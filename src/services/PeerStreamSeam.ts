/**
 * Seam for the host-side WebRTC MediaStream shared during peer streaming.
 * Replaces setPeerStream/getPeerStream on PlayerRefService.
 */
export class PeerStreamSeam {
  private static instance: PeerStreamSeam;
  private stream: MediaStream | null = null;

  private constructor() {}

  static getInstance(): PeerStreamSeam {
    if (!PeerStreamSeam.instance) {
      PeerStreamSeam.instance = new PeerStreamSeam();
    }
    return PeerStreamSeam.instance;
  }

  setStream(stream: MediaStream | null): void {
    this.stream = stream;
  }

  getStream(): MediaStream | null {
    return this.stream;
  }
}
