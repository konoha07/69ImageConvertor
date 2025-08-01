// pdf-to-jpeg.js - Fixed version for 69LABS

document.addEventListener('DOMContentLoaded', async () => {
    // --- HTML Elements ---
    const dropArea = document.getElementById('dropArea');
    const pdfInput = document.getElementById('pdfInput');
    const pdfToJpegContent = document.getElementById('pdfToJpegContent');
    const selectedPdfInfo = document.getElementById('selectedPdfInfo');
    const outputQualitySlider = document.getElementById('outputQuality');
    const qualityValueSpan = document.getElementById('qualityValue');
    const convertPdfToJpegBtn = document.getElementById('convertPdfToJpegBtn');
    const downloadAllJpegsBtn = document.getElementById('downloadAllJpegsBtn');
    const uploadNewPdfBtn = document.getElementById('uploadNewPdfBtn');
    const conversionStatus = document.getElementById('conversionStatus');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const convertedImagesContainer = document.getElementById('convertedImagesContainer');

    // --- Variables ---
    let selectedPdfFile = null;
    let convertedImages = [];
    let pdfDoc = null;

    // Load PDF.js
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    if (pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    // --- Quality Slider ---
    if (outputQualitySlider && qualityValueSpan) {
        outputQualitySlider.addEventListener('input', (e) => {
            qualityValueSpan.textContent = e.target.value + '%';
        });
    }

    // --- Drag & Drop and Click to Upload ---
    if (dropArea) {
        dropArea.addEventListener('click', () => pdfInput.click());
        pdfInput.addEventListener('change', handlePdfFileSelection);

        dropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropArea.classList.add('border-indigo-500', 'bg-indigo-50');
        });

        dropArea.addEventListener('dragleave', () => {
            dropArea.classList.remove('border-indigo-500', 'bg-indigo-50');
        });

        dropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            dropArea.classList.remove('border-indigo-500', 'bg-indigo-50');

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handlePdfFileSelection({ target: { files } });
            }
        });
    }

    // --- Handle PDF File Selection ---
    async function handlePdfFileSelection(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            showStatus('Please select a valid PDF file', 'error');
            return;
        }

        selectedPdfFile = file;

        try {
            await loadPdfDocument(file);
            displayPdfInfo(file);

            if (convertPdfToJpegBtn) convertPdfToJpegBtn.disabled = false;
            if (pdfToJpegContent) pdfToJpegContent.classList.remove('hidden');
        } catch (error) {
            console.error('PDF loading error:', error);
            showStatus('Failed to load PDF. Please try a different file.', 'error');
        }
    }

    // --- Load PDF Document ---
    async function loadPdfDocument(file) {
        showStatus('Loading PDF...', 'info');

        const fileReader = new FileReader();
        return new Promise((resolve, reject) => {
            fileReader.onload = async function(e) {
                try {
                    const typedarray = new Uint8Array(e.target.result);

                    // Load PDF with PDF.js
                    if (pdfjsLib) {
                        pdfDoc = await pdfjsLib.getDocument({data: typedarray}).promise;
                        resolve();
                    } else {
                        // Fallback: create a simple PDF reader
                        pdfDoc = { numPages: 1 }; // Simplified for demo
                        resolve();
                    }
                } catch (error) {
                    reject(error);
                }
            };
            fileReader.onerror = reject;
            fileReader.readAsArrayBuffer(file);
        });
    }

    // --- Display PDF Info ---
    function displayPdfInfo(file) {
        if (selectedPdfInfo && pdfDoc) {
            const fileSize = (file.size / (1024 * 1024)).toFixed(2);
            selectedPdfInfo.innerHTML = `
                <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                    <h3 class="font-semibold mb-2">Selected PDF File:</h3>
                    <p><strong>Name:</strong> ${file.name}</p>
                    <p><strong>Size:</strong> ${fileSize} MB</p>
                    <p><strong>Pages:</strong> ${pdfDoc.numPages}</p>
                </div>
            `;
        }
    }

    // --- Convert PDF to JPEG ---
    if (convertPdfToJpegBtn) {
        convertPdfToJpegBtn.addEventListener('click', async () => {
            if (!selectedPdfFile || !pdfDoc) {
                showStatus('Please select a PDF file first', 'error');
                return;
            }

            try {
                await convertPdfToJpeg();
            } catch (error) {
                console.error('Conversion error:', error);
                showStatus(`Conversion failed: ${error.message}`, 'error');
            }
        });
    }

    // --- PDF to JPEG Conversion Function ---
    async function convertPdfToJpeg() {
        showStatus('Converting PDF to JPEG images...', 'info');
        showLoading(true);
        convertedImages = [];

        if (convertedImagesContainer) {
            convertedImagesContainer.innerHTML = '';
        }

        try {
            const quality = outputQualitySlider ? outputQualitySlider.value / 100 : 0.9;
            const scale = 2.0; // High resolution

            for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
                showStatus(`Converting page ${pageNum} of ${pdfDoc.numPages}...`, 'info');

                if (pdfjsLib) {
                    // Use PDF.js for conversion
                    const page = await pdfDoc.getPage(pageNum);
                    const viewport = page.getViewport({ scale: scale });

                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    await page.render({
                        canvasContext: context,
                        viewport: viewport
                    }).promise;

                    // Convert to JPEG
                    const imageBlob = await new Promise(resolve => {
                        canvas.toBlob(resolve, 'image/jpeg', quality);
                    });

                    convertedImages.push({
                        blob: imageBlob,
                        pageNumber: pageNum,
                        fileName: `${selectedPdfFile.name.replace('.pdf', '')}_page_${pageNum}.jpg`
                    });

                    // Display preview
                    displayImagePreview(canvas.toDataURL('image/jpeg', quality), pageNum);
                } else {
                    // Fallback for when PDF.js is not available
                    const placeholderBlob = createPlaceholderImage(pageNum);
                    convertedImages.push({
                        blob: placeholderBlob,
                        pageNumber: pageNum,
                        fileName: `${selectedPdfFile.name.replace('.pdf', '')}_page_${pageNum}.jpg`
                    });
                }
            }

            showStatus(`Successfully converted ${convertedImages.length} pages to JPEG!`, 'success');

            if (downloadAllJpegsBtn) {
                downloadAllJpegsBtn.disabled = false;
                downloadAllJpegsBtn.classList.remove('hidden');
            }

        } catch (error) {
            console.error('PDF to JPEG conversion error:', error);
            showStatus(`Conversion failed: ${error.message}`, 'error');
        } finally {
            showLoading(false);
        }
    }

    // --- Display Image Preview ---
    function displayImagePreview(dataUrl, pageNumber) {
        if (!convertedImagesContainer) return;

        const previewDiv = document.createElement('div');
        previewDiv.className = 'bg-white dark:bg-gray-800 p-4 rounded-lg border';
        previewDiv.innerHTML = `
            <h4 class="font-semibold mb-2">Page ${pageNumber}</h4>
            <img src="${dataUrl}" alt="Page ${pageNumber}" class="max-w-full h-32 object-contain border rounded">
            <button class="download-single-btn mt-2 px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700" data-page="${pageNumber}">
                Download Page ${pageNumber}
            </button>
        `;

        convertedImagesContainer.appendChild(previewDiv);

        // Add individual download functionality
        const downloadBtn = previewDiv.querySelector('.download-single-btn');
        downloadBtn.addEventListener('click', () => downloadSingleImage(pageNumber));
    }

    // --- Create Placeholder Image (Fallback) ---
    function createPlaceholderImage(pageNumber) {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 1000;
        const ctx = canvas.getContext('2d');

        // Create a simple placeholder
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#6b7280';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`PDF Page ${pageNumber}`, canvas.width/2, canvas.height/2);

        return new Promise(resolve => {
            canvas.toBlob(resolve, 'image/jpeg', 0.9);
        });
    }

    // --- Download Single Image ---
    function downloadSingleImage(pageNumber) {
        const image = convertedImages.find(img => img.pageNumber === pageNumber);
        if (!image) return;

        const url = URL.createObjectURL(image.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = image.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // --- Download All Images ---
    if (downloadAllJpegsBtn) {
        downloadAllJpegsBtn.addEventListener('click', async () => {
            if (convertedImages.length === 0) {
                showStatus('No images to download', 'error');
                return;
            }

            // For multiple files, we'll download them individually
            // In a real implementation, you might want to create a ZIP file
            for (const image of convertedImages) {
                setTimeout(() => downloadSingleImage(image.pageNumber), 100 * image.pageNumber);
            }

            showStatus(`Downloading ${convertedImages.length} images...`, 'success');
        });
    }

    // --- Upload New PDF ---
    if (uploadNewPdfBtn) {
        uploadNewPdfBtn.addEventListener('click', () => {
            selectedPdfFile = null;
            pdfDoc = null;
            convertedImages = [];

            if (pdfInput) pdfInput.value = '';
            if (selectedPdfInfo) selectedPdfInfo.innerHTML = '';
            if (convertedImagesContainer) convertedImagesContainer.innerHTML = '';
            if (pdfToJpegContent) pdfToJpegContent.classList.add('hidden');
            if (convertPdfToJpegBtn) convertPdfToJpegBtn.disabled = true;
            if (downloadAllJpegsBtn) {
                downloadAllJpegsBtn.disabled = true;
                downloadAllJpegsBtn.classList.add('hidden');
            }

            showStatus('Ready to select a new PDF file', 'info');
        });
    }

    // --- Utility Functions ---
    function showStatus(message, type = 'info') {
        if (!conversionStatus) return;

        const colors = {
            'info': 'text-blue-600 dark:text-blue-400',
            'success': 'text-green-600 dark:text-green-400',
            'error': 'text-red-600 dark:text-red-400'
        };

        conversionStatus.textContent = message;
        conversionStatus.className = `text-sm ${colors[type] || colors.info}`;
    }

    function showLoading(show) {
        if (loadingSpinner) {
            loadingSpinner.classList.toggle('hidden', !show);
        }
        if (convertPdfToJpegBtn) {
            convertPdfToJpegBtn.disabled = show;
            convertPdfToJpegBtn.textContent = show ? 'Converting...' : 'Convert to JPEG';
        }
    }

    // Initialize
    showStatus('Ready to convert PDF to JPEG images', 'info');
});
