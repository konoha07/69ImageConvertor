// compress-pdf.js

document.addEventListener('DOMContentLoaded', () => {
    // --- HTML Elements ---
    const dropArea = document.getElementById('dropArea');
    const pdfInput = document.getElementById('pdfInput');
    const compressPdfContent = document.getElementById('compressPdfContent');
    const pdfList = document.getElementById('pdfList');
    const outputFileNameInput = document.getElementById('outputFileName');
    const compressionLevelSelect = document.getElementById('compressionLevel');
    const compressPdfBtn = document.getElementById('compressPdfBtn');
    const downloadCompressedPdfBtn = document.getElementById('downloadCompressedPdfBtn');
    const uploadNewPdfsBtn = document.getElementById('uploadNewPdfsBtn');
    const compressStatus = document.getElementById('compressStatus');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const pdfPreviewContainer = document.getElementById('pdfPreviewContainer'); // Element to display PDF preview

    // --- Variables ---
    let selectedPdfFiles = []; // Array to hold File objects of selected PDFs
    let totalOriginalSize = 0; // To store the combined size of all original PDFs
    const DEFAULT_SUFFIX = '-69LABS-compressed'; // Default suffix for compressed files

    // --- Drag & Drop and Click to Upload ---
    if (dropArea) {
        dropArea.addEventListener('click', () => pdfInput.click());
        pdfInput.addEventListener('change', (e) => handlePdfFiles(e.target.files));

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
            handlePdfFiles(e.dataTransfer.files);
        });
    }

    // --- Handle Uploaded PDF Files ---
    function handlePdfFiles(files) {
        // Clear previous selections
        selectedPdfFiles = [];
        totalOriginalSize = 0; // Reset total size
        pdfList.innerHTML = ''; // Clear the displayed list
        compressStatus.textContent = '';
        downloadCompressedPdfBtn.classList.add('hidden');
        pdfPreviewContainer.classList.add('hidden'); // Hide preview on new upload
        pdfPreviewContainer.innerHTML = ''; // Clear previous preview content

        if (!files.length) {
            compressPdfContent.classList.add('hidden');
            compressPdfBtn.disabled = true;
            outputFileNameInput.value = `document${DEFAULT_SUFFIX}`; // Reset to a generic default
            return;
        }

        const fileArray = Array.from(files);
        let hasInvalidFile = false;

        fileArray.forEach(file => {
            if (file.type !== 'application/pdf') {
                displayMessage(`File "${file.name}" is not a PDF and will be skipped.`, 'error');
                hasInvalidFile = true;
                return;
            }
            selectedPdfFiles.push(file);
            totalOriginalSize += file.size; // Add to total original size

            // Add file name and size to the list for display
            const listItem = document.createElement('div');
            listItem.className = 'flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-600 last:border-b-0';
            listItem.innerHTML = `
                <span class="text-gray-800 dark:text-gray-200 text-sm truncate">${file.name}</span>
                <span class="text-gray-500 dark:text-gray-400 text-xs ml-2">${(file.size / (1024 * 1024)).toFixed(2)} MB</span>
            `;
            pdfList.appendChild(listItem);
        });

        if (selectedPdfFiles.length > 0) {
            compressPdfContent.classList.remove('hidden');
            compressPdfBtn.disabled = false;
            compressStatus.textContent = `Ready to compress ${selectedPdfFiles.length} PDF file(s). Total original size: ${(totalOriginalSize / (1024 * 1024)).toFixed(2)} MB.`;

            // Set the output file name based on the first selected file
            const firstFileName = selectedPdfFiles[0].name;
            const fileNameWithoutExtension = firstFileName.substring(0, firstFileName.lastIndexOf('.'));
            outputFileNameInput.value = `${fileNameWithoutExtension}${DEFAULT_SUFFIX}`;

        } else {
            compressPdfContent.classList.add('hidden');
            compressPdfBtn.disabled = true;
            if (hasInvalidFile) {
                compressStatus.textContent = 'Please upload valid PDF files.';
            } else {
                compressStatus.textContent = '';
            }
            outputFileNameInput.value = `document${DEFAULT_SUFFIX}`; // Reset to a generic default
        }
    }

    // --- Reset to initial state ---
    function resetCompressConverter() {
        selectedPdfFiles = [];
        totalOriginalSize = 0;
        pdfList.innerHTML = '';
        outputFileNameInput.value = `compressed_document${DEFAULT_SUFFIX}`; // Default name on reset
        compressionLevelSelect.value = 'medium';
        compressPdfContent.classList.add('hidden');
        downloadCompressedPdfBtn.classList.add('hidden');
        loadingSpinner.classList.add('hidden');
        compressStatus.textContent = '';
        compressPdfBtn.disabled = true;
        pdfPreviewContainer.classList.add('hidden'); // Hide preview on reset
        pdfPreviewContainer.innerHTML = ''; // Clear preview content
    }

    if (uploadNewPdfsBtn) {
        uploadNewPdfsBtn.addEventListener('click', resetCompressConverter);
    }

    // --- Compress PDFs Button Click Handler ---
    if (compressPdfBtn) {
        compressPdfBtn.addEventListener('click', async () => {
            if (selectedPdfFiles.length === 0) {
                displayMessage('Please select at least one PDF file to compress.', 'error');
                return;
            }

            compressPdfBtn.disabled = true;
            loadingSpinner.classList.remove('hidden');
            compressStatus.textContent = 'Compressing PDFs... This may take a moment.';
            downloadCompressedPdfBtn.classList.add('hidden');
            pdfPreviewContainer.classList.add('hidden'); // Hide preview during compression
            pdfPreviewContainer.innerHTML = ''; // Clear previous preview content

            try {
                const { PDFDocument } = PDFLib;

                // pdf-lib's save() method applies stream compression (e.g., FlateDecode) by default.
                // The 'compressionLevel' selection influences these internal optimizations,
                // but pdf-lib does not directly expose a way to target a specific output file size
                // or re-compress existing images within the PDF with a custom quality setting.
                // Achieving precise size targeting often requires more advanced techniques
                // like extracting, re-encoding (with adjustable quality), and re-embedding images,
                // which is outside the scope of this current implementation.

                const compressedPdf = await PDFDocument.create();

                for (const file of selectedPdfFiles) {
                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await PDFDocument.load(arrayBuffer);

                    // Copy all pages from the original PDF to the new one.
                    // The actual compression happens when `compressedPdf.save()` is called.
                    const copiedPages = await compressedPdf.copyPages(pdf, pdf.getPageIndices());
                    copiedPages.forEach((page) => compressedPdf.addPage(page));
                }

                const compressedPdfBytes = await compressedPdf.save();
                const compressedSize = compressedPdfBytes.byteLength;
                const blob = new Blob([compressedPdfBytes], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);

                // Use the value from the outputFileNameInput for the download name
                const fileName = outputFileNameInput.value.trim();
                downloadCompressedPdfBtn.href = url;
                downloadCompressedPdfBtn.download = `${fileName}.pdf`; // Ensure .pdf extension is added
                downloadCompressedPdfBtn.classList.remove('hidden');

                // Calculate and display the size reduction
                const originalSizeMB = (totalOriginalSize / (1024 * 1024)).toFixed(2);
                const compressedSizeMB = (compressedSize / (1024 * 1024)).toFixed(2);
                const reductionPercent = totalOriginalSize > 0 ? (((totalOriginalSize - compressedSize) / totalOriginalSize) * 100).toFixed(2) : 0;

                compressStatus.textContent = `Compression complete! Original: ${originalSizeMB} MB, Compressed: ${compressedSizeMB} MB (${reductionPercent}% reduction).`;
                displayMessage('PDFs compressed successfully!', 'info');

                // Display the compressed PDF in an iframe
                const iframe = document.createElement('iframe');
                iframe.src = url;
                iframe.style.width = '100%';
                iframe.style.height = '500px'; // Adjust height as needed
                iframe.style.border = '1px solid #ccc';
                iframe.classList.add('rounded-lg', 'shadow-md', 'mt-4');
                pdfPreviewContainer.innerHTML = ''; // Clear any old content
                pdfPreviewContainer.appendChild(iframe);
                pdfPreviewContainer.classList.remove('hidden'); // Show the preview container

            } catch (error) {
                console.error('Error compressing PDFs:', error);
                compressStatus.textContent = 'Error compressing PDFs. Please try again.';
                displayMessage('Error compressing PDFs. Please check console for details.', 'error');
            } finally {
                loadingSpinner.classList.add('hidden');
                compressPdfBtn.disabled = false;
            }
        });
    }

    // --- Custom message box function (replaces alert) ---
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
