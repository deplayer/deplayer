import * as React from 'react'
import Spinner from './Spinner'

class LazyImage extends React.Component {
  state = {
    error: null,
    isMounted: false,
    loading: false
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

  componentDidMount() {
    this.setState({isMounted: true})
    this.initializeLoading(this.props.src)
  }

  componentWillUnmount() {
    /* eslint react/no-direct-mutation-state: 0 */
    this.state.isMounted = false
    this.destroyLoading()
  }

  // Initialize the loading parameters
  initializeLoading(src) {
    this.image = new Image()

    this.image.src = src
    this.image.onload = this.handleLoad
    this.image.onerror = this.handleError
  }

  // Reset the loading parameters
  destroyLoading() {
   this.image = null
   this.handleLoad  = null
   this.handleError = null
  }

  handleLoad(e) {
    if (this.state.isMounted) {
      this.setState({
        loading: false
      })
    }
  }

  handleError(e) {
    if (this.state.isMounted) {
      this.setState({
        error: `Failed to load ${this.props.src}`,
        loading: false
      })
    }
  }

  render() {
    if (this.state.loading) {
      return (<Spinner />)
    }

    return (
      <div className="lazy-image fade-in one">
        { this.props.children }
      </div>
    )
  }
}

export default LazyImage
