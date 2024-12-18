import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import React from 'react'
import { toMagnetURI, remote } from 'parse-torrent'

import Button from '../common/Button'
import Input from '../common/Input'
import Modal from '../common/Modal'
import Header from '../common/Header'
import * as types from '../../constants/ActionTypes'

import fileManager from '../../services/Filesystem/FileManager'

type Props = {
  showAddMediaModal: boolean,
  dispatch: Dispatch
}

const AddMediaModal = (props: Props) => {
  const [magnetLink, setMagnetLink] = React.useState('')
  const [torrent, setTorrent] = React.useState<File>()
  const [youtubeLink, setYoutubeLink] = React.useState('')
  const [ipfsHash, setIpfsHash] = React.useState('')

  if (!props.showAddMediaModal) {
    return null
  }

  return (
    <Modal
      title='Select media to add'
      onClose={() => {
        props.dispatch({ type: types.HIDE_ADD_MEDIA_MODAL })
      }}
    >
      <Header>Deplayer supports several ways to access your media! If you have a provider such as Subsonic compatible API visit Providers section!</Header>
      { /* Filesystem */}
      <div className='my-6'>
        <Header>
          Open local filesystem directory
        </Header>

        <input multiple className='hidden' id="filePicker" type="file" name="file" />

        <div className='flex justify-end'>
          <Button
            fullWidth
            type='submit'
            onClick={async () => {
              const files = await fileManager.openDialog()
              props.dispatch({
                type: types.START_FILESYSTEM_FILES_PROCESSING,
                files: files
              })
            }}
          >
            Open
          </Button>
        </div>
      </div>

      <div className='my-6'>
        <Header>
          Magnet link (powered by <a target="_blank" rel="noopener noreferrer" href='https://webtorrent.io/'><span>webtorrent</span></a>. check some <a target="_blank" rel="noopener noreferrer" href="https://webtorrent.io/free-torrents"><span>examples</span></a>)
        </Header>
        <div className='my-2'>
          <Input
            type="text"
            value={magnetLink}
            onChange={(event) => setMagnetLink(event.target.value)}
          />
        </div>

        <input className='my-4' type="file" name="file" onChange={(event) => event.target.files && setTorrent(event.target.files[0])} />

        <div className='flex justify-end'>
          <Button
            fullWidth
            type='submit'
            onClick={() => {
              if (magnetLink !== '') {
                props.dispatch({ type: types.ADD_WEBTORRENT_MEDIA, magnet: magnetLink })
              }
              if (torrent) {
                remote(torrent, (err, parsedTorrent: any) => {

                  if (err) {
                    props.dispatch({
                      type: types.SEND_NOTIFICATION,
                      notification: 'Error parsing torrent file',
                      level: 'error'
                    })
                    return
                  }

                  console.log('parsedTorrent', parsedTorrent)
                  const magnet = toMagnetURI(parsedTorrent)
                  props.dispatch({ type: types.ADD_WEBTORRENT_MEDIA, magnet: magnet })

                })
              }
              props.dispatch({ type: types.HIDE_ADD_MEDIA_MODAL })
            }}
          >
            Add and fetch
          </Button>
        </div>
      </div>

      <div className='my-6'>
        <Header>Youtube link</Header>
        <div className='my-2'>
          <Input
            type="text"
            value={youtubeLink}
            onChange={(event) => setYoutubeLink(event.target.value)}
          />
        </div>
        <div className='flex justify-end'>
          <Button
            fullWidth
            type='submit'
            onClick={() => {
              props.dispatch({
                type: types.START_YOUTUBE_DL_SERVER_SCAN,
                key: 'youtube',
                data: { url: youtubeLink }
              })
              props.dispatch({ type: types.HIDE_ADD_MEDIA_MODAL })
            }}
          >
            Add and fetch
          </Button>
        </div>
      </div>

      <div className='my-6'>
        <Header>IPFS Hash</Header>
        <div className='my-2'>
          <Input
            type="text"
            value={ipfsHash}
            onChange={(event) => setIpfsHash(event.target.value)}
          />
        </div>
        <div className='flex justify-end'>
          <Button
            fullWidth
            type='submit'
            onClick={() => {
              props.dispatch({
                type: types.SEND_NOTIFICATION,
                notification: `starting to scan hash: ${ipfsHash}`,
                level: 'info'
              })
              props.dispatch({ type: types.IPFS_FOLDER_FOUND, hash: ipfsHash })
            }}
          >
            Add and fetch
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default connect(
  (state: any) => ({
    showAddMediaModal: state.app.showAddMediaModal
  })
)(AddMediaModal)
