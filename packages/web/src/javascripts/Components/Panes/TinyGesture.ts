/**
 * TinyGesture.js
 *
 * This service uses passive listeners, so you can't call event.preventDefault()
 * on any of the events.
 *
 * Adapted from https://gist.github.com/SleepWalker/da5636b1abcbaff48c4d
 * and https://github.com/uxitten/xwiper
 */

export default class TinyGesture<Element extends HTMLElement = HTMLElement> {
  public opts: Options<Element>
  public touchStartX: number | null = null
  public touchStartY: number | null = null
  public touchEndX: number | null = null
  public touchEndY: number | null = null
  public touchMoveX: number | null = null
  public touchMoveY: number | null = null
  public velocityX: number | null = null
  public velocityY: number | null = null

  public longPressTimer: number | null = null
  public doubleTapTimer: number | null = null

  public doubleTapWaiting = false
  public thresholdX = 0
  public thresholdY = 0
  public disregardVelocityThresholdX = 0
  public disregardVelocityThresholdY = 0

  public swipingHorizontal = false
  public swipingVertical = false
  public swipingDirection: SwipingDirection | null = null
  public swipedHorizontal = false
  public swipedVertical = false

  public handlers: Handlers = {
    panstart: [],
    panmove: [],
    panend: [],
    swipeleft: [],
    swiperight: [],
    swipeup: [],
    swipedown: [],
    tap: [],
    doubletap: [],
    longpress: [],
  }

  // eslint-disable-next-line no-invalid-this
  private _onTouchStart: typeof this['onTouchStart'] = this.onTouchStart.bind(this)
  // eslint-disable-next-line no-invalid-this
  private _onTouchMove: typeof this['onTouchMove'] = this.onTouchMove.bind(this)
  // eslint-disable-next-line no-invalid-this
  private _onTouchEnd: typeof this['onTouchEnd'] = this.onTouchEnd.bind(this)

  constructor(public element: Element, options?: Partial<Options<Element>>) {
    this.opts = Object.assign({}, TinyGesture.defaults, options)
    this.element.addEventListener('touchstart', this._onTouchStart, passiveIfSupported)
    this.element.addEventListener('touchmove', this._onTouchMove, passiveIfSupported)
    this.element.addEventListener('touchend', this._onTouchEnd, passiveIfSupported)

    if (this.opts.mouseSupport && !('ontouchstart' in window)) {
      this.element.addEventListener('mousedown', this._onTouchStart, passiveIfSupported)
      document.addEventListener('mousemove', this._onTouchMove, passiveIfSupported)
      document.addEventListener('mouseup', this._onTouchEnd, passiveIfSupported)
    }
  }

  destroy() {
    this.element.removeEventListener('touchstart', this._onTouchStart)
    this.element.removeEventListener('touchmove', this._onTouchMove)
    this.element.removeEventListener('touchend', this._onTouchEnd)
    this.element.removeEventListener('mousedown', this._onTouchStart)
    document.removeEventListener('mousemove', this._onTouchMove)
    document.removeEventListener('mouseup', this._onTouchEnd)
    clearTimeout(this.longPressTimer ?? undefined)
    clearTimeout(this.doubleTapTimer ?? undefined)
  }

  on<E extends keyof Events>(type: E, fn: Handler<Events[E]>) {
    if (this.handlers[type]) {
      this.handlers[type].push(fn)
      return {
        type,
        fn,
        cancel: () => this.off(type, fn),
      }
    }
  }

  off<E extends keyof Events>(type: E, fn: Handler<Events[E]>) {
    if (this.handlers[type]) {
      const idx = this.handlers[type].indexOf(fn)
      if (idx !== -1) {
        this.handlers[type].splice(idx, 1)
      }
    }
  }

  fire<E extends keyof Events>(type: E, event: Events[E]) {
    for (let i = 0; i < this.handlers[type].length; i++) {
      this.handlers[type][i](event)
    }
  }

  onTouchStart(event: MouseEvent | TouchEvent) {
    this.thresholdX = this.opts.threshold('x', this)
    this.thresholdY = this.opts.threshold('y', this)
    this.disregardVelocityThresholdX = this.opts.disregardVelocityThreshold('x', this)
    this.disregardVelocityThresholdY = this.opts.disregardVelocityThreshold('y', this)
    this.touchStartX =
      event.type === 'mousedown' ? (event as MouseEvent).screenX : (event as TouchEvent).changedTouches[0].screenX
    this.touchStartY =
      event.type === 'mousedown' ? (event as MouseEvent).screenY : (event as TouchEvent).changedTouches[0].screenY
    this.touchMoveX = null
    this.touchMoveY = null
    this.touchEndX = null
    this.touchEndY = null
    this.swipingDirection = null
    // Long press.
    this.longPressTimer = window.setTimeout(() => this.fire('longpress', event), this.opts.longPressTime)
    this.fire('panstart', event)
  }

  onTouchMove(event: MouseEvent | TouchEvent) {
    if (event.type === 'mousemove' && (!this.touchStartX || this.touchEndX !== null)) {
      return
    }
    const touchMoveX =
      (event.type === 'mousemove' ? (event as MouseEvent).screenX : (event as TouchEvent).changedTouches[0].screenX) -
      (this.touchStartX ?? 0)
    this.velocityX = touchMoveX - (this.touchMoveX ?? 0)
    this.touchMoveX = touchMoveX
    const touchMoveY =
      (event.type === 'mousemove' ? (event as MouseEvent).screenY : (event as TouchEvent).changedTouches[0].screenY) -
      (this.touchStartY ?? 0)
    this.velocityY = touchMoveY - (this.touchMoveY ?? 0)
    this.touchMoveY = touchMoveY
    const absTouchMoveX = Math.abs(this.touchMoveX)
    const absTouchMoveY = Math.abs(this.touchMoveY)
    this.swipingHorizontal = absTouchMoveX > this.thresholdX
    this.swipingVertical = absTouchMoveY > this.thresholdY
    this.swipingDirection =
      absTouchMoveX > absTouchMoveY
        ? this.swipingHorizontal
          ? 'horizontal'
          : 'pre-horizontal'
        : this.swipingVertical
        ? 'vertical'
        : 'pre-vertical'
    if (Math.max(absTouchMoveX, absTouchMoveY) > this.opts.pressThreshold) {
      clearTimeout(this.longPressTimer ?? undefined)
    }
    this.fire('panmove', event)
  }

