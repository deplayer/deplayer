import { Dispatch, connect } from 'react-redux'
import React from 'react'

import Button from '../common/Button'
import Input from '../common/Input'
import Modal from '../common/Modal'
import Header from '../common/Header'
import * as types from '../../constants/ActionTypes'

type Props = {
  showAddMediaModal: boolean,
  dispatch: Dispatch
}

const AddMediaModal = (props: Props) => {
  const [magnetLink, setMagnetLink] = React.useState('')
  const [youtubeLink, setYoutubeLink] = React.useState('')
  const [ipfsHash, setIpfsHash] = React.useState('')

  if (!props.showAddMediaModal) {
    return null
  }

  return (
    <Modal
      onClose={() => {
        props.dispatch({type: types.HIDE_ADD_MEDIA_MODAL})
      }}
    >
      <Header>Select media to add:</Header>

      <div className='my-6'>
        <Header>Magnet link</Header>
        <Input
          type="text"
          value={magnetLink}
          onChange={(event) => setMagnetLink(event.target.value)}
        />
        <Button
          fullWidth
          type='submit'
          onClick={() => {
            props.dispatch({type: types.ADD_WEBTORRENT_MEDIA, magnet: magnetLink})
            props.dispatch({type: types.HIDE_ADD_MEDIA_MODAL})
          }}
        >
          Add and fetch
        </Button>
      </div>

      <div className='my-6'>
        <Header>Youtube link</Header>
        <Input
          type="text"
          value={youtubeLink}
          onChange={(event) => setYoutubeLink(event.target.value)}
        />
        <Button
          fullWidth
          type='submit'
          onClick={() => {
            props.dispatch({
              type: types.START_YOUTUBE_DL_SERVER_SCAN,
              key: 'youtube',
              data: { url: youtubeLink }
            })
            props.dispatch({type: types.HIDE_ADD_MEDIA_MODAL})
          }}
        >
          Add and fetch
        </Button>
      </div>

      <div className='my-6'>
        <Header>IPFS Hash</Header>
        <Input
          type="text"
          value={ipfsHash}
          onChange={(event) => setIpfsHash(event.target.value)}
        />
        <Button
          fullWidth
          type='submit'
          onClick={() => {
            props.dispatch({
              type: types.SEND_NOTIFICATION,
              notification: `starting to scan hash: ${ ipfsHash }`,
              level: 'info'
            })
            props.dispatch({type: types.IPFS_FOLDER_FOUND, hash: ipfsHash })
          }}
        >
          Add and fetch
        </Button>
      </div>
    </Modal>
  )
}

export default connect(
  (state: any) => ({
    showAddMediaModal: state.app.showAddMediaModal
  })
)(AddMediaModal)
