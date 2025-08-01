// script.js

// This code runs when the entire web page has finished loading.
document.addEventListener('DOMContentLoaded', () => {
    // Get the dark mode toggle button from the HTML using its ID.
    const darkModeToggle = document.getElementById('darkModeToggle');

    // Get the <body> element, where we'll add/remove the 'dark' class.
    const body = document.body;

    // Get the sun and moon icons inside the button.
    const sunIcon = document.getElementById('sunIcon');
    const moonIcon = document.getElementById('moonIcon');

    // Check if the user has a dark mode preference set in their browser/system.
    // This makes the website automatically match their system preference on first visit.
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)');

    // Function to apply or remove dark mode.
    function applyDarkMode(isDark) {
        if (isDark) {
            body.classList.add('dark'); // Add 'dark' class to the body
            // We'll also save this preference so it remembers for next time
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.remove('dark'); // Remove 'dark' class from the body
            // Save light mode preference
            localStorage.setItem('theme', 'light');
        }
    }

    // Function to update the icon based on the current mode
    function updateIcon() {
        if (body.classList.contains('dark')) {
            moonIcon.classList.add('hidden'); // Hide moon
            sunIcon.classList.remove('hidden'); // Show sun
        } else {
            moonIcon.classList.remove('hidden'); // Show moon
            sunIcon.classList.add('hidden'); // Hide sun
        }
    }

    // --- Initial Setup (when the page first loads) ---

    // 1. Check if a theme preference is saved in the user's browser (from a previous visit).
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme) {
        // If a preference is saved, use that.
        applyDarkMode(savedTheme === 'dark');
    } else {
        // If no preference is saved, check the user's system preference.
        applyDarkMode(prefersDarkMode.matches);
    }
    // Update the icon immediately after applying the initial theme.
    updateIcon();

    // 2. Listen for changes in the user's system dark mode preference.
    // This makes the website automatically switch if the user changes their system theme.
    prefersDarkMode.addEventListener('change', (event) => {
        // Only apply if no specific theme was manually set by the user on the site
        if (!localStorage.getItem('theme')) {
            applyDarkMode(event.matches);
            updateIcon();
        }
    });

    // --- Event Listener for the Toggle Button ---

    // When the dark mode button is clicked:
    darkModeToggle.addEventListener('click', () => {
        // Toggle the 'dark' class on the <body>.
        // If it has 'dark', remove it; if it doesn't, add it.
        const isCurrentlyDark = body.classList.toggle('dark');
        applyDarkMode(isCurrentlyDark); // Apply the new mode and save it
        updateIcon(); // Update the icon to match
    });
});