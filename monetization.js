// monetization.js - Simple monetization features for 69LABS

class MonetizationManager {
    constructor() {
        this.initializeAds();
        this.initializePremiumPrompts();
    }

    initializeAds() {
        // Add ad placeholder areas that won't disrupt the layout
        this.createAdPlaceholders();
    }

    createAdPlaceholders() {
        // Header ad space
        const headerAd = document.createElement('div');
        headerAd.className = 'ad-space bg-gray-100 dark:bg-gray-800 p-4 mb-4 rounded-lg text-center border-2 border-dashed border-gray-300';
        headerAd.innerHTML = `
            <div class="text-gray-500 dark:text-gray-400 text-sm">
                <p>📢 Advertisement Space</p>
                <p class="text-xs mt-1">Your ads here - Contact us for rates</p>
            </div>
        `;

        // Insert after header
        const header = document.querySelector('header');
        if (header) {
            header.parentNode.insertBefore(headerAd, header.nextSibling);
        }

        // Sidebar ad space for larger screens
        const sidebarAd = document.createElement('div');
        sidebarAd.className = 'ad-sidebar fixed top-1/2 right-4 transform -translate-y-1/2 w-48 h-64 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 hidden lg:flex items-center justify-center z-10';
        sidebarAd.innerHTML = `
            <div class="text-gray-500 dark:text-gray-400 text-xs text-center p-2">
                <p>📱 Side Ad</p>
                <p class="mt-1">160x600</p>
                <p class="text-xs mt-1">Contact for rates</p>
            </div>
        `;
        document.body.appendChild(sidebarAd);
    }

    initializePremiumPrompts() {
        // Add premium upgrade prompts after successful conversions
        document.addEventListener('conversion-complete', () => {
            this.showPremiumPrompt();
        });

        // Show premium features for large files
        document.addEventListener('large-file-uploaded', () => {
            this.showFileSizeLimitPrompt();
        });
    }

    showPremiumPrompt() {
        const prompt = document.createElement('div');
        prompt.className = 'premium-prompt fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        prompt.innerHTML = `
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md mx-4">
                <h3 class="text-lg font-bold mb-4 text-indigo-600 dark:text-indigo-400">🎉 Conversion Complete!</h3>
                <p class="mb-4 text-gray-700 dark:text-gray-300">
                    Love using 69LABS? Upgrade to Premium for:
                </p>
                <ul class="list-disc list-inside mb-4 text-sm text-gray-600 dark:text-gray-400">
                    <li>Faster conversion speeds</li>
                    <li>No file size limits</li>
                    <li>Batch processing</li>
                    <li>Priority support</li>
                    <li>Ad-free experience</li>
                </ul>
                <div class="flex gap-2">
                    <button class="premium-btn flex-1 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                        Upgrade Now - $9.99/mo
                    </button>
                    <button class="close-prompt flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">
                        Maybe Later
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(prompt);

        // Add event listeners
        prompt.querySelector('.close-prompt').addEventListener('click', () => {
            prompt.remove();
        });

        prompt.querySelector('.premium-btn').addEventListener('click', () => {
            alert('Premium upgrade coming soon! Contact us at premium@69labs.com');
            prompt.remove();
        });

        // Auto-close after 10 seconds
        setTimeout(() => {
            if (document.body.contains(prompt)) {
                prompt.remove();
            }
        }, 10000);
    }

    showFileSizeLimitPrompt() {
        const limitPrompt = document.createElement('div');
        limitPrompt.className = 'limit-prompt bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 text-yellow-700 dark:text-yellow-200 px-4 py-3 rounded mb-4';
        limitPrompt.innerHTML = `
            <div class="flex items-center">
                <span class="text-lg mr-2">⚠️</span>
                <div class="flex-1">
                    <strong class="font-bold">Large File Detected!</strong>
                    <p class="text-sm">Free users are limited to 100MB. Upgrade to Premium for unlimited file sizes.</p>
                </div>
                <button class="upgrade-now-btn bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 ml-2">
                    Upgrade
                </button>
            </div>
        `;

        // Insert at the top of the main content
        const mainContent = document.querySelector('main') || document.querySelector('.container') || document.body;
        mainContent.insertBefore(limitPrompt, mainContent.firstChild);

        limitPrompt.querySelector('.upgrade-now-btn').addEventListener('click', () => {
            alert('Premium upgrade: unlimited file sizes! Contact premium@69labs.com');
        });
    }

    // Analytics tracking (placeholder)
    trackConversion(type, fileSize) {
        console.log(`Conversion tracked: ${type}, File size: ${fileSize}MB`);
        // Here you would integrate with Google Analytics, etc.

        // Trigger premium prompt for successful conversions
        if (fileSize > 50) { // Files larger than 50MB
            document.dispatchEvent(new CustomEvent('large-file-uploaded'));
        }

        document.dispatchEvent(new CustomEvent('conversion-complete'));
    }
}

// Initialize monetization when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.monetizationManager = new MonetizationManager();
    console.log('💰 Monetization features initialized');
});
