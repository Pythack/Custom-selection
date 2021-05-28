function restoreOptions(sender) {
	function onError(error) {
		console.log(`Error:${error}`);
	};

	function setCurrentChoice(sender, result) {
    if(result.shadowActivated) {
      var css = '::selection { background: ' + result.background_color + '; color: ' + result.color + '; text-shadow: ' + result.shadowColor + ' 0px 0px ' + result.shadowBlur + 'px}';
    } else {
      var css = '::selection { background: ' + result.background_color + '; color: ' + result.color + '; text-shadow: none}';
    };
    browser.tabs.insertCSS({
      allFrames: true,
      code: css
    });
    var url = new URL(sender);
    url = url.host;
    result.customOptions.forEach(element => {
      if (element.url.includes(url)) {
        if(element.shadowActivated) {
          css = '::selection { background: ' + element.background + '; color: ' + element.color + '; text-shadow: ' + element.shadowColor + ' 0px 0px ' + element.shadowBlur + 'px}';
        } else {
          css = '::selection { background: ' + element.background + '; color: ' + element.color + '; text-shadow: none}';
        };
        browser.tabs.insertCSS({
          allFrames: true,
          code: css
        });
      };
    });
	};
	let getting = browser.storage.local.get();
	getting.then(setCurrentChoice.bind(null, sender), onError);
};
browser.runtime.onMessage.addListener((message) => {
	switch(message.request) {
		case "inject-css":
			restoreOptions(message.url);
			break;
	};
});

function onIconClicked() {
	browser.tabs.create({
		url: browser.extension.getURL('./popup.html')
	})
};
browser.browserAction.onClicked.addListener(onIconClicked);
