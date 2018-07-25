/**
 * Filter Listings Project listings by category and ...
 */

const panelHTML = `
	<div id="lpext">
		<h3>Listings Project Filter</h3>
		<div class="filter categories">
			<ul></ul>
		</div>
		<div class="filter prices">
			<div class="slider"></div>
		</div>
	</div>
`;

(function () {
	let filterState = {
		category: "",
		price: ""
	};

	function applyFilterState(source) {
		filterState = Object.assign(filterState, source);
		return filterState;
	}

	function log(...args) {
		let [msg, ...opts] = args;
		console.log("[LP-EXT] " + msg, ...opts);
	}

	function $newFrag(htmlStr) {
		return document.createRange().createContextualFragment(htmlStr);
	}

	function $updateCategoryFilter($panel, categories) {
		let $list = $panel.querySelector(".filter.categories ul");
		for (let category of categories.slice(1)) {
			$list.appendChild($newFrag(`<li class="category" data-category=${category.value}>${category.label}</li>`));
		}
	}

	function $updatePriceFilter($panel, prices) {
		let minPrice = Math.min(...prices),
			maxPrice = Math.max(...prices);
		let $slider = $panel.querySelector(".filter.prices .slider");
		noUiSlider.create($slider, {
			start: [maxPrice],
			connect: [true, false],
			tooltips: [true],
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
	}

	function $hideAllListings() {
		let $divs = document.querySelectorAll(".search-listings-section > div");
		for (let $div of $divs) {
			$div.style.display = "none";
		}
	}

	function $showListingsBySlug(slugs) {
		for (let i in slugs) {
			let $listing = document.querySelector(`.row a[href*="${slugs[i]}"]`);
			if ($listing) {
				$listing.parentNode.parentNode.parentNode.style.display = "";
			}
		}
	}

	function filterBySlugs(slugs) {
		$hideAllListings();
		$showListingsBySlug(slugs);
	}

	function filterListing({category, price}, listing) {
		let catMatch = (!category || listing.subcategory_key == category),
			priceMatch = (!price || listing.price_cents <= price);
		return catMatch && priceMatch;
	}

	function filterListings(state, listings) {
		let slugs = listings.filter(listing => filterListing(state, listing)).map(listing => listing.slug);
		$hideAllListings();
		$showListingsBySlug(slugs);
	}

	function $bindCategoryChangeEvents($panel, listings) {
		$panel.querySelectorAll(".filter.categories li").forEach($li => {
			$li.addEventListener("click", ({target}) => {
				filterListings(applyFilterState({"category": target.dataset.category}), listings);
			})
		});
	}

	function $bindSliderChangeEvents($panel, listings) {
		$panel.querySelector(".slider").noUiSlider.on("change", (strs, handles, [value]) => {
			filterListings(applyFilterState({"price": Math.trunc(value)}), listings);
		});
	}

	function parseAttrJSON(el, attrName) {
		if (!el) {
			log("element not defined");
			return {};
		}
		try {
			return JSON.parse(el.getAttribute(attrName)) || {};
		} catch(err) {
			log("unable to parse listings json: ", err);
			return {};
		}
	}

	let listingsData = parseAttrJSON(document.querySelector("div[data-react-props]"), "data-react-props");
	log("found %d listings", listingsData.initialListings.length);

	let $panel = $newFrag(panelHTML);
	$updateCategoryFilter($panel, listingsData.category_options);
	$updatePriceFilter($panel, listingsData.initialListings.map(listing => listing.price_cents));
	$bindCategoryChangeEvents($panel, listingsData.initialListings);
	$bindSliderChangeEvents($panel, listingsData.initialListings);
	document.body.insertBefore($panel, document.querySelector(".header"));
}())
