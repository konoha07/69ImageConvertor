// video-converter.js - Fixed version for 69LABS

document.addEventListener('DOMContentLoaded', async () => {
    // --- HTML Elements ---
    const dropArea = document.getElementById('dropArea');
    const videoInput = document.getElementById('videoInput');
    const videoConverterContent = document.getElementById('videoConverterContent');
    const selectedVideoInfo = document.getElementById('selectedVideoInfo');
    const outputFormatSelect = document.getElementById('outputFormat');
    const convertVideoBtn = document.getElementById('convertVideoBtn');
    const downloadVideoBtn = document.getElementById('downloadVideoBtn');
    const uploadNewVideoBtn = document.getElementById('uploadNewVideoBtn');
    const conversionStatus = document.getElementById('conversionStatus');
    const loadingSpinner = document.getElementById('loadingSpinner');

    // --- Variables ---
    let selectedVideoFile = null;
    let convertedVideoBlob = null;
    let ffmpeg = null;

    // --- Progress Bar Elements ---
    const progressContainer = document.querySelector('.progress-container') || createProgressContainer();
    const progressBar = progressContainer.querySelector('.progress-bar') || createProgressBar(progressContainer);

    function createProgressContainer() {
        const container = document.createElement('div');
        container.className = 'progress-container bg-gray-200 rounded-full h-4 mb-4 hidden';
        container.innerHTML = '<div class="progress-bar bg-indigo-600 h-4 rounded-full transition-all duration-300" style="width: 0%"></div>';
        conversionStatus.parentNode.insertBefore(container, conversionStatus);
        return container;
    }

    function createProgressBar(container) {
        return container.querySelector('.progress-bar');
    }

    // --- Progress Event Listener ---
    document.addEventListener('ffmpeg-progress', (event) => {
        const percent = Math.round(event.detail.progress * 100);
        progressBar.style.width = percent + '%';
        progressContainer.classList.remove('hidden');

        if (conversionStatus) {
            conversionStatus.textContent = `Converting... ${percent}%`;
        }
    });

    // --- Drag & Drop and Click to Upload ---
    if (dropArea) {
        dropArea.addEventListener('click', () => videoInput.click());
        videoInput.addEventListener('change', handleVideoFileSelection);

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
                handleVideoFileSelection({ target: { files } });
            }
        });
    }

    // --- Handle Video File Selection ---
    function handleVideoFileSelection(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv'];
        if (!validTypes.some(type => file.type.startsWith('video/')) && !file.name.match(/\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i)) {
            showStatus('Please select a valid video file (MP4, AVI, MOV, WMV, FLV, WebM, MKV)', 'error');
            return;
        }

        // Check file size (limit to ~100MB for demo)
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (file.size > maxSize) {
            showStatus('File too large. Please select a video smaller than 100MB for optimal performance.', 'error');
            return;
        }

        selectedVideoFile = file;
        displayVideoInfo(file);

        if (convertVideoBtn) convertVideoBtn.disabled = false;
        if (videoConverterContent) videoConverterContent.classList.remove('hidden');
    }

    // --- Display Video Info ---
    function displayVideoInfo(file) {
        if (selectedVideoInfo) {
            const fileSize = (file.size / (1024 * 1024)).toFixed(2);
            selectedVideoInfo.innerHTML = `
                <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                    <h3 class="font-semibold mb-2">Selected Video File:</h3>
                    <p><strong>Name:</strong> ${file.name}</p>
                    <p><strong>Size:</strong> ${fileSize} MB</p>
                    <p><strong>Type:</strong> ${file.type || 'Unknown'}</p>
                </div>
            `;
        }
    }

    // --- Convert Video ---
    if (convertVideoBtn) {
        convertVideoBtn.addEventListener('click', async () => {
            if (!selectedVideoFile) {
                showStatus('Please select a video file first', 'error');
                return;
            }

            const outputFormat = outputFormatSelect ? outputFormatSelect.value : 'mp4';

            try {
                await convertVideo(selectedVideoFile, outputFormat);
            } catch (error) {
                console.error('Conversion error:', error);
                showStatus(`Conversion failed: ${error.message}`, 'error');
            }
        });
    }

    // --- Video Conversion Function ---
    async function convertVideo(file, outputFormat) {
        showStatus('Initializing video conversion...', 'info');
        showLoading(true);
        progressContainer.classList.remove('hidden');

        try {
            // Load FFmpeg if not already loaded
            if (!ffmpeg) {
                showStatus('Loading FFmpeg (this may take a moment)...', 'info');
                ffmpeg = await window.ffmpegManager.loadFFmpeg();
            }

            const { fetchFile } = FFmpeg;

            // Get file extension
            const inputExt = file.name.split('.').pop().toLowerCase();
            const inputFileName = `input.${inputExt}`;
            const outputFileName = `output.${outputFormat}`;

            showStatus('Processing video file...', 'info');

            // Write input file to FFmpeg file system
            await ffmpeg.FS('writeFile', inputFileName, await fetchFile(file));

            // Convert video with optimized settings
            const conversionArgs = getConversionArgs(outputFormat, inputFileName, outputFileName);
            await ffmpeg.run(...conversionArgs);

            // Read output file
            const data = ffmpeg.FS('readFile', outputFileName);

            // Create blob
            convertedVideoBlob = new Blob([data.buffer], { 
                type: `video/${outputFormat}` 
            });

            // Clean up FFmpeg file system
            try {
                ffmpeg.FS('unlink', inputFileName);
                ffmpeg.FS('unlink', outputFileName);
            } catch (e) {
                console.warn('Cleanup warning:', e);
            }

            showStatus('Video conversion completed successfully!', 'success');

            if (downloadVideoBtn) {
                downloadVideoBtn.disabled = false;
                downloadVideoBtn.classList.remove('hidden');
            }

        } catch (error) {
            console.error('FFmpeg video conversion error:', error);
            showStatus(`Video conversion failed: ${error.message}`, 'error');
        } finally {
            showLoading(false);
            progressContainer.classList.add('hidden');
            progressBar.style.width = '0%';
        }
    }

    // --- Get Conversion Arguments ---
    function getConversionArgs(outputFormat, inputFileName, outputFileName) {
        const baseArgs = ['-i', inputFileName];

        switch (outputFormat) {
            case 'mp4':
                return [...baseArgs, '-c:v', 'libx264', '-c:a', 'aac', '-preset', 'medium', outputFileName];
            case 'webm':
                return [...baseArgs, '-c:v', 'libvpx-vp9', '-c:a', 'libopus', outputFileName];
            case 'avi':
                return [...baseArgs, '-c:v', 'libx264', '-c:a', 'mp3', outputFileName];
            case 'mov':
                return [...baseArgs, '-c:v', 'libx264', '-c:a', 'aac', outputFileName];
            case 'flv':
                return [...baseArgs, '-c:v', 'libx264', '-c:a', 'aac', outputFileName];
            default:
                return [...baseArgs, '-c:v', 'libx264', '-c:a', 'aac', outputFileName];
        }
    }

    // --- Download Converted Video ---
    if (downloadVideoBtn) {
        downloadVideoBtn.addEventListener('click', () => {
            if (!convertedVideoBlob) {
                showStatus('No converted video to download', 'error');
                return;
            }

            const outputFormat = outputFormatSelect ? outputFormatSelect.value : 'mp4';
            const originalName = selectedVideoFile.name.split('.')[0];
            const fileName = `${originalName}_converted.${outputFormat}`;

            const url = URL.createObjectURL(convertedVideoBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showStatus('Video download started!', 'success');
        });
    }

    // --- Upload New Video ---
    if (uploadNewVideoBtn) {
        uploadNewVideoBtn.addEventListener('click', () => {
            selectedVideoFile = null;
            convertedVideoBlob = null;

            if (videoInput) videoInput.value = '';
            if (selectedVideoInfo) selectedVideoInfo.innerHTML = '';
            if (videoConverterContent) videoConverterContent.classList.add('hidden');
            if (convertVideoBtn) convertVideoBtn.disabled = true;
            if (downloadVideoBtn) {
                downloadVideoBtn.disabled = true;
                downloadVideoBtn.classList.add('hidden');
            }

            showStatus('Ready to select a new video file', 'info');
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
        if (convertVideoBtn) {
            convertVideoBtn.disabled = show;
            convertVideoBtn.textContent = show ? 'Converting...' : 'Convert Video';
        }
    }

    // Initialize
    showStatus('Ready to convert video files', 'info');
});
