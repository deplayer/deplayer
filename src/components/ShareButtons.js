// @flow

import React from 'react'
import { SimpleShareButtons } from "react-simple-share"

import Song from '../entities/Song'

type Props = {
  song: Song
}

const ShareButtons = (props: Props) => {
  const { shareUrl } = props.song
  return (
    <div className='share-buttons'>
      <SimpleShareButtons
        url={shareUrl}
        color="#37474F"
        size="40px"
      />
    </div>
  )
}

export default ShareButtons
