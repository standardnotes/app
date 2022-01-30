import { Component, createRef } from 'preact';
import { debounce } from '@/utils';

export type ResizeFinishCallback = (
  lastWidth: number,
  lastLeft: number,
  isMaxWidth: boolean,
  isCollapsed: boolean
) => void;

export enum PanelSide {
  Right = 'right',
  Left = 'left',
}

type Props = {
  width: number;
  left: number;
  alwaysVisible?: boolean;
  collapsable?: boolean;
  defaultWidth?: number;
  hoverable?: boolean;
  minWidth?: number;
  panel: HTMLDivElement;
  side: PanelSide;
  resizeFinishCallback?: ResizeFinishCallback;
  widthEventCallback?: () => void;
};

type State = {
  collapsed: boolean;
  pressed: boolean;
  startLeft: number;
  startWidth: number;
  lastDownX: number;
  lastLeft: number;
  lastWidth: number;
  widthBeforeLastDblClick: number;
  minWidth: number;
};

export class SimplePanelResizer extends Component<Props, State> {
  private overlay?: HTMLDivElement;
  private resizerElementRef = createRef<HTMLDivElement>();
  private debouncedResizeHandler: () => void;

  constructor(props: Props) {
    super(props);
    this.state = {
      collapsed: false,
      pressed: false,
      minWidth: props.minWidth || 5,
      startLeft: props.panel.offsetLeft,
      startWidth: props.panel.scrollWidth,
      lastDownX: 0,
      lastLeft: props.panel.offsetLeft,
      lastWidth: props.panel.scrollWidth,
      widthBeforeLastDblClick: 0,
    };

    this.setWidth(this.props.width);
    this.setLeft(this.props.left);

    document.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('mousemove', this.onMouseMove);
    this.debouncedResizeHandler = debounce(this.handleResize, 250);
    if (this.props.side === PanelSide.Right) {
      window.addEventListener('resize', this.debouncedResizeHandler);
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.width != prevProps.width) {
      this.setWidth(this.props.width);
    }
    if (this.props.left !== prevProps.left) {
      this.setLeft(this.props.left);
      this.setWidth(this.props.width);
    }

    const isCollapsed = this.isCollapsed();
    if (isCollapsed !== this.state.collapsed) {
      this.setState({ collapsed: isCollapsed });
    }
  }

  componentWillUnmount() {
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('resize', this.debouncedResizeHandler);
  }

  get appFrame() {
    return document.getElementById('app')?.getBoundingClientRect() as DOMRect;
  }

  getParentRect() {
    return (this.props.panel.parentNode as HTMLElement).getBoundingClientRect();
  }

  isAtMaxWidth = () => {
    const marginOfError = 5;
    const difference = Math.abs(
      Math.round(this.state.lastWidth + this.state.lastLeft) -
        Math.round(this.getParentRect().width)
    );
    return difference < marginOfError;
  };

  isCollapsed() {
    return this.state.lastWidth <= this.state.minWidth;
  }

  finishSettingWidth = () => {
    if (!this.props.collapsable) {
      return;
    }

    this.setState({
      collapsed: this.isCollapsed(),
    });
  };

  setWidth = async (width: number, finish = false): Promise<void> => {
    if (width === 0) {
      width = this.computeMaxWidth();
    }
    if (width < this.state.minWidth) {
      width = this.state.minWidth;
    }

    const parentRect = this.getParentRect();
    if (width > parentRect.width) {
      width = parentRect.width;
    }

    const maxWidth =
      this.appFrame.width - this.props.panel.getBoundingClientRect().x;
    if (width > maxWidth) {
      width = maxWidth;
    }

    if (
      Math.round(width + this.state.lastLeft) === Math.round(parentRect.width)
    ) {
      this.props.panel.style.width = `calc(100% - ${this.state.lastLeft}px)`;
    } else {
      this.props.panel.style.width = width + 'px';
    }

    return new Promise((resolve) => {
      this.setState(
        {
          lastWidth: width,
        },
        () => {
          resolve();
          if (finish) {
            this.finishSettingWidth();
            if (this.props.resizeFinishCallback) {
              this.props.resizeFinishCallback(
                this.state.lastWidth,
                this.state.lastLeft,
                this.isAtMaxWidth(),
                this.isCollapsed()
              );
            }
          }
        }
      );
    });
  };

  setLeft = (left: number) => {
    this.props.panel.style.left = left + 'px';
    this.setState({ lastLeft: left });
  };

