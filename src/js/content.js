/**
 * @fileoverview Provides functionality around filtering listings in a Listings Project
 * newsletter page. This is a web extension, content script that will add a "panel" to
 * the top of any matching page and provide filtering elements.
 */

const panelHTML = `
	<div id="lpext">
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
	 * @param {!Element} $el The HTML Element containing all listings
	 */
	constructor($el) {
		this.$el = $el;
	}

	/**
	 * Hide every listing in the Listings Project view.
	 * @return void
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
	 * @return void
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

class FilterView {
	constructor($el, categories, minPrice, maxPrice) {
		this.$el = $el;
		this.evFns = {"change": []};

		this.category = "";
		this.frequency = "";
		this.price = 0;

		for (let category of categories) {
			this.addCategory(category.value, category.label);
		}

		this.$slider = buildPriceSlider($el.querySelector(".filter.price .price-slider"), minPrice, maxPrice);

		let $maxPrice = $el.querySelector(".max-price");
		this.$slider.on("update", ([price]) => {
			$maxPrice.innerHTML = price;
		});

		this.$slider.on("change", (strs, handles, [value]) => {
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

	addCategory(key, label) {
		this.$el.querySelector(".filter.categories select").
			appendChild(parseFragment(`<option value="${key}">${label}</option>`));
	}

	on(evName, fn) {
		if (!this.evFns[evName]) {
			this.evFns[evName] = [];
		}
		this.evFns[evName].push(fn);
	}

	_emit(evName) {
		let state = {
			category: this.category,
			frequency: this.frequency,
			price: this.price
		};
		(this.evFns[evName] || []).forEach(fn => fn(state));
	}
}

function listingFilter({category, frequency, price}, listing) {
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

	filterView.on("change", (filterState) => {
		let slugs = listings.filter(listing => listingFilter(filterState, listing)).
					map(listing => listing.slug);
		listingsView.hide();
		listingsView.update(slugs);
	})

	log("found %d listings", listings.length);
	document.body.insertBefore($filterEl, document.querySelector(".header"));
}())
