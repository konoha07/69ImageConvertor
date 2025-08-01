// ffmpeg-setup.js - Proper FFmpeg initialization for 69LABS
class FFmpegManager {
    constructor() {
        this.ffmpeg = null;
        this.isLoaded = false;
        this.isLoading = false;
        this.loadPromise = null;
    }

    async loadFFmpeg() {
        if (this.isLoaded) return this.ffmpeg;
        if (this.isLoading) return this.loadPromise;

        this.isLoading = true;
        this.loadPromise = this._initializeFFmpeg();

        try {
            await this.loadPromise;
            this.isLoaded = true;
            return this.ffmpeg;
        } catch (error) {
            console.error('FFmpeg loading failed:', error);
            this.isLoading = false;
            throw error;
        }
    }

    async _initializeFFmpeg() {
        try {
            // Load FFmpeg from CDN
            if (typeof FFmpeg === 'undefined') {
                await this._loadFFmpegScript();
            }

            const { createFFmpeg, fetchFile } = FFmpeg;

            this.ffmpeg = createFFmpeg({
                log: true,
                progress: ({ ratio }) => {
                    const event = new CustomEvent('ffmpeg-progress', { 
                        detail: { progress: ratio } 
                    });
                    document.dispatchEvent(event);
                }
            });

            await this.ffmpeg.load();
            console.log('✅ FFmpeg loaded successfully');

            return this.ffmpeg;
        } catch (error) {
            console.error('❌ FFmpeg initialization failed:', error);
            throw new Error('FFmpeg could not be initialized. Please check your internet connection.');
        }
    }

    _loadFFmpegScript() {
        return new Promise((resolve, reject) => {
            if (typeof FFmpeg !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.15/dist/umd/ffmpeg.js';
            script.onload = () => {
                console.log('FFmpeg script loaded');
                resolve();
            };
            script.onerror = () => {
                reject(new Error('Failed to load FFmpeg script'));
            };
            document.head.appendChild(script);
        });
    }

    isReady() {
        return this.isLoaded && this.ffmpeg;
    }
}

// Create global FFmpeg manager instance
window.ffmpegManager = new FFmpegManager();
