if (typeof browser === "undefined") {
  var browser = chrome;
}

var localstorage = new Object; // Initialize a local storage

function onError(error) { // Define onError function
    console.log(`Error:${error}`);
}

async function restoreOptions(tab) {
  if (/^((chrome|about):\/\/.*|$|https:\/\/chrome\.google\.com\/webstore.*)/.test(tab.url)) { // If tab is chrome:// or about://
    return; // Abort the CSS injection
  }
  var storage = await browser.storage.local.get(); // Get settings
  if (localstorage[tab.id]) { // If extension already injected CSS in this tab, remove it
    browser.scripting.removeCSS({
      target: {
        tabId: tab.id,
      },
      css: localstorage[tab.id]
    });
  }
  var css;
  var url = new URL(tab.url);
  url = url.host; // Get the hostname of the url
  var injected = false;
  if (storage.customOptions) { // If custom settings are defined
    storage.customOptions.forEach((element) => {
      var elurl = new URL(element.url);
      if (elurl.host === url) { // Compare custom setting's hostname with the tab's
        injected = true;
        if(element.shadowActivated) { // If the settings has text shadow activated
          css = '::selection { background: ' + element.background + ' !important; color: ' + element.color + ' !important; text-shadow: ' + element.shadowColor + ' 0px 0px ' + element.shadowBlur + 'px !important}';
        } else {
          css = '::selection { background: ' + element.background + ' !important; color: ' + element.color + ' !important; text-shadow: none !important}';
        }
        browser.scripting.insertCSS({
          target: {
            tabId: tab.id,
          },
          css: css
        });
      }
    });
  }
  if (!injected && storage.witness) { // If url didn't match any custom settings and the user already defined some settings (avoid injecting undefined values into CSS)
    if(storage.shadowActivated) { // If the settings has text shadow activated
      css = '::selection { background: ' + storage.background_color + ' !important; color: ' + storage.color + ' !important; text-shadow: ' + storage.shadowColor + ' 0px 0px ' + storage.shadowBlur + 'px !important}';
    } else {
      css = '::selection { background: ' + storage.background_color + ' !important; color: ' + storage.color + ' !important; text-shadow: none !important}';
    }
    browser.scripting.insertCSS({
      target: {
        tabId: tab.id,
      },
      css: css
    });
  }
  localstorage[tab.id] = css; // Store the injected CSS into local storage so that we can remove it later
}

async function update_action_icon(tabin) {
  var tab = await browser.tabs.get(tabin.tabId); // Get the tab from the id
  var storage = await browser.storage.local.get(); // Get settings
  if (/^((chrome|about):\/\/.*|$|https:\/\/chrome\.google\.com\/webstore.*)/.test(tab.url)) { // If tab is on chrome://, about:// or on the chrome web store
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
      var elurl = new URL(element.url);
      if (elurl.host === taburl.host) { // If the custom setting's url matches the hostname
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
  update_action_icon({tabId: tab.id}); // Update icon
});

browser.runtime.onMessage.addListener((message, sender) => {
  switch(message.request) {
      case "inject-css-all": // When the user saves the settings (from popup)
        browser.tabs.query({}).then((result) => {
          tabids = result.forEach((tab) => {
            restoreOptions(tab); // Apply new settings in each tab
          });
        });
        break;
      case "display-notification": // When the user saves the settings (from popup)
          browser.notifications.create(message.notificationName, message.notification);
          setTimeout(function() {
            browser.notifications.clear(message.notificationName);
          }, message.timeout);
        break;
      }
    });
    
browser.tabs.onActivated.addListener(update_action_icon); // When the active tab has changed: update icon