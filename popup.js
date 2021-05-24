function saveSuccess(item) {
  browser.notifications.create("selesty-save-status", {type: 'basic', title: 'Selection styler: Saving success', message: "Preferences saved successfully. ", "iconUrl": browser.runtime.getURL("./icon.png")})
  setTimeout(function(){browser.notifications.clear("selesty-save-status");}, 5000);
}

function saveError(item) {
  browser.notifications.create("selesty-save-status", {type: 'basic', title: 'Selection styler: Saving error', message: "Error saving preferences", "iconUrl": browser.runtime.getURL("./icon.png")})
  setTimeout(function(){browser.notifications.clear("selesty-save-status");}, 5000);
}

class Custom_option {
  constructor(url, color, background, shadowActivated, shadowColor, shadowBlur) {
    this.url = url;
    this.color = color;
    this.background = background;
    this.shadowActivated = shadowActivated;
    this.shadowColor = shadowColor;
    this.shadowBlur = shadowBlur;
  }

function saveOptions(e) {
  e.preventDefault();
  let preferencesSave = browser.storage.local.set({
    background_color: document.querySelector("#background_color").value || "#007ef3",
    color: document.querySelector("#color").value || "white",
    shadowActivated: document.querySelector("input#activate_textShadow").checked || false,
    shadowColor: document.querySelector("#shadow-color").value || "none",
    shadowBlur: document.querySelector("#shadow-blur").value || "0"
    //fontSize: document.querySelector("#font-size").value || "auto",
  });
  preferencesSave.then(saveSuccess, saveError)
  browser.runtime.sendMessage({
          request:"inject-css"
  });
}

function updatePreview() {
  document.querySelector("#preview").style.background = document.querySelector("#background_color").value;
  document.querySelector("#preview").style.color = document.querySelector("#color").value;
  if (document.querySelector("input#activate_textShadow").checked) {
    document.querySelector("#preview").style.textShadow = document.querySelector("#shadow-color").value + " 0px 0px " + document.querySelector("#shadow-blur").value + "px";
  } else {
    document.querySelector("#preview").style.textShadow = "";
  }
}

function restoreOptions() {

  function setCurrentChoice(result) {
    document.querySelector("#background_color").value = result.background_color || "#007ef3";
    document.querySelector("#color-picker-backgroundColor").value = result.background_color || "#007ef3";
    document.querySelector("#color").value = result.color || "white";
    document.querySelector("#color-picker-textColor").value = result.color || "#ffffff";
    document.querySelector("#shadow-color").value = result.shadowColor || "#ffffff";
    document.querySelector("input#color-picker-shadowColor").value = result.shadowColor;
    document.querySelector("#shadow-blur").value = result.shadowBlur || "0px";
    document.querySelector("input#activate_textShadow").checked = result.shadowActivated;
    if (result.shadowActivated) {
      document.querySelector('div#textSadowOptions').style.display = "block";
    }
  }

  function onError(error) {
    console.log(`Error: ${error}`);
  }

  function updatePreview() {
    document.querySelector("#preview").style.background = document.querySelector("#background_color").value;
    document.querySelector("#preview").style.color = document.querySelector("#color").value;
    if (document.querySelector("input#activate_textShadow").checked) {
      document.querySelector("#preview").style.textShadow = document.querySelector("#shadow-color").value + " 0px 0px " + document.querySelector("#shadow-blur").value + "px";
    } else {
      document.querySelector("#preview").style.textShadow = "";
    }
  }

  let getting = browser.storage.local.get();
  getting.then(setCurrentChoice, onError);
  updatePreview();
}


function updateColorInput() {
  var color = document.querySelector("input#color-picker-textColor").value;
  document.querySelector("input#color").value = color;
}

function updateBackgroundColorInput() {
  var color = document.querySelector("input#color-picker-backgroundColor").value;
  document.querySelector("input#background_color").value = color;
}

function updateColorInputColor() {
  var color = document.querySelector("input#color").value;
  document.querySelector("input#color-picker-textColor").value = color;
}

function updateBackgroundColorInputColor() {
  var color = document.querySelector("input#background_color").value;
  document.querySelector("input#color-picker-backgroundColor").value = color;
}

function updateShadowColorInput() {
  var color = document.querySelector("input#color-picker-shadowColor").value;
  document.querySelector("input#shadow-color").value = color;
}

function updateShadowColorInputColor() {
  var color = document.querySelector("input#shadow-color").value;
  document.querySelector("input#color-picker-shadowColor").value = color;
}

function updateShadowColorDisplay() {
  if (document.querySelector("input#activate_textShadow").checked) {
    document.querySelector('div#textSadowOptions').style.display = "block";
  } else {
    document.querySelector('div#textSadowOptions').style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.addEventListener("DOMContentLoaded", updatePreview);
document.querySelector("form").addEventListener("submit", saveOptions);
document.querySelector("form").addEventListener("keyup", updatePreview);
document.querySelector("form").addEventListener("input", updatePreview);
document.querySelector("input#activate_textShadow").addEventListener("change", updatePreview);
document.querySelector("input#color-picker-textColor").addEventListener("input", updateColorInput);
document.querySelector("input#color-picker-backgroundColor").addEventListener("input", updateBackgroundColorInput);
document.querySelector("input#color").addEventListener("input", updateColorInputColor);
document.querySelector("input#background_color").addEventListener("input", updateBackgroundColorInputColor);
document.querySelector("input#color-picker-shadowColor").addEventListener("input", updateShadowColorInput);
document.querySelector("input#shadow-color").addEventListener("input", updateShadowColorInputColor);
document.querySelector("input#activate_textShadow").addEventListener("change", updateShadowColorDisplay);

/*browser.tabs.create({
    url:browser.extension.getURL('./popup.html')
});*/
