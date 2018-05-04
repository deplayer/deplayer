import React, { Component } from 'react';

import { getCollection } from '../actions/collection';
import CollectionRow from './CollectionRow';

export default class Collection extends Component {
  componentWillMount () {
    const { dispatch } = this.props
    dispatch(getCollection())
  }

  render() {
    const songs = this.props.collection.visibleSongs.map((visibleSong) => {
      return <CollectionRow key={visibleSong._id} song={visibleSong} />
    })

    return (
      <div>
        { songs }
        Total songs {this.props.collection.totalRows}
      </div>
    )
  }
}
