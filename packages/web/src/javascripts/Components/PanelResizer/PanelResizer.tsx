import { Component, createRef, MouseEventHandler } from 'react'
import { debounce } from '@/Utils'
import styled from 'styled-components'

export type ResizeFinishCallback = (
  lastWidth: number,
  lastLeft: number,
  isMaxWidth: boolean,
  isCollapsed: boolean,
) => void

export enum PanelSide {
  Right = 'right',
  Left = 'left',
}

export enum PanelResizeType {
  WidthOnly = 'WidthOnly',
  OffsetAndWidth = 'OffsetAndWidth',
}

type Props = {
  width: number
  left: number
  alwaysVisible?: boolean
  collapsable?: boolean
  defaultWidth?: number
  hoverable?: boolean
  minWidth?: number
  panel: HTMLDivElement
  side: PanelSide
  type: PanelResizeType
  resizeFinishCallback?: ResizeFinishCallback
  widthEventCallback?: () => void
}

type State = {
  collapsed: boolean
  pressed: boolean
}

const StyledPanelResizer = styled.div<{
  hoverable?: boolean
  alwaysVisible?: boolean
  pressed: boolean
  collapsed: boolean
}>`
  background-color: var(--panel-resizer-background-color);
  border-bottom: none;
  border-top: none;
  cursor: col-resize;
  height: 100%;
  opacity: 0;
  position: absolute;
  right: 0;
  top: 0;
  width: 4px;
  z-index: var(--z-index-panel-resizer);

  @keyframes fade {
    0% {
      opacity: 0;
    }

    50% {
      opacity: 1;
    }

    100% {
      opacity: 0;
    }
  }

  &.left {
    left: 0;
    right: none;
  }

  ${(props) => (props.alwaysVisible || props.collapsed || props.pressed) && 'opacity: 1;'}

  &:hover {
    ${(props) => props.hoverable && 'opacity: 1;'}
  }
`

class PanelResizer extends Component<Props, State> {
  private overlay?: HTMLDivElement
  private resizerElementRef = createRef<HTMLDivElement>()
  private debouncedResizeHandler: () => void
  private startLeft: number
  private startWidth: number
  private lastDownX: number
  private lastLeft: number
  private lastWidth: number
  private widthBeforeLastDblClick: number
  private minWidth: number

  constructor(props: Props) {
    super(props)
    this.state = {
      collapsed: false,
      pressed: false,
    }

    this.minWidth = props.minWidth || 5
    this.startLeft = props.panel.offsetLeft
    this.startWidth = props.panel.scrollWidth
    this.lastDownX = 0
    this.lastLeft = props.panel.offsetLeft
    this.lastWidth = props.panel.scrollWidth
    this.widthBeforeLastDblClick = 0

    this.setWidth(this.props.width)
    this.setLeft(this.props.left)

    document.addEventListener('mouseup', this.onMouseUp)
    document.addEventListener('mousemove', this.onMouseMove)
    this.debouncedResizeHandler = debounce(this.handleResize, 250)
    if (this.props.type === PanelResizeType.OffsetAndWidth) {
      window.addEventListener('resize', this.debouncedResizeHandler)
    }
  }

  override componentDidMount() {
    console.log(this.resizerElementRef.current)
    this.resizerElementRef.current?.addEventListener('dblclick', this.onDblClick)
  }

  override componentDidUpdate(prevProps: Props) {
    if (this.props.width != prevProps.width) {
      this.setWidth(this.props.width)
    }
    if (this.props.left !== prevProps.left) {
      this.setLeft(this.props.left)
      this.setWidth(this.props.width)
    }

    const isCollapsed = this.isCollapsed()
    if (isCollapsed !== this.state.collapsed) {
      this.setState({ collapsed: isCollapsed })
    }
  }

  override componentWillUnmount() {
    this.resizerElementRef.current?.removeEventListener('dblclick', this.onDblClick)
    document.removeEventListener('mouseup', this.onMouseUp)
    document.removeEventListener('mousemove', this.onMouseMove)
    window.removeEventListener('resize', this.debouncedResizeHandler)
  }

  get appFrame() {
    return document.getElementById('app')?.getBoundingClientRect() as DOMRect
  }

  getParentRect() {
    return (this.props.panel.parentNode as HTMLElement).getBoundingClientRect()
  }

  isAtMaxWidth = () => {
    const marginOfError = 5
    const difference = Math.abs(Math.round(this.lastWidth + this.lastLeft) - Math.round(this.getParentRect().width))
    return difference < marginOfError
  }

  isCollapsed() {
    return this.lastWidth <= this.minWidth
  }

  finishSettingWidth = () => {
    if (!this.props.collapsable) {
      return
    }

    this.setState({
      collapsed: this.isCollapsed(),
    })
  }

