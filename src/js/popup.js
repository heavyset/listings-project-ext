import "../css/popup.css";

const STORAGE_ENABLED_KEY = "enabled";
const CSS_ENABLE = ".controls .enable";
const CSS_DISABLE = ".controls .disable";

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
 * hideShow hides one Element via its CSS selector and shows another.
 * @param {string} hideSelector CSS selector of Element to hide
 * @param {string} showSelector CSS selector of Element to show
 */
function hideShow(hideSelector, showSelector) {
	document.querySelector(hideSelector).style.display = "none";
	document.querySelector(showSelector).style.display = "";
}

/**
 * updateOptions will change what options are displayed to the user
 * based on whether the user has enabled or disabled this extension.
 * @param {boolean} enabled Indicates if extension is enabled or not
 */
function updateOptions(enabled) {
	if (enabled == true || enabled == null) {
		log("activated the disable option");
		hideShow(CSS_ENABLE, CSS_DISABLE);
	} else {
		log("activated the enable option");
		hideShow(CSS_DISABLE, CSS_ENABLE);
	}
}

(function () {
	// listen for changes to storage
	chrome.storage.onChanged.addListener((changes, namespace) => {
		log("%s storage changed", namespace);
		if (changes.hasOwnProperty(STORAGE_ENABLED_KEY)) {
			updateOptions(changes[STORAGE_ENABLED_KEY].newValue);
		}
	})

	// listen for changes from user
	document.querySelector(CSS_DISABLE + " a").addEventListener("click", (ev) => {
		chrome.storage.local.set({[STORAGE_ENABLED_KEY]: false});
		updateOptions(false);
	})

	document.querySelector(CSS_ENABLE + " a").addEventListener("click", (ev) => {
		chrome.storage.local.set({[STORAGE_ENABLED_KEY]: true});
	})

	// initialize options
	chrome.storage.local.get(STORAGE_ENABLED_KEY, state => {
		updateOptions(state[STORAGE_ENABLED_KEY]);
	});
}())
