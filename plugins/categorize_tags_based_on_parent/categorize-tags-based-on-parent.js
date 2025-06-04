(function () {
  "use strict";

  // Constants
  const TAG_SELECTORS = ".tag-name, .tag-item, .tag-card";
  const TAG_ID_REGEX = /%22id%22:%22(\d+)%22/;

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
      const response = await fetch("/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok: " + response.statusText);
      }
      const result = (await response.json()).data.querySQL.rows[0];
      return result || [0, "No Parent", tagid];
    } catch (error) {
      // console.error("Error fetching parent tag by id:", error);
      return [0, "No Parent", tagid];
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

    return `rgb(${r}, ${g}, ${b}, 0.3)`;
  }

  // New function to process tags within a given element
  async function processTagsInElement(parentElement) {
    const elements = parentElement.querySelectorAll(TAG_SELECTORS);
    const elementsWithTags = [];

    for (const pre of elements) {
      const anchorElement = pre.querySelector("a");
      if (anchorElement) {
        const innerDiv = anchorElement.querySelector("div");
        if (innerDiv) {
          const match = anchorElement.href.match(TAG_ID_REGEX);
          const tagId = match && match[1] ? match[1] : anchorElement.href;

          const parent_tag = await fetchparenttagbyid(tagId);

          // Store the element along with parent_tag for sorting later
          elementsWithTags.push({ element: pre, parentTag: parent_tag });

          pre.style.backgroundColor = stringToColor(parent_tag[1]);
          pre.style.color = "white";
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
      const possibleTagElements = parentElement.querySelectorAll(TAG_SELECTORS);
      if (possibleTagElements.length > 0) {
        // Find the closest previous H6 relative to the first tag element found
        let prevElement = possibleTagElements[0].previousElementSibling;
        while (prevElement) {
          if (prevElement.tagName === "H6") {
            tagHeader = prevElement;
            break;
          }
          prevElement = prevElement.previousElementSibling;
        }
      }

      // If tagHeader is found, clear out existing tags and insert sorted ones after it
      if (tagHeader) {
        // Remove existing tag elements from the DOM before re-inserting
        elementsWithTags.forEach((item) => {
          if (item.element.parentNode) {
            item.element.parentNode.removeChild(item.element);
          }
        });

        // Insert each sorted element after the <h6> element in correct order
        let insertAfter = tagHeader;
        elementsWithTags.forEach(({ element }) => {
          insertAfter.insertAdjacentElement("afterend", element);
          insertAfter = element;
        });
      } else {
        // console.error(
        //   "Could not find the tag header element (<h6> preceding a tag item) on the scene detail page for sorting.",
        // );
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
        // console.error(
        //   "Could not find the common parent element for sorting in a non-document context.",
        // );
        return;
      }

      // Remove existing tag elements from the DOM before re-inserting
      elementsWithTags.forEach((item) => {
        if (item.element.parentNode) {
          item.element.parentNode.removeChild(item.element);
        }
      });

      // Insert each sorted element back into the common parent element
      elementsWithTags.forEach(({ element }) => {
        commonParent.appendChild(element);
      });
    }
  }

  // Store the MutationObserver instance so we can disconnect it later
  let sceneListObserver = null;

  // New function to handle the scene list page
  async function processSceneList() {
    // console.log("Processing scene list page...");

    // If an observer is already active, disconnect it before creating a new one
    if (sceneListObserver) {
      sceneListObserver.disconnect();
      // console.log("Disconnected previous scene list observer.");
    }

    // Process tags that are already visible on the page (not in popovers)
    await processTagsInElement(document);

    // Use MutationObserver to watch for the popover
    sceneListObserver = new MutationObserver(async (mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes) {
          for (const node of mutation.addedNodes) {
            // Check if the added node is the popover element or contains it
            if (
              node.nodeType === 1 &&
              (node.id === "popover" || node.querySelector("#popover"))
            ) {
              // console.log("Popover detected. Checking for tags...");
              const popoverElement =
                node.id === "popover" ? node : node.querySelector("#popover");
              if (popoverElement) {
                // Find tag elements directly within the detected popover
                const tagElements = popoverElement.querySelectorAll(TAG_SELECTORS);

                if (tagElements.length > 0) {
                  // console.log(
                  //   `Found ${tagElements.length} tags in popover. Processing...`,
                  // );
                  // Process the found tags within the popover element
                  await processTagsInElement(popoverElement);
                }
              }
            }
          }
        }
      }
    });

    // Start observing the document body for childList changes
    sceneListObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // console.log("Scene list observer started.");
  }

  // Helper function to handle both scenes and markers pages
  function handleListPage(currentPath, pageType, elementSelector) {
    if (currentPath.includes(`/${pageType}`)) {
      // console.log(
      //   `${pageType.charAt(0).toUpperCase() + pageType.slice(1)} List page (/${pageType}) detected and ${elementSelector} appeared: ${currentPath}. Starting MutationObserver...`,
      // );
      processSceneList();
    }
  }

  // Listener for the Scene List page (/scenes)
  csLib.PathElementListener("/", ".scene-card", () => {
    const currentPath = window.location.pathname;
    handleListPage(currentPath, "scenes", ".scene-card");
  });

  // Listener for the Marker List page (/markers)
  csLib.PathElementListener("/", ".scene-marker-card", async () => {
    const currentPath = window.location.pathname;
    handleListPage(currentPath, "markers", ".scene-marker-card");
  });

  // Listener for individual Scene Detail pages (/scenes/:id)
  csLib.PathElementListener("/scenes/", ".vjs-control-text", async () => {
    processTagsInElement(document);
  });

  // Listener to disconnect the MutationObserver when navigating away from the scene list page
  csLib.PathElementListener("/", "body", (bodyElement) => {
    PluginApi.Event.addEventListener("stash:location", (e) => {
      const currentPath = e.detail.data.location.pathname;
      // If the current path does NOT include '/scenes', disconnect the observer if it exists
      if (!currentPath.includes("/scenes") && sceneListObserver) {
        sceneListObserver.disconnect();
        sceneListObserver = null;
      }
    });
  });
})();
