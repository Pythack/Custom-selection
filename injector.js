if (typeof browser === "undefined") {
    var browser = chrome;
}
browser.runtime.sendMessage({request:"inject-css"});
