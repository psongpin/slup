import Inferno   from 'inferno'
import Component from 'inferno-component'
import { bind }  from 'decko'

export class Ripple extends Component {
  state = {
    ripples: []
  }

  componentDidMount() {
    const { handleMouseDown } = this
    this.ripple.addEventListener(
      'mousedown',
      handleMouseDown,
      { passive: true }
    )
  }

  componentWillUnmount() {
    const { handleMouseDown } = this
    this.ripple.removeEventListener(
      'mousedown',
      handleMouseDown,
      { passive: true }
    )
  }

  @bind
  createListener(id) {
    const { ripple, startRemoval }  = this
    const { ripples } = this.state

    const handler = function() {
      ripples[id].removable = true

      // This will just work if the
      // animation has ended
      startRemoval(id)
      ripple.removeEventListener('mouseup', handler, { passive: true})
    }

    ripple.addEventListener('mouseup', handler, { passive: true})
  }

  @bind
  startRemoval(id) {
    const { ripples } = this.state
    const { opacityTiming } = this.props

    if(!ripples[id].animationEnded || !ripples[id].removable)
      return false

    // If we can remove it we first start
    // By decreasing the opacity to 0 and
    // Then after the animation finishes we
    // Remove the node
    const _styles = {
      ...ripples[id].styles,
      opacity: '0'
    }

    ripples[id].styles = _styles

    this.setState({ ripples })

    setTimeout(e => this.removeRipple(id), opacityTiming || 300)
  }

  @bind
  removeRipple(id) {
    const { ripples } = this.state

    const _styles = {
      ...ripples[id].styles,
      opacity: '0'
    }

    setTimeout(() => {
      ripples[id].styles = undefined
      ripples[id] = undefined

      this.setState({ ripples })
    }, 10000)
  }

  @bind
  handleAnimationEnded(id) {
    const { ripples } = this.state

    ripples[id].animationEnded = true
    ripples.removable = true
    this.setState({ ripples })

    if (ripples[id].removable) {
      this.removeRipple
    }

    // This will just work if the user has
    // fired the mouseup event
    this.startRemoval(id)
  }

  @bind
  startScaling(id) {
    const { ripples } = this.state
    const { scaleTiming, scaleSize } = this.props
    const self = this

    setTimeout(e => self.handleAnimationEnded(id), scaleTiming || 400)

    const _styles = {
      ...ripples[id].styles,
      transform: `scale(${scaleSize || 100})`
    }

    ripples[id].styles = _styles
    setTimeout(() => self.setState({ ripples }), 1)
  }

  @bind
  createNewRipple(x, y) {
    const id               = this.state.ripples.length
    const { rippleStyles } = this.getStyles()
    const {
      ripples,
      timeouts
    } = this.state

    const ripple = {
      id,
      animationEnded: false,
      removable: false,
      styles: {
        ...rippleStyles,
        top: y - (rippleStyles.height / 2),
        left: x - (rippleStyles.width / 2)
      }
    }

    ripples.push(ripple)
    this.setState({ ripples })

    this.createListener(id)
    this.startScaling(id)
  }

  @bind
  handleMouseDown(event) {
    event.stopPropagation()
    const { offsetX, offsetY } = event

    this.createNewRipple(offsetX, offsetY)
  }

  @bind
  getStyles() {
    const {
      startingSize,
      scaleTiming,
      opacityTiming,
      easing,
      opacity,
      background
    } = this.props

    const styles = {
      position: 'absolute',
      top: 0, left: 0,
      right: 0, bottom: 0,
      overflow: 'hidden',

      rippleStyles: {
        zIndex: -1,
        position: 'absolute',
        height: startingSize || 10,
        width: startingSize || 10,
        background: background || '#9E9E9E',
        opacity: opacity || .3,
        transition: `
          transform ${scaleTiming / 100 || .900}s,
          opacity ${opacityTiming / 100 || .300}s
        `,
        transitionTimingFunction: easing || 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        borderRadius: '50%',
      }
    }

    return styles
  }

  render() {
    const styles = this.getStyles()
    const { ripples } = this.state
    const { handleMouseDown } = this

    return(
      <div onMouseDown={handleMouseDown} ref={e => this.ripple = e} style={styles} >
        {ripples.filter(Boolean).map(({ styles, id }) => {
          return <div
            onMouseDown={e => e.preventDefault()}
            key={id}
            style={styles}
          />
        })}
      </div>
    )
  }
}
