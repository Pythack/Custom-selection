if (typeof browser === "undefined") {
    var browser = chrome;
	text_decoration = true;
} else {
	text_decoration = false;
}

function saveSuccess(item) {
    // browser.runtime.sendMessage({
	// 	request: "display-notification",
	// 	notificationName: "custom-selection-save", 
	// 	timeout: 1000,
	// 	notification: {
	// 		type: 'basic',
    //         title: browser.i18n.getMessage("notifSuccessTitle"),
    //         message: browser.i18n.getMessage("notifSuccessContent"),
    //         iconUrl: "./images/iconvalid.png"
    //     }
	// });
};

function saveError(item) {
	// browser.runtime.sendMessage({
	// 	request: "display-notification",
	// 	notificationName: "custom-selection-save", 
	// 	timeout: 1000,
	// 	notification: {
	// 		type: 'basic',
	// 		title: browser.i18n.getMessage("notifFailTitle"),
	// 		message: browser.i18n.getMessage("notifFailContent"),
    //         iconUrl: "./images/iconfail.png"
    //     }
	// });
};

function matchRuleShort(str, rule) {
	var escapeRegex = (str) => str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
	return new RegExp("^" + rule.split("*").map(escapeRegex).join(".*") + "$").test(str);
  }


function onError(error) {
	console.log(`Error:${error}`);
}

class Custom_option {
	constructor(url, background, color, shadowActivated, shadowColor, shadowBlur, decorationActivated, decorationType, decorationColor) {
		this.url = url;
		this.color = color;
		this.background = background;
		this.shadowActivated = shadowActivated;
		this.shadowColor = shadowColor;
		this.shadowBlur = shadowBlur;
		this.decorationActivated = decorationActivated;
		this.decorationType = decorationType;
		this.decorationColor = decorationColor;
	}
};

function addCustom() {
	let getting = browser.storage.local.get(); // Get storage
	getting.then(result => {
		var custom_url = document.querySelector("#add_url").value; // Get new custom url
		document.querySelector("#add_url").value = "";
		var customSettings = new Custom_option(custom_url, document.querySelector("#background_color").value || "#007EF3", document.querySelector("#color").value || "white", document.querySelector("input#activate_textShadow").checked || false, document.querySelector("#shadow-color").value || "none", document.querySelector("#shadow-blur").value || "0", document.querySelector("input#activate_textDecoration").checked || false, document.querySelector("#decoration_select").value || "none", document.querySelector("#decoration-color").value || "#007EF3FF"); // Create new element with currently displayed settings
		var customs = result.customOptions || []; // Get current saved settings; if there are none, initialize an empty list
		customs.push(customSettings); // Add new custom settings to the list
		browser.storage.local.set({ // Store the new list in the storage
			customOptions: customs
		});
		var optionToAdd = document.createElement("option"); // Create new option element
		optionToAdd.textContent = custom_url; // Add custom url to option
		optionToAdd.value = custom_url; // Add custom url to option value
		var select = document.querySelector("#custom_select");
		select.appendChild(optionToAdd); // Append new option to select
		select.value = custom_url;
		select.dispatchEvent(new Event('change'));
		browser.runtime.sendMessage({ // Send message to background script asking to update the action icon
			request: "update-action-icon"
		});
	}, onError);
};

