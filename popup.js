function saveSuccess(item){browser.notifications.create("notification-save-status",{type:'basic',title:'Selection styler: Saving success',message:"Preferences saved successfully. ","iconUrl":browser.runtime.getURL("./iconvalid.png")});setTimeout(function(){browser.notifications.clear("notification-save-status");},1000);};
function saveError(item){browser.notifications.create("notification-save-status",{type:'basic',title:'Selection styler: Saving error',message:"Error saving preferences","iconUrl":browser.runtime.getURL("./iconfail.png")});setTimeout(function(){browser.notifications.clear("notification-save-status");},1000);};

class Custom_option {
	constructor(url, background, color, shadowActivated, shadowColor, shadowBlur) {
		this.url = url;
		this.color = color;
		this.background = background;
		this.shadowActivated = shadowActivated;
		this.shadowColor = shadowColor;
		this.shadowBlur = shadowBlur;
	}
};

function addCustom() {
	function continueCustom(result) {
		var custom_url = document.querySelector("#add_url").value;
		var customSettings = new Custom_option(custom_url, document.querySelector("#background_color").value || "#007ef3", document.querySelector("#color").value || "white", document.querySelector("input#activate_textShadow").checked || false, document.querySelector("#shadow-color").value || "none", document.querySelector("#shadow-blur").value || "0");
		var customs = result.customOptions || [];
		customs.push(customSettings);
		browser.storage.local.set({
			customOptions: customs
		});
		var optionToAdd = document.createElement("option");
		optionToAdd.textContent = custom_url;
		optionToAdd.value = custom_url;
		var select = document.querySelector("#custom_select");
		select.appendChild(optionToAdd);
	};

	function onError(error) {
		console.log(`Error:${error}`);
	};
	let getting = browser.storage.local.get();
	getting.then(continueCustom, onError);
};

function removeCustom() {
	function continueCustom(result) {
		var selectIndex = document.querySelector("#custom_select").selectedIndex - 1;
		var customs = result.customOptions;
		customs.splice(selectIndex, 1);
		browser.storage.local.set({
			customOptions: customs
		});
		var optionToRemove = document.querySelector("#custom_select");
		optionToRemove.remove(document.querySelector("#custom_select").selectedIndex);
		var selectTrueIndex = document.querySelector("#custom_select").selectedIndex;
		if(selectTrueIndex != 0) {
			document.querySelector("#url_div").style.display = "block";
			document.querySelector("#url_div").value = document.querySelector("#custom_select").value;
			document.querySelector("#remove_custom").style.display = "block";
		} else {
			document.querySelector("#url_div").style.display = "none";
			document.querySelector("#remove_custom").style.display = "none";
		}
		document.querySelector("#background_color").jscolor.fromString(result.background_color || "#007ef3");
		document.querySelector("#color").jscolor.fromString(result.color || "white");
		document.querySelector("#shadow-color").jscolor.fromString(result.shadowColor || "#ffffff");
		document.querySelector("#shadow-blur").value = result.shadowBlur || "0px";
		document.querySelector("input#activate_textShadow").checked = result.shadowActivated;
		if(result.shadowActivated) {
			document.querySelector('div#textShadowOptions').style.display = "block";
		} else {
			document.querySelector('div#textShadowOptions').style.display = "none";
		}
		document.querySelector("#preview").style.background = document.querySelector("#background_color").value;
		document.querySelector("#preview").style.color = document.querySelector("#color").value;
		if (document.querySelector("input#activate_textShadow").checked) {
			document.querySelector("#preview").style.textShadow = document.querySelector("#shadow-color").value + " 0px 0px " + document.querySelector("#shadow-blur").value + "px";
		} else {
			document.querySelector("#preview").style.textShadow = "";
		}
	};

	function onError(error) {
		console.log(`Error:${error}`);
	};
	let getting = browser.storage.local.get();
	getting.then(continueCustom, onError);
};

