if (typeof browser === "undefined") {
  var browser = chrome;
}

var localstorage = new Object;

function onError(error) {
    console.log(`Error:${error}`);
}

async function restoreOptions(tab) {
  if (/(chrome|about):\/\/.*/.test(tab.url)) {
    return;
  }
  var storage = await browser.storage.local.get();
  if (localstorage[tab.id]) {
    browser.scripting.removeCSS({
      target: {
        tabId: tab.id,
      },
      css: localstorage[tab.id]
    });
  }
  var css;
  var url = new URL(tab.url);
  url = url.host;
  var injected = false;
  if (storage.customOptions) {
    storage.customOptions.forEach((element) => {
      var elurl = new URL(element.url);
      if (elurl.host === url) {
        injected = true;
        if(element.shadowActivated) {
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
  if (!injected && storage.witness) {
    if(storage.shadowActivated) {
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
  localstorage[tab.id] = css;
}

async function update_action_icon(tabin) {
  var tab = await browser.tabs.get(tabin.tabId);
  var storage = await browser.storage.local.get();
  if (/^((chrome|about):\/\/.*|$)/.test(tab.url)) {
    browser.action.setIcon({path: browser.runtime.getURL('./icondisabled.png')});
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
      var elurl = new URL(element.url);
      if (elurl.host === taburl.host) {
        injected = true;
        browser.action.setIcon({path: browser.runtime.getURL('./iconcustom.png')});
      }
    });
  }
  if (!injected) {
    browser.action.setIcon({path: browser.runtime.getURL('./icon.png')});
  }
}

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  restoreOptions(tab);
  update_action_icon({tabId: tab.id});
});

browser.runtime.onMessage.addListener((message, sender) => {
  switch(message.request) {
      case "inject-css-all":
        browser.tabs.query({}).then((result) => {
          tabids = result.forEach((tab) => {
            restoreOptions(tab);
          });
        });
        break;
      }
    });
    
browser.tabs.onActivated.addListener(update_action_icon);

// function onIconClicked() {
// 	browser.tabs.create({
// 		url: browser.extension.getURL('./popup.html'),
// 	});
// };
// browser.browserAction.onClicked.addListener(onIconClicked);