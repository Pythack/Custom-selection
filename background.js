const browser_action = chrome.action;

function insertCSS(tabId, css) {
  chrome.scripting.insertCSS({
    target: { tabId: tabId },
    css: css
  }).catch(error => console.error(error));
}

function removeCSS(tabId, css) {
  chrome.scripting.removeCSS({
    target: { tabId: tabId },
    css: css
  }).catch(error => console.error(error));
}

function onError(error) { 
    console.log(`Error:${error}`);
}

function matchRuleShort(str, rule) {
  var escapeRegex = (str) => str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
  return new RegExp("^" + rule.split("*").map(escapeRegex).join(".*") + "$").test(str);
}

async function restoreOptions(tab) {
  if (!tab || !tab.url) return; // Guard against undefined URLs
  
  var storage = await chrome.storage.local.get(); 
  
  // Use session storage instead of a global variable to survive Service Worker restarts
  var session = await chrome.storage.session.get('injectedCSS');
  var injectedCache = session.injectedCSS || {};

  if (injectedCache[tab.id]) { 
    removeCSS(tab.id, injectedCache[tab.id]);
  }

  try {
    var url = new URL(tab.url);
    var host = url.host; 
  } catch (e) {
    return; // Abort if URL is completely malformed
  }

  const generateCSS = (config) => {
    // Handle the discrepancy: custom options use 'background', default uses 'background_color'
    const bg = config.background || config.background_color;
    
    // Explicitly set to 'none' if deactivated to overwrite previous injections
    const shadow = config.shadowActivated 
      ? `text-shadow: ${config.shadowColor} 0px 0px ${config.shadowBlur}px !important;` 
      : 'text-shadow: none !important;';
      
    const decoration = config.decorationActivated 
      ? `text-decoration: ${config.decorationType} ${config.decorationColor} !important;` 
      : 'text-decoration: none !important;';

    return `::selection { background: ${bg} !important; color: ${config.color} !important; ${shadow} ${decoration} }`;
  };

  let css;
  let injected = false;

  if (storage.customOptions) { 
    const matchedConfig = storage.customOptions.find((element) => matchRuleShort(host, element.url));
    
    if (matchedConfig) { 
      injected = true;
      css = generateCSS(matchedConfig);
    }
  }

  // Fallback to default settings if no custom rule matched and the URL is permitted
  if (!injected && storage.witness && !/^((chrome:\/\/|chrome-extension:\/\/|about:).*|$|https:\/\/chrome\.google\.com\/webstore.*|https:\/\/addons\.mozilla\.org.*)/.test(tab.url)) { 
    css = generateCSS(storage);
  }

  if (css) {
    insertCSS(tab.id, css);
    // Update the session storage cache
    injectedCache[tab.id] = css;
    await chrome.storage.session.set({ injectedCSS: injectedCache });
  }
}

async function update_action_icon(tabin) {
  try {
    var tab = await chrome.tabs.get(tabin.tabId); 
  } catch {
    return; // Tab might have closed before this executes
  }

  var storage = await chrome.storage.local.get(); 
  
  // Guard against internal pages or missing URLs
  if (!tab.url || /^((chrome:\/\/|chrome-extension:\/\/|about:).*|$|https:\/\/chrome\.google\.com\/webstore.*|https:\/\/addons\.mozilla\.org.*)/.test(tab.url)) { 
    browser_action.setIcon({path: './images/icondisabled.png', tabId: tab.id}); // Isolate to tabId
    return; 
  }

  try {
    var taburl = new URL(tab.url);
  } catch {
    return;
  }

  var injected = false;
  if (storage.customOptions) { 
    storage.customOptions.forEach((element) => { 
      if (matchRuleShort(taburl.host, element.url)) { 
        injected = true;
        browser_action.setIcon({path: './images/iconcustom.png', tabId: tab.id}); 
      }
    });
  }

  if (!injected) { 
    browser_action.setIcon({path: './images/icon.png', tabId: tab.id}); 
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only run the heavy logic when the page has actually finished loading
  if (changeInfo.status === 'complete') {
    restoreOptions(tab); 
    update_action_icon({ tabId: tabId }); // Target the specific tab that updated, not just the active one
  }
});

chrome.runtime.onMessage.addListener((message, sender) => {
  switch(message.request) {
      case "inject-css-all": 
        chrome.tabs.query({}).then((result) => {
          result.forEach((tab) => {
            restoreOptions(tab); 
          });
        });
        break;

      case "update-action-icon": 
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
          if (tabs.length > 0) update_action_icon({ tabId: tabs[0].id });
        });
        break;
  }
});
    
chrome.tabs.onActivated.addListener(update_action_icon); 

chrome.runtime.onInstalled.addListener(async details => {
  switch (details.reason) {
    case "install":
      chrome.storage.local.set({ 
        background_color: "#007EF333",
        color: "#007EF3FF",
        shadowActivated: false,
        shadowColor: "#007EF3FF",
        shadowBlur: "0",
        decorationActivated: false,
        decorationType: "underline",
        decorationColor: "#007EF3FF",
        witness: true
      });
      break;
    case "update":
      var storage = await chrome.storage.local.get(); 
      if (!storage.hasOwnProperty('decorationActivated')) {
        chrome.storage.local.set({ 
          decorationActivated: false,
          decorationType: "underline",
          decorationColor: "#007EF3FF"
        });
      }
      if (storage.customOptions) { 
        var customs = storage.customOptions;
        customs.forEach((element) => {
          try {
            let cururl = new URL(element.url);
            element.url = cururl.host;
            if (!element.hasOwnProperty('decorationActivated')) {
              element.decorationActivated = false;
              element.decorationType = "underline";
              element.decorationColor = "#007EF3FF";
            }
          } catch (error) {}
        });
        chrome.storage.local.set({ customOptions: customs });
      }
      break;
  }
});

chrome.runtime.setUninstallURL("https://forms.gle/uRLUAXrwUa7bbBRH8");