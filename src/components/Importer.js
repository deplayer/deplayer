import React, { Component } from 'react';
import parsers from 'playlist-parser'
import saveCollectionItems from '../db/collection-store'

const getAsText = (readFile) => {
  var reader = new FileReader()

  // Read file into memory as UTF-16
  reader.readAsText(readFile, "UTF-8")

  // Handle progress, success, and errors
  reader.onprogress = updateProgress
  reader.onload = loaded
  reader.onerror = errorHandler
}

const updateProgress = (evt) => {
  if (evt.lengthComputable) {
    // evt.loaded and evt.total are ProgressEvent properties
    var loaded = (evt.loaded / evt.total);
    if (loaded < 1) {
      // Increase the prog bar length
      // style.width = (loaded * 200) + "px";
    }
  }
}

const loaded = (evt) => {
  // Obtain the read file data
  const fileString = evt.target.result
  const M3U = parsers.M3U
  const playlist = M3U.parse(fileString)
  saveCollectionItems(playlist)
  console.log(playlist)
}

const errorHandler = (evt) => {
  if(evt.target.error.name === "NotReadableError") {
    // The file could not be read
  }
}


export default class Importer extends Component {
  constructor (props) {
    super(props)
    // create a ref to store the textInput DOM element
    this.fileInput = React.createRef()
  }

  startImport() {
    const file = this.fileInput.current.files[0]
    if (file) {
      getAsText(file)
    }
  }

  render() {
    return (
      <div>
        <input
          type='file'
          name='import-playlist'
          ref={this.fileInput}
        />
        <button onClick={this.startImport.bind(this)}>Start import</button>
      </div>
    )
  }
}
