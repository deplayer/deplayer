import React, { Component } from 'react';

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
  var fileString = evt.target.result;
  console.log(fileString)
  // Handle UTF-16 file dump
  // if(utils.regexp.isChinese(fileString)) {
    //Chinese Characters + Name validation
  // }
  // else {
    // run other charset test
  // }
  // xhr.send(fileString)
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
    const file = this.fileInput.current[0]
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
