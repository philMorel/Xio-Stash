(function () {
    'use strict';

    // Function that waits for a DOM element to appear
    async function waitForElement(selector) {
        return new Promise(resolve => {
            const intervalId = setInterval(() => {
                const element = document.querySelector(selector);
                if (element) {
                    clearBackgroundImages(); // Clear any previously set background images before updating
                    clearInterval(intervalId); // Stop checking when the element is found
                    resolve(element); // Resolve with the found element
                }
            }, 100); // Check every 100 milliseconds
        });
    }

    // Clear background images from containers
       function clearBackgroundImages() {
        const backgroundContainers = document.querySelectorAll('.background-image-container');
        backgroundContainers.forEach(container => {
            const source = container.querySelector('source');
            const img = container.querySelector('img');
            if (source) source.src = "";
            if (img) img.src = "";
        });
    }
    
    // Fetch performer images based on their name
    const fetchPerformerImagesByName = async (performerID) => {
        const query = `
        query {
  findImages(
    image_filter: {galleries_filter: {performers: {value: ["${performerID}"], modifier: INCLUDES_ALL}}}
 , filter: {sort: "random"} 
  ) {
    images {
      id
      visual_files {
        ... on ImageFile {
          width
          height
        }
        ... on VideoFile {
          width
          height
        }
      }
    }
  }
}
        `;
        try {
            const response = await fetch('/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }

            return (await response.json()).data.findImages; // Return performer image data
        } catch (error) {
            console.error('Error fetching performer images:', error);
        }
    };

    // Update the DOM with fetched images
    async function updateDOM() {
        const tallImages = [];
        const wideImages = [];
        const regex = /performers\/(\d+)/;
        const currentPath = window.location.pathname;
        const match = currentPath.match(regex);
        const performerIdFromRegex = match ? match[1] : null;
        const performerID = performerIdFromRegex;
        const imagesArray = await fetchPerformerImagesByName(performerID);

        if (imagesArray && imagesArray.images) {
            imagesArray.images.forEach(image => {
                const imgUrl = `image/${image.id}/image`;
                const { width, height } = image.visual_files[0];

                // Categorize images based on their dimensions
                (height > width ? tallImages : wideImages).push(imgUrl);
            });

            // Set images in the DOM
            updateBackgroundImages(wideImages);
            updateDetailHeaderImages(tallImages);
        }
    }

    // Update background images in the containers
    function updateBackgroundImages(images) {
        if (images.length > 0) {
            const randomImage = getRandomImage(images);
            document.querySelectorAll('.background-image-container').forEach(container => {
                const img = container.querySelector('img');
                if (img) img.src = randomImage;
                const div = container.querySelector('.background-transition');
                if (!div) container.insertAdjacentHTML('afterend', '<div class="background-transition"></div>');
                container.style.visibility = 'visible';
                container.style.opacity = '1';
            });
        }
    }

    // Update detail header images
    function updateDetailHeaderImages(images) {
        if (images.length > 0) {
            const randomImage = getRandomImage(images);
            document.querySelectorAll('.detail-header-image').forEach(container => {
                const img = container.querySelector('img');
                if (img) img.src = randomImage;
            });
        }
    }

    // Function to get a random image from an array
    function getRandomImage(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    // Handle path change events
    function handlePathChange() {
        if (window.location.pathname.startsWith("/performers/")) {
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
