class AudioContextService {
  private static instance: AudioContextService;
  private audioContext: AudioContext | null = null;
  private audioSources = new WeakMap<HTMLAudioElement, MediaElementAudioSourceNode>();
  private analyzers = new WeakMap<HTMLAudioElement, AnalyserNode>();

  private constructor() {}

  static getInstance(): AudioContextService {
    if (!AudioContextService.instance) {
      AudioContextService.instance = new AudioContextService();
    }
    return AudioContextService.instance;
  }

  getAudioContext(): AudioContext | null {
    if (!this.audioContext) {
      try {
        this.audioContext = new AudioContext();
      } catch (e) {
        console.error('!Your browser does not support AudioContext');
        return null;
      }
    }
    return this.audioContext;
  }

  getAnalyser(audioElement: HTMLAudioElement): AnalyserNode | null {
    const ctx = this.getAudioContext();
    if (!ctx) return null;

    // Return existing analyzer if we have one
    let existingAnalyzer = this.analyzers.get(audioElement);
    if (existingAnalyzer) {
      return existingAnalyzer;
    }

    // Create new analyzer
    const analyser = ctx.createAnalyser();
    analyser.smoothingTimeConstant = 0.8;
    analyser.fftSize = 2048;

    // Get or create audio source
    let source = this.audioSources.get(audioElement);
    if (!source) {
      try {
        source = ctx.createMediaElementSource(audioElement);
        this.audioSources.set(audioElement, source);
      } catch (e) {
        console.error('Error creating media element source:', e);
        return null;
      }
    }

    // Connect source -> analyzer -> destination
    source.connect(analyser);
    source.connect(ctx.destination);

    // Store analyzer for reuse
    this.analyzers.set(audioElement, analyser);

    return analyser;
  }

  disconnectAll() {
    // WeakMap doesn't have forEach, so we need to disconnect current connections
    if (this.audioContext) {
      try {
        this.audioContext.close();
        this.audioContext = null;
      } catch (e) {
        // Ignore close errors
      }
    }
    
    // Create new WeakMaps to clear old references
    this.analyzers = new WeakMap();
    this.audioSources = new WeakMap();
  }
}

export default AudioContextService; 
