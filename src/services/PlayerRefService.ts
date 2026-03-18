import ReactPlayer from "react-player";
import { createLogger } from "../utils/logger";
import { getLiveStoreInstance } from "../middleware/livestore";

declare global {
  interface HTMLMediaElement {
    captureStream?(fps?: number): MediaStream;
    mozCaptureStream?(fps?: number): MediaStream;
  }
}

const logger = createLogger({ namespace: "PlayerRefService" });

class PlayerRefService {
  private static instance: PlayerRefService;
  private playerRef: React.RefObject<ReactPlayer | null> | null = null;
  private peerStream: MediaStream | null = null;

  private constructor() {}

  static getInstance(): PlayerRefService {
    if (!PlayerRefService.instance) {
      PlayerRefService.instance = new PlayerRefService();
    }
    return PlayerRefService.instance;
  }

  setPlayerRef(ref: React.RefObject<ReactPlayer | null> | null) {
    this.playerRef = ref;
  }

  getPlayerRef(): React.RefObject<ReactPlayer | null> | null {
    return this.playerRef;
  }

  getCurrentPlayingId(): string | null {
    // Get current playing from LiveStore queue
    const liveStore = getLiveStoreInstance()
    if (!liveStore) return null
    
    const result = liveStore.query({
      query: `SELECT currentPlaying FROM queue WHERE id = ?`,
      bindValues: { 1: 'default' }
    }) as any[]
    return result[0]?.currentPlaying || null;
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
            !(media as any).captureStream &&
            (media as any).mozCaptureStream
          ) {
            return {
              element: media,
              captureStream: (fps?: number) =>
                (media as any).mozCaptureStream(fps),
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
      if (!internal.captureStream && (internal as any).mozCaptureStream) {
        return {
          element: internal,
          captureStream: (fps?: number) =>
            (internal as any).mozCaptureStream(fps),
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

  setPeerStream(stream: MediaStream | null) {
    this.peerStream = stream;
  }

  getPeerStream(): MediaStream | null {
    return this.peerStream;
  }
}

export default PlayerRefService;
