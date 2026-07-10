/**
 * Music Playlist Player - Optimized Version
 * Fast video loading with intelligent preloading and caching
 */

class MusicPlayer {
    constructor() {
        // DOM Elements
        this.video = document.getElementById('myVideo');
        this.playPause = document.getElementById('playPause');
        this.progress = document.getElementById('progress');
        this.bufferedProgress = document.getElementById('bufferedProgress');
        this.mute = document.getElementById('mute');
        this.fullscreen = document.getElementById('fullscreen');
        this.next = document.getElementById('next');
        this.prev = document.getElementById('prev');
        this.volume = document.getElementById('volume');
        this.currentTrackEl = document.getElementById('currentTrack');
        this.currentTimeEl = document.getElementById('currentTime');
        this.durationEl = document.getElementById('duration');
        this.playlistMenu = document.getElementById('playlistMenu');

        // Playlist data
        this.playlist = [
            "Jhol _ Coke Studio Pakistan _ Season 15 _ Maanu x Annural Khalid.mp4",
            "Udaarian (Badi lambi hai kahani mere pyaar di) - Satinder Sartaaj _ Love Songs _ New Punjabi Songs.mp4",
            "Midnight Call (Official Video) - Harkirat Sangha _ Starboy X _ Rupan Bal _ Interstellar 2025.mp4",
            "MEMORIES - Hasan Raheem ft Justin Bibis (Official Music Video) _ Latest Urdu Punjabi Song 2025.mp4",
            "Anuv Jain - HUSN (Official Video).mp4",
            "Aditya Rikhari - Paaro (Official Video).mp4",
            "Aditya Rikhari - SAMJHO NA ( NASAMAJH ).mp4",
            "Finding Her (Jana Mere Sawalon Ka Manzar Tu) _ Kushagra _ Vanshika _ Bharath _ Karan Maini _UR Debut.mp4",
            "Sahiba (Official Music Video) _ Aditya Rikhari, Ankita Chhetri _ T-Series.mp4",
            "Anuv Jain - INAAM (Official Lyrical Video).mp4",
            "Anuv Jain - AFSOS ft. AP Dhillon (Official Visualizer).mp4",
            "Dil Diyan Gallan Song _ Tiger Zinda Hai _ Salman Khan, Katrina Kaif _ Atif Aslam _ Vishal & Shekhar.mp4",
            "Khasara – Abdul Hannan & Samar Jafri (Official Audio).mp4",
            "BOYFRIEND(MUSIC VIDEO) KARAN AUJLA_ SUNANDA _ IKKY _ Latest Punjabi Songs 2025.mp4"
        ];

        // State
        this.currentIndex = 0;
        this.isMuted = false;
        this.playStarted = false;
        this.loadingNextIndex = null;

        // Performance optimization
        this.updateTimeout = null;
        this.preloadCache = new Set();
        this.videoSourceCache = {};

        // Initialize
        this.init();
    }

    init() {
        // Optimize: Set video properties before rendering
        this.video.volume = 1;
        this.video.muted = false;
        
        this.renderPlaylist();
        this.loadVideo(this.currentIndex);
        this.attachEventListeners();
        this.updateTrackInfo();
        
        // Preload next video in background
        this.preloadNextVideo();
    }

    renderPlaylist() {
        // Use DocumentFragment for better performance
        const fragment = document.createDocumentFragment();
        
        this.playlist.forEach((track, index) => {
            const li = document.createElement('li');
            const button = document.createElement('button');
            button.className = 'playlist-item';
            if (index === 0) button.classList.add('active');
            
            // Extract track name more efficiently
            const trackName = track.split('_')[0].trim();
            button.textContent = `${index + 1}. ${trackName}`;
            button.setAttribute('data-index', index);
            button.addEventListener('click', () => this.selectTrack(index));
            
            li.appendChild(button);
            fragment.appendChild(li);
        });
        
        this.playlistMenu.appendChild(fragment);
    }

