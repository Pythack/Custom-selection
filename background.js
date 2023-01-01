if (typeof browser === "undefined") {
  var browser = chrome;
}

function onError(error) {
    console.log(`Error:${error}`);
}

async function restoreOptions(tab) {
  var storage = await browser.storage.local.get();
  browser.tabs.removeCSS(tab.id, {
    allFrames: true,
    code: localStorage.getItem(tab.id)
  });
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
        browser.tabs.insertCSS(tab.id, {
          allFrames: true,
          code: css
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
    browser.tabs.insertCSS(tab.id, {
      allFrames: true,
      code: css
    });
  }
  localStorage.setItem(tab.id, css);
}

async function update_action_icon(tabin) {
  var tab = await browser.tabs.get(tabin.tabId);
  var storage = await browser.storage.local.get();
  var taburl = new URL(tab.url);
  var injected = false;
  if (storage.customOptions) {
    storage.customOptions.forEach((element) => {
      var elurl = new URL(element.url);
      if (elurl.host === taburl.host) {
        injected = true;
        browser.browserAction.setIcon({path: browser.extension.getURL('./iconcustom.png')});
      }
    });
  }
  if (!injected) {
    browser.browserAction.setIcon({path: browser.extension.getURL('./icon.png')});
  }
}

browser.runtime.onMessage.addListener((message, sender) => {
  switch(message.request) {
    case "inject-css":
      restoreOptions(sender.tab);
      update_action_icon({tabId: sender.tab.id});
      break;
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