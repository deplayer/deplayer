import ITunesProvider from "./ItunesApiProvider";
import MstreamApiProvider from "./MstreamApiProvider";
import SubsonicApiProvider from "./SubsonicApiProvider";
import LastfmProvider from "./LastfmProvider";
import DummyProvider from "./DummyProvider";
import JellyfinProvider from "./JellyfinProvider";

export default {
  itunes: ITunesProvider,
  mstream: MstreamApiProvider,
  subsonic: SubsonicApiProvider,
  lastfm: LastfmProvider,
  dummy: DummyProvider,
  jellyfin: JellyfinProvider,
};
