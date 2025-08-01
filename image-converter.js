// image-converter.js

document.addEventListener('DOMContentLoaded', () => {
    // --- HTML elements ---
    const dropArea = document.getElementById('dropArea');
    const imageInput = document.getElementById('imageInput');
    const imageConverterContent = document.getElementById('imageConverterContent');
    const originalImagePreview = document.getElementById('originalImagePreview');
    const convertedImagePreview = document.getElementById('convertedImagePreview');
    const originalImageInfo = document.getElementById('originalImageInfo');
    const convertedImageInfo = document.getElementById('convertedImageInfo');
    const outputFormatSelect = document.getElementById('outputFormat');
    const outputQualitySlider = document.getElementById('outputQuality');
    const qualityValueSpan = document.getElementById('qualityValue');
    const outputWidthInput = document.getElementById('outputWidth');
    const outputHeightInput = document.getElementById('outputHeight');
    const keepAspectRatioCheckbox = document.getElementById('keepAspectRatio');
    const convertImageBtn = document.getElementById('convertImageBtn');
    const downloadImageBtn = document.getElementById('downloadImageBtn');
    const uploadNewImageBtn = document.getElementById('uploadNewImageBtn');
    const conversionStatus = document.getElementById('conversionStatus');
    const loadingSpinner = document.getElementById('loadingSpinner');

    // --- Variables ---
    let originalImageFile = null;
    let originalImage = new Image();
    let originalWidth = 0;
    let originalHeight = 0;
    let originalFileSize = 0;

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

    // --- Handle uploaded file ---
    function handleFiles(files) {
        if (!files.length) return;
        const file = files[0];
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file (JPG, PNG, WebP, etc).');
            return;
        }

        originalImageFile = file;
        originalFileSize = file.size;

        const reader = new FileReader();
        reader.onload = (e) => {
            originalImage.src = e.target.result;
            originalImage.onload = () => {
                originalWidth = originalImage.width;
                originalHeight = originalImage.height;

                originalImagePreview.src = originalImage.src;
                originalImageInfo.textContent = `Original: ${originalWidth}×${originalHeight}px, ${(originalFileSize / 1024).toFixed(2)} KB`;

                outputWidthInput.value = originalWidth;
                outputHeightInput.value = originalHeight;

                imageConverterContent.classList.remove('hidden');
                conversionStatus.textContent = '';
                downloadImageBtn.classList.add('hidden');
            };
        };
        reader.readAsDataURL(file);
    }

    // --- Reset to start ---
    function resetConverter() {
        originalImageFile = null;
        originalImage.src = '';
        originalWidth = 0;
        originalHeight = 0;
        originalFileSize = 0;

        originalImagePreview.src = '';
        convertedImagePreview.src = '';
        originalImageInfo.textContent = '';
        convertedImageInfo.textContent = '';
        conversionStatus.textContent = '';

        imageConverterContent.classList.add('hidden');
        downloadImageBtn.classList.add('hidden');
        loadingSpinner.classList.add('hidden');

        outputFormatSelect.value = 'jpeg';
        outputQualitySlider.value = '90';
        qualityValueSpan.textContent = '90%';
        outputWidthInput.value = '';
        outputHeightInput.value = '';
        keepAspectRatioCheckbox.checked = true;
    }

    uploadNewImageBtn.addEventListener('click', resetConverter);

    // --- Conversion options ---
    outputQualitySlider.addEventListener('input', () => {
        qualityValueSpan.textContent = `${outputQualitySlider.value}%`;
    });

    outputWidthInput.addEventListener('input', () => {
        if (keepAspectRatioCheckbox.checked && originalWidth > 0) {
            const newWidth = parseInt(outputWidthInput.value);
            if (!isNaN(newWidth) && newWidth > 0) {
                outputHeightInput.value = Math.round((newWidth / originalWidth) * originalHeight);
            }
        }
    });

    outputHeightInput.addEventListener('input', () => {
        if (keepAspectRatioCheckbox.checked && originalHeight > 0) {
            const newHeight = parseInt(outputHeightInput.value);
            if (!isNaN(newHeight) && newHeight > 0) {
                outputWidthInput.value = Math.round((newHeight / originalHeight) * originalWidth);
            }
        }
    });

    // --- Convert image ---
    convertImageBtn.addEventListener('click', () => {
        if (!originalImageFile) {
            alert('Please upload an image first!');
            return;
        }
        conversionStatus.textContent = 'Converting... Please wait.';
        downloadImageBtn.classList.add('hidden');
        loadingSpinner.classList.remove('hidden');
        setTimeout(() => performImageConversion(), 50);
    });

    // --- Perform conversion ---
    function performImageConversion() {
        const outputFormat = outputFormatSelect.value; // 'jpeg', 'png', 'webp'
        const outputQuality = parseInt(outputQualitySlider.value) / 100;
        let targetWidth = parseInt(outputWidthInput.value);
        let targetHeight = parseInt(outputHeightInput.value);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (isNaN(targetWidth) || targetWidth <= 0) targetWidth = originalWidth;
        if (isNaN(targetHeight) || targetHeight <= 0) targetHeight = originalHeight;

        if (keepAspectRatioCheckbox.checked) {
            const aspectRatio = originalWidth / originalHeight;
            if (targetWidth && !targetHeight) {
                targetHeight = Math.round(targetWidth / aspectRatio);
            } else if (targetHeight && !targetWidth) {
                targetWidth = Math.round(targetHeight * aspectRatio);
            } else if (targetWidth && targetHeight) {
                const ratio = Math.min(targetWidth / originalWidth, targetHeight / originalHeight);
                targetWidth = Math.round(originalWidth * ratio);
                targetHeight = Math.round(originalHeight * ratio);
            }
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;
        ctx.drawImage(originalImage, 0, 0, targetWidth, targetHeight);

        const mimeType = 'image/' + (outputFormat === 'jpg' ? 'jpeg' : outputFormat);
        const quality = outputFormat === 'png' ? 1 : outputQuality;

        canvas.toBlob((blob) => {
            if (blob) {
                const url = URL.createObjectURL(blob);
                convertedImagePreview.src = url;
                convertedImageInfo.textContent = `Converted: ${targetWidth}×${targetHeight}px, ${(blob.size / 1024).toFixed(2)} KB`;

                downloadImageBtn.href = url;
                downloadImageBtn.download = `69LABS-converted.${outputFormat}`;
                downloadImageBtn.classList.remove('hidden');

                conversionStatus.textContent = 'Conversion complete! Download ready.';
            } else {
                console.error('canvas.toBlob failed. mimeType:', mimeType);
                conversionStatus.textContent = 'Error during conversion.';
                alert('Could not convert image. Please try again.');
            }
            loadingSpinner.classList.add('hidden');
        }, mimeType, quality);
    }
});
