chrome.webRequest.onCompleted.addListener(
  (details) => {
    // Check if the status code is 500
    if (details.statusCode === 500) {
      console.log("HTTP 500 detected. Clearing cookies and reloading.");

      // Replace 'https://myetl.snu.ac.kr/' with the actual host
      let url = 'https://myetl.snu.ac.kr/';

      // Clear cookies
      chrome.cookies.getAll({ url: url }, function (cookies) {
        for (let i = 0; i < cookies.length; i++) {
          let cookie = cookies[i];
          let url = (cookie.secure ? "https://" : "http://") + cookie.domain + cookie.path;
          chrome.cookies.remove({ url: url, name: cookie.name });
        }
      });

      // Reload the tab
      chrome.tabs.reload(details.tabId);
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);
