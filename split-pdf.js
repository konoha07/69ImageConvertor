// split-pdf.js

document.addEventListener('DOMContentLoaded', () => {
    // --- HTML Elements ---
    const dropArea = document.getElementById('dropArea');
    const pdfInput = document.getElementById('pdfInput');
    const splitPdfContent = document.getElementById('splitPdfContent');
    const selectedPdfNameSpan = document.getElementById('selectedPdfName');
    const pdfPageCountPara = document.getElementById('pdfPageCount');
    const splitMethodSelect = document.getElementById('splitMethod');
    const pageRangeOptionsDiv = document.getElementById('pageRangeOptions');
    const pageRangesInput = document.getElementById('pageRanges');
    const splitPdfBtn = document.getElementById('splitPdfBtn');
    const downloadSplitPdfBtn = document.getElementById('downloadSplitPdfBtn');
    const uploadNewPdfBtn = document.getElementById('uploadNewPdfBtn');
    const splitStatus = document.getElementById('splitStatus');
    const loadingSpinner = document.getElementById('loadingSpinner');

    // --- Variables ---
    let originalPdfFile = null;
    let originalPdfDoc = null; // To store the loaded PDFDocument object from pdf-lib

    // --- Event Listeners ---
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

    if (splitMethodSelect) {
        splitMethodSelect.addEventListener('change', () => {
            if (splitMethodSelect.value === 'range') {
                pageRangeOptionsDiv.classList.remove('hidden');
            } else {
                pageRangeOptionsDiv.classList.add('hidden');
            }
        });
    }

    if (splitPdfBtn) {
        splitPdfBtn.addEventListener('click', splitPdf);
    }

    if (uploadNewPdfBtn) {
        uploadNewPdfBtn.addEventListener('click', resetSplitConverter);
    }

    // --- Functions ---

    // Handles the uploaded PDF file
    async function handlePdfFile(files) {
        originalPdfFile = null;
        originalPdfDoc = null;
        splitPdfContent.classList.add('hidden');
        splitStatus.textContent = '';
        downloadSplitPdfBtn.classList.add('hidden');
        loadingSpinner.classList.add('hidden');
        splitPdfBtn.disabled = true;

        if (!files.length) return;

        const file = files[0];
        if (file.type !== 'application/pdf') {
            displayMessage('Please upload a valid PDF file.', 'error');
            return;
        }

        originalPdfFile = file;
        selectedPdfNameSpan.textContent = file.name;
        splitStatus.textContent = 'Loading PDF...';
        loadingSpinner.classList.remove('hidden');

        try {
            const { PDFDocument } = PDFLib;
            const arrayBuffer = await file.arrayBuffer();
            originalPdfDoc = await PDFDocument.load(arrayBuffer);
            pdfPageCountPara.textContent = `Total Pages: ${originalPdfDoc.getPageCount()}`;
            splitPdfContent.classList.remove('hidden');
            splitPdfBtn.disabled = false;
            splitStatus.textContent = 'PDF loaded. Ready to split.';
        } catch (error) {
            console.error('Error loading PDF:', error);
            displayMessage('Error loading PDF. Please ensure it is a valid PDF.', 'error');
            splitStatus.textContent = 'Failed to load PDF.';
            resetSplitConverter(); // Reset on error
        } finally {
            loadingSpinner.classList.add('hidden');
        }
    }

    // Resets the converter to its initial state
    function resetSplitConverter() {
        originalPdfFile = null;
        originalPdfDoc = null;
        splitPdfContent.classList.add('hidden');
        splitStatus.textContent = '';
        downloadSplitPdfBtn.classList.add('hidden');
        loadingSpinner.classList.add('hidden');
        splitPdfBtn.disabled = true;
        selectedPdfNameSpan.textContent = '';
        pdfPageCountPara.textContent = '';
        pageRangesInput.value = '';
        splitMethodSelect.value = 'range';
        pageRangeOptionsDiv.classList.remove('hidden'); // Ensure range options are visible by default
    }

    // Main function to split the PDF
    async function splitPdf() {
        if (!originalPdfDoc) {
            displayMessage('Please upload a PDF file first.', 'error');
            return;
        }

        splitPdfBtn.disabled = true;
        loadingSpinner.classList.remove('hidden');
        splitStatus.textContent = 'Splitting PDF...';
        downloadSplitPdfBtn.classList.add('hidden');

        try {
            const { PDFDocument } = PDFLib;
            const splitMethod = splitMethodSelect.value;
            const pdfsToSave = []; // Array to hold { filename: 'name.pdf', bytes: ArrayBuffer }

            if (splitMethod === 'each') {
                // Split each page into a separate PDF
                const totalPages = originalPdfDoc.getPageCount();
                for (let i = 0; i < totalPages; i++) {
                    const newPdf = await PDFDocument.create();
                    const [copiedPage] = await newPdf.copyPages(originalPdfDoc, [i]);
                    newPdf.addPage(copiedPage);
                    const bytes = await newPdf.save();
                    pdfsToSave.push({
                        filename: `${originalPdfFile.name.replace(/\.pdf$/, '')}_page_${i + 1}.pdf`,
                        bytes: bytes
                    });
                }
            } else if (splitMethod === 'range') {
                // Extract pages based on user-defined ranges
                const rangesText = pageRangesInput.value.trim();
                if (!rangesText) {
                    displayMessage('Please enter page range(s) to extract.', 'error');
                    splitStatus.textContent = 'Please enter page range(s).';
                    return;
                }

                const pageIndicesToExtract = parsePageRanges(rangesText, originalPdfDoc.getPageCount());

                if (pageIndicesToExtract.length === 0) {
                    displayMessage('No valid pages found in the specified range(s).', 'error');
                    splitStatus.textContent = 'No valid pages found.';
                    return;
                }

                // Create a new PDF with the extracted pages
                const newPdf = await PDFDocument.create();
                const copiedPages = await newPdf.copyPages(originalPdfDoc, pageIndicesToExtract);
                copiedPages.forEach((page) => newPdf.addPage(page));
                const bytes = await newPdf.save();
                pdfsToSave.push({
                    filename: `${originalPdfFile.name.replace(/\.pdf$/, '')}_extracted.pdf`,
                    bytes: bytes
                });
            }

            // Handle download
            if (pdfsToSave.length === 1) {
                // If only one PDF is generated (e.g., range extraction), download directly
                const { filename, bytes } = pdfsToSave[0];
                const blob = new Blob([bytes], { type: 'application/pdf' });
                saveAs(blob, filename); // Uses FileSaver.js
                downloadSplitPdfBtn.classList.remove('hidden');
                downloadSplitPdfBtn.href = URL.createObjectURL(blob);
                downloadSplitPdfBtn.download = filename;
                splitStatus.textContent = 'PDF split successfully! Download ready.';
                displayMessage('PDF split successfully!', 'info');
            } else if (pdfsToSave.length > 1) {
                // If multiple PDFs are generated (e.g., split each page), zip them
                const zip = new JSZip();
                pdfsToSave.forEach(pdf => {
                    zip.file(pdf.filename, pdf.bytes);
                });

                const zipBlob = await zip.generateAsync({ type: "blob" });
                const zipFileName = `${originalPdfFile.name.replace(/\.pdf$/, '')}_split.zip`;
                saveAs(zipBlob, zipFileName); // Uses FileSaver.js
                downloadSplitPdfBtn.classList.remove('hidden');
                downloadSplitPdfBtn.href = URL.createObjectURL(zipBlob);
                downloadSplitPdfBtn.download = zipFileName;
                splitStatus.textContent = 'PDFs split and zipped successfully! Download ready.';
                displayMessage('PDFs split and zipped successfully!', 'info');
            } else {
                splitStatus.textContent = 'No PDFs generated based on your selection.';
                displayMessage('No PDFs generated. Please check your options.', 'error');
            }

        } catch (error) {
            console.error('Error splitting PDF:', error);
            splitStatus.textContent = 'Error splitting PDF. Please try again.';
            displayMessage('Error splitting PDF. Please check console for details.', 'error');
        } finally {
            loadingSpinner.classList.add('hidden');
            splitPdfBtn.disabled = false;
        }
    }

    // Helper function to parse page ranges (e.g., "1-5, 8, 10-12")
    function parsePageRanges(rangesText, totalPages) {
        const pageIndices = new Set(); // Use a Set to avoid duplicate pages
        const parts = rangesText.split(',').map(s => s.trim()).filter(s => s);

        for (const part of parts) {
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(Number);
                if (!isNaN(start) && !isNaN(end) && start >= 1 && end <= totalPages && start <= end) {
                    for (let i = start; i <= end; i++) {
                        pageIndices.add(i - 1); // Convert to 0-based index
                    }
                } else {
                    displayMessage(`Invalid range: ${part}. Pages must be within 1-${totalPages}.`, 'error');
                }
            } else {
                const pageNum = Number(part);
                if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
                    pageIndices.add(pageNum - 1); // Convert to 0-based index
                } else {
                    displayMessage(`Invalid page number: ${part}. Page must be within 1-${totalPages}.`, 'error');
                }
            }
        }
        return Array.from(pageIndices).sort((a, b) => a - b); // Return sorted 0-based indices
    }

    // Custom message box function (replaces alert)
    // This function should ideally be in a shared script (like script.js)
    // or defined globally if this is the only script using it.
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
