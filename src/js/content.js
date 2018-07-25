/**
 * Filter Listings Project listings by category and ...
 */

const panelHTML = `
	<div id="lpext">
		<div class="title">Filter Listings</div>
		<div class="filter categories">
			<select>
				<option value="all" selected>All Categories</option>
			</select>
		</div>
		<div class="max-price"></div>
		<div class="filter price">
			<div class="price-slider"></div>
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
		let $list = $panel.querySelector(".filter.categories select");
		for (let category of categories.slice(1)) {
			$list.appendChild($newFrag(`<option value="${category.value}">${category.label}</option>`));
		}
	}

	function $updatePriceFilter($panel, prices) {
		let minPrice = Math.min(...prices),
			maxPrice = Math.max(...prices);
		let $slider = $panel.querySelector(".filter.price .price-slider");
		noUiSlider.create($slider, {
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
		$panel.querySelector(".filter.categories select").addEventListener("change", ({target}) => {
			let category = target.value == "all" ? "" : target.value;
			filterListings(applyFilterState({"category": target.value}), listings);
		});
	}

	function $bindSliderChangeEvents($panel, listings) {
		let $slider = $panel.querySelector(".filter.price .price-slider").noUiSlider,
			$maxPrice = $panel.querySelector(".max-price");

		$slider.on("change", (strs, handles, [value]) => {
			filterListings(applyFilterState({"price": Math.trunc(value)}), listings);
		});

		$slider.on("update", ([price]) => {
			$maxPrice.innerHTML = price;
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
