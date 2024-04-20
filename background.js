async function alert({
  html,
  title = chrome.runtime.getManifest().name,
  width = 300,
  height = 150,
  left,
  top,
}) {
  const w = left == null && top == null && await chrome.windows.getCurrent();
  const w2 = await chrome.windows.create({
    url: `data:text/html,<title>${title}</title>${html}`.replace(/#/g, '%23'),
    type: 'popup',
    left: left ?? Math.floor(w.left + (w.width - width) / 2),
    top: top ?? Math.floor(w.top + (w.height - height) / 2),
    height,
    width,
  });
  return new Promise(resolve => {
    chrome.windows.onRemoved.addListener(onRemoved, { windowTypes: ['popup'] });
    function onRemoved(id) {
      if (id === w2.id) {
        chrome.windows.onRemoved.removeListener(onRemoved);
        resolve();
      }
    }
  });
}

chrome.webRequest.onCompleted.addListener(
  (details) => {
    // Check if the status code is 500
    if (details.statusCode === 500) {
      console.log("HTTP 500 detected. Clearing cookies and reloading.");

      // Define the array of URLs for which cookies need to be cleared
      let urls = [
        'https://myetl.snu.ac.kr/',
        'https://etl.snu.ac.kr/',
        'https://snu.ac.kr/',
        'http://myetl.snu.ac.kr/',
        'http://etl.snu.ac.kr/',
        "http://snu.ac.kr/",
      ];

      // Iterate over each URL and clear cookies
      urls.forEach(url => {
        chrome.cookies.getAll({ url: url }, function (cookies) {
          for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i];
            let domain = cookie.domain;
            if (domain.startsWith('.')) {
              domain = domain.replace(/^\./, ''); // Removes the leading dot
            }
            let cookieUrl = (cookie.secure ? "https://" : "http://") + domain + cookie.path;
            console.log(`${cookieUrl}, ${domain}, ${cookie.name}, ${cookie.path}`);
            chrome.cookies.remove({ url: cookieUrl, name: cookie.name });
          }
        });
      });

      // Reload the tab
      chrome.tabs.reload(details.tabId);
    } else if (details.statusCode === 200) {
      console.log("HTTP 200 detected. Clearing cookies and reloading.");
      let urls = [
        "https://nsso.snu.ac.kr/sso/usr/login/link", // sso/usr/login/link
        "http://nsso.snu.ac.kr/sso/usr/login/link", // sso/usr/login/link
      ];
      // if current URL is one of the login URLs
      if (urls.includes(details.url)) {
        // clear cookies and reload
        console.log("Login detected. Clearing cookies and reloading.");
        chrome.cookies.getAll({ url: details.url }, function (cookies) {
          for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i];
            let domain = cookie.domain;
            if (domain.startsWith('.')) {
              domain = domain.replace(/^\./, ''); // Removes the leading dot
            }
            let cookieUrl = (cookie.secure ? "https://" : "http://") + domain + cookie.path;
            console.log(`${cookieUrl}, ${domain}, ${cookie.name}, ${cookie.path}`);
            chrome.cookies.remove({ url: cookieUrl, name: cookie.name });
          }
        });
        // Redirect to https://myetl.snu.ac.kr
        chrome.tabs.update(details.tabId, { url: "https://myetl.snu.ac.kr" });
      } else {
        console.log("Not a login page. Ignoring.");
      }
    }
  },
  {
    urls: [
      "*://myetl.snu.ac.kr/*",
      "*://etl.snu.ac.kr/*",
      "http://myetl.snu.ac.kr/*",
      "http://etl.snu.ac.kr/*",
      "*://snu.ac.kr/*",
      "http://snu.ac.kr/*",
      "https://nsso.snu.ac.kr/*",
      "http://nsso.snu.ac.kr/sso/usr/login/link",
      "https://sso.snu.ac.kr/sso/usr/login/link",
    ]
  }, // Monitor only these URLs
  ["responseHeaders"]
);
