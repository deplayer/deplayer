import ReactPlayer from "react-player";
import { PlaybackTransport } from "./PlaybackController";
import { createLogger } from "../utils/logger";

declare global {
  interface HTMLMediaElement {
    captureStream?(fps?: number): MediaStream;
    mozCaptureStream?(fps?: number): MediaStream;
  }
}

const logger = createLogger({ namespace: "PlayerRefService" });

/**
 * PlayerRefService handles two concerns:
 * 1. PlaybackTransport seam — imperative play/pause/stop/toggle for the saga
 * 2. Capture seam — provides the current media element for WebRTC peer streaming
 */
class PlayerRefService implements PlaybackTransport {
  private static instance: PlayerRefService;
  private playerRef: React.RefObject<ReactPlayer | null> | null = null;
  private audioElementListeners = new Set<() => void>();

  private constructor() {}

  static getInstance(): PlayerRefService {
    if (!PlayerRefService.instance) {
      PlayerRefService.instance = new PlayerRefService();
    }
    return PlayerRefService.instance;
  }

  setPlayerRef(ref: React.RefObject<ReactPlayer | null> | null) {
    this.playerRef = ref;
    this.notifyAudioElementChanged();
  }

  getPlayerRef(): React.RefObject<ReactPlayer | null> | null {
    return this.playerRef;
  }

  /** The <audio> element ReactPlayer renders right now; null for video, iframes, or no player. */
  getAudioElement = (): HTMLAudioElement | null => {
    const internal = this.playerRef?.current?.getInternalPlayer();
    return internal instanceof HTMLAudioElement ? internal : null;
  };

  /**
   * ReactPlayer is keyed per track, so every track change mounts a new media
   * element. Audio-graph consumers (spectrum, visualizers) subscribe here to
   * rebind instead of holding on to a detached element.
   */
  subscribeAudioElement = (listener: () => void): (() => void) => {
    this.audioElementListeners.add(listener);
    return () => {
      this.audioElementListeners.delete(listener);
    };
  };

  notifyAudioElementChanged(): void {
    for (const listener of this.audioElementListeners) listener();
  }


  getCurrentMedia() {
    if (!this.playerRef?.current) return null;

    const internal = this.playerRef.current.getInternalPlayer();

    if (internal instanceof HTMLIFrameElement) {
      try {
        const media = internal.contentWindow?.document.querySelector(
          "video, audio"
        ) as HTMLMediaElement;
        if (media) {
          if (
            !media.captureStream &&
            media.mozCaptureStream
          ) {
            return {
              element: media,
              captureStream: (fps?: number) =>
                media.mozCaptureStream!(fps),
            };
          }
          return {
            element: media,
            captureStream: media.captureStream?.bind(media),
          };
        }
      } catch (e) {
        logger.warn("Could not access iframe content:", e);
      }
    }

    if (
      internal instanceof HTMLVideoElement ||
      internal instanceof HTMLAudioElement
    ) {
      if (!internal.captureStream && internal.mozCaptureStream) {
        return {
          element: internal,
          captureStream: (fps?: number) =>
            internal.mozCaptureStream!(fps),
        };
      }
      return {
        element: internal,
        captureStream: internal.captureStream?.bind(internal),
      };
    }

    return null;
  }

  /**
   * Stop all currently playing audio/video elements in the DOM.
   * Synchronous kill-switch — called before every queue mutation so that
   * LiveStore reactive re-renders never encounter a playing stream.
   */
  stop(): void {
    if (typeof document === 'undefined') return
    document.querySelectorAll('audio, video').forEach((el) => {
      const mediaEl = el as HTMLMediaElement
      if (!mediaEl.paused) {
        mediaEl.pause()
        mediaEl.currentTime = 0
      }
    })
  }

  /**
   * Imperatively start playback on the ReactPlayer internal element.
   * This is the ONLY way audio should be started — never via the `playing` prop.
   * 
   * Waits for the internal player to become available (e.g. after ReactPlayer
   * mounts a new <audio> element when the URL changes from null).
   */
  async play(): Promise<void> {
    const maxAttempts = 20;
    const intervalMs = 50;

    for (let i = 0; i < maxAttempts; i++) {
      const internal = this.playerRef?.current?.getInternalPlayer();
      if (internal && (internal instanceof HTMLAudioElement || internal instanceof HTMLVideoElement)) {
        try {
          await internal.play();
        } catch (err: unknown) {
          logger.warn("play() rejected:", (err as Error).message);
        }
        return;
      }
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    logger.warn("play() gave up waiting for internal player after", maxAttempts * intervalMs, "ms");
  }

  /**
   * Imperatively pause playback on the ReactPlayer internal element.
   */
  pause(): void {
    const internal = this.playerRef?.current?.getInternalPlayer();
    if (internal && (internal instanceof HTMLAudioElement || internal instanceof HTMLVideoElement)) {
      internal.pause();
    }
  }

  /**
   * Imperatively toggle play/pause.
   */
  toggle(): void {
    const internal = this.playerRef?.current?.getInternalPlayer();
    if (internal && (internal instanceof HTMLAudioElement || internal instanceof HTMLVideoElement)) {
      if (internal.paused) {
        internal.play().catch((err: Error) => {
          logger.warn("play() rejected:", err.message);
        });
      } else {
        internal.pause();
      }
    }
  }
}

export default PlayerRefService;
