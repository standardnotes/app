type SwipeDirection = 'left' | 'right'

type SwipeGestureListener = (direction: SwipeDirection) => boolean

/**
 * Handles swipe gestures on the document.
 * Adapted from https://github.com/sciactive/tinygesture
 */
export class SwipeGestureHandler {
  public touchStartX: number | null = null
  public touchStartY: number | null = null
  public touchEndX: number | null = null
  public touchEndY: number | null = null
  public touchMoveX: number | null = null
  public touchMoveY: number | null = null
  public velocityX: number | null = null
  public velocityY: number | null = null

  public thresholdX = window.innerWidth / 2
  public thresholdY = 0
  public disregardVelocityThresholdX = 0
  public disregardVelocityThresholdY = 0

  public swipingHorizontal = false
  public swipedHorizontal = false

  private listeners = new Set<SwipeGestureListener>()

  constructor() {
    window.addEventListener('touchstart', this.onTouchStart, true)
    window.addEventListener('touchmove', this.onTouchMove, true)
    window.addEventListener('touchend', this.onTouchEnd, true)
  }

  deinit = (): void => {
    window.removeEventListener('touchstart', this.onTouchStart, true)
    window.removeEventListener('touchmove', this.onTouchMove, true)
    window.removeEventListener('touchend', this.onTouchEnd, true)
  }

  onTouchStart = (event: TouchEvent): void => {
    this.touchStartX = event.changedTouches[0].screenX
    this.touchStartY = event.changedTouches[0].screenY
    this.touchMoveX = null
    this.touchMoveY = null
    this.touchEndX = null
    this.touchEndY = null
  }

  onTouchMove = (event: TouchEvent): void => {
    const touchMoveX = event.changedTouches[0].screenX - (this.touchStartX ?? 0)
    this.velocityX = touchMoveX - (this.touchMoveX ?? 0)
    this.touchMoveX = touchMoveX
    const touchMoveY = event.changedTouches[0].screenY - (this.touchStartY ?? 0)
    this.velocityY = touchMoveY - (this.touchMoveY ?? 0)
    this.touchMoveY = touchMoveY
    const absTouchMoveX = Math.abs(this.touchMoveX)
    this.swipingHorizontal = absTouchMoveX > this.thresholdX
  }

  onTouchEnd = (event: TouchEvent): void => {
    this.touchEndX = event.changedTouches[0].screenX
    this.touchEndY = event.changedTouches[0].screenY

    const x = this.touchEndX - (this.touchStartX ?? 0)
    const absX = Math.abs(x)
    const y = this.touchEndY - (this.touchStartY ?? 0)
    const absY = Math.abs(y)

    if (absX > this.thresholdX || absY > this.thresholdY) {
      this.swipedHorizontal = absX >= absY && absX > this.thresholdX
      if (this.swipedHorizontal) {
        if (x < 0) {
          if ((this.velocityX ?? 0) < -10 || x < -this.disregardVelocityThresholdX) {
            this.notifySwipeGesture('left')
          }
        } else {
          if ((this.velocityX ?? 0) > 10 || x > this.disregardVelocityThresholdX) {
            this.notifySwipeGesture('right')
          }
        }
      }
    }
  }

  addSwipeGestureListener = (listener: SwipeGestureListener): (() => void) => {
    this.listeners.add(listener)

    return () => {
      this.listeners.delete(listener)
    }
  }

  notifySwipeGesture = (direction: SwipeDirection): void => {
    for (const listener of Array.from(this.listeners).reverse()) {
      if (listener(direction)) {
        return
      }
    }
  }
}