  onTouchEnd(event: MouseEvent | TouchEvent) {
    if (event.type === 'mouseup' && (!this.touchStartX || this.touchEndX !== null)) {
      return
    }
    this.touchEndX =
      event.type === 'mouseup' ? (event as MouseEvent).screenX : (event as TouchEvent).changedTouches[0].screenX
    this.touchEndY =
      event.type === 'mouseup' ? (event as MouseEvent).screenY : (event as TouchEvent).changedTouches[0].screenY
    this.fire('panend', event)
    clearTimeout(this.longPressTimer ?? undefined)

    const x = this.touchEndX - (this.touchStartX ?? 0)
    const absX = Math.abs(x)
    const y = this.touchEndY - (this.touchStartY ?? 0)
    const absY = Math.abs(y)

    if (absX > this.thresholdX || absY > this.thresholdY) {
      this.swipedHorizontal = this.opts.diagonalSwipes
        ? Math.abs(x / y) <= this.opts.diagonalLimit
        : absX >= absY && absX > this.thresholdX
      this.swipedVertical = this.opts.diagonalSwipes
        ? Math.abs(y / x) <= this.opts.diagonalLimit
        : absY > absX && absY > this.thresholdY
      if (this.swipedHorizontal) {
        if (x < 0) {
          // Left swipe.
          if ((this.velocityX ?? 0) < -this.opts.velocityThreshold || x < -this.disregardVelocityThresholdX) {
            this.fire('swipeleft', event)
          }
        } else {
          // Right swipe.
          if ((this.velocityX ?? 0) > this.opts.velocityThreshold || x > this.disregardVelocityThresholdX) {
            this.fire('swiperight', event)
          }
        }
      }
      if (this.swipedVertical) {
        if (y < 0) {
          // Upward swipe.
          if ((this.velocityY ?? 0) < -this.opts.velocityThreshold || y < -this.disregardVelocityThresholdY) {
            this.fire('swipeup', event)
          }
        } else {
          // Downward swipe.
          if ((this.velocityY ?? 0) > this.opts.velocityThreshold || y > this.disregardVelocityThresholdY) {
            this.fire('swipedown', event)
          }
        }
      }
    } else if (absX < this.opts.pressThreshold && absY < this.opts.pressThreshold) {
      // Tap.
      if (this.doubleTapWaiting) {
        this.doubleTapWaiting = false
        clearTimeout(this.doubleTapTimer ?? undefined)
        this.fire('doubletap', event)
      } else {
        this.doubleTapWaiting = true
        this.doubleTapTimer = window.setTimeout(() => (this.doubleTapWaiting = false), this.opts.doubleTapTime)
        this.fire('tap', event)
      }
    }
  }

  static defaults: Options<HTMLElement> = {
    threshold: (type, _self) =>
      Math.max(
        25,
        Math.floor(
          0.15 *
            (type === 'x'
              ? window.innerWidth || document.body.clientWidth
              : window.innerHeight || document.body.clientHeight),
        ),
      ),
    velocityThreshold: 10,
    disregardVelocityThreshold: (type, self: TinyGesture) =>
      Math.floor(0.5 * (type === 'x' ? self.element.clientWidth : self.element.clientHeight)),
    pressThreshold: 8,
    diagonalSwipes: false,
    diagonalLimit: Math.tan(((45 * 1.5) / 180) * Math.PI),
    longPressTime: 500,
    doubleTapTime: 300,
    mouseSupport: true,
  }
}

export interface Options<Element extends HTMLElement = HTMLElement> {
  diagonalLimit: number
  diagonalSwipes: boolean
  doubleTapTime: number
  disregardVelocityThreshold(type: 'x' | 'y', self: TinyGesture<Element>): number
  longPressTime: number
  mouseSupport: boolean
  pressThreshold: number
  threshold(type: 'x' | 'y', self: TinyGesture<Element>): number
  velocityThreshold: number
}

export interface Events {
  doubletap: MouseEvent | TouchEvent
  longpress: MouseEvent | TouchEvent
  panend: MouseEvent | TouchEvent
  panmove: MouseEvent | TouchEvent
  panstart: MouseEvent | TouchEvent
  swipedown: MouseEvent | TouchEvent
  swipeleft: MouseEvent | TouchEvent
  swiperight: MouseEvent | TouchEvent
  swipeup: MouseEvent | TouchEvent
  tap: MouseEvent | TouchEvent
}

export type Handler<E> = (event: E) => void
export type Handlers = {
  [E in keyof Events]: Handler<Events[E]>[]
}

export type SwipingDirection = 'horizontal' | 'pre-horizontal' | 'vertical' | 'pre-vertical'

// Passive feature detection.
let passiveIfSupported: false | { passive: true } = false

try {
  window.addEventListener(
    'test',
    null as any,
    Object.defineProperty({}, 'passive', {
      get: function () {
        passiveIfSupported = { passive: true }
      },
    }),
  )
} catch (err) {
  /* empty */
}
