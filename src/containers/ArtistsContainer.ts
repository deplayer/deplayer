import { connect } from "react-redux";
import ArtistsTable from "../components/ArtistsTable/ArtistTable";
import { State as AppState } from "../reducers";

export default connect((state: AppState) => ({
  queue: state.queue,
  player: state.player,
  collection: state.collection,
  filteredSongs: state.collection.filteredSongs,
}))(ArtistsTable);
