import { data } from 'autoprefixer'
import * as React from 'react'

import Button from './common/Button'

type Props = {
  onLoaded: (data: any) => void
}

export default class Importer extends React.Component<Props> {
  fileInput = React.createRef<HTMLInputElement>()

  state = {
    status: ''
  }

  constructor (props: Props) {
    super(props)
    // create a ref to store the textInput DOM element
    this.fileInput = React.createRef()
  }

  loaded (evt) {
    // Obtain the read file data
    const fileString = evt.target.result
    this.setState({status: 'File loaded!'})
    this.props.onLoaded(fileString)
  }

  errorHandler (evt) {
    if(evt.target.error.name === "NotReadableError") {
      // The file could not be read
    }

    this.setState({status: evt.target.error.name})
  }

  updateProgress (evt) {
    if (evt.lengthComputable) {
      // evt.loaded and evt.total are ProgressEvent properties
      var loaded = (evt.loaded / evt.total);
      if (loaded < 1) {
        // Increase the prog bar length
        // style.width = (loaded * 200) + "px";
        this.setState({status: 'Loading ' + loaded + '%'})
      }
    }
  }

  getAsText (readFile) {
    var reader = new FileReader()

    // Read file into memory as UTF-16
    reader.readAsText(readFile, "UTF-8")

    // Handle progress, success, and errors
    reader.onprogress = this.updateProgress.bind(this)
    reader.onload = this.loaded.bind(this)
    reader.onerror = this.errorHandler.bind(this)
    this.setState({status: 'Loading'})
  }

  startImport() {
    const node = this.fileInput.current
    if (node && node.files) {
      const file = node.files[0]
      if (file) {
        this.getAsText(file)
      }
    }
  }

  render() {
    const message = this.state.status

    return (
      <React.Fragment>
        <input
          type='file'
          name='import-playlist'
          ref={this.fileInput}
        />
        <Button onClick={this.startImport.bind(this)}>Start import</Button>
        { message }
      </React.Fragment>
    )
  }
  }
