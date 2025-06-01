(function () {
    'use strict';

    // Function to get plugin configuration using csLib
    async function getPluginConfig() {
        try {
            // Use the plugin ID defined in the manifest file
            const config = await csLib.getConfiguration('categorize-tags-based-on-parent', {});
            return config;
        } catch (error) {
            console.error('Error fetching plugin configuration with csLib:', error);
            return {};
        }
    }

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
        // Get plugin configuration
        const config = await getPluginConfig();
        const showParentTagName = config.showParentTagName === true; // Default to false if not set
        
        const waitss = await waitForElement('.vjs-control-text');
        const elements = document.querySelectorAll('.tag-name, .tag-item, .tag-card');
        
        // Process the found tags
        await processTagsInElement(document, showParentTagName);
    }
    
    // New function to process tags within a given element
    async function processTagsInElement(parentElement, showParentTagName) {
        const elements = parentElement.querySelectorAll('.tag-name, .tag-item, .tag-card');
        const elementsWithTags = [];
    
        for (const pre of elements) { // Change to for...of to allow await
            const anchorElement = pre.querySelector('a');
            if (anchorElement) {
                const innerDiv = anchorElement.querySelector('div'); // Find the inner div
                if (innerDiv) {
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

        // Prepend parent tag name to the inner div's innerHTML if it exists and option is enabled
                    // Add a check to see if the element has already been processed
                    if (showParentTagName && parent_tag[1] !== "No Parent" && !innerDiv.dataset.categorized) {
            const parentTagNameDisplay = `${parent_tag[1]}: `;
                        // Store the original content before prepending
                        innerDiv.dataset.originalTagName = innerDiv.innerHTML;
                 innerDiv.innerHTML = parentTagNameDisplay + innerDiv.innerHTML; // Prepend to inner div's content
                        // Mark this element as categorized
                        innerDiv.dataset.categorized = 'true';
                    }
                }
            }
        }
    
        // Sorting the elements by their first value in parent_tag
        await sortElementsByParentTag(elementsWithTags, parentElement);
    }

    async function sortElementsByParentTag(elementsWithTags, parentElement) {
        // Sort elements based on the first value of parent_tag
        elementsWithTags.sort((a, b) => a.parentTag[0] - b.parentTag[0]);

        // Check if we are on the scene detail page (where parentElement is the document)
        if (parentElement === document) {
            // Re-implement the logic to find the H6 tag and insert after it for the scene detail page
            let tagHeader = null;
            // Since we are processing the whole document, find the H6 that precedes any tag element
            const possibleTagElements = parentElement.querySelectorAll('.tag-name, .tag-item, .tag-card');
            if (possibleTagElements.length > 0) {
                // Find the closest previous H6 relative to the first tag element found
                let prevElement = possibleTagElements[0].previousElementSibling;
                while(prevElement) {
                    if (prevElement.tagName === 'H6') {
                        tagHeader = prevElement;
                        break;
                    }
                    prevElement = prevElement.previousElementSibling;
                }
            }

            // If tagHeader is found, clear out existing tags and insert sorted ones after it
            if (tagHeader) {
                // Remove existing tag elements from the DOM before re-inserting
                elementsWithTags.forEach(item => {
                    if (item.element.parentNode) {
                         item.element.parentNode.removeChild(item.element);
                    }
                });

                // Insert each sorted element after the <h6> element in correct order
                let insertAfter = tagHeader;
                elementsWithTags.forEach(({ element }) => {
                    insertAfter.insertAdjacentElement('afterend', element); // Insert after the previous element
                    insertAfter = element; // Update the reference to the last inserted element
                });
            } else {
                 console.error('Could not find the tag header element (<h6> preceding a tag item) on the scene detail page for sorting.');
            }
        } else {
            // This logic is for popovers or other containers where tags are children of a common parent
            // Find the common parent element of the tags being sorted
            let commonParent = null;
            if (elementsWithTags.length > 0) {
                // Assuming all tags have the same immediate parent for sorting purposes within a group (like a popover or list)
                commonParent = elementsWithTags[0].element.parentElement;
            }

            if (!commonParent) {
                console.error('Could not find the common parent element for sorting in a non-document context.');
                return; // Exit if no common parent is found
            }

            // Remove existing tag elements from the DOM before re-inserting
             elementsWithTags.forEach(item => {
                if (item.element.parentNode) {
                     item.element.parentNode.removeChild(item.element);
                }
            });

            // Insert each sorted element back into the common parent element
            elementsWithTags.forEach(({ element }) => {
                 commonParent.appendChild(element); // Append the element in the new sorted order
            });
        }
    }
    
    // Handle path change events
    function handlePathChange() {
        if (window.location.pathname.startsWith("/scenes/") && window.location.pathname !== "/scenes") {
            updateDOM(); // Existing logic for individual scene pages
        } else if (window.location.pathname === "/scenes") {
            processSceneList(); // New logic for the scene list page
        }
    }

    // New function to handle the scene list page
    async function processSceneList() {
        console.log("Processing scene list page...");

        // Get plugin configuration
        const config = await getPluginConfig();
        const showParentTagName = config.showParentTagName === true; // Default to false if not set
        
        // Use MutationObserver to watch for the popover
        const observer = new MutationObserver(async (mutations) => {
            for (const mutation of mutations) {
                if (mutation.addedNodes) {
                    for (const node of mutation.addedNodes) {
                        // Check if the added node is the popover element or contains it
                        if (node.nodeType === 1 && (node.id === 'popover' || node.querySelector('#popover'))) {
                            console.log("Popover detected. Processing tags...");
                            const popoverElement = node.id === 'popover' ? node : node.querySelector('#popover');
                            if (popoverElement) {
                                // Wait a moment for the popover content to be fully rendered
                                // This might need adjustment based on how fast the popover content loads
                                await new Promise(resolve => setTimeout(resolve, 50)); 
                                await processTagsInElement(popoverElement, showParentTagName);
                            }
                        }
                    }
                }
            }
        });

        // Start observing the document body for childList changes
        observer.observe(document.body, { childList: true, subtree: true });

        // We might need to disconnect the observer when navigating away
        // This can be done by storing the observer and disconnecting in handlePathChange
        // Or, since we are only processing for /scenes, the observer can persist
        // for the lifetime of the /scenes page visit.
        // For now, let's keep it simple and let it persist.
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