    loadVideo(index) {
        this.currentIndex = index;
        
        // Check cache first
        if (this.videoSourceCache[index]) {
            this.video.src = this.videoSourceCache[index];
        } else {
            const src = this.playlist[index];
            this.videoSourceCache[index] = src;
            this.video.src = src;
        }
        
        this.updateTrackInfo();
        this.updatePlaylistUI();
    }

    selectTrack(index) {
        this.loadVideo(index);
        // Immediate play without waiting
        this.video.play().catch(() => {
            console.log('Play initiated');
        });
        this.playPause.textContent = '⏸';
        this.playPause.setAttribute('aria-label', 'Pause');
    }

    attachEventListeners() {
        // Play/Pause
        this.playPause.addEventListener('click', () => this.togglePlayPause());

        // Previous
        this.prev.addEventListener('click', () => this.playPrevious());

        // Next
        this.next.addEventListener('click', () => this.playNext());

        // Progress bar - use passive listener for better scroll performance
        this.progress.addEventListener('input', () => this.seek(), { passive: true });

        // Volume
        this.volume.addEventListener('input', () => this.setVolume(), { passive: true });

        // Mute/Unmute
        this.mute.addEventListener('click', () => this.toggleMute());

        // Fullscreen
        this.fullscreen.addEventListener('click', () => this.requestFullscreen());

        // Video events - optimized
        this.video.addEventListener('canplay', () => this.onCanPlay(), { once: false });
        this.video.addEventListener('timeupdate', () => this.updateProgressBar(), { passive: true });
        this.video.addEventListener('loadedmetadata', () => this.updateMetadata(), { once: true });
        this.video.addEventListener('progress', () => this.updateBufferedProgress(), { passive: true });
        this.video.addEventListener('ended', () => this.playNext());
        this.video.addEventListener('error', () => this.handleVideoError());
        
        // Preload next video when current is playing
        this.video.addEventListener('timeupdate', () => this.intelligentPreload(), { passive: true });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    togglePlayPause() {
        if (this.video.paused) {
            this.video.play().catch(() => {});
            this.playPause.textContent = '⏸';
            this.playPause.setAttribute('aria-label', 'Pause');
        } else {
            this.video.pause();
            this.playPause.textContent = '▶';
            this.playPause.setAttribute('aria-label', 'Play');
        }
    }

    playNext() {
        this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
        this.loadVideo(this.currentIndex);
        this.video.play().catch(() => {});
        this.playPause.textContent = '⏸';
        this.playPause.setAttribute('aria-label', 'Pause');
        this.preloadNextVideo();
    }

    playPrevious() {
        this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
        this.loadVideo(this.currentIndex);
        this.video.play().catch(() => {});
        this.playPause.textContent = '⏸';
        this.playPause.setAttribute('aria-label', 'Pause');
    }

    seek() {
        if (this.video.duration) {
            this.video.currentTime = (this.progress.value / 100) * this.video.duration;
        }
    }

    setVolume() {
        const volumeValue = this.volume.value / 100;
        this.video.volume = volumeValue;
        
        if (volumeValue === 0) {
            this.video.muted = true;
            this.mute.textContent = '🔇';
        } else {
            this.video.muted = false;
            this.updateMuteButton();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.video.muted = this.isMuted;
        this.updateMuteButton();
    }

    updateMuteButton() {
        if (this.video.muted || this.video.volume === 0) {
            this.mute.textContent = '🔇';
            this.mute.setAttribute('aria-label', 'Unmute');
        } else if (this.video.volume < 0.5) {
            this.mute.textContent = '🔉';
            this.mute.setAttribute('aria-label', 'Mute');
        } else {
            this.mute.textContent = '🔊';
            this.mute.setAttribute('aria-label', 'Mute');
        }
    }

    requestFullscreen() {
        if (this.video.requestFullscreen) {
            this.video.requestFullscreen().catch(() => {});
        } else if (this.video.webkitRequestFullscreen) {
            this.video.webkitRequestFullscreen();
        }
    }

    onCanPlay() {
        if (!this.playStarted) {
            this.playStarted = true;
            this.video.play().catch(() => {});
            this.playPause.textContent = '⏸';
            this.playPause.setAttribute('aria-label', 'Pause');
        }
    }

    /**
     * PERFORMANCE: Intelligent preloading
     * Preload next video when current reaches 80% completion
     */
    intelligentPreload() {
        if (!this.video.duration) return;
        
        const percentComplete = (this.video.currentTime / this.video.duration) * 100;
        
        if (percentComplete > 80 && this.loadingNextIndex === null) {
            this.preloadNextVideo();
        }
    }

    /**
     * PERFORMANCE: Background preload
     * Load next video source in background without displaying it
     */
    preloadNextVideo() {
        const nextIndex = (this.currentIndex + 1) % this.playlist.length;
        
        if (this.preloadCache.has(nextIndex)) {
            return; // Already preloaded
        }
        
        this.loadingNextIndex = nextIndex;
        
        // Use timeout to avoid blocking main thread
        setTimeout(() => {
            if (!this.videoSourceCache[nextIndex]) {
                this.videoSourceCache[nextIndex] = this.playlist[nextIndex];
            }
            this.preloadCache.add(nextIndex);
            this.loadingNextIndex = null;
        }, 100);
    }

    updateProgressBar() {
        // Throttle updates to 50ms for smoother performance
        clearTimeout(this.updateTimeout);
        this.updateTimeout = setTimeout(() => {
            if (this.video.duration) {
                this.progress.value = (this.video.currentTime / this.video.duration) * 100;
                this.updateTimeDisplay();
            }
        }, 50);
    }

    updateBufferedProgress() {
        // Use requestAnimationFrame for smoother updates
        requestAnimationFrame(() => {
            if (this.video.buffered.length > 0) {
                try {
                    const bufferedEnd = this.video.buffered.end(this.video.buffered.length - 1);
                    const percentage = (bufferedEnd / this.video.duration) * 100;
                    this.bufferedProgress.style.width = percentage + '%';
                } catch (e) {
                    // Handle any timing issues
                }
            }
        });
    }

    updateMetadata() {
        this.durationEl.textContent = this.formatTime(this.video.duration);
        this.updateBufferedProgress();
    }

    updateTimeDisplay() {
        this.currentTimeEl.textContent = this.formatTime(this.video.currentTime);
    }

    updateTrackInfo() {
        const trackName = this.playlist[this.currentIndex]
            .replace(/\.mp4$/, '')
            .split('_')[0]
            .trim();
        this.currentTrackEl.textContent = trackName || `Track ${this.currentIndex + 1}`;
    }

    updatePlaylistUI() {
        // Optimize: Only update affected elements
        document.querySelectorAll('.playlist-item').forEach((item, index) => {
            if (index === this.currentIndex) {
                item.classList.add('active');
                item.setAttribute('aria-current', 'true');
            } else {
                item.classList.remove('active');
                item.setAttribute('aria-current', 'false');
            }
        });
    }

    handleVideoError() {
        console.error('Video failed to load:', this.playlist[this.currentIndex]);
        this.currentTrackEl.textContent = 'Error loading video';
    }

    handleKeyboard(e) {
        if (e.target.tagName === 'INPUT') return;

        switch (e.code) {
            case 'Space':
                e.preventDefault();
                this.togglePlayPause();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.video.currentTime = Math.min(this.video.currentTime + 5, this.video.duration);
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.video.currentTime = Math.max(this.video.currentTime - 5, 0);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.volume.value = Math.min(100, parseInt(this.volume.value) + 10);
                this.setVolume();
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.volume.value = Math.max(0, parseInt(this.volume.value) - 10);
                this.setVolume();
                break;
            case 'KeyM':
                this.toggleMute();
                break;
            case 'KeyF':
                this.requestFullscreen();
                break;
            case 'KeyN':
                this.playNext();
                break;
            case 'KeyP':
                this.playPrevious();
                break;
        }
    }

    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
}

// Initialize player when DOM is ready - use faster detection
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new MusicPlayer();
    });
} else {
    new MusicPlayer();
}