function removeCustom() {
	let getting = browser.storage.local.get(); // Get storage
	getting.then(result => {
		var selectIndex = document.querySelector("#custom_select").selectedIndex - 1; // Get selected index (-1 to ignore first index: default settings)
		var customs = result.customOptions; // Get stored custom settings
		customs.splice(selectIndex, 1); // Remove custom setting from list
		browser.storage.local.set({ // Store new list in storage
			customOptions: customs
		});
		var customSettingsSelect = document.querySelector("#custom_select"); // Get option in select
		customSettingsSelect.remove(document.querySelector("#custom_select").selectedIndex); // Remove option from select
		var selectTrueIndex = document.querySelector("#custom_select").selectedIndex;
		document.querySelector("#url_div").style.display = "none"; // Hide url edition input
		document.querySelector("#remove_custom").style.display = "none"; // Hide remove button
		// Restore default settings in the inputs
		document.querySelector("#background_color").jscolor.fromString(result.background_color || "#007EF3");
		document.querySelector("#color").jscolor.fromString(result.color || "white");
		document.querySelector("#shadow-color").jscolor.fromString(result.shadowColor || "#ffffff");
		document.querySelector("#shadow-blur").value = result.shadowBlur || "0px";
		document.querySelector("input#activate_textShadow").checked = result.shadowActivated;
		document.querySelector("input#activate_textDecoration").checked = result.decorationActivated;
		document.querySelector("#decoration_select").value = result.decorationType;
		document.querySelector("#decoration-color").jscolor.fromString(result.decorationColor || "#007EF3FF");
		if(result.shadowActivated) {
			document.querySelector('div#textShadowOptions').style.display = "flex";
		} else {
			document.querySelector('div#textShadowOptions').style.display = "none";
		}
		
		if(result.decorationActivated) {
			document.querySelector('div#textDecorationOptions').style.display = "flex";
		} else {
			document.querySelector('div#textDecorationOptions').style.display = "none";
		};
		chrome.tabs.query({active: true, currentWindow: true}, async tabs => {
			var activeTab = tabs[0];
			var activeTabURL = new URL(activeTab.url);
			let urlField = document.querySelector("#add_url");
			urlField.value = activeTabURL.host;
		 });
		updatePreview(); // Update preview
		browser.runtime.sendMessage({ // Send message to background script asking to update the action icon
			request: "inject-css-all"
		});
		browser.runtime.sendMessage({ // Send message to background script asking to update the action icon
			request: "update-action-icon"
		});
	}, onError);
};

function saveOptions(e) { // Function called when user clicks on "Save" button
	e.preventDefault();
	var selectIndex = document.querySelector("#custom_select").selectedIndex; // Get selected custom option
	if(selectIndex == 0) { // If 0, then user selected default settings
		var preferencesSave = browser.storage.local.set({ // Update default settings
			background_color: document.querySelector("#background_color").value || "#007EF3",
			color: document.querySelector("#color").value || "white",
			shadowActivated: document.querySelector("input#activate_textShadow").checked || false,
			shadowColor: document.querySelector("#shadow-color").value || "none",
			shadowBlur: document.querySelector("#shadow-blur").value || "0",
			decorationActivated: document.querySelector("input#activate_textDecoration").checked || false,
			decorationType: document.querySelector("#decoration_select").value || "none",
			decorationColor: document.querySelector("#decoration-color").value || "none",
			witness: true
		});
		preferencesSave.then(saveSuccess, saveError); // Display notifications
	} else {
		let getting = browser.storage.local.get();
		getting.then(result => {
			var selectIndex = document.querySelector("#custom_select").selectedIndex - 1; // Get index (-1 to ignore first index: default settings)
			var customs = result.customOptions; // Get current custom settings
			customs[selectIndex] = { // Update selected custom settings
				background: document.querySelector("#background_color").value || "#007EF3",
				color: document.querySelector("#color").value || "white",
				shadowActivated: document.querySelector("input#activate_textShadow").checked || false,
				shadowColor: document.querySelector("#shadow-color").value || "none",
				shadowBlur: document.querySelector("#shadow-blur").value || "0",
				decorationActivated: document.querySelector("input#activate_textDecoration").checked || false,
				decorationType: document.querySelector("#decoration_select").value || "none",
				decorationColor: document.querySelector("#decoration-color").value || "none",
				url: document.querySelector("#change_url").value
			};
			var preferencesSave = browser.storage.local.set({ // Update custom settings
				customOptions: customs
			});
			let select = document.querySelector("#custom_select");
			select.options[select.selectedIndex].textContent = document.querySelector("#change_url").value;
			select.options[select.selectedIndex].value = document.querySelector("#change_url").value;
			preferencesSave.then(saveSuccess, saveError); // Display notifications
		}, onError);
	};
	browser.runtime.sendMessage({ // Send message to background script asking to inject new CSS in all tabs
		request: "inject-css-all"
	});
};
function updatePreview() { // Function called when input values are changed
	// Apply selection style to preview style
	document.querySelector("#preview").style.background = document.querySelector("#background_color").value;
	document.querySelector("#preview").style.color = document.querySelector("#color").value;
	if (document.querySelector("input#activate_textShadow").checked) {
		document.querySelector("#preview").style.textShadow = document.querySelector("#shadow-color").value + " 0px 0px " + document.querySelector("#shadow-blur").value + "px";
	} else {
		document.querySelector("#preview").style.textShadow = "";
	}
	if (document.querySelector("input#activate_textDecoration").checked) {
		document.querySelector("#preview").style.textDecoration = document.querySelector("#decoration_select").value + " " + document.querySelector("#decoration-color").value;
	} else {
		document.querySelector("#preview").style.textDecoration = "";
	}
};

