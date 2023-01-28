/**
 * MIT License

Copyright (c) 2018-Present Atanas Atanasov

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

export const enum TouchSwipeEventType {
  up = 'swipeup',
  tap = 'tap',
  down = 'swipedown',
  move = 'swipemove',
  left = 'swipeleft',
  right = 'swiperight',
}

export type TouchSwipeCoordinateType = 'startX' | 'startY' | 'moveX' | 'moveY' | 'endX' | 'endY'

export type TouchSwipeCoordinates = Record<'x' | 'y', number>

const defaultCoordinates = {
  endX: 0,
  endY: 0,
  moveX: 0,
  moveY: 0,
  startX: 0,
  startY: 0,
}

export default class TouchSweep {
  public eventData: Record<string, unknown>

  private element: HTMLElement
  private threshold: number

  private coords: Record<TouchSwipeCoordinateType, number>
  private isMoving: boolean
  private moveCoords: TouchSwipeCoordinates

  constructor(element = document.body, data = {}, threshold = 40) {
    this.element = element
    this.eventData = data
    this.threshold = threshold

    this.coords = defaultCoordinates
    this.isMoving = false
    this.moveCoords = { x: 0, y: 0 }

    this.onStart = this.onStart.bind(this)
    this.onMove = this.onMove.bind(this)
    this.onEnd = this.onEnd.bind(this)

    this.bind()

    // eslint-disable-next-line no-constructor-return
    return this
  }

  public bind(): void {
    const { element } = this

    element.addEventListener('touchstart', this.onStart, false)
    element.addEventListener('touchmove', this.onMove, false)
    element.addEventListener('touchend', this.onEnd, false)
    element.addEventListener('mousedown', this.onStart, false)
    element.addEventListener('mousemove', this.onMove, false)
    element.addEventListener('mouseup', this.onEnd, false)
  }

  public unbind(): void {
    const { element } = this

    element.removeEventListener('touchstart', this.onStart, false)
    element.removeEventListener('touchmove', this.onMove, false)
    element.removeEventListener('touchend', this.onEnd, false)
    element.removeEventListener('mousedown', this.onStart, false)
    element.removeEventListener('mousemove', this.onMove, false)
    element.removeEventListener('mouseup', this.onEnd, false)
  }

  private getCoords(event: MouseEvent | TouchEvent): TouchSwipeCoordinates {
    const result = this.moveCoords
    const isMouseEvent = 'pageX' in event

    result.x = isMouseEvent ? event.pageX : event.changedTouches[0].screenX
    result.y = isMouseEvent ? event.pageY : event.changedTouches[0].screenY

    return result
  }

  private resetCoords(): void {
    this.coords = defaultCoordinates
  }

  private getEndEventName(): TouchSwipeEventType | '' {
    const threshold = this.threshold
    const { startX, startY, endX, endY } = this.coords
    const distanceX = Math.abs(endX - startX)
    const distanceY = Math.abs(endY - startY)
    const isSwipeX = distanceX > distanceY

    if (isSwipeX) {
      if (endX < startX && distanceX > threshold) {
        return TouchSwipeEventType.left
      }

      if (endX > startX && distanceX > threshold) {
        return TouchSwipeEventType.right
      }
    } else {
      if (endY < startY && distanceY > threshold) {
        return TouchSwipeEventType.up
      }

      if (endY > startY && distanceY > threshold) {
        return TouchSwipeEventType.down
      }
    }

    if (endY === startY && endX === startX) {
      return TouchSwipeEventType.tap
    }

    return ''
  }

  private dispatchEvent(type: TouchSwipeEventType): void {
    const event = new CustomEvent(type, {
      detail: {
        ...this.eventData,
        coords: this.coords,
      },
    })

    this.element.dispatchEvent(event)
  }

  private dispatchEnd(): void {
    const eventName = this.getEndEventName()

    if (!eventName) {
      return
    }

    this.dispatchEvent(eventName)
  }

  private onStart(event: MouseEvent | TouchEvent): void {
    const { x, y } = this.getCoords(event)

    this.isMoving = true

    this.coords.startX = x
    this.coords.startY = y
  }

  private onMove(event: MouseEvent | TouchEvent): void {
    if (!this.isMoving) {
      return
    }

    const { x, y } = this.getCoords(event)

    this.coords.moveX = x
    this.coords.moveY = y

    this.dispatchEvent(TouchSwipeEventType.move)
  }

  private onEnd(event: MouseEvent | TouchEvent): void {
    const { x, y } = this.getCoords(event)

    this.isMoving = false

    this.coords.endX = x
    this.coords.endY = y

    this.dispatchEnd()
    this.resetCoords()
  }
}