function saveOptions(e) {
	e.preventDefault();
	var selectIndex = document.querySelector("#custom_select").selectedIndex;
	if(selectIndex == 0) {
		var preferencesSave = browser.storage.local.set({
			background_color: document.querySelector("#background_color").value || "#007ef3",
			color: document.querySelector("#color").value || "white",
			shadowActivated: document.querySelector("input#activate_textShadow").checked || false,
			shadowColor: document.querySelector("#shadow-color").value || "none",
			shadowBlur: document.querySelector("#shadow-blur").value || "0",
			witness: true
		});
		preferencesSave.then(saveSuccess, saveError);
	} else {
		function continueCustom(result) {
			var selectIndex = document.querySelector("#custom_select").selectedIndex - 1;
			var customs = result.customOptions;
			customs[selectIndex] = {
				background: document.querySelector("#background_color").value || "#007ef3",
				color: document.querySelector("#color").value || "white",
				shadowActivated: document.querySelector("input#activate_textShadow").checked || false,
				shadowColor: document.querySelector("#shadow-color").value || "none",
				shadowBlur: document.querySelector("#shadow-blur").value || "0",
				url: document.querySelector("#change_url").value || "auto"
			};
			var preferencesSave = browser.storage.local.set({
				customOptions: customs
			});
			preferencesSave.then(saveSuccess, saveError);
		};

		function onError(error) {
			console.log(`Error:${error}`)
		};
		let getting = browser.storage.local.get();
		getting.then(continueCustom, onError);
	};
	browser.runtime.sendMessage({
		request: "inject-css-all"
	});
};
function updatePreview() {
  document.querySelector("#preview").style.background = document.querySelector("#background_color").value;
  document.querySelector("#preview").style.color = document.querySelector("#color").value;
  if (document.querySelector("input#activate_textShadow").checked) {
    document.querySelector("#preview").style.textShadow = document.querySelector("#shadow-color").value + " 0px 0px " + document.querySelector("#shadow-blur").value + "px";
  } else {
    document.querySelector("#preview").style.textShadow = "";
  }
};

function restoreOptions() {

  function setCurrentChoice(result) {
    document.querySelector("#background_color").jscolor.fromString(result.background_color || "#00EF380");
    document.querySelector("#color").jscolor.fromString(result.color || "007EF3FF");
    document.querySelector("#shadow-color").jscolor.fromString(result.shadowColor || "#FFFFFF00");
    document.querySelector("#shadow-blur").value = result.shadowBlur || "0px";
    document.querySelector("input#activate_textShadow").checked = result.shadowActivated;
    if (result.shadowActivated) {
      document.querySelector('div#textShadowOptions').style.display = "block";
    };
	if (result.customOptions) {
		result.customOptions.forEach(element => {
		var option = document.createElement("option");
		option.textContent = element.url;
		option.value = element.url;
		var select = document.querySelector("#custom_select");
		select.appendChild(option);
		});
	}
  };

  function onError(error) {
    console.log(`Error: ${error}`);
  };

  function updatePreview() {
    document.querySelector("#preview").style.background = document.querySelector("#background_color").value;
    document.querySelector("#preview").style.color = document.querySelector("#color").value;
    if (document.querySelector("input#activate_textShadow").checked) {
      document.querySelector("#preview").style.textShadow = document.querySelector("#shadow-color").value + " 0px 0px " + document.querySelector("#shadow-blur").value + "px";
    } else {
      document.querySelector("#preview").style.textShadow = "";
    };
  };

  let getting = browser.storage.local.get();
  getting.then(setCurrentChoice, onError);
  updatePreview();
};


