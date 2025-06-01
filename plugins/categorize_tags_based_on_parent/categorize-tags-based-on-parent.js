(function () {
    'use strict';

    // Function that waits for a DOM element to appear
    async function waitForElement(selector) {
        return new Promise(resolve => {
            const intervalId = setInterval(() => {
                const element = document.querySelector(selector);
                if (element) {
                    clearInterval(intervalId); // Stop checking when the element is found
                    resolve(element); // Resolve with the found element
                }
            }, 100); // Check every 100 milliseconds
        });
    }

    // Fetch performer images based on their name
    const fetchparenttagbyid = async (tagid) => {
        const query = `
        mutation {
            querySQL(
                sql: "WITH RECURSIVE ParentHierarchy AS (SELECT parent_id, child_id FROM tags_relations WHERE child_id = ? UNION ALL SELECT tr.parent_id, tr.child_id FROM tags_relations tr INNER JOIN ParentHierarchy ph ON tr.child_id = ph.parent_id) SELECT COALESCE(ph.parent_id, ?) AS topmost_parent_id, t.name AS topmost_parent_name, ? FROM ParentHierarchy ph LEFT JOIN tags t ON ph.parent_id = t.id WHERE ph.parent_id NOT IN (SELECT child_id FROM ParentHierarchy) LIMIT 1;"
                args: [${tagid}, ${tagid}, ${tagid}]
            ) {
                rows
            }
        }`;
        try {
            const response = await fetch('/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return (await response.json()).data.querySQL.rows[0]; // Return performer image data
        } catch (error) {
            console.error('Error fetching performer images:', error);
        }
    };

    function stringToColor(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }

        // Convert hash to RGB
        const r = (hash >> 16) & 0xff;
        const g = (hash >> 8) & 0xff;
        const b = hash & 0xff;

        // Modify the RGB values to create softer colors
        const softR = Math.floor(r); // Increase the intensity instead of reducing it
        const softG = Math.floor(g);
        const softB = Math.floor(b);

        return `rgb(${softR}, ${softG}, ${softB}, 0.3)`;
    }

    // Update the DOM with fetched images and sort them by background color
    async function updateDOM() {
        const waitss = await waitForElement('.vjs-control-text');
        const elements = document.querySelectorAll('.tag-name, .tag-item, .tag-card');
        const elementsWithTags = [];
    
        for (const pre of elements) { // Change to for...of to allow await
            if (pre.querySelector('a')) {
                var anchorElement = pre.querySelector('a');
                var hrefValue = anchorElement.href;
                const regex = /%22id%22:%22(\d+)%22/;
                var match = hrefValue.match(regex);
                if (match && match[1]) {
                    hrefValue = match[1];
                }
    
                var parent_tag = await fetchparenttagbyid(hrefValue); 
                if (parent_tag == null) { parent_tag = [0, "No Parent", hrefValue]; }
    
                // Store the element along with parent_tag for sorting later
                elementsWithTags.push({ element: pre, parentTag: parent_tag });
                
                pre.style.backgroundColor = stringToColor(parent_tag[1]);
                pre.style.color = 'white';
                // Modify the innerHTML to display "HighestParentTag: TagName"
                // parent_tag[1] is the topmost_parent_name
                // pre.innerHTML contains the original tag name inside a link
                // We need to extract the original tag name and prepend the parent tag name
                const originalTagName = anchorElement.textContent; // Assuming the tag name is the text content of the anchor tag
                
                // Check if the parent tag is "No Parent" and adjust the display accordingly
                if (parent_tag[1] === "No Parent") {
                    pre.innerHTML = `<div class="arrange">${originalTagName}</div>`;
                } else {
                    pre.innerHTML = `<div class="arrange">${parent_tag[1]}: ${originalTagName}</div>`;
                }
            }
        }
    
        // Sorting the elements by their first value in parent_tag
        await sortElementsByParentTag(elementsWithTags);
    }
    
    async function sortElementsByParentTag(elementsWithTags) {
        // Sort elements based on the first value of parent_tag
        elementsWithTags.sort((a, b) => a.parentTag[0] - b.parentTag[0]);
    
        // Find the <h6>Tags</h6> element
        const tagHeader = Array.from(document.querySelectorAll('h6')).find(h6 => h6.textContent.trim() === 'Tags');
    
        // Clear out any previous elements after the header
        let nextElement = tagHeader.nextElementSibling;
        while (nextElement && !nextElement.matches('h6')) { // Assuming no other <h6> follows
            const temp = nextElement; // Store the current next sibling
            nextElement = nextElement.nextElementSibling; // Move to the next sibling
            tagHeader.parentNode.removeChild(temp); // Remove it from the DOM
        }
    
        // Insert each sorted element after the <h6> element
        elementsWithTags.forEach(({ element }) => {
            tagHeader.insertAdjacentElement('afterend', element); // Correctly place the actual DOM element
        });
    }
    
        
            // Handle path change events
            function handlePathChange() {
                if (window.location.pathname.startsWith("/scenes/")) {
                    updateDOM();
                }
            }
        
            // Override history pushState and replaceState to handle navigation
            const originalPushState = history.pushState;
            history.pushState = function (state, title, url) {
                originalPushState.apply(this, arguments);
                handlePathChange(); // Check for path change on pushState
            };
        
            const originalReplaceState = history.replaceState;
            history.replaceState = function (state, title, url) {
                originalReplaceState.apply(this, arguments);
                handlePathChange(); // Check for path change on replaceState
            };
        
            // Initial path detection to update content if on a performer page
            handlePathChange();
            window.addEventListener('popstate', handlePathChange); // Listen for back/forward navigation
        
        })();