function restoreOptions() {
  let getting = browser.storage.local.get(); // Get storage
  getting.then(result => {
	if (result.customOptions) { // If there are custom settings
		result.customOptions.forEach(element => { // For each custom setting: add option to select
		const option = document.createElement("option");
		option.textContent = element.url;
		option.value = element.url;
		const select = document.querySelector("#custom_select");
		select.appendChild(option);
		});
	}
  }, onError);
  var indexToUpdate = 0;
  chrome.tabs.query({active: true, currentWindow: true}, async tabs => {
	var activeTab = tabs[0];
	var activeTabURL = new URL(activeTab.url);
	var storage = await browser.storage.local.get();
	var isOnCustom = false;
	if (storage.customOptions) { // If custom settings are defined
		storage.customOptions.forEach((element) => {
			if (matchRuleShort(activeTabURL.host, element.url)) { // Compare custom setting's hostname with the tab's
				const select = document.querySelector("#custom_select");
				select.value = element.url;
				select.dispatchEvent(new Event('change'));
				isOnCustom = true;
			}
		});
	}
	if (!isOnCustom) {
		let urlField = document.querySelector("#add_url");
		urlField.value = activeTabURL.host;
		const select = document.querySelector("#custom_select");
		select.dispatchEvent(new Event('change'));
	}
 });
 if (!text_decoration) {
	document.querySelector("#formdivtxtdec").style.display = "none";
 };
};


function updateShadowColorDisplay() {
    if (document.querySelector("input#activate_textShadow").checked) {
        document.querySelector('div#textShadowOptions').style.display = "flex"
    } else {
        document.querySelector('div#textShadowOptions').style.display = "none"
    }
};

function updateDecorationDisplay() {
    if (document.querySelector("input#activate_textDecoration").checked) {
        document.querySelector('div#textDecorationOptions').style.display = "flex"
    } else {
        document.querySelector('div#textDecorationOptions').style.display = "none"
    }
};

