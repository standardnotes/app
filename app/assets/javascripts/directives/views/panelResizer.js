import angular from 'angular';
import template from '%/directives/panel-resizer.pug';
import { debounce } from '@/utils';

const PanelSides = {
  Right: 'right',
  Left: 'left'
};
const MouseEvents = {
  Move: 'mousemove',
  Down: 'mousedown',
  Up: 'mouseup'
};
const CssClasses = {
  Hoverable: 'hoverable',
  AlwaysVisible: 'always-visible',
  Dragging: 'dragging',
  NoSelection: 'no-selection',
  Collapsed: 'collapsed',
  AnimateOpacity: 'animate-opacity',
};
const WINDOW_EVENT_RESIZE = 'resize';

class PanelResizerCtrl {
  /* @ngInject */
  constructor(
    $compile,
    $element,
    $timeout,
  ) {
    this.$compile = $compile;
    this.$element = $element;
    this.$timeout = $timeout;

    /** To allow for registering events */
    this.handleResize = this.handleResize.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
  }

  $onInit() {
    this.configureDefaults();
    this.reloadDefaultValues();
    this.configureControl();
    this.addDoubleClickHandler();
    this.addMouseDownListener();
    this.addMouseMoveListener();
    this.addMouseUpListener();
  }

  $onDestroy() {
    this.onResizeFinish = null;
    this.control = null;
    window.removeEventListener(WINDOW_EVENT_RESIZE, this.handleResize);
    document.removeEventListener(MouseEvents.Move, this.onMouseMove);
    document.removeEventListener(MouseEvents.Up, this.onMouseUp);
    this.resizerColumn.removeEventListener(MouseEvents.Down, this.onMouseDown);
    this.handleResize = null;
    this.onMouseMove = null;
    this.onMouseUp = null;
    this.onMouseDown = null;
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
    this.control.onReady();
  }

  configureDefaults() {
    this.panel = document.getElementById(this.panelId);
    if (!this.panel) {
      console.error('Panel not found for', this.panelId);
    }

    this.resizerColumn = this.$element[0];
    this.currentMinWidth = this.minWidth || this.resizerColumn.offsetWidth;
    this.pressed = false;
    this.startWidth = this.panel.scrollWidth;
    this.lastDownX = 0;
    this.collapsed = false;
    this.lastWidth = this.startWidth;
    this.startLeft = this.panel.offsetLeft;
    this.lastLeft = this.startLeft;
    this.appFrame = null;
    this.widthBeforeLastDblClick = 0;

    if (this.property === PanelSides.Right) {
      this.configureRightPanel();
    }
    if (this.alwaysVisible) {
      this.resizerColumn.classList.add(CssClasses.AlwaysVisible);
    }
    if (this.hoverable) {
      this.resizerColumn.classList.add(CssClasses.Hoverable);
    }
  }

  configureRightPanel() {
    window.addEventListener(WINDOW_EVENT_RESIZE, this.handleResize);
  }

  handleResize() {
    debounce(this, () => {
      this.reloadDefaultValues();
      this.handleWidthEvent();
      this.$timeout(() => {
        this.finishSettingWidth();
      });
    }, 250);
  }

  getParentRect() {
    return this.panel.parentNode.getBoundingClientRect();
  }

  reloadDefaultValues() {
    this.startWidth = this.isAtMaxWidth()
      ? this.getParentRect().width
      : this.panel.scrollWidth;
    this.lastWidth = this.startWidth;
    this.appFrame = document.getElementById('app').getBoundingClientRect();
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
        this.onResizeFinish(
          this.lastWidth,
          this.lastLeft,
          this.isAtMaxWidth(),
          newCollapseState
        );
      });
    };
  }

  addMouseDownListener() {
    this.resizerColumn.addEventListener(MouseEvents.Down, this.onMouseDown);
  }

  onMouseDown(event) {
    this.addInvisibleOverlay();
    this.pressed = true;
    this.lastDownX = event.clientX;
    this.startWidth = this.panel.scrollWidth;
    this.startLeft = this.panel.offsetLeft;
    this.panel.classList.add(CssClasses.NoSelection);
    if (this.hoverable) {
      this.resizerColumn.classList.add(CssClasses.Dragging);
    }
  }

  addMouseMoveListener() {
    document.addEventListener(MouseEvents.Move, this.onMouseMove);
  }

  onMouseMove(event) {
    if (!this.pressed) {
      return;
    }
    event.preventDefault();
    if (this.property && this.property === PanelSides.Left) {
      this.handleLeftEvent(event);
    } else {
      this.handleWidthEvent(event);
    }
  }

  handleWidthEvent(event) {
    let x;
    if (event) {
      x = event.clientX;
    } else {
      /** Coming from resize event */
      x = 0;
      this.lastDownX = 0;
    }

    const deltaX = x - this.lastDownX;
    const newWidth = this.startWidth + deltaX;
    this.setWidth(newWidth, false);
  }

  handleLeftEvent(event) {
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
    this.setLeft(newLeft, false);
    this.setWidth(newWidth, false);
  }

  addMouseUpListener() {
    document.addEventListener(MouseEvents.Up, this.onMouseUp);
  }

  onMouseUp() {
    this.removeInvisibleOverlay();
    if (!this.pressed) {
      return;
    }
    this.pressed = false;
    this.resizerColumn.classList.remove(CssClasses.Dragging);
    this.panel.classList.remove(CssClasses.NoSelection);
    const isMaxWidth = this.isAtMaxWidth();
    if (this.onResizeFinish) {
      this.onResizeFinish(
        this.lastWidth,
        this.lastLeft,
        isMaxWidth,
        this.isCollapsed()
      );
    }
    this.finishSettingWidth();
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

  setWidth(width, finish) {
    if (width < this.currentMinWidth) {
      width = this.currentMinWidth;
    }
    const parentRect = this.getParentRect();
    if (width > parentRect.width) {
      width = parentRect.width;
    }

    const maxWidth = this.appFrame.width - this.panel.getBoundingClientRect().x;
    if (width > maxWidth) {
      width = maxWidth;
    }
    if (Math.round(width + this.lastLeft) === Math.round(parentRect.width)) {
      this.panel.style.width = `calc(100% - ${this.lastLeft}px)`;
      this.panel.style.flexBasis = `calc(100% - ${this.lastLeft}px)`;
    } else {
      this.panel.style.flexBasis = width + 'px';
      this.panel.style.width = width + 'px';
    }
    this.lastWidth = width;
    if (finish) {
      this.finishSettingWidth();
    }
  }

  setLeft(left) {
    this.panel.style.left = left + 'px';
    this.lastLeft = left;
  }

  finishSettingWidth() {
    if (!this.collapsable) {
      return;
    }

    this.collapsed = this.isCollapsed();
    if (this.collapsed) {
      this.resizerColumn.classList.add(CssClasses.Collapsed);
    } else {
      this.resizerColumn.classList.remove(CssClasses.Collapsed);
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
    this.overlay = this.$compile(`<div id='resizer-overlay'></div>`)(this);
    angular.element(document.body).prepend(this.overlay);
  }

  removeInvisibleOverlay() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }

  flash() {
    const FLASH_DURATION = 3000;
    this.resizerColumn.classList.add(CssClasses.AnimateOpacity);
    this.$timeout(() => {
      this.resizerColumn.classList.remove(CssClasses.AnimateOpacity);
    }, FLASH_DURATION);
  }
}

export class PanelResizer {
  constructor() {
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
      panelId: '=',
      property: '='
    };
  }
}
