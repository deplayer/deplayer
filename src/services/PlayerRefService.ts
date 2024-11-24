import ReactPlayer from "react-player";

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
        return internal.contentWindow?.document.querySelector("video, audio");
      } catch (e) {
        console.warn("Could not access iframe content:", e);
      }
    }

    if (
      internal instanceof HTMLVideoElement ||
      internal instanceof HTMLAudioElement
    ) {
      return internal;
    }

    return null;
  }
}

export default PlayerRefService;
