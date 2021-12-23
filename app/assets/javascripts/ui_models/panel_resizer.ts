import {
  PanelSide,
  ResizeFinishCallback,
} from '@/directives/views/panelResizer';
import { debounce } from '@/utils';
import { ApplicationEvent, PrefKey } from '@standardnotes/snjs';
import { action, computed, makeObservable, observable } from 'mobx';
import { WebApplication } from './application';

export type PanelResizerProps = {
  alwaysVisible?: boolean;
  application: WebApplication;
  collapsable: boolean;
  defaultWidth?: number;
  hoverable?: boolean;
  minWidth?: number;
  panel: HTMLDivElement;
  prefKey: PrefKey;
  resizeFinishCallback?: ResizeFinishCallback;
  side: PanelSide;
  widthEventCallback?: () => void;
};

export class PanelResizerState {
  private application: WebApplication;
  alwaysVisible: boolean;
  collapsable: boolean;
  collapsed = false;
  currentMinWidth = 0;
  defaultWidth: number;
  hoverable: boolean;
  lastDownX = 0;
  lastLeft = 0;
  lastWidth = 0;
  panel: HTMLDivElement;
  pressed = false;
  prefKey: PrefKey;
  resizeFinishCallback?: ResizeFinishCallback;
  side: PanelSide;
  startLeft = 0;
  startWidth = 0;
  widthBeforeLastDblClick = 0;
  widthEventCallback?: () => void;
  overlay?: HTMLDivElement;

  constructor({
    alwaysVisible,
    application,
    defaultWidth,
    hoverable,
    collapsable,
    minWidth,
    panel,
    prefKey,
    resizeFinishCallback,
    side,
    widthEventCallback,
  }: PanelResizerProps) {
    const currentKnownPref =
      (application.getPreference(prefKey) as number) ?? defaultWidth ?? 0;

    this.panel = panel;
    this.startLeft = this.panel.offsetLeft;
    this.startWidth = this.panel.scrollWidth;
    this.alwaysVisible = alwaysVisible ?? false;
    this.application = application;
    this.collapsable = collapsable ?? false;
    this.collapsed = false;
    this.currentMinWidth = minWidth ?? 0;
    this.defaultWidth = defaultWidth ?? 0;
    this.hoverable = hoverable ?? true;
    this.lastDownX = 0;
    this.lastLeft = this.startLeft;
    this.lastWidth = this.startWidth;
    this.prefKey = prefKey;
    this.pressed = false;
    this.side = side;
    this.widthBeforeLastDblClick = 0;
    this.widthEventCallback = widthEventCallback;
    this.resizeFinishCallback = resizeFinishCallback;

    this.setWidth(currentKnownPref, true);

    application.addEventObserver(async () => {
      const changedWidth = application.getPreference(prefKey) as number;
      if (changedWidth !== this.lastWidth) this.setWidth(changedWidth, true);
    }, ApplicationEvent.PreferencesChanged);

    makeObservable(this, {
      pressed: observable,
      collapsed: observable,

      onMouseUp: action,
      onMouseDown: action,
      onDblClick: action,
      handleWidthEvent: action,
      handleLeftEvent: action,
      setWidth: action,
      setMinWidth: action,
      reloadDefaultValues: action,

      appFrame: computed,
    });

    document.addEventListener('mouseup', this.onMouseUp.bind(this));
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    if (this.side === PanelSide.Right) {
      window.addEventListener(
        'resize',
        debounce(this.handleResize.bind(this), 250)
      );
    }
  }

  get appFrame() {
    return document.getElementById('app')?.getBoundingClientRect() as DOMRect;
  }

  getParentRect() {
    return (this.panel.parentNode as HTMLElement).getBoundingClientRect();
  }

  isAtMaxWidth = () => {
    return (
      Math.round(this.lastWidth + this.lastLeft) ===
      Math.round(this.getParentRect().width)
    );
  };

  isCollapsed() {
    return this.lastWidth <= this.currentMinWidth;
  }

  reloadDefaultValues = () => {
    this.startWidth = this.isAtMaxWidth()
      ? this.getParentRect().width
      : this.panel.scrollWidth;
    this.lastWidth = this.startWidth;
  };

  finishSettingWidth = () => {
    if (!this.collapsable) {
      return;
    }

    this.collapsed = this.isCollapsed();
  };

  setWidth = (width: number, finish = false) => {
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
    } else {
      this.panel.style.width = width + 'px';
    }

    this.lastWidth = width;

    if (finish) {
      this.finishSettingWidth();
      if (this.resizeFinishCallback) {
        this.resizeFinishCallback(
          this.lastWidth,
          this.lastLeft,
          this.isAtMaxWidth(),
          this.isCollapsed()
        );
      }
    }

    this.application.setPreference(this.prefKey, this.lastWidth);
  };

  setLeft = (left: number) => {
    this.panel.style.left = left + 'px';
    this.lastLeft = left;
  };

  onDblClick = () => {
    const collapsed = this.isCollapsed();
    if (collapsed) {
      this.setWidth(this.widthBeforeLastDblClick || this.defaultWidth);
    } else {
      this.widthBeforeLastDblClick = this.lastWidth;
      this.setWidth(this.currentMinWidth);
    }
    this.application.setPreference(this.prefKey, this.lastWidth);
    this.finishSettingWidth();
    if (this.resizeFinishCallback) {
      this.resizeFinishCallback(
        this.lastWidth,
        this.lastLeft,
        this.isAtMaxWidth(),
        this.isCollapsed()
      );
    }
  };

  handleWidthEvent(event?: MouseEvent) {
    if (this.widthEventCallback) {
      this.widthEventCallback();
    }
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

  handleResize = () => {
    this.reloadDefaultValues();
    this.handleWidthEvent();
    this.finishSettingWidth();
  };

  onMouseDown = (event: MouseEvent) => {
    this.addInvisibleOverlay();
    this.pressed = true;
    this.lastDownX = event.clientX;
    this.startWidth = this.panel.scrollWidth;
    this.startLeft = this.panel.offsetLeft;
  };

  onMouseUp = () => {
    this.removeInvisibleOverlay();
    if (!this.pressed) {
      return;
    }
    this.pressed = false;
    const isMaxWidth = this.isAtMaxWidth();
    if (this.resizeFinishCallback) {
      this.resizeFinishCallback(
        this.lastWidth,
        this.lastLeft,
        isMaxWidth,
        this.isCollapsed()
      );
    }
    this.finishSettingWidth();
  };

  onMouseMove(event: MouseEvent) {
    if (!this.pressed) {
      return;
    }
    event.preventDefault();
    if (this.side === PanelSide.Left) {
      this.handleLeftEvent(event);
    } else {
      this.handleWidthEvent(event);
    }
  }

  setMinWidth = (minWidth?: number) => {
    this.currentMinWidth = minWidth ?? this.currentMinWidth;
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
}
