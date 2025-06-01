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
                } else if (!document.body.contains(document.querySelector(selector.split(' ')[0] || selector))) {
                     // Basic check to stop waiting if a potential parent element is removed
                     clearInterval(intervalId);
                     resolve(null); // Resolve with null if parent is removed
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
                    if (showParentTagName && parent_tag[1] !== "No Parent") {
            const parentTagNameDisplay = `${parent_tag[1]}: `;
                        
                        // If already processed, start from original text to avoid duplication
                        if (innerDiv.dataset.originalTagName) {
                            innerDiv.innerHTML = parentTagNameDisplay + innerDiv.dataset.originalTagName;
                        } else {
                            // Store the original content before prepending
                            innerDiv.dataset.originalTagName = innerDiv.innerHTML;
                            innerDiv.innerHTML = parentTagNameDisplay + innerDiv.innerHTML; // Prepend to inner div's content
                        }
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
    
    // Store the MutationObserver instance so we can disconnect it later
    let sceneListObserver = null;

    // New function to handle the scene list page
    async function processSceneList() {
        console.log("Processing scene list page...");

        // Get plugin configuration
        const config = await getPluginConfig();
        const showParentTagName = config.showParentTagName === true; // Default to false if not set

        // If an observer is already active, disconnect it before creating a new one
        if (sceneListObserver) {
            sceneListObserver.disconnect();
            console.log("Disconnected previous scene list observer.");
        }

        // Use MutationObserver to watch for the popover
        sceneListObserver = new MutationObserver(async (mutations) => {
            for (const mutation of mutations) {
                if (mutation.addedNodes) {
                    for (const node of mutation.addedNodes) {
                        // Check if the added node is the popover element or contains it
                        if (node.nodeType === 1 && (node.id === 'popover' || node.querySelector('#popover'))) {
                            console.log("Popover detected. Checking for tags...");
                            const popoverElement = node.id === 'popover' ? node : node.querySelector('#popover');
                            if (popoverElement) {
                                // Find tag elements directly within the detected popover
                                const tagElements = popoverElement.querySelectorAll('.tag-name, .tag-item, .tag-card');

                                if (tagElements.length > 0) {
                                     console.log(`Found ${tagElements.length} tags in popover. Processing...`);
                                     // Process the found tags within the popover element
                                     await processTagsInElement(popoverElement, showParentTagName);
                                }
                            }
                        }
                    }
                }
            }
        });

        // Start observing the document body for childList changes
        // The observer will be disconnected when navigating away from /scenes
        sceneListObserver.observe(document.body, { childList: true, subtree: true });

        console.log("Scene list observer started.");
    }

    // Use csLib.PathElementListener to trigger logic based on path and element availability

    // Listener for the Scene List page (/scenes)
    // Wait for a stable element on the scene list page (e.g., .scene-card) to ensure the page is loaded,
    // then start the MutationObserver to watch for the popover.
    csLib.PathElementListener('/', '.scene-card', () => {
        console.log('Scene List page (/scenes) detected and .scene-card appeared. Starting MutationObserver...');
        // Call the function that sets up the MutationObserver for the popover
        processSceneList();
    });

    // Listener for individual Scene Detail pages (/scenes/:id)
    // Wait for a selector present on detail pages when content is loaded, e.g., .vjs-control-text
    csLib.PathElementListener('/scenes/', '.vjs-control-text', () => {
        console.log('Scene Detail page (/scenes/:id) detected and .vjs-control-text appeared. Updating DOM...');
        // Call the function that handles the individual scene page logic
        updateDOM();
    });

    // Listener for the Tags List page (/tags)
    // Wait for a stable element on the tags list page (e.g., .card-section) to ensure the page is loaded,
    // then process the tag names.
    csLib.PathElementListener('/tags', '.card-section', async () => {
        console.log('Tags List page (/tags) detected and .card-section appeared. Processing tag names...');

        // Get plugin configuration
        const config = await getPluginConfig();
        const showParentTagName = config.showParentTagName === true; // Default to false if not set

        if (!showParentTagName) {
            console.log("showParentTagName is false. Skipping tag name categorization on tags page.");
            return;
        }

        // Find all the links within .card-section elements on the page
        const tagLinks = document.querySelectorAll('div.card-section > a');
        console.log(`Found ${tagLinks.length} tag links. Processing...`);

        for (const anchorElement of tagLinks) {
            const h5Element = anchorElement.querySelector('h5');
            if (h5Element) {
                const innerDiv = h5Element.querySelector('div');
                if (innerDiv) {
                    const hrefValue = anchorElement.href;
                    const regex = /\/tags\/(\d+)$/;
                    const match = hrefValue.match(regex);

                    if (match && match[1]) {
                        const tagId = match[1];
                        const parent_tag = await fetchparenttagbyid(tagId);

                        if (parent_tag && parent_tag[1] !== "No Parent") {
                            const parentTagNameDisplay = `${parent_tag[1]}: `;
                            
                            // If already processed, start from original text to avoid duplication
                            if (innerDiv.dataset.originalTagName) {
                                innerDiv.innerHTML = parentTagNameDisplay + innerDiv.dataset.originalTagName;
                            } else {
                                // Store the original content before prepending
                                innerDiv.dataset.originalTagName = innerDiv.innerHTML;
                                innerDiv.innerHTML = parentTagNameDisplay + innerDiv.innerHTML; // Prepend to inner div's content
                            }
                            // Mark this element as categorized
                            innerDiv.dataset.categorized = 'true';
                        } else if (parent_tag == null) { // Handle case where tag might not exist or fetch failed
                            console.warn(`Could not fetch parent tag for ID: ${tagId}. Skipping.`);
                        }
                    } else {
                        console.warn(`Could not extract tag ID from href: ${hrefValue}`);
                    }
                }
            }
        }
    });

    // Listener to disconnect the MutationObserver when navigating away from the scene list page
    csLib.PathElementListener('/', 'body', (bodyElement) => {
        // This listener is effectively always active after the initial load, watching for any path.
        // Use stash:location event to check the path more accurately.
        PluginApi.Event.addEventListener("stash:location", (e) => {
            const currentPath = e.detail.data.location.pathname;
            console.log(`Navigated to: ${currentPath}`);
            // If the current path does NOT include '/scenes', disconnect the observer if it exists
            if (!currentPath.includes('/scenes') && sceneListObserver) {
                console.log('Navigated away from scene paths. Disconnecting scene list observer.');
                sceneListObserver.disconnect();
                sceneListObserver = null; // Clear the reference
            }
             // If the current path IS /scenes, the other PathElementListener will handle starting the observer when .scene-card appears.
        });
    });

})();
