import ReactPlayer from "react-player";

declare global {
  interface HTMLMediaElement {
    captureStream?(fps?: number): MediaStream;
    mozCaptureStream?(fps?: number): MediaStream;
  }
}

class PlayerRefService {
  private static instance: PlayerRefService;
  private playerRef: React.RefObject<ReactPlayer> | null = null;

  private constructor() {}

  static getInstance(): PlayerRefService {
    if (!PlayerRefService.instance) {
      PlayerRefService.instance = new PlayerRefService();
    }
    return PlayerRefService.instance;
  }

  setPlayerRef(ref: React.RefObject<ReactPlayer> | null) {
    this.playerRef = ref;
  }

  getPlayerRef(): React.RefObject<ReactPlayer> | null {
    return this.playerRef;
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
        console.warn("Could not access iframe content:", e);
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
}

export default PlayerRefService;
