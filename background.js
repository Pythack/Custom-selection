function restoreOptions() {

  function onError(error) {
    console.log(`Error: ${error}`);
  };

  function setCurrentChoice(result) {
    if (result.shadowActivated) {
      var css = '::selection { background: ' + result.background_color + '; color: ' + result.color + '; text-shadow: ' + result.shadowColor + ' 0px 0px ' + result.shadowBlur + 'px}';
    } else {
      var css = '::selection { background: ' + result.background_color + '; color: ' + result.color + '; text-shadow: }';
    }
    console.log(css);
    browser.tabs.insertCSS({code: css});
  };

  let getting = browser.storage.local.get();
  getting.then(setCurrentChoice, onError);

};


browser.runtime.onMessage.addListener((message) => {
  switch (message.request) {
    case "inject-css": restoreOptions();
    break;
  }
})

function onIconClicked() {
    browser.tabs.create({url: browser.extension.getURL('./popup.html')});
}

browser.browserAction.onClicked.addListener(onIconClicked);
