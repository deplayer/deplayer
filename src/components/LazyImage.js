import * as React from 'react'

class LazyImage extends React.Component {
  state = {
    error: null,
    loading: true,
  }

  // The Image object to check the loading will be stored here
  image = null

  constructor(props) {
    super(props)

    this.handleLoad = this.handleLoad.bind(this)
    this.handleError = this.handleError.bind(this)
  }

  // Update component only if the src has changed
  shouldComponentUpdate(nextProps) {
    if (nextProps.src !== this.props.src) {
      return false
    }

    return true
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.src !== this.props.src) {
      this.destroyLoading()
      this.initializeLoading(nextProps.src)
    }
  }

  componentWillMount() {
    this.initializeLoading(this.props.src)
  }

  componentWillUnmount() {
    this.destroyLoading()
  }

  render() {
    return (
      <div className="lazy-image fade-in one">
        { this.props.children }
      </div>
    )
  }

  // Initialize the loading parameters
  initializeLoading(src) {
    this.image = new Image()

    this.image.src = src
    this.image.onload = this.handleLoad
    this.image.onerror = this.handleError

    this.setState({
      loading: true,
    })
  }

  // Reset the loading parameters
  destroyLoading() {
    this.image = null

    this.setState({
      loading: false,
    })
  }

  handleLoad(e) {
    this.setState({
      loading: false,
    })
  }

  handleError(e) {
    this.setState({
      error: `Failed to load ${this.props.src}`,
      loading: false
    })
  }
}

export default LazyImage
