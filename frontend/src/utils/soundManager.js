/**
 * Sound Manager for UI sound effects
 * Uses Web Audio API for pitch variation and HTML5 Audio as fallback
 */

class SoundManager {
  constructor() {
    this.audioContext = null;
    this.buffers = new Map(); // Cache for AudioBuffers
    this.audioElements = new Map(); // Cache for HTML5 Audio elements
    this.volume = 0.4; // Default volume (0.0 to 1.0)
    this.initialized = false;
    this.lastHoverTime = 0;
    this.hoverDebounceMs = 150; // Debounce hover sounds
    
    // Sound file paths
    this.soundPaths = {
      tick: '/sounds/tick',
      'card-pickup': '/sounds/card-pickup',
      'card-slide': '/sounds/card-slide',
      click: '/sounds/click',
      'trans-load': '/sounds/trans-load',
      'trans-unload': '/sounds/trans-unload',
      'trans-developed': '/sounds/trans-developed',
      'trans-scanned': '/sounds/trans-scanned',
    };

    // Pitch variation configuration (in semitones)
    this.pitchVariations = {
      tick: 0.15, // ±0.15 semitones (hover - organic feel)
      'card-pickup': 0.1, // ±0.1 semitones (drag start - very subtle)
      'card-slide': 0.08, // ±0.08 semitones (drag end - subtle drop sound)
    };

    // Sounds that use pitch variation (physical interaction sounds)
    this.soundsWithPitchVariation = new Set(['tick', 'card-pickup', 'card-slide']);
  }

  /**
   * Initialize AudioContext (must be called after user interaction)
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Create AudioContext
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
        
        // Resume AudioContext if suspended (browser autoplay restrictions)
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }
      }
      
      this.initialized = true;
    } catch (error) {
      console.warn('Failed to initialize AudioContext:', error);
      // Continue without Web Audio API, will use HTML5 Audio fallback
    }
  }

  /**
   * Resume AudioContext if suspended (call on user interaction)
   */
  async resumeContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.warn('Failed to resume AudioContext:', error);
      }
    }
  }

  /**
   * Get audio file URL (uses .wav format)
   */
  getSoundUrl(soundName) {
    const basePath = this.soundPaths[soundName];
    if (!basePath) {
      console.warn(`Unknown sound: ${soundName}`);
      return null;
    }

    // All sounds are in .wav format
    return `${basePath}.wav`;
  }

  /**
   * Load audio buffer for Web Audio API
   */
  async loadBuffer(url) {
    if (this.buffers.has(url)) {
      return this.buffers.get(url);
    }

    try {
      if (!this.audioContext) {
        await this.initialize();
      }

      if (!this.audioContext) {
        return null; // Web Audio API not available
      }

      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      this.buffers.set(url, audioBuffer);
      return audioBuffer;
    } catch (error) {
      console.warn(`Failed to load audio buffer ${url}:`, error);
      return null;
    }
  }

  /**
   * Load HTML5 Audio element
   */
  async loadAudioElement(url) {
    if (this.audioElements.has(url)) {
      const audio = this.audioElements.get(url);
      // Clone audio element to allow overlapping playback
      const clone = audio.cloneNode();
      clone.volume = this.volume;
      return clone;
    }

    return new Promise((resolve) => {
      const audio = new Audio(url);
      audio.preload = 'auto';
      audio.volume = this.volume;
      
      audio.addEventListener('canplaythrough', () => {
        this.audioElements.set(url, audio);
        const clone = audio.cloneNode();
        clone.volume = this.volume;
        resolve(clone);
      });

      audio.addEventListener('error', () => {
        console.warn(`Failed to load audio ${url}`);
        resolve(null);
      });

      // Timeout fallback
      setTimeout(() => {
        if (!this.audioElements.has(url)) {
          resolve(null);
        }
      }, 5000);
    });
  }

  /**
   * Play sound with Web Audio API and pitch variation
   */
  async playWithPitch(buffer, pitchVariation = 0) {
    if (!buffer || !this.audioContext) {
      return;
    }

    try {
      await this.resumeContext();

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = buffer;
      
      // Apply pitch variation using playbackRate
      // playbackRate: 1.0 = normal, 2.0 = octave up, 0.5 = octave down
      // semitones to playbackRate: rate = 2^(semitones/12)
      if (pitchVariation !== 0) {
        const playbackRate = Math.pow(2, pitchVariation / 12);
        source.playbackRate.value = playbackRate;
      }
      
      gainNode.gain.value = this.volume;
      
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      source.start(0);
      
      // Cleanup when finished
      source.addEventListener('ended', () => {
        source.disconnect();
        gainNode.disconnect();
      });
    } catch (error) {
      console.warn('Failed to play sound with pitch:', error);
    }
  }

  /**
   * Play sound with HTML5 Audio (fallback)
   */
  async playWithAudioElement(url) {
    const audio = await this.loadAudioElement(url);
    if (audio) {
      try {
        audio.currentTime = 0; // Reset to start
        await audio.play();
      } catch (error) {
        // Ignore play errors (may be due to autoplay restrictions)
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to play audio:', error);
        }
      }
    }
  }

  /**
   * Play a sound by name
   */
  async playSound(soundName, options = {}) {
    const { usePitchVariation = null, forcePitchVariation = null } = options;
    
    // Determine if this sound should use pitch variation
    const shouldUsePitchVariation = 
      forcePitchVariation !== null 
        ? forcePitchVariation 
        : usePitchVariation !== null 
          ? usePitchVariation 
          : this.soundsWithPitchVariation.has(soundName);

    const url = this.getSoundUrl(soundName);
    if (!url) return;

    // Debounce tick sounds (hover)
    if (soundName === 'tick') {
      const now = Date.now();
      if (now - this.lastHoverTime < this.hoverDebounceMs) {
        return;
      }
      this.lastHoverTime = now;
    }

    // Try Web Audio API first if pitch variation is needed
    if (shouldUsePitchVariation && this.audioContext) {
      const buffer = await this.loadBuffer(url);
      if (buffer) {
        const pitchVariation = this.pitchVariations[soundName] || 0;
        const randomVariation = (Math.random() * 2 - 1) * pitchVariation; // -range to +range
        await this.playWithPitch(buffer, randomVariation);
        return;
      }
    }

    // Fallback to HTML5 Audio
    await this.playWithAudioElement(url);
  }

  /**
   * Preload all sounds
   */
  async preloadSounds() {
    const soundNames = Object.keys(this.soundPaths);
    const loadPromises = soundNames.map(async (soundName) => {
      const url = this.getSoundUrl(soundName);
      if (!url) return;

      // Preload both Web Audio buffer and HTML5 Audio element
      if (this.soundsWithPitchVariation.has(soundName)) {
        await this.loadBuffer(url);
      }
      await this.loadAudioElement(url);
    });

    await Promise.allSettled(loadPromises);
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    // Update cached audio elements
    this.audioElements.forEach((audio) => {
      audio.volume = this.volume;
    });
  }

  /**
   * Get current volume
   */
  getVolume() {
    return this.volume;
  }
}

// Export singleton instance
const soundManager = new SoundManager();

export default soundManager;
