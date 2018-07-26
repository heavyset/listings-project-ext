/**
 * @fileoverview Provides functionality around filtering listings in a Listings Project
 * newsletter page. This is a web extension, content script that will add a "panel" to
 * the top of any matching page and provide filtering elements.
 */

const STORAGE_ENABLED_KEY = "enabled";

/**
 * Static HTML for extension's filter panel. Default to not being displayed
 */
const panelHTML = `
	<div id="lpext" style="display: none">
		<div class="title">Filter Listings</div>
		<div class="filter categories">
			<select>
				<option value="all" selected>All Categories</option>
			</select>
		</div>
		<div class="filter frequency">
			<select>
				<option value="all" selected>Any Pay Frequency</option>
				<option value="/month">Monthly</option>
				<option value="/week">Weekly</option>
				<option value="/day">Daily</option>
			</select>
		</div>
		<div class="max-price"></div>
		<div class="filter price">
			<div class="price-slider"></div>
		</div>
	</div>
`;

/**
 * log is a custom `console.log` function that simply prefixes any log message with
 * "[LP-EXT]". Anything that can be achieved with `console.log` will be achievable.
 * with this function.
 * @param {string} msg The msg to attach the prefix to
 * @param {...args} args Arguments to pass to `console.log`
 */
function log(msg, ...args) {
	console.log("[LP-EXT] " + msg, ...args);
}

/**
 * parseAttrJSON will parse the attribute value of an `Element` with the assumption
 * that it is in JSON format. If the Element is not defined or the attribute cannot
 * be parsed for any reason, an empty object is returned and a message logged.
 * @param {!Element} $el The HTML Element to pull an attribute from
 * @param {string} attrName The name of the attribute
 * @return {object}
 */
function parseAttrJSON($el, attrName) {
	if (!$el) {
		log("element not defined");
		return {};
	}
	try {
		return JSON.parse($el.getAttribute(attrName)) || {};
	} catch(err) {
		log("unable to parse listings json: ", err);
		return {};
	}
}

function findMinMax(nums) {
	return [ Math.min(...nums), Math.max(...nums) ];
}

/**
 * This is a helper function for creating a new `ContextualFragement` instance from
 * an string of HTML.
 * @param {string} htmlStr A string of HTML to create a `ContextualFragment` from
 * @return {!ContextualFragment}
 */
function parseFragment(htmlStr) {
	return document.createRange().createContextualFragment(htmlStr);
}

/**
 * `ListingsView` provides functionality around changing the view of the actual listings
 * in the Listings Project page. It expects to be provided the top-level `Element` which
 * contains these listings. This is most likely the element selected via the CSS query:
 * `.newsletterSearch`.
 */
class ListingsView {
	/**
	 * @param {!Element} $el HTML Element containing all listings
	 */
	constructor($el) {
		this.$el = $el;
	}

	/**
	 * Hide every listing in the Listings Project view.
	 */
	hide() {
		for (let $child of this.$el.querySelectorAll(":scope .search-listings-section > div")) {
			$child.style.display = "none";
		}
	}

	/**
	 * Show any listings with a URI matching a slug from the provided Array. This is
	 * definitely not an efficient way to do this.
	 * @param {!Array<string>} slugs An array of slugs
	 */
	update(slugs) {
		for (let idx in slugs) {
			let $listing = this.$el.querySelector(`:scope .row a[href*="${slugs[idx]}"]`);
			if ($listing) {
				$listing.parentNode.parentNode.parentNode.style.display = "";
			}
		}
	}
}

/**
 * buildPriceSlider constructs a noUiSlider instance and applies it to a provided
 * `Element`. The min and max prices are used to construct the range of the slider.
 * The slider will start stepping in increments of $500 at the 50% mark, all the way
 * to the max price. The 50% mark is calculated as the minimum value of either $1000
 * or half of the max price.
 * @param {!Element} $sliderView An Element instance that will contain the slider
 * @param {number} minPrice Integer representing min price in cents
 * @param {number} maxPrice Integer representing max price in cents
 * @return {object}
 */
 function buildPriceSlider($sliderView, minPrice, maxPrice) {
	noUiSlider.create($sliderView, {
		start: [maxPrice],
		connect: [true, false],
		format: {
			to: (num) => { return "$" + Math.trunc(num/100) },
			from: (str) => { return parseInt(str.replace('$', '')) }
		},
		range: {
			'min': [minPrice],
			'50%': [Math.min(100000, Math.trunc(maxPrice/2)), 50000],
			'max': [maxPrice]
		}
	});
	return $sliderView.noUiSlider;
}

/**
 * A `FilterView` event callback function.
 *
 * @callback filterViewEventFn
 * @param {object} state Current state of filter values.
 */

