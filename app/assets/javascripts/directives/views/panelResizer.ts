import { PanelPuppet, WebDirective } from './../../types';
import angular from 'angular';
import template from '%/directives/panel-resizer.pug';
import { debounce } from '@/utils';

enum PanelSide {
  Right = 'right',
  Left = 'left',
}
enum MouseEventType {
  Move = 'mousemove',
  Down = 'mousedown',
  Up = 'mouseup',
}
enum CssClass {
  Hoverable = 'hoverable',
  AlwaysVisible = 'always-visible',
  Dragging = 'dragging',
  NoSelection = 'no-selection',
  Collapsed = 'collapsed',
  AnimateOpacity = 'animate-opacity',
}
const WINDOW_EVENT_RESIZE = 'resize';

type ResizeFinishCallback = (
  lastWidth: number,
  lastLeft: number,
  isMaxWidth: boolean,
  isCollapsed: boolean
) => void;

interface PanelResizerScope {
  alwaysVisible: boolean;
  collapsable: boolean;
  control: PanelPuppet;
  defaultWidth: number;
  hoverable: boolean;
  index: number;
  minWidth: number;
  onResizeFinish: () => ResizeFinishCallback;
  onWidthEvent?: () => void;
  panelId: string;
  property: PanelSide;
}

class PanelResizerCtrl implements PanelResizerScope {
  /** @scope */
  alwaysVisible!: boolean;
  collapsable!: boolean;
  control!: PanelPuppet;
  defaultWidth!: number;
  hoverable!: boolean;
  index!: number;
  minWidth!: number;
  onResizeFinish!: () => ResizeFinishCallback;
  onWidthEvent?: () => () => void;
  panelId!: string;
  property!: PanelSide;

  $compile: ng.ICompileService;
  $element: JQLite;
  $timeout: ng.ITimeoutService;
  panel!: HTMLElement;
  resizerColumn!: HTMLElement;
  currentMinWidth = 0;
  pressed = false;
  startWidth = 0;
  lastDownX = 0;
  collapsed = false;
  lastWidth = 0;
  startLeft = 0;
  lastLeft = 0;
  appFrame?: DOMRect;
  widthBeforeLastDblClick = 0;
  overlay?: JQLite;

  /* @ngInject */
  constructor(
    $compile: ng.ICompileService,
    $element: JQLite,
    $timeout: ng.ITimeoutService
  ) {
    this.$compile = $compile;
    this.$element = $element;
    this.$timeout = $timeout;

    /** To allow for registering events */
    this.handleResize = debounce(this.handleResize.bind(this), 250);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
  }

  $onInit() {
    this.configureDefaults();
    this.reloadDefaultValues();
    this.configureControl();
    this.addDoubleClickHandler();
    this.resizerColumn.addEventListener(MouseEventType.Down, this.onMouseDown);
    document.addEventListener(MouseEventType.Move, this.onMouseMove);
    document.addEventListener(MouseEventType.Up, this.onMouseUp);
  }

  $onDestroy() {
    (this.onResizeFinish as any) = undefined;
    (this.onWidthEvent as any) = undefined;
    (this.control as any) = undefined;
    window.removeEventListener(WINDOW_EVENT_RESIZE, this.handleResize);
    document.removeEventListener(MouseEventType.Move, this.onMouseMove);
    document.removeEventListener(MouseEventType.Up, this.onMouseUp);
    this.resizerColumn.removeEventListener(
      MouseEventType.Down,
      this.onMouseDown
    );
    (this.handleResize as any) = undefined;
    (this.onMouseMove as any) = undefined;
    (this.onMouseUp as any) = undefined;
    (this.onMouseDown as any) = undefined;
  }

  configureControl() {
    this.control.setWidth = (value) => {
      this.setWidth(value, true);
    };
    this.control.setLeft = (value) => {
      this.setLeft(value);
    };
    this.control.flash = () => {
      this.flash();
    };
    this.control.isCollapsed = () => {
      return this.isCollapsed();
    };
    this.control.ready = true;
    this.control.onReady!();
  }

  configureDefaults() {
    this.panel = document.getElementById(this.panelId)!;
    if (!this.panel) {
      console.error('Panel not found for', this.panelId);
      return;
    }
    this.resizerColumn = this.$element[0];
    this.currentMinWidth = this.minWidth || this.resizerColumn.offsetWidth + 2;
    this.pressed = false;
    this.startWidth = this.panel.scrollWidth;
    this.lastDownX = 0;
    this.collapsed = false;
    this.lastWidth = this.startWidth;
    this.startLeft = this.panel.offsetLeft;
    this.lastLeft = this.startLeft;
    this.appFrame = undefined;
    this.widthBeforeLastDblClick = 0;
    if (this.property === PanelSide.Right) {
      this.configureRightPanel();
    }
    if (this.alwaysVisible) {
      this.resizerColumn.classList.add(CssClass.AlwaysVisible);
    }
    if (this.hoverable) {
      this.resizerColumn.classList.add(CssClass.Hoverable);
    }
  }

  configureRightPanel() {
    window.addEventListener(WINDOW_EVENT_RESIZE, this.handleResize);
  }

  handleResize() {
    this.reloadDefaultValues();
    this.handleWidthEvent();
    this.$timeout(() => {
      this.finishSettingWidth();
    });
  }

  getParentRect() {
    const node = this.panel!.parentNode! as HTMLElement;
    return node.getBoundingClientRect();
  }

  reloadDefaultValues() {
    this.startWidth = this.isAtMaxWidth()
      ? this.getParentRect().width
      : this.panel.scrollWidth;
    this.lastWidth = this.startWidth;
    this.appFrame = document.getElementById('app')!.getBoundingClientRect();
  }

