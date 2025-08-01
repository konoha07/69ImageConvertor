// pdf-to-doc.js

document.addEventListener('DOMContentLoaded', () => {
    // --- HTML elements ---
    const dropArea = document.getElementById('dropArea');
    const pdfInput = document.getElementById('pdfInput');
    const pdfToDocContent = document.getElementById('pdfToDocContent');
    const selectedPdfInfo = document.getElementById('selectedPdfInfo');
    const convertPdfToDocBtn = document.getElementById('convertPdfToDocBtn');
    const downloadDocBtn = document.getElementById('downloadDocBtn');
    const uploadNewPdfBtn = document.getElementById('uploadNewPdfBtn');
    const conversionStatus = document.getElementById('conversionStatus');
    const loadingSpinner = document.getElementById('loadingSpinner');

    // --- Variables ---
    let selectedPdfFile = null;

    // --- Drag & drop + click to upload ---
    if (dropArea) {
        dropArea.addEventListener('click', () => pdfInput.click());
        pdfInput.addEventListener('change', (e) => handlePdfFile(e.target.files));

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
            handlePdfFile(e.dataTransfer.files);
        });
    }

    // --- Handle uploaded PDF file ---
    function handlePdfFile(files) {
        selectedPdfFile = null;
        pdfToDocContent.classList.add('hidden');
        conversionStatus.textContent = '';
        downloadDocBtn.classList.add('hidden');
        loadingSpinner.classList.add('hidden');
        convertPdfToDocBtn.disabled = true;

        if (!files.length) return;

        const file = files[0];
        if (file.type !== 'application/pdf') {
            displayMessage('Please upload a valid PDF file.', 'error');
            return;
        }

        selectedPdfFile = file;
        selectedPdfInfo.textContent = file.name;
        pdfToDocContent.classList.remove('hidden');
        convertPdfToDocBtn.disabled = false;
        conversionStatus.textContent = `PDF "${file.name}" selected. Ready for conversion.`;
    }

    // --- Reset to initial state ---
    function resetConverter() {
        selectedPdfFile = null;
        pdfToDocContent.classList.add('hidden');
        conversionStatus.textContent = '';
        downloadDocBtn.classList.add('hidden');
        loadingSpinner.classList.add('hidden');
        convertPdfToDocBtn.disabled = true;
        selectedPdfInfo.textContent = '';
    }

    if (uploadNewPdfBtn) {
        uploadNewPdfBtn.addEventListener('click', resetConverter);
    }

    // --- Convert to Doc Button Click Handler ---
    if (convertPdfToDocBtn) {
        convertPdfToDocBtn.addEventListener('click', async () => {
            if (!selectedPdfFile) {
                displayMessage('Please upload a PDF file first.', 'error');
                return;
            }

            convertPdfToDocBtn.disabled = true;
            loadingSpinner.classList.remove('hidden');
            conversionStatus.textContent = 'Initiating conversion...';
            downloadDocBtn.classList.add('hidden');

            // --- IMPORTANT: Placeholder for actual conversion logic ---
            // Converting PDF to editable Word (DOCX) is a highly complex task
            // that is generally not feasible to implement purely client-side
            // with high fidelity using basic JavaScript libraries.
            // It often requires:
            // 1. Advanced PDF parsing and layout analysis.
            // 2. Optical Character Recognition (OCR) for scanned PDFs.
            // 3. Reconstruction of document structure (paragraphs, tables, lists)
            //    into a Word-compatible format.
            //
            // For a real-world application, you would typically integrate with:
            // - A powerful client-side library (which would be very large).
            // - A server-side API (e.g., Adobe PDF Services API, Aspose.PDF, CloudConvert)
            //   that handles the conversion on their servers and returns the DOCX file.
            //
            // The following setTimeout simulates a "coming soon" message.
            // Replace this with your actual API call or library integration when ready.
            setTimeout(() => {
                conversionStatus.textContent = 'PDF to Microsoft Word conversion is a complex feature that requires specialized tools or server-side processing. This functionality is currently under development. Please check back later!';
                loadingSpinner.classList.add('hidden');
                convertPdfToDocBtn.disabled = false;
                displayMessage('Feature Coming Soon!', 'info');
            }, 3000); // Simulate a short loading time
        });
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
