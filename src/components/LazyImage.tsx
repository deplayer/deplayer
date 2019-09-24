import * as React from 'react'

type Props = {
  src?: string
}

class LazyImage extends React.Component<Props> {
  state = {
    error: null,
    isMounted: false,
    loading: false
  }

  // The Image object to check the loading will be stored here
  image: HTMLImageElement | null = null

  constructor(props: Props) {
    super(props)

    this.handleLoad = this.handleLoad.bind(this)
    this.handleError = this.handleError.bind(this)
  }

  componentWillReceiveProps(nextProps: Props) {
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
  initializeLoading(src: string | undefined) {
    this.image = new Image()

    if (src) {
      this.image.src = src
    }

    /* eslint react/no-direct-mutation-state: 0 */
    this.state.loading = true
    this.image.onload = this.handleLoad
    this.image.onerror = this.handleError
  }

  // Reset the loading parameters
  destroyLoading() {
   this.image = null
  }

  handleLoad(e) {
    if (this.state.isMounted && this.image) {
      this.setState({
        loading: false
      })
    }
  }

  handleError() {
    if (this.state.isMounted) {
      this.setState({
        error: `Failed to load ${this.props.src}`,
        loading: false
      })
    }
  }

  render() {
    const childrenWithProps = React.Children.map(this.props.children, (child: any) =>
      React.cloneElement(child, {
        noImage: this.state.loading || this.state.error
      })
    )

    return (
      <div className="lazy-image fade-in one">
        { childrenWithProps }
      </div>
    )
  }
}

export default LazyImage
