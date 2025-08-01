// audio-converter.js - Fixed version for 69LABS

document.addEventListener('DOMContentLoaded', async () => {
    // --- HTML Elements ---
    const dropArea = document.getElementById('dropArea');
    const audioInput = document.getElementById('audioInput');
    const audioConverterContent = document.getElementById('audioConverterContent');
    const selectedAudioInfo = document.getElementById('selectedAudioInfo');
    const outputFormatSelect = document.getElementById('outputFormat');
    const convertAudioBtn = document.getElementById('convertAudioBtn');
    const downloadAudioBtn = document.getElementById('downloadAudioBtn');
    const uploadNewAudioBtn = document.getElementById('uploadNewAudioBtn');
    const conversionStatus = document.getElementById('conversionStatus');
    const loadingSpinner = document.getElementById('loadingSpinner');

    // --- Variables ---
    let selectedAudioFile = null;
    let convertedAudioBlob = null;
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
        dropArea.addEventListener('click', () => audioInput.click());
        audioInput.addEventListener('change', handleAudioFileSelection);

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
                handleAudioFileSelection({ target: { files } });
            }
        });
    }

    // --- Handle Audio File Selection ---
    function handleAudioFileSelection(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['audio/mp3', 'audio/wav', 'audio/flac', 'audio/ogg', 'audio/m4a', 'audio/aac'];
        if (!validTypes.some(type => file.type.startsWith('audio/')) && !file.name.match(/\.(mp3|wav|flac|ogg|m4a|aac)$/i)) {
            showStatus('Please select a valid audio file (MP3, WAV, FLAC, OGG, M4A, AAC)', 'error');
            return;
        }

        selectedAudioFile = file;
        displayAudioInfo(file);

        if (convertAudioBtn) convertAudioBtn.disabled = false;
        if (audioConverterContent) audioConverterContent.classList.remove('hidden');
    }

    // --- Display Audio Info ---
    function displayAudioInfo(file) {
        if (selectedAudioInfo) {
            const fileSize = (file.size / (1024 * 1024)).toFixed(2);
            selectedAudioInfo.innerHTML = `
                <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                    <h3 class="font-semibold mb-2">Selected Audio File:</h3>
                    <p><strong>Name:</strong> ${file.name}</p>
                    <p><strong>Size:</strong> ${fileSize} MB</p>
                    <p><strong>Type:</strong> ${file.type || 'Unknown'}</p>
                </div>
            `;
        }
    }

    // --- Convert Audio ---
    if (convertAudioBtn) {
        convertAudioBtn.addEventListener('click', async () => {
            if (!selectedAudioFile) {
                showStatus('Please select an audio file first', 'error');
                return;
            }

            const outputFormat = outputFormatSelect ? outputFormatSelect.value : 'mp3';

            try {
                await convertAudio(selectedAudioFile, outputFormat);
            } catch (error) {
                console.error('Conversion error:', error);
                showStatus(`Conversion failed: ${error.message}`, 'error');
            }
        });
    }

    // --- Audio Conversion Function ---
    async function convertAudio(file, outputFormat) {
        showStatus('Initializing conversion...', 'info');
        showLoading(true);
        progressContainer.classList.remove('hidden');

        try {
            // Load FFmpeg if not already loaded
            if (!ffmpeg) {
                showStatus('Loading FFmpeg...', 'info');
                ffmpeg = await window.ffmpegManager.loadFFmpeg();
            }

            const { fetchFile } = FFmpeg;

            // Get file extension
            const inputExt = file.name.split('.').pop().toLowerCase();
            const inputFileName = `input.${inputExt}`;
            const outputFileName = `output.${outputFormat}`;

            showStatus('Processing audio file...', 'info');

            // Write input file to FFmpeg file system
            await ffmpeg.FS('writeFile', inputFileName, await fetchFile(file));

            // Convert audio
            await ffmpeg.run('-i', inputFileName, '-c:a', getAudioCodec(outputFormat), outputFileName);

            // Read output file
            const data = ffmpeg.FS('readFile', outputFileName);

            // Create blob and download link
            convertedAudioBlob = new Blob([data.buffer], { 
                type: `audio/${outputFormat}` 
            });

            // Clean up FFmpeg file system
            try {
                ffmpeg.FS('unlink', inputFileName);
                ffmpeg.FS('unlink', outputFileName);
            } catch (e) {
                console.warn('Cleanup warning:', e);
            }

            showStatus('Conversion completed successfully!', 'success');

            if (downloadAudioBtn) {
                downloadAudioBtn.disabled = false;
                downloadAudioBtn.classList.remove('hidden');
            }

        } catch (error) {
            console.error('FFmpeg conversion error:', error);
            showStatus(`Conversion failed: ${error.message}`, 'error');
        } finally {
            showLoading(false);
            progressContainer.classList.add('hidden');
            progressBar.style.width = '0%';
        }
    }

    // --- Get Audio Codec ---
    function getAudioCodec(format) {
        const codecs = {
            'mp3': 'libmp3lame',
            'wav': 'pcm_s16le',
            'flac': 'flac',
            'ogg': 'libvorbis',
            'm4a': 'aac',
            'aac': 'aac'
        };
        return codecs[format] || 'libmp3lame';
    }

    // --- Download Converted Audio ---
    if (downloadAudioBtn) {
        downloadAudioBtn.addEventListener('click', () => {
            if (!convertedAudioBlob) {
                showStatus('No converted audio to download', 'error');
                return;
            }

            const outputFormat = outputFormatSelect ? outputFormatSelect.value : 'mp3';
            const originalName = selectedAudioFile.name.split('.')[0];
            const fileName = `${originalName}_converted.${outputFormat}`;

            const url = URL.createObjectURL(convertedAudioBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showStatus('Download started!', 'success');
        });
    }

    // --- Upload New Audio ---
    if (uploadNewAudioBtn) {
        uploadNewAudioBtn.addEventListener('click', () => {
            selectedAudioFile = null;
            convertedAudioBlob = null;

            if (audioInput) audioInput.value = '';
            if (selectedAudioInfo) selectedAudioInfo.innerHTML = '';
            if (audioConverterContent) audioConverterContent.classList.add('hidden');
            if (convertAudioBtn) convertAudioBtn.disabled = true;
            if (downloadAudioBtn) {
                downloadAudioBtn.disabled = true;
                downloadAudioBtn.classList.add('hidden');
            }

            showStatus('Ready to select a new audio file', 'info');
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
        if (convertAudioBtn) {
            convertAudioBtn.disabled = show;
            convertAudioBtn.textContent = show ? 'Converting...' : 'Convert Audio';
        }
    }

    // Initialize
    showStatus('Ready to convert audio files', 'info');
});
