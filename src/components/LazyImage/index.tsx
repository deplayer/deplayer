import * as React from 'react'
import classNames from 'classnames'

type Props = {
  src?: string,
  onClick?: () => void
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

  handleLoad(_e: any) {
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

    const className = classNames({
      "lazy-image": true,
      "fade-in": true,
      "w-full": true,
      "bg-no-repeat": true,
      "bg-center": true,
      "cursor-pointer": true,
      one: true
    })

    return (
      <div
        className={className}
        onClick={this.props.onClick}
      >
        { childrenWithProps }
      </div>
    )
  }
}

export default LazyImage
