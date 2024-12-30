(function() {
    'use strict';

function waitForElementByXpath(xpath, callback) {
    const interval = setInterval(() => {
        const element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (element) {
            clearInterval(interval);
            callback(xpath, element);
        }
    }, 100); // Check every 100 ms
}

    // Function to replace text content
    async function replaceText() {
        const elements = document.querySelectorAll('.tag-name, .tag-item, .tag-select, .tag-card, #tag-edit');
        elements.forEach(function(pre) {
          if (pre.querySelector('a')) {
                    var anchorElement = pre.querySelector('a')
                    var hrefValue = anchorElement.href;
                    const regex = /%22id%22:%22(\d+)%22/;
                    var match = hrefValue.match(regex);
                    if (match && match[1]) {
                      hrefValue = match[1]; // Return the captured group (the ID)
                      hrefValue = "tag/" + hrefValue + '/image?';
                    }else{
                      hrefValue = hrefValue.replace('/tags/','/tag/');
                      hrefValue = hrefValue  + '/image?';
                    }
                    var final_value = '<img style="height:70px;" src="' + hrefValue + '" />'
                    if (!anchorElement.innerHTML.startsWith('<img')) {
                      anchorElement.innerHTML = final_value + pre.innerHTML
                    }
                    }
        })}

          
    waitForElementByXpath("//span[contains(@class, 'paginationIndex') or contains(@class, 'vjs-control-text')]", function (xpath, el) {
      replaceText();
          });

  function handlePathChange() {
    waitForElementByXpath("//span[contains(@class, 'paginationIndex') or contains(@class, 'vjs-control-text')]", function (xpath, el) {
      replaceText();
          });
}

const originalPushState = history.pushState;
history.pushState = function(state, title, url) {
    originalPushState.apply(this, arguments);
    handlePathChange();
};

const originalReplaceState = history.replaceState;
history.replaceState = function(state, title, url) {
    originalReplaceState.apply(this, arguments);
    handlePathChange();
};

// Initial path detection
handlePathChange();
window.addEventListener('popstate', handlePathChange);
    })();
