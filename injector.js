var url = window.location.href;
browser.runtime.sendMessage({request:"inject-css", url:url});