  onDblClick = async () => {
    const collapsed = this.isCollapsed();
    if (collapsed) {
      await this.setWidth(
        this.state.widthBeforeLastDblClick || this.props.defaultWidth || 0
      );
    } else {
      this.setState({
        widthBeforeLastDblClick: this.state.lastWidth,
      });
      await this.setWidth(this.state.minWidth);
    }
    this.finishSettingWidth();

    this.props.resizeFinishCallback?.(
      this.state.lastWidth,
      this.state.lastLeft,
      this.isAtMaxWidth(),
      this.isCollapsed()
    );
  };

  handleWidthEvent(event?: MouseEvent) {
    if (this.props.widthEventCallback) {
      this.props.widthEventCallback();
    }
    let x;
    let lastDownX = this.state.lastDownX;
    if (event) {
      x = event.clientX;
    } else {
      /** Coming from resize event */
      x = 0;
      lastDownX = 0;
      this.setState({ lastDownX: 0 });
    }
    const deltaX = x - lastDownX;
    const newWidth = this.state.startWidth + deltaX;
    this.setWidth(newWidth, false);
  }

  handleLeftEvent(event: MouseEvent) {
    const panelRect = this.props.panel.getBoundingClientRect();
    const x = event.clientX || panelRect.x;
    let deltaX = x - this.state.lastDownX;
    let newLeft = this.state.startLeft + deltaX;
    if (newLeft < 0) {
      newLeft = 0;
      deltaX = -this.state.startLeft;
    }
    const parentRect = this.getParentRect();
    let newWidth = this.state.startWidth - deltaX;
    if (newWidth < this.state.minWidth) {
      newWidth = this.state.minWidth;
    }
    if (newWidth > parentRect.width) {
      newWidth = parentRect.width;
    }
    if (newLeft + newWidth > parentRect.width) {
      newLeft = parentRect.width - newWidth;
    }
    this.setLeft(newLeft);
    this.setWidth(newWidth, false);
  }

  computeMaxWidth(): number {
    const parentRect = this.getParentRect();
    let width = parentRect.width - this.props.left;
    if (width < this.state.minWidth) {
      width = this.state.minWidth;
    }
    return width;
  }

  handleResize = () => {
    const startWidth = this.isAtMaxWidth()
      ? this.computeMaxWidth()
      : this.props.panel.scrollWidth;
    this.setState(
      {
        startWidth,
        lastWidth: startWidth,
      },
      () => {
        this.handleWidthEvent();
        this.finishSettingWidth();
      }
    );
  };

  onMouseDown = (event: MouseEvent) => {
    this.addInvisibleOverlay();
    this.setState({
      pressed: true,
      lastDownX: event.clientX,
      startWidth: this.props.panel.scrollWidth,
      startLeft: this.props.panel.offsetLeft,
    });
  };

  onMouseUp = () => {
    this.removeInvisibleOverlay();
    if (!this.state.pressed) {
      return;
    }
    this.setState({ pressed: false });
    const isMaxWidth = this.isAtMaxWidth();
    if (this.props.resizeFinishCallback) {
      this.props.resizeFinishCallback(
        this.state.lastWidth,
        this.state.lastLeft,
        isMaxWidth,
        this.isCollapsed()
      );
    }
    this.finishSettingWidth();
  };

  onMouseMove = (event: MouseEvent) => {
    if (!this.state.pressed) {
      return;
    }
    event.preventDefault();
    if (this.props.side === PanelSide.Left) {
      this.handleLeftEvent(event);
    } else {
      this.handleWidthEvent(event);
    }
  };

  /**
   * If an iframe is displayed adjacent to our panel, and the mouse exits over the iframe,
   * document[onmouseup] is not triggered because the document is no longer the same over
   * the iframe. We add an invisible overlay while resizing so that the mouse context
   * remains in our main document.
   */
  addInvisibleOverlay = () => {
    if (this.overlay) {
      return;
    }
    const overlayElement = document.createElement('div');
    overlayElement.id = 'resizer-overlay';
    this.overlay = overlayElement;
    document.body.prepend(this.overlay);
  };

  removeInvisibleOverlay = () => {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = undefined;
    }
  };

  render() {
    return (
      <div
        className={`panel-resizer ${this.props.side} ${
          this.props.hoverable ? 'hoverable' : ''
        } ${this.props.alwaysVisible ? 'alwaysVisible' : ''} ${
          this.state.pressed ? 'dragging' : ''
        } ${this.state.collapsed ? 'collapsed' : ''}`}
        onMouseDown={this.onMouseDown}
        onDblClick={this.onDblClick}
        ref={this.resizerElementRef}
      ></div>
    );
  }
}
