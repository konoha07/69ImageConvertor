// merge-pdf.js

document.addEventListener('DOMContentLoaded', () => {
    // --- HTML Elements ---
    const dropArea = document.getElementById('dropArea');
    const pdfInput = document.getElementById('pdfInput');
    const mergePdfContent = document.getElementById('mergePdfContent');
    const pdfList = document.getElementById('pdfList');
    const outputFileNameInput = document.getElementById('outputFileName');
    const mergePdfBtn = document.getElementById('mergePdfBtn');
    const downloadMergedPdfBtn = document.getElementById('downloadMergedPdfBtn');
    const uploadNewPdfsBtn = document.getElementById('uploadNewPdfsBtn');
    const mergeStatus = document.getElementById('mergeStatus');
    const loadingSpinner = document.getElementById('loadingSpinner');

    // --- Variables ---
    let selectedPdfFiles = []; // Array to hold File objects of selected PDFs

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
        pdfList.innerHTML = ''; // Clear the displayed list
        mergeStatus.textContent = '';
        downloadMergedPdfBtn.classList.add('hidden');

        if (!files.length) {
            mergePdfContent.classList.add('hidden');
            mergePdfBtn.disabled = true;
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

            // Add file name to the list for display
            const listItem = document.createElement('div');
            listItem.className = 'flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-600 last:border-b-0';
            listItem.innerHTML = `
                <span class="text-gray-800 dark:text-gray-200 text-sm truncate">${file.name}</span>
                <span class="text-gray-500 dark:text-gray-400 text-xs ml-2">${(file.size / 1024 / 1024).toFixed(2)} MB</span>
            `;
            pdfList.appendChild(listItem);
        });

        if (selectedPdfFiles.length > 0) {
            mergePdfContent.classList.remove('hidden');
            mergePdfBtn.disabled = false;
            mergeStatus.textContent = `Ready to merge ${selectedPdfFiles.length} PDF file(s).`;
        } else {
            mergePdfContent.classList.add('hidden');
            mergePdfBtn.disabled = true;
            if (hasInvalidFile) {
                mergeStatus.textContent = 'Please upload valid PDF files.';
            } else {
                mergeStatus.textContent = '';
            }
        }
    }

    // --- Reset to initial state ---
    function resetMergeConverter() {
        selectedPdfFiles = [];
        pdfList.innerHTML = '';
        outputFileNameInput.value = 'merged_document';
        mergePdfContent.classList.add('hidden');
        downloadMergedPdfBtn.classList.add('hidden');
        loadingSpinner.classList.add('hidden');
        mergeStatus.textContent = '';
        mergePdfBtn.disabled = true;
    }

    if (uploadNewPdfsBtn) {
        uploadNewPdfsBtn.addEventListener('click', resetMergeConverter);
    }

    // --- Merge PDFs Button Click Handler ---
    if (mergePdfBtn) {
        mergePdfBtn.addEventListener('click', async () => {
            if (selectedPdfFiles.length < 2) {
                displayMessage('Please select at least two PDF files to merge.', 'error');
                return;
            }

            mergePdfBtn.disabled = true;
            loadingSpinner.classList.remove('hidden');
            mergeStatus.textContent = 'Merging PDFs... This may take a moment.';
            downloadMergedPdfBtn.classList.add('hidden');

            try {
                // Create a new PDFDocument for the merged output
                const { PDFDocument } = PDFLib; // Access PDFLib from the global scope
                const mergedPdf = await PDFDocument.create();

                for (const file of selectedPdfFiles) {
                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await PDFDocument.load(arrayBuffer);
                    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                    copiedPages.forEach((page) => mergedPdf.addPage(page));
                }

                const mergedPdfBytes = await mergedPdf.save();
                const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);

                const fileName = outputFileNameInput.value.trim() || 'merged_document';
                downloadMergedPdfBtn.href = url;
                downloadMergedPdfBtn.download = `${fileName}.pdf`;
                downloadMergedPdfBtn.classList.remove('hidden');

                mergeStatus.textContent = 'PDFs merged successfully! Click to download.';
                displayMessage('PDFs merged successfully!', 'info');

            } catch (error) {
                console.error('Error merging PDFs:', error);
                mergeStatus.textContent = 'Error merging PDFs. Please try again.';
                displayMessage('Error merging PDFs. Please check console for details.', 'error');
            } finally {
                loadingSpinner.classList.add('hidden');
                mergePdfBtn.disabled = false;
            }
        });
    }

    // --- Custom message box function (replaces alert) ---
    // This function should ideally be in a shared script (like script.js)
    // or defined globally if this is the only script using it.
    // Assuming it's either in script.js or you'll add it globally.
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