/**
 * `FilterView` provides functionality for this extension's filterable panel. It
 * currently expects to be able to filter on: category, pay frequency, and max price.
 * This view assumes it has been provided the panel's top-level DOM Element and
 * will dynamically:
 *
 *  - add options for the categories
 *  - create the max-price slider
 *  - make available a change event when any filter is updated
 *
 * Thus, to watch for changes to the filters, simply add an event listener to the
 * `change` event:
 *
 * ```
 * let filterView = new FilterView($el, [{value: "sublet", label: "Sublets"}], 0, 100000);
 * filterView.on("change", state => { ... });
 * ```
 *
 * The `state` argument in the event will contain the currently chosen values for the
 * filters as an object: `{category: "sublet", frequency: "all", price: 100000}`.
 */
 class FilterView {
	/**
	 * @param {!Element} $el HTML Element containing the filters
	 * @param {!Array<Object<string, string>>} Array of categories with an object having value and label keys
	 * @param {number} minPrice The min price of all listings in cents
	 * @param {number} maxPrice The max price of all listings in cents
	 */
	 constructor($el, categories, minPrice, maxPrice) {
		this.evFns = {"change": []};

		this.category = "";
		this.frequency = "";
		this.price = 0;

		let $catSelect = $el.querySelector(".filter.categories select");
		for (let category of categories) {
			$catSelect.appendChild(parseFragment(`<option value="${category.value}">${category.label}</option>`));
		}

		let $slider = buildPriceSlider($el.querySelector(".filter.price .price-slider"), minPrice, maxPrice);

		let $maxPrice = $el.querySelector(".max-price");
		$slider.on("update", ([price]) => {
			$maxPrice.innerHTML = price;
		});

		$slider.on("change", (strs, handles, [value]) => {
			this.price = Math.trunc(value);
			this._emit("change");
		});

		$el.querySelector(".filter.categories select").addEventListener("change", ({target}) => {
			this.category = target.value == "all" ? "" : target.value;
			this._emit("change");
		});

		$el.querySelector(".filter.frequency select").addEventListener("change", ({target}) => {
			this.frequency = target.value == "all" ? "" : target.value;
			this._emit("change");
		});
	}

	show() {
		document.querySelector("#lpext").style.display = "";
	}

	hide() {
		document.querySelector("#lpext").style.display = "none";
	}

	/**
	 * Adds an event listener function for a named event. All functions should expect to
	 * receive one argument representing the current state of the filters.
	 * @param {string} evName The name of the event
	 * @param {filterViewEventFn} fn A function to execute
	 * @return {!FilterView}
	 */
	on(evName, fn) {
		if (!this.evFns[evName]) {
			this.evFns[evName] = [];
		}
		this.evFns[evName].push(fn);
		return this;
	}

    /**
     * Emits a named event to all bound listeners. A state object is generated that should
     * be considered immutable in theory.
     * @param {string} evName Name of event to emit.
     * @private
     */
	_emit(evName) {
		let state = {
			category: this.category,
			frequency: this.frequency,
			price: this.price
		};
		(this.evFns[evName] || []).forEach(fn => fn(state));
	}
}

/**
 * listingFilter is a function that will determine if a given listing matches the
 * rules for the given state of the filter values. If yes, return `true`. This is
 * best used with an array's `filter` function.
 * @param {object} state State of current filter values
 * @param {object} listing A listing object from the Listing Project data
 * @return {boolean}
 */
function listingFilter(state, listing) {
	let {category, frequency, price} = state;
	let catMatch = (!category || listing.subcategory_key == category),
		freqMatch = (!frequency || listing.price_duration == frequency);
		priceMatch = (!price || listing.price_cents <= price);
	return catMatch && freqMatch && priceMatch;
}

(function () {
	let listingsData = parseAttrJSON(document.querySelector("div[data-react-props]"), "data-react-props"),
		listings = listingsData.initialListings,
		categories = listingsData.category_options.slice(1),
		[minPrice, maxPrice] = findMinMax(listings.map(listing => listing.price_cents));

	let listingsView = new ListingsView(document.querySelector(".newsletterSearch")),
		$filterEl = parseFragment(panelHTML),
		filterView = new FilterView($filterEl, categories, minPrice, maxPrice);

	// create and display panel
	filterView.on("change", (filterState) => {
		let slugs = listings.filter(listing => listingFilter(filterState, listing)).
					map(listing => listing.slug);
		listingsView.hide();
		listingsView.update(slugs);
	})

	log("found %d listings", listings.length);
	document.body.insertBefore($filterEl, document.querySelector(".header"));

	// determine current enabled state
	chrome.storage.local.get(STORAGE_ENABLED_KEY, state => {
		let enabled = state[STORAGE_ENABLED_KEY];
		if (enabled == true || enabled == null) {
			filterView.show();
		}
	});

	// listen for changes to storage in regards to options
	chrome.storage.onChanged.addListener((changes, namespace) => {
		if (changes.hasOwnProperty(STORAGE_ENABLED_KEY)) {
			let enabled = changes[STORAGE_ENABLED_KEY].newValue;
			if (enabled == true || enabled == null) {
				filterView.show();
			} else {
				filterView.hide();
			}
		}
	});
}())
