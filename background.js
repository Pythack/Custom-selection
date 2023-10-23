if (typeof browser === "undefined") {
  var browser = chrome;
}

var localstorage = new Object(); // Initialize a local storage

function onError(error) { // Define onError function
    console.log(`Error:${error}`);
}

function matchRuleShort(str, rule) {
  var escapeRegex = (str) => str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
  return new RegExp("^" + rule.split("*").map(escapeRegex).join(".*") + "$").test(str);
}

async function restoreOptions(tab) {
  var storage = await browser.storage.local.get(); // Get settings
  if (localstorage[tab.id]) { // If extension already injected CSS in this tab, remove it
    browser.scripting.removeCSS({
      target: {
        tabId: tab.id,
      },
      css: localstorage[tab.id]
    }).catch(error => {return;});
  }
  var css;
  var url = new URL(tab.url);
  url = url.host; // Get the hostname of the url
  var injected = false;
  if (storage.customOptions) { // If custom settings are defined
    storage.customOptions.forEach((element) => {
      if (matchRuleShort(url, element.url)) { // Compare custom setting's hostname with the tab's
        injected = true;
        if(element.shadowActivated) { // If the settings has text shadow activated
          css = '::selection { background: ' + element.background + ' !important; color: ' + element.color + ' !important; text-shadow: ' + element.shadowColor + ' 0px 0px ' + element.shadowBlur + 'px !important}';
        } else {
          css = '::selection { background: ' + element.background + ' !important; color: ' + element.color + ' !important; text-shadow: none !important}';
        }
      }
    });
  }
  if (!injected && storage.witness) { // If url didn't match any custom settings and the user already defined some settings (avoid injecting undefined values into CSS)
    if(storage.shadowActivated) { // If the settings has text shadow activated
      css = '::selection { background: ' + storage.background_color + ' !important; color: ' + storage.color + ' !important; text-shadow: ' + storage.shadowColor + ' 0px 0px ' + storage.shadowBlur + 'px !important}';
    } else {
      css = '::selection { background: ' + storage.background_color + ' !important; color: ' + storage.color + ' !important; text-shadow: none !important}';
    }
  }
  browser.scripting.insertCSS({
    target: {
      tabId: tab.id,
    },
    css: css
  }).then(result => {return;}, error => {console.log(error);});
  localstorage[tab.id] = css; // Store the injected CSS into local storage so that we can remove it later
}

async function update_action_icon(tabin) {
  var tab = await browser.tabs.get(tabin.tabId); // Get the tab from the id
  var storage = await browser.storage.local.get(); // Get settings
  if (/^((chrome:\/\/|chrome-extension:\/\/|about:).*|$|https:\/\/chrome\.google\.com\/webstore.*|https:\/\/addons\.mozilla\.org.*)/.test(tab.url)) { // If tab is on chrome://, about:// or on the chrome web store
    browser.action.setIcon({path: './images/icondisabled.png'}); // Set the icon to disabled (grey)
    return; // Abort
  }
  try {
    var taburl = new URL(tab.url);
  } catch {
    return;
  }
  var injected = false;
  if (storage.customOptions) { // If custom settings are defined
    storage.customOptions.forEach((element) => { // For each custom setting
      if (matchRuleShort(taburl.host, element.url)) { // If the custom setting's url matches the hostname
        injected = true;
        browser.action.setIcon({path: './images/iconcustom.png'}); // Set to custom icon (yellow)
      }
    });
  }
  if (!injected) { // If the default settings are applied
    browser.action.setIcon({path: './images/icon.png'}); // Set to the default icon (blue)
  }
}

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {// When a tab is updated
  restoreOptions(tab); // Inject CSS
  browser.tabs.query({ active: true, currentWindow: true }, tabs => {
    update_action_icon({ tabId: tabs[0].id })// Update icon
  });
});

browser.runtime.onMessage.addListener((message, sender) => {
  switch(message.request) {
      case "inject-css-all": // When the user saves the settings (from popup)
        browser.tabs.query({}).then((result) => {
          tabids = result.forEach((tab) => {
            restoreOptions(tab); // Apply new settings in each tab
          });
        });
      case "update-action-icon": // When the user adds a new custom setting
        browser.tabs.query({ active: true, currentWindow: true }, tabs => {
          update_action_icon({ tabId: tabs[0].id })// Update icon
        });
        break;
      // case "display-notification": // When the user saves the settings (from popup)
      //     browser.notifications.create(message.notificationName, message.notification);
      //     setTimeout(function() {
      //       browser.notifications.clear(message.notificationName);
      //     }, message.timeout);
      //   break;
      }
    });
    
browser.tabs.onActivated.addListener(update_action_icon); // When the active tab has changed: update icon

chrome.runtime.onInstalled.addListener(async details => {
  switch (details.reason) {
    case "install":
      browser.storage.local.set({ // Set basic settings
        background_color: "#007EF333",
        color: "#007EF3FF",
        shadowActivated: false,
        shadowColor: "#007EF3FF",
        shadowBlur: "0",
        witness: true
      });
      break;
    case "update":
      var storage = await browser.storage.local.get(); // Get settings
      if (storage.customOptions) { // If custom settings are defined
        var customs = storage.customOptions;
        customs.forEach((element) => {
          try {
            let cururl = new URL(element.url);
            element.url = cururl.host;
          } catch (error) {
            
          }
        });
        browser.storage.local.set({ // Update custom settings
          customOptions: customs
        });
      }
      break;
    default:
      break;
  }
});

chrome.runtime.setUninstallURL("https://forms.gle/uRLUAXrwUa7bbBRH8");