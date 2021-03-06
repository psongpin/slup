import Inferno   from 'inferno'
import Component from 'inferno-component'
import styled    from 'styled-components'
import { bind }  from 'decko'

import { Indicator } from './indicator'
import { lightTheme } from '@slup/theming'
import { rgba } from 'polished'

const Container = styled.div`
  height: 38px;
  width: 100%;
  position: relative;
  display: flex;
  align-items: center;
  outline: none;
  opacity: ${props => props.disabled ? '.3' : '1'};
  pointer-events: ${props => props.disabled ? 'none' : 'auto'};
  &:focus {
    div:nth-child(2) {
      width: ${props => props.discrete ? '0' : '14px'};
      height: ${props => props.discrete ? '0' : '14px'};
      box-shadow: ${props => props.focus
      ? 'none' 
        : props.value == 0 && !props.discrete
          ? '0 0 0 14px rgba(0, 0, 0, .1)'
          :props.discrete
            ? 'none'
            : `0 0 0 14px ${rgba(props.theme.primary || lightTheme.primary, .1)}`
      };
    }

    div:nth-child(4) {
      transition: transform 300ms cubic-bezier(0.4, 0.0, 0.2, 1);
      transform: ${props => props.discrete
        ? 'translateX(-50%) scale(1)'
        : 'translateX(-50%) scale(0)'
      };
    }
  }
`

const Line = styled.div`
  height: 3px;
  width: 100%;
  position: absolute;
  background: ${props => props.theme.text || lightTheme.text};
  opacity: ${props => props.disabled ? '1' : '.3'};
  z-index: 1;
`

const Thumb = styled.div`
  transition: height 300ms, width 300ms, box-shadow 300ms, background 150ms;
  width: ${props => props.focus ? '14px' : '10px'};
  height: ${props => props.focus ? '14px' : '10px'};
  border-radius: 50%;
  background: ${props => props.disabled && props.value == 0
    ? props.theme.background || lightTheme.background                  /* Disabled or = to 0(at the beginning) */
    : props.disabled
      ? props.theme.text || lightTheme.text                            /* Disabled */
      : props.discrete && props.value == 0
        ? props.theme.text || lightTheme.text                          /* Not disabled, discrete but still at beginning */
        : props.value == 0
          ? props.theme.background || lightTheme.background            /* At the beginning */
          : props.theme.primary || lightTheme.primary                  /* Moved */
  };
  border: ${props => props.disabled && props.value == 0
    ? `2px solid ${props.theme.text || lightTheme.text}`
    : props.disabled
    ? `2px solid ${props.theme.background || lightTheme.background}`
    : props.value == 0 && !props.discrete
      ? `2px solid ${rgba(props.theme.text || lightTheme.text, .3)}`
      : 'none'
  };
  position: absolute;
  transform: translateX(-50%);
  box-shadow: none;
  z-index: 2;
`

const Track = styled.div`
  height: 3px;
  position: absolute;
  background: ${props => props.disabled
    ? 'transparent'
    : props.theme.primary || lightTheme.primary
  };
  z-index: 1;
`

export class Slider extends Component {
  state = {
    focus: false,
    keyFocus: false,
  }

  // Helper functions
  vise = (min, value, max) =>
    Math.min(Math.max(min, value), max)

  capitalize = (string) =>
    string.charAt(0).toUpperCase() + string.slice(1)

  getPercentage = (max) => max / 100

  componentWillMount() {
    document.body.addEventListener(
      'mousemove',
      this.handleMouseMove,
      { passive: true }
    )
    document.body.addEventListener(
      'mouseup',
      this.handleMouseUp,
      { passive: true }
    )
  }

  componentWillUnmount() {
    document.body.removeEventListener(
      'mousemove',
      this.handleMouseMove,
      { passive: true }
    )
    document.body.removeEventListener(
      'mouseup',
      this.handleMouseUp,
      { passive: true }
    )
  }


  @bind
  moveSlider({ clientX }) {
    const { offsetLeft, clientWidth } = this.slider
    const { max } = this.props
    const percentage = (clientX - offsetLeft) / clientWidth

    const progress = this.vise(0, percentage, 1) * max

    this.emit('change', progress)
  }

  emit(type, value) {
    const eventName = 'on' + this.capitalize(type)
    if(typeof this.props[eventName] == 'function') {
      this.props[eventName](value)
    }
  }

  @bind
  handleMouseDown(e) {
    // Set the state and emit the focus event
    this.setState({ focus: true })
    this.emit('focus')

    this.moveSlider(e)
  }

  @bind
  handleMouseUp(e) {
    // Set the state and emit the blur event
    this.setState({ focus: false })
    this.emit('blur')
  }

  @bind
  handleMouseMove(e) {
    if(this.state.focus) this.moveSlider(e)
  }

  @bind
  handleFocus() {
    this.setState({ keyFocus: true })
  }

  @bind
  handleKeyDown({ keyCode }) {
    const { vise } = this
    let { value, max } = this.props
    let { keyFocus } = this.state

    const percentage = this.getPercentage(max)

    switch (keyCode) {

      // Forward: increment of 1
      case 38:
      case 39:
        if(keyFocus) {
          const _value = vise(0, value + percentage, max)
          this.emit('change', _value)
        }
      break

      // Backwards: decrease of 1
      case 40:
      case 37:
        if(keyFocus) {
          const _value = vise(0, value - percentage, max)
          this.emit('change', _value)
        }
      break
      default:
      break
    }
  }

  render(props) {
    const {
      handleMouseDown,
      handleMouseUp,
      handleMouseMove,
      handleKeyDown,
      handleFocus
    } = this

    const { focus, keyFocus } = this.state

    return(
      <Container
        {...props}
        onMouseDown={handleMouseDown}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        innerRef={e => this.slider = e}
        tabIndex={props.disabled ? -1 : 0}
        focus={focus}
      >
        {/*Main Line*/}
        <Line disabled={props.disabled} />

        {/* Thumb */}
        <Thumb
          {...props}
          focus={focus}
          style={{left: (props.value / props.max) * 100 + '%'}}
        />

        {/* Track */}
        <Track disabled={props.disabled} style={{width: (props.value / props.max) * 100 + '%'}} />

        {props.discrete
          ? <Indicator
            value={props.value}
            max={props.max}
            focus={focus || keyFocus}
          />
          : null
        }
      </Container>
    )
  }
}