  addDoubleClickHandler() {
    this.resizerColumn.ondblclick = () => {
      this.$timeout(() => {
        const preClickCollapseState = this.isCollapsed();
        if (preClickCollapseState) {
          this.setWidth(this.widthBeforeLastDblClick || this.defaultWidth);
        } else {
          this.widthBeforeLastDblClick = this.lastWidth;
          this.setWidth(this.currentMinWidth);
        }
        this.finishSettingWidth();
        const newCollapseState = !preClickCollapseState;
        this.onResizeFinish()(
          this.lastWidth,
          this.lastLeft,
          this.isAtMaxWidth(),
          newCollapseState
        );
      });
    };
  }

  onMouseDown(event: MouseEvent) {
    this.addInvisibleOverlay();
    this.pressed = true;
    this.lastDownX = event.clientX;
    this.startWidth = this.panel.scrollWidth;
    this.startLeft = this.panel.offsetLeft;
    this.panel.classList.add(CssClass.NoSelection);
    if (this.hoverable) {
      this.resizerColumn.classList.add(CssClass.Dragging);
    }
  }

  onMouseUp() {
    this.removeInvisibleOverlay();
    if (!this.pressed) {
      return;
    }
    this.pressed = false;
    this.resizerColumn.classList.remove(CssClass.Dragging);
    this.panel.classList.remove(CssClass.NoSelection);
    const isMaxWidth = this.isAtMaxWidth();
    if (this.onResizeFinish) {
      this.onResizeFinish()(
        this.lastWidth,
        this.lastLeft,
        isMaxWidth,
        this.isCollapsed()
      );
    }
    this.finishSettingWidth();
  }

  onMouseMove(event: MouseEvent) {
    if (!this.pressed) {
      return;
    }
    event.preventDefault();
    if (this.property && this.property === PanelSide.Left) {
      this.handleLeftEvent(event);
    } else {
      this.handleWidthEvent(event);
    }
  }

  handleWidthEvent(event?: MouseEvent) {
    if (this.onWidthEvent && this.onWidthEvent()) {
      this.onWidthEvent()();
    }
    let x;
    if (event) {
      x = event!.clientX;
    } else {
      /** Coming from resize event */
      x = 0;
      this.lastDownX = 0;
    }
    const deltaX = x - this.lastDownX;
    const newWidth = this.startWidth + deltaX;
    this.setWidth(newWidth, false);
  }

  handleLeftEvent(event: MouseEvent) {
    const panelRect = this.panel.getBoundingClientRect();
    const x = event.clientX || panelRect.x;
    let deltaX = x - this.lastDownX;
    let newLeft = this.startLeft + deltaX;
    if (newLeft < 0) {
      newLeft = 0;
      deltaX = -this.startLeft;
    }
    const parentRect = this.getParentRect();
    let newWidth = this.startWidth - deltaX;
    if (newWidth < this.currentMinWidth) {
      newWidth = this.currentMinWidth;
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

  isAtMaxWidth() {
    return (
      Math.round(this.lastWidth + this.lastLeft) ===
      Math.round(this.getParentRect().width)
    );
  }

  isCollapsed() {
    return this.lastWidth <= this.currentMinWidth;
  }

  setWidth(width: number, finish = false) {
    if (width < this.currentMinWidth) {
      width = this.currentMinWidth;
    }
    const parentRect = this.getParentRect();
    if (width > parentRect.width) {
      width = parentRect.width;
    }

    const maxWidth =
      this.appFrame!.width - this.panel.getBoundingClientRect().x;
    if (width > maxWidth) {
      width = maxWidth;
    }
    if (Math.round(width + this.lastLeft) === Math.round(parentRect.width)) {
      this.panel.style.width = `calc(100% - ${this.lastLeft}px)`;
    } else {
      this.panel.style.width = width + 'px';
    }
    this.lastWidth = width;
    if (finish) {
      this.finishSettingWidth();
    }
  }

  setLeft(left: number) {
    this.panel.style.left = left + 'px';
    this.lastLeft = left;
  }

  finishSettingWidth() {
    if (!this.collapsable) {
      return;
    }

    this.collapsed = this.isCollapsed();
    if (this.collapsed) {
      this.resizerColumn.classList.add(CssClass.Collapsed);
    } else {
      this.resizerColumn.classList.remove(CssClass.Collapsed);
    }
  }

  /**
   * If an iframe is displayed adjacent to our panel, and the mouse exits over the iframe,
   * document[onmouseup] is not triggered because the document is no longer the same over
   * the iframe. We add an invisible overlay while resizing so that the mouse context
   * remains in our main document.
   */
  addInvisibleOverlay() {
    if (this.overlay) {
      return;
    }
    this.overlay = this.$compile(`<div id='resizer-overlay'></div>`)(
      this as any
    );
    angular.element(document.body).prepend(this.overlay);
  }

  removeInvisibleOverlay() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = undefined;
    }
  }

  flash() {
    const FLASH_DURATION = 3000;
    this.resizerColumn.classList.add(CssClass.AnimateOpacity);
    this.$timeout(() => {
      this.resizerColumn.classList.remove(CssClass.AnimateOpacity);
    }, FLASH_DURATION);
  }
}

export class PanelResizer extends WebDirective {
  constructor() {
    super();
    this.restrict = 'E';
    this.template = template;
    this.controller = PanelResizerCtrl;
    this.controllerAs = 'ctrl';
    this.bindToController = true;
    this.scope = {
      alwaysVisible: '=',
      collapsable: '=',
      control: '=',
      defaultWidth: '=',
      hoverable: '=',
      index: '=',
      minWidth: '=',
      onResizeFinish: '&',
      onWidthEvent: '&',
      panelId: '=',
      property: '=',
    };
  }
}