function updateShadowColorDisplay(){if(document.querySelector("input#activate_textShadow").checked){document.querySelector('div#textShadowOptions').style.display="block"}else{document.querySelector('div#textShadowOptions').style.display="none"}};
function changeCustomDisplay() {
	var selectIndex = document.querySelector("#custom_select").selectedIndex;
	if(selectIndex != 0) {
		document.querySelector("#url_div").style.display = "block";
		document.querySelector("#change_url").value = document.querySelector("#custom_select").value;
		document.querySelector("#remove_custom").style.display = "block";

		function setCurrentChoice(result) {
			var customs = result.customOptions;
			document.querySelector("#background_color").jscolor.fromString(customs[selectIndex - 1].background || "#007ef3");
			document.querySelector("#color").jscolor.fromString(customs[selectIndex - 1].color || "white");
			document.querySelector("#shadow-color").jscolor.fromString(customs[selectIndex - 1].shadowColor || "#ffffff");
			document.querySelector("#shadow-blur").value = customs[selectIndex - 1].shadowBlur || "0px";
			document.querySelector("input#activate_textShadow").checked = customs[selectIndex - 1].shadowActivated;
			if(customs[selectIndex - 1].shadowActivated) {
				document.querySelector('div#textShadowOptions').style.display = "block";
			} else {
				document.querySelector('div#textShadowOptions').style.display = "none";
			};
			document.querySelector("#preview").style.background = document.querySelector("#background_color").value;
			document.querySelector("#preview").style.color = document.querySelector("#color").value;
			if (document.querySelector("input#activate_textShadow").checked) {
				document.querySelector("#preview").style.textShadow = document.querySelector("#shadow-color").value + " 0px 0px " + document.querySelector("#shadow-blur").value + "px";
			} else {
				document.querySelector("#preview").style.textShadow = "";
			};
		};

		function onError(error) {
			console.log(`Error:${error}`);
		};
		let getting = browser.storage.local.get();
		getting.then(setCurrentChoice, onError);
	} else {
		document.querySelector("#url_div").style.display = "none";
		document.querySelector("#remove_custom").style.display = "none";

		function setCurrentChoice(result) {
			document.querySelector("#background_color").jscolor.fromString(result.background_color || "#007ef3");
			document.querySelector("#color").jscolor.fromString(result.color || "white");
			document.querySelector("#shadow-color").jscolor.fromString(result.shadowColor || "#ffffff");
			document.querySelector("#shadow-blur").value = result.shadowBlur || "0px";
			document.querySelector("input#activate_textShadow").checked = result.shadowActivated;
			if(result.shadowActivated) {
				document.querySelector('div#textShadowOptions').style.display = "block";
			} else {
				document.querySelector('div#textShadowOptions').style.display = "none";
			}
			document.querySelector("#preview").style.background = document.querySelector("#background_color").value;
			document.querySelector("#preview").style.color = document.querySelector("#color").value;
			if (document.querySelector("input#activate_textShadow").checked) {
				document.querySelector("#preview").style.textShadow = document.querySelector("#shadow-color").value + " 0px 0px " + document.querySelector("#shadow-blur").value + "px";
			} else {
				document.querySelector("#preview").style.textShadow = "";
			};
		};

		function onError(error) {
			console.log(`Error:${error}`);
		};
		let getting = browser.storage.local.get();
		getting.then(setCurrentChoice, onError);
	};
};
document.addEventListener("DOMContentLoaded", restoreOptions);
document.addEventListener("DOMContentLoaded", () => {setTimeout(updatePreview, 100)});
document.querySelector("#save_btn").addEventListener("click", saveOptions);
document.querySelector("#formdiv").addEventListener("keyup", updatePreview);
document.querySelector("#formdiv").addEventListener("input", updatePreview);
document.querySelector("#add_custom").addEventListener("click", addCustom);
document.querySelector("#remove_custom").addEventListener("click", removeCustom);
document.querySelector("input#activate_textShadow").addEventListener("change", updatePreview);
document.querySelector("select#custom_select").addEventListener("change", changeCustomDisplay);
document.querySelector("input#activate_textShadow").addEventListener("change", updateShadowColorDisplay);
// document.querySelector("#promotionaldiv").addEventListener("click", (event) => {document.querySelector("#promotionaldiv").style.display = "none"})
/*browser.tabs.create({
    url:browser.extension.getURL('./popup.html')
});*/
