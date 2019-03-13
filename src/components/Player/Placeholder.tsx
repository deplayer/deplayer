import * as React from 'react'
import { connect } from 'react-redux'

type Props = {
  queue: any,
  collection: any
}

const Placeholder = (props: Props) => {
  const currentPlayingId = props.queue.currentPlaying
  const currentPlaying = props.collection.rows[currentPlayingId]

  if (!currentPlaying) {
    return null
  }

  return (
    <div className='placeholder'>
    </div>
  )
}

export default connect(
  (state) => ({
    queue: state.queue,
    collection: state.collection
  })
)(Placeholder)
