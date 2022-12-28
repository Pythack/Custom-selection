function restoreOptions(tab) {
  function onError(error) {
    console.log(`Error:${error}`);
	};
  
	function setCurrentChoice(tab, result) {
    browser.tabs.removeCSS(tab.id, {
      allFrames: true,
      code: localStorage.getItem(tab.id)
    });
    var css;
    var url = new URL(tab.url);
    url = url.host;
    let injected = false;
    if (result.customOptions) {
      result.customOptions.forEach(element => {
        var elurl = new URL(element.url);
        if (elurl.host === url) {
          injected = true;
          if(element.shadowActivated) {
            css = '::selection { background: ' + element.background + '; color: ' + element.color + '; text-shadow: ' + element.shadowColor + ' 0px 0px ' + element.shadowBlur + 'px}';
          } else {
            css = '::selection { background: ' + element.background + '; color: ' + element.color + '; text-shadow: none}';
          };
          browser.tabs.insertCSS(tab.id, {
            allFrames: true,
            code: css
          });
        };
      });
    };
    if (!injected && result.witness) {
      if(result.shadowActivated) {
        css = '::selection { background: ' + result.background_color + '; color: ' + result.color + '; text-shadow: ' + result.shadowColor + ' 0px 0px ' + result.shadowBlur + 'px}';
      } else {
        css = '::selection { background: ' + result.background_color + '; color: ' + result.color + '; text-shadow: none}';
      };
      browser.tabs.insertCSS(tab.id, {
        allFrames: true,
        code: css
      });
    }
    localStorage.setItem(tab.id, css);
	};
	let getting = browser.storage.local.get();
	getting.then(setCurrentChoice.bind(null, tab), onError);
};
browser.runtime.onMessage.addListener((message, sender) => {
  switch(message.request) {
    case "inject-css":
			restoreOptions(sender.tab);
			break;
		case "inject-css-all":
      browser.tabs.query({}).then((result) => {
        tabids = result.forEach(tab => {
          restoreOptions(tab);
        });
      });
			break;
	};
});

// function onIconClicked() {
// 	browser.tabs.create({
// 		url: browser.extension.getURL('./popup.html'),
// 	});
// };
// browser.browserAction.onClicked.addListener(onIconClicked);