  setWidth = (width: number, finish = false): void => {
    if (width === 0) {
      width = this.computeMaxWidth()
    }
    if (width < this.minWidth) {
      width = this.minWidth
    }

    const parentRect = this.getParentRect()
    if (width > parentRect.width) {
      width = parentRect.width
    }

    const maxWidth = this.appFrame.width - this.props.panel.getBoundingClientRect().x
    if (width > maxWidth) {
      width = maxWidth
    }

    const isFullWidth = Math.round(width + this.lastLeft) === Math.round(parentRect.width)
    if (isFullWidth) {
      if (this.props.type === PanelResizeType.WidthOnly) {
        this.props.panel.style.removeProperty('width')
      } else {
        this.props.panel.style.width = `calc(100% - ${this.lastLeft}px)`
      }
    } else {
      this.props.panel.style.width = width + 'px'
    }
    this.lastWidth = width
    if (finish) {
      this.finishSettingWidth()
      if (this.props.resizeFinishCallback) {
        this.props.resizeFinishCallback(this.lastWidth, this.lastLeft, this.isAtMaxWidth(), this.isCollapsed())
      }
    }
  }

  setLeft = (left: number) => {
    this.props.panel.style.left = left + 'px'
    this.lastLeft = left
  }

  onDblClick = () => {
    const collapsed = this.isCollapsed()
    if (collapsed) {
      this.setWidth(this.widthBeforeLastDblClick || this.props.defaultWidth || 0)
    } else {
      this.widthBeforeLastDblClick = this.lastWidth
      this.setWidth(this.minWidth)
    }
    this.finishSettingWidth()

    this.props.resizeFinishCallback?.(this.lastWidth, this.lastLeft, this.isAtMaxWidth(), this.isCollapsed())
  }

  handleWidthEvent(event?: MouseEvent) {
    if (this.props.widthEventCallback) {
      this.props.widthEventCallback()
    }

    let x
    if (event) {
      x = event.clientX
    } else {
      /** Coming from resize event */
      x = 0
      this.lastDownX = 0
    }
    const deltaX = x - this.lastDownX
    const newWidth = this.startWidth + deltaX
    this.setWidth(newWidth, false)
  }

  handleLeftEvent(event: MouseEvent) {
    const panelRect = this.props.panel.getBoundingClientRect()
    const x = event.clientX || panelRect.x
    let deltaX = x - this.lastDownX
    let newLeft = this.startLeft + deltaX
    if (newLeft < 0) {
      newLeft = 0
      deltaX = -this.startLeft
    }
    const parentRect = this.getParentRect()
    let newWidth = this.startWidth - deltaX
    if (newWidth < this.minWidth) {
      newWidth = this.minWidth
    }
    if (newWidth > parentRect.width) {
      newWidth = parentRect.width
    }
    if (newLeft + newWidth > parentRect.width) {
      newLeft = parentRect.width - newWidth
    }
    this.setLeft(newLeft)
    this.setWidth(newWidth, false)
  }

  computeMaxWidth(): number {
    const parentRect = this.getParentRect()
    let width = parentRect.width - this.props.left
    if (width < this.minWidth) {
      width = this.minWidth
    }
    return width
  }

  handleResize = () => {
    const startWidth = this.isAtMaxWidth() ? this.computeMaxWidth() : this.props.panel.scrollWidth

    this.startWidth = startWidth
    this.lastWidth = startWidth

    this.handleWidthEvent()
    this.finishSettingWidth()
  }

  onMouseDown: MouseEventHandler = (event) => {
    this.addInvisibleOverlay()
    this.lastDownX = event.clientX
    this.startWidth = this.props.panel.scrollWidth
    this.startLeft = this.props.panel.offsetLeft
    this.setState({
      pressed: true,
    })
  }

  onMouseUp = () => {
    this.removeInvisibleOverlay()
    if (!this.state.pressed) {
      return
    }
    this.setState({ pressed: false })
    const isMaxWidth = this.isAtMaxWidth()
    if (this.props.resizeFinishCallback) {
      this.props.resizeFinishCallback(this.lastWidth, this.lastLeft, isMaxWidth, this.isCollapsed())
    }
    this.finishSettingWidth()
  }

  onMouseMove = (event: MouseEvent) => {
    if (!this.state.pressed) {
      return
    }
    event.preventDefault()
    if (this.props.side === PanelSide.Left) {
      this.handleLeftEvent(event)
    } else {
      this.handleWidthEvent(event)
    }
  }

  /**
   * If an iframe is displayed adjacent to our panel, and the mouse exits over the iframe,
   * document[onmouseup] is not triggered because the document is no longer the same over
   * the iframe. We add an invisible overlay while resizing so that the mouse context
   * remains in our main document.
   */
  addInvisibleOverlay = () => {
    if (this.overlay) {
      return
    }
    const overlayElement = document.createElement('div')
    overlayElement.id = 'resizer-overlay'
    this.overlay = overlayElement
    document.body.prepend(this.overlay)
  }

  removeInvisibleOverlay = () => {
    if (this.overlay) {
      this.overlay.remove()
      this.overlay = undefined
    }
  }

  override render() {
    return (
      <StyledPanelResizer
        hoverable={this.props.hoverable}
        alwaysVisible={this.props.alwaysVisible}
        pressed={this.state.pressed}
        collapsed={this.state.collapsed}
        className={this.props.side}
        onMouseDown={this.onMouseDown}
        ref={this.resizerElementRef}
      />
    )
  }
}

export default PanelResizer
