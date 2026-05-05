import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import React from 'react'
import { toMagnetURI, remote } from 'parse-torrent'

import Button from '../common/Button'
import Input from '../common/Input'
import Modal from '../common/Modal'
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

  if (!props.showAddMediaModal) {
    return null
  }

  return (
    <Modal
      title='Select media to add'
      isOpen={props.showAddMediaModal}
      onClose={() => {
        props.dispatch({ type: types.HIDE_ADD_MEDIA_MODAL })
      }}
      className="w-[800px] max-w-[90vw]"
    >
      <div className="p-4">
        <p className="text-base opacity-70 mb-8">
          Deplayer supports several ways to access your media! If you have a provider such as Subsonic compatible API visit Providers section!
        </p>

        { /* Filesystem */}
        <div className='mb-8 space-y-4'>
          <h3 className="text-lg font-medium">
            Open local filesystem directory
          </h3>

          <input multiple className='hidden' id="filePicker" type="file" name="file" />

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
            className="btn-primary"
          >
            Open Directory
          </Button>
        </div>

        <div className='mb-8 space-y-4'>
          <h3 className="text-lg font-medium">
            Magnet link <span className="text-sm opacity-70">(powered by <a className="text-accent hover:underline" target="_blank" rel="noopener noreferrer" href='https://webtorrent.io/'>webtorrent</a>. check some <a className="text-accent hover:underline" target="_blank" rel="noopener noreferrer" href="https://webtorrent.io/free-torrents">examples</a>)</span>
          </h3>

          <Input
            type="text"
            value={magnetLink}
            onChange={(event) => setMagnetLink(event.target.value)}
            placeholder="Enter magnet link..."
            className="w-full"
          />

          <div className="flex items-center space-x-2">
            <input 
              type="file" 
              name="file" 
              onChange={(event) => event.target.files && setTorrent(event.target.files[0])} 
              className="file-input file-input-bordered w-full"
            />
          </div>

          <Button
            fullWidth
            type='submit'
            onClick={() => {
              if (magnetLink !== '') {
                props.dispatch({ type: types.ADD_WEBTORRENT_MEDIA, magnet: magnetLink })
              }
              if (torrent) {
                remote(torrent, (err, parsedTorrent) => {
                  if (err) {
                    props.dispatch({
                      type: types.SEND_NOTIFICATION,
                      notification: 'Error parsing torrent file',
                      level: 'error'
                    })
                    return
                  }
                  console.log('parsedTorrent', parsedTorrent)
                  const magnet = toMagnetURI(parsedTorrent!)
                  props.dispatch({ type: types.ADD_WEBTORRENT_MEDIA, magnet: magnet })
                })
              }
              props.dispatch({ type: types.HIDE_ADD_MEDIA_MODAL })
            }}
            className="btn-primary"
          >
            Add and fetch
          </Button>
        </div>

        <div className='mb-8 space-y-4'>
          <h3 className="text-lg font-medium">Youtube link</h3>
          
          <Input
            type="text"
            value={youtubeLink}
            onChange={(event) => setYoutubeLink(event.target.value)}
            placeholder="Enter YouTube URL..."
            className="w-full"
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
              props.dispatch({ type: types.HIDE_ADD_MEDIA_MODAL })
            }}
            className="btn-primary"
          >
            Add and fetch
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default connect(
  (state: { app: { showAddMediaModal: boolean } }) => ({
    showAddMediaModal: state.app.showAddMediaModal
  })
)(AddMediaModal)