function changeCustomDisplay(event) { // Function called when select changes
		var selectIndex = document.querySelector("#custom_select").selectedIndex;
	if(selectIndex != 0) { // If selected option is not default settings
		document.querySelector("#change_url").value = document.querySelector("#custom_select").value; // Initialize url edition input to selected setting's url
		document.querySelector("#change_url").placeholder = document.querySelector("#custom_select").value;
		document.querySelector("#url_div").style.display = "block"; // Display custom url edition div
		document.querySelector("#remove_custom").style.display = "block"; // Display remove button
		let getting = browser.storage.local.get(); // Get storage
		getting.then(result => {
			var customs = result.customOptions; // Get custom settings
			// Restore settings in inputs
			document.querySelector("#background_color").jscolor.fromString(customs[selectIndex - 1].background || "#007EF3");
			document.querySelector("#color").jscolor.fromString(customs[selectIndex - 1].color || "white");
			document.querySelector("#shadow-color").jscolor.fromString(customs[selectIndex - 1].shadowColor || "#ffffff");
			document.querySelector("#shadow-blur").value = customs[selectIndex - 1].shadowBlur || "0px";
			document.querySelector("input#activate_textShadow").checked = customs[selectIndex - 1].shadowActivated;
			document.querySelector("input#activate_textDecoration").checked = customs[selectIndex - 1].decorationActivated;
			document.querySelector("#decoration_select").value = customs[selectIndex - 1].decorationType;
			document.querySelector("#decoration-color").jscolor.fromString(customs[selectIndex - 1].decorationColor || "#007EF3FF");
			if(customs[selectIndex - 1].shadowActivated) {
				document.querySelector('div#textShadowOptions').style.display = "flex";
			} else {
				document.querySelector('div#textShadowOptions').style.display = "none";
			};
			if(customs[selectIndex - 1].decorationActivated) {
				document.querySelector('div#textDecorationOptions').style.display = "flex";
			} else {
				document.querySelector('div#textDecorationOptions').style.display = "none";
			};
			updatePreview(); // Update preview
		}, onError);
	} else {
		document.querySelector("#url_div").style.display = "none"; // Hide custom url edition div
		document.querySelector("#remove_custom").style.display = "none"; // Hide remove button
		let getting = browser.storage.local.get(); // Get storage
		getting.then(result => {
			// Restore settings in inputs
			document.querySelector("#background_color").jscolor.fromString(result.background_color || "#007EF3");
			document.querySelector("#color").jscolor.fromString(result.color || "white");
			document.querySelector("#shadow-color").jscolor.fromString(result.shadowColor || "#ffffff");
			document.querySelector("#shadow-blur").value = result.shadowBlur || "0px";
			document.querySelector("input#activate_textShadow").checked = result.shadowActivated;
			document.querySelector("input#activate_textDecoration").checked = result.decorationActivated;
			document.querySelector("#decoration_select").value = result.decorationType;
			document.querySelector("#decoration-color").jscolor.fromString(result.decorationColor || "#007EF3FF");
			if(result.shadowActivated) {
				document.querySelector('div#textShadowOptions').style.display = "flex";
			} else {
				document.querySelector('div#textShadowOptions').style.display = "none";
			}
			if(result.decorationActivated) {
				document.querySelector('div#textDecorationOptions').style.display = "flex";
			} else {
				document.querySelector('div#textDecorationOptions').style.display = "none";
			};
			updatePreview(); // Update preview
		}, onError);
	};
};

function localizeHtmlPage()
{
    //Localize by replacing __MSG_***__ meta tags
    var objects = document.getElementsByTagName('html');
    for (var j = 0; j < objects.length; j++)
    {
        var obj = objects[j];

        var valStrH = obj.innerHTML.toString();
        var valNewH = valStrH.replace(/__MSG_(\w+)__/g, function(match, v1)
        {
            return v1 ? browser.i18n.getMessage(v1) : "";
        });

        if(valNewH != valStrH)
        {
            obj.innerHTML = valNewH;
        }
    }
}

function checkURLHost(event) {
	const inp = event.target;
	const regex = new RegExp('^(([a-zA-Z\*]|[a-zA-Z\*][a-zA-Z0-9\-\*]*[a-zA-Z0-9\*])\.)*([A-Za-z\*]|[A-Za-z\*][A-Za-z0-9\-\*]*[A-Za-z0-9\*])$');
	if (regex.test(inp.value)) {
		inp.setCustomValidity("");
	} else {
		inp.setCustomValidity("Please enter a hostname")
	}
}

localizeHtmlPage();

// Set event listeners
document.addEventListener("DOMContentLoaded", restoreOptions);
document.addEventListener("DOMContentLoaded", () => {let myPicker = new JSColor('#shadow-color', {'position': 'top'})});
document.addEventListener("DOMContentLoaded", () => {setTimeout(updatePreview, 100)});
document.querySelector("#save_btn").addEventListener("click", saveOptions);
document.querySelector("#formdiv").addEventListener("keyup", updatePreview);
document.querySelector("#formdiv").addEventListener("input", updatePreview);
document.querySelector("#add_url").addEventListener("input", checkURLHost);
document.querySelector("#change_url").addEventListener("input", checkURLHost);
document.querySelector("#add_custom").addEventListener("click", addCustom);
document.querySelector("#remove_custom").addEventListener("click", removeCustom);
document.querySelector("input#activate_textShadow").addEventListener("change", updatePreview);
document.querySelector("select#custom_select").addEventListener("change", changeCustomDisplay);
document.querySelector("input#activate_textShadow").addEventListener("change", updateShadowColorDisplay);
document.querySelector("input#activate_textDecoration").addEventListener("change", updateDecorationDisplay);
