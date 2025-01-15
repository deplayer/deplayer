import Mstream from "./Mstream";
import Subsonic from "./Subsonic";
import Itunes from "./Itunes";
import Ipfs from "./Ipfs";
import YoutubeDlServer from "./YoutubeDlServer";
import Jellyfin from "./Jellyfin";
import Musicbrainz from "./Musicbrainz";
import { ISettingsProvider } from "./ISettingsProvider";

const providers: { [key: string]: ISettingsProvider } = {
  mstream: new Mstream(),
  subsonic: new Subsonic(),
  itunes: new Itunes(),
  ipfs: new Ipfs(),
  "youtube-dl-server": new YoutubeDlServer(),
  jellyfin: new Jellyfin(),
  musicbrainz: new Musicbrainz(),
};

export default providers;
