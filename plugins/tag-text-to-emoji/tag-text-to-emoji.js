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
          pre.innerHTML = pre.innerHTML
            .replace(/Green/g, "🟢")
            .replace(/White/g, "⚪")
            .replace(/Gray/g, "🩶")
            .replace(/Black/g, "⚫")
            .replace(/Brown/g, "🟤")
            .replace(/Purple/g, "🟣")
            .replace(/Blue/g, "🔵")
            .replace(/(Yellow|Blond)e?/g, "🟡")
            .replace(/Gold /g, "🪙")
            .replace(/Orange/g, "🟠")
            .replace(/Red/g, "🔴")
            .replace(/Pink/g, "🌸")
            .replace(/Female/g, "👩")
            .replace(/Male/g, "👨")
            .replace(/\(DP\)/g, "<b>DP</b>")
            .replace(/\(DVP\)/g, "<b>DVP</b>")
            .replace(/\(DAP\)/g, "<b>DAP</b>")
            .replace(/\(TAP\)/g, "<b>TAP</b>")
            .replace(/\(TP\)/g, "<b>TP</b>")
            .replace(/\(TVP\)/g, "<b>TVP</b>")
            .replace(/\(QUAP\)/g, "<b>QUAP</b>")
            .replace(/Ball/g, "⚽⚽")
            .replace(/Balls?/g, "⚽⚽")
            .replace(/Breasts?/g, "🍈🍈")
            .replace(/Fingers?/g, "🖕")
            .replace(/Foots?/g, "🦶")
            .replace(/Tongue/g, "👅")
            .replace(/Toys?/g, "🧸")
            .replace(/Eyes?/g, "👁️")
            .replace(/Nose/g, "👃")
            .replace(/Mouth/g, "👄")
            .replace(/(Ear |Ears)/g, "👂")
            .replace(/Toes?/g, "👣")
            .replace(/Albanian/g, "🇦🇱")
            .replace(/American/g, "🇺🇸")
            .replace(/Argentinian/g, "🇦🇷")
            .replace(/Australian/g, "🇦🇺")
            .replace(/Belarusian/g, "🇧🇾")
            .replace(/Belgian/g, "🇧🇪")
            .replace(/Brazilian/g, "🇧🇷")
            .replace(/British/g, "🇬🇧")
            .replace(/Bulgarian/g, "🇧🇬")
            .replace(/Canadian/g, "🇨🇦")
            .replace(/Chinese/g, "🇨🇳")
            .replace(/Colombian/g, "🇨🇴")
            .replace(/Costa Rican/g, "🇨🇷")
            .replace(/Cuban/g, "🇨🇺")
            .replace(/Czech/g, "🇨🇿")
            .replace(/Dominican/g, "🇩🇴")
            .replace(/Dutch/g, "🇳🇱")
            .replace(/Ecuadorian/g, "🇪🇨")
            .replace(/Estonian/g, "🇪🇪")
            .replace(/Filipino/g, "🇵🇭")
            .replace(/Finnish/g, "🇫🇮")
            .replace(/French/g, "🇫🇷")
            .replace(/German/g, "🇩🇪")
            .replace(/Greek/g, "🇬🇷")
            .replace(/Guatemalan/g, "🇬🇹")
            .replace(/Hungarian/g, "🇭🇺")
            .replace(/Icelandic/g, "🇮🇸")
            .replace(/Indonesian/g, "🇮🇩")
            .replace(/Irish/g, "🇮🇪")
            .replace(/Italian/g, "🇮🇹")
            .replace(/Japanese/g, "🇯🇵")
            .replace(/Latvian/g, "🇱🇻")
            .replace(/Lebanese/g, "🇱🇧")
            .replace(/Lithuanian/g, "🇱🇹")
            .replace(/Moldovan/g, "🇲🇹")
            .replace(/Mongolian/g, "🇲🇳")
            .replace(/Norwegian/g, "🇳🇴")
            .replace(/Peruvian/g, "🇵🇪")
            .replace(/Polish/g, "🇵🇱")
            .replace(/Portuguese/g, "🇵🇹")
            .replace(/Romanian/g, "🇷🇴")
            .replace(/Russian/g, "🇷🇺")
            .replace(/Saudi Arabian/g, "🇸🇦")
            .replace(/Scandinavian/g, "🇸🇪") // Note: There is no specific flag for "Scandinavian", using Sweden as a representative
            .replace(/Scottish/g, "🏴")  // Using the Scotland flag emoji
            .replace(/Serbian/g, "🇷🇸")
            .replace(/Slovakian/g, "🇸🇰")
            .replace(/Slovenian/g, "🇸🇮")
            .replace(/Spanish/g, "🇪🇸")
            .replace(/Swedish/g, "🇸🇪")
            .replace(/Thai/g, "🇹🇭")
            .replace(/Turkish/g, "🇹🇷")
            .replace(/Ukrainian/g, "🇺🇦")
            .replace(/Uruguayan/g, "🇺🇾")
            .replace(/Venezuelan/g, "🇻🇪")
            .replace(/Vietnamese/g, "🇻🇳")
            .replace(/Welsh/g, "🏴‍☠️") // Welsh uses the flag of the United Kingdom for representation, alternative is a dragon emoji
            .replace(/Airplane/g, "✈️") // Airplane
            .replace(/Toilet/g, "🚽") // Toilet
            .replace(/Boat/g, "⛵") // Sailboat
            .replace(/Camping/g, "🏕️") // Camping
            .replace(/Church/g, "⛪") // Church
            .replace(/Hospital/g, "🏥") // Hospital
            .replace(/Hot Spring/g, "♨️") // Hot Springs
            .replace(/Hot Tub Room/g, "🛁") // Bathtub
            .replace(/Hotel/g, "🏨") // Hotel
            .replace(/Window/g, "🪟")
            .replace(/Office/g, "🏢") // Office Building
            .replace(/Parking Lot/g, "🅿️") // P Symbol (Parking)
            .replace(/Park/g, "🏞️") // National Park
            .replace(/School/g, "🏫") // School
            .replace(/Store/g, "🏬") // Department Store
            .replace(/Aggressive/g, "😡") // Angry Face
            .replace(/Angry/g, "😠") // Pouting Face
            .replace(/Artistic/g, "🎨") // Artist Palette
            .replace(/Bizarre/g, "😵‍💫") // Dizzy Face
            .replace(/Bored/g, "😪") // Sleepy Face
            .replace(/Brutal/g, "💀") // Skull
            .replace(/Crying/g, "😭") // Loudly Crying Face
            .replace(/Dirty Talk/g, "🗣️") // Speaking Head
            .replace(/Disgust/g, "🤢") // Nauseated Face
            .replace(/Eager/g, "😃") // Grinning Face with Big Eyes
            .replace(/Edgy/g, "😎") // Smiling Face with Sunglasses
            .replace(/Glamour/g, "✨") // Sparkles
            .replace(/High Energy/g, "⚡") // High Voltage
            .replace(/Nervous/g, "😰") // Anxious Face with Sweat
            .replace(/Playful/g, "😜") // Winking Face with Tongue
            .replace(/Reluctance/g, "😐") // Neutral Face
            .replace(/Romance/g, "💑") // Couple with Heart
            .replace(/Sneaky/g, "😏") // Smirking Face
            .replace(/Sunlit/g, "☀️") // Sun
            .replace(/Sweaty/g, "😅") // Grinning Face with Sweat
            .replace(/Whispering/g, "🤫") // Shushing Face
            .replace(/Girl/g, "👧") // Grinning Face with Sweat
            .replace(/Boy/g, "👦") // Shushing Face


          const matches = pre.innerHTML.match(/\((.*?)\)/g);
                let textInsideParentheses = '';
                if (matches) {
                    // Join all matched strings without parentheses
                    textInsideParentheses = matches.map(match => match.slice(1, -1)).join(', '); // Collect and format the results


                    // Check if only contains 'b' and 'g'
                    if (/^[BG]+$/.test(textInsideParentheses)) { // Regex to check if only consists of 'b' and 'g'
                        // Replace 'b' with 'boy' and 'g' with 'girl'
                        textInsideParentheses = textInsideParentheses.replace(/B/g, '♂️').replace(/G/g, '♀️');
                        pre.innerHTML = pre.innerHTML.replace(/[a-zA-Z ]+\(.*?\)/g, `${textInsideParentheses}`);
                    }
                }
          


        });
    }

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
