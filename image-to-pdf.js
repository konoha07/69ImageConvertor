// image-to-pdf.js

document.addEventListener('DOMContentLoaded', () => {
    // --- HTML elements ---
    const dropArea = document.getElementById('dropArea');
    const imageInput = document.getElementById('imageInput');
    const pdfConverterContent = document.getElementById('imageConverterContent'); // Reusing ID from image-converter.html for now
    const originalImagePreview = document.getElementById('originalImagePreview');
    const originalImageInfo = document.getElementById('originalImageInfo');
    const pdfFileNameInput = document.getElementById('pdfFileName');
    const convertPdfBtn = document.getElementById('convertPdfBtn');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const uploadNewPdfBtn = document.getElementById('uploadNewPdfBtn');
    const pdfConversionStatus = document.getElementById('pdfConversionStatus');
    const loadingSpinner = document.getElementById('loadingSpinner');

    // --- Variables ---
    let originalImageFiles = []; // Array to hold multiple image files
    let originalImagesDataUrls = []; // Array to hold data URLs of images for preview

    // --- Drag & drop + click to upload ---
    dropArea.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', (e) => handleFiles(e.target.files));

    dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.classList.add('border-indigo-500', 'bg-indigo-50', 'dark:bg-indigo-900', 'dark:border-indigo-400');
    });
    dropArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropArea.classList.remove('border-indigo-500', 'bg-indigo-50', 'dark:bg-indigo-900', 'dark:border-indigo-400');
    });
    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.classList.remove('border-indigo-500', 'bg-indigo-50', 'dark:bg-indigo-900', 'dark:border-indigo-400');
        handleFiles(e.dataTransfer.files);
    });

    // --- Handle uploaded files ---
    function handleFiles(files) {
        originalImageFiles = [];
        originalImagesDataUrls = [];
        originalImagePreview.src = ''; // Clear previous preview
        originalImageInfo.textContent = '';
        pdfConversionStatus.textContent = '';
        downloadPdfBtn.classList.add('hidden');

        if (!files.length) return;

        const fileArray = Array.from(files); // Convert FileList to Array
        fileArray.forEach(file => {
            if (!file.type.startsWith('image/')) {
                // Using a custom message box instead of alert()
                displayMessage('Please upload only image files.', 'error');
                originalImageFiles = []; // Clear if non-image found
                originalImagesDataUrls = [];
                return;
            }
            originalImageFiles.push(file);

            const reader = new FileReader();
            reader.onload = (e) => {
                originalImagesDataUrls.push(e.target.result);
                // Only display the first image in the preview for simplicity
                if (originalImageFiles.length === 1) {
                     originalImagePreview.src = e.target.result;
                     originalImageInfo.textContent = `Selected: ${originalImageFiles.length} image(s)`;
                } else {
                     originalImageInfo.textContent = `Selected: ${originalImageFiles.length} image(s)`;
                }
            };
            reader.readAsDataURL(file);
        });

        if (originalImageFiles.length > 0) {
            pdfConverterContent.classList.remove('hidden');
            convertPdfBtn.disabled = false;
        } else {
            pdfConverterContent.classList.add('hidden');
            convertPdfBtn.disabled = true;
        }
    }

    // --- Reset to start ---
    function resetConverter() {
        originalImageFiles = [];
        originalImagesDataUrls = [];
        originalImagePreview.src = '';
        originalImageInfo.textContent = '';
        pdfConversionStatus.textContent = '';
        pdfFileNameInput.value = 'converted_images';
        pdfConverterContent.classList.add('hidden');
        downloadPdfBtn.classList.add('hidden');
        loadingSpinner.classList.add('hidden');
        convertPdfBtn.disabled = true;
    }

    uploadNewPdfBtn.addEventListener('click', resetConverter);

    // --- Convert to PDF ---
    convertPdfBtn.addEventListener('click', () => {
        if (originalImageFiles.length === 0) {
            // Using a custom message box instead of alert()
            displayMessage('Please upload images first!', 'error');
            return;
        }
        pdfConversionStatus.textContent = 'Converting images to PDF...';
        downloadPdfBtn.classList.add('hidden');
        loadingSpinner.classList.remove('hidden');
        convertPdfBtn.disabled = true;

        setTimeout(() => performPdfConversion(), 50); // Small delay to allow UI update
    });

    // --- Perform PDF conversion ---
    async function performPdfConversion() {
        // Ensure jsPDF is loaded
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
            pdfConversionStatus.textContent = 'Error: jsPDF library not loaded.';
            loadingSpinner.classList.add('hidden');
            convertPdfBtn.disabled = false;
            console.error("jsPDF library not found. Make sure the script tag is correct in image-to-pdf.html.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF(); // Initialize a new PDF document

        for (let i = 0; i < originalImageFiles.length; i++) {
            const imageDataUrl = originalImagesDataUrls[i];
            const img = new Image();

            // Use await to ensure image is loaded before adding to PDF
            await new Promise(resolve => {
                img.onload = () => resolve();
                img.src = imageDataUrl;
            });

            // Calculate image dimensions to fit page (A4 size by default in jsPDF)
            // You might want more sophisticated sizing/positioning for real use
            const imgWidth = img.width;
            const imgHeight = img.height;
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
            const scaledWidth = imgWidth * ratio;
            const scaledHeight = imgHeight * ratio;

            const xOffset = (pageWidth - scaledWidth) / 2;
            const yOffset = (pageHeight - scaledHeight) / 2;

            if (i > 0) {
                doc.addPage(); // Add a new page for each subsequent image
            }
            doc.addImage(imageDataUrl, 'JPEG', xOffset, yOffset, scaledWidth, scaledHeight);
        }

        const fileName = pdfFileNameInput.value.trim() || 'converted_images';
        doc.save(`${fileName}.pdf`); // Save the PDF

        pdfConversionStatus.textContent = 'PDF conversion complete! Download initiated.';
        loadingSpinner.classList.add('hidden');
        downloadPdfBtn.classList.remove('hidden'); // Not strictly needed if doc.save triggers download, but good for consistency
        downloadPdfBtn.href = doc.output('bloburl'); // Provide a URL for explicit download button
        downloadPdfBtn.download = `${fileName}.pdf`;
        convertPdfBtn.disabled = false;
    }

    // Custom message box function (replaces alert)
    function displayMessage(message, type = 'info') {
        const messageBox = document.createElement('div');
        messageBox.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg text-white z-50`;
        if (type === 'error') {
            messageBox.classList.add('bg-red-500');
        } else {
            messageBox.classList.add('bg-blue-500');
        }
        messageBox.textContent = message;
        document.body.appendChild(messageBox);

        setTimeout(() => {
            messageBox.remove();
        }, 3000); // Message disappears after 3 seconds
    }
});
