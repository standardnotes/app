/**
 * @jest-environment jsdom
 */

import {
  DEFAULT_SCROLL_BOTTOM_THRESHOLD,
  isScrolledToBottom,
  hasVerticalOverflow,
  observeElementScrollState,
} from './isScrolledToBottom'

describe('isScrolledToBottom', () => {
  it('returns true when scrollTop reaches the bottom within the threshold', () => {
    const element = document.createElement('div')
    Object.defineProperty(element, 'scrollHeight', { value: 1000, configurable: true })
    Object.defineProperty(element, 'clientHeight', { value: 200, configurable: true })
    element.scrollTop = 800 - DEFAULT_SCROLL_BOTTOM_THRESHOLD

    expect(isScrolledToBottom(element)).toBe(true)
  })

  it('returns false when not near the bottom', () => {
    const element = document.createElement('div')
    Object.defineProperty(element, 'scrollHeight', { value: 1000, configurable: true })
    Object.defineProperty(element, 'clientHeight', { value: 200, configurable: true })
    element.scrollTop = 0

    expect(isScrolledToBottom(element)).toBe(false)
  })

  it('respects a custom threshold', () => {
    const element = document.createElement('div')
    Object.defineProperty(element, 'scrollHeight', { value: 500, configurable: true })
    Object.defineProperty(element, 'clientHeight', { value: 100, configurable: true })
    element.scrollTop = 350

    expect(isScrolledToBottom(element, 50)).toBe(true)
    expect(isScrolledToBottom(element, 10)).toBe(false)
  })
})

describe('hasVerticalOverflow', () => {
  it('returns true when content exceeds the viewport', () => {
    const element = document.createElement('div')
    Object.defineProperty(element, 'scrollHeight', { value: 500, configurable: true })
    Object.defineProperty(element, 'clientHeight', { value: 200, configurable: true })

    expect(hasVerticalOverflow(element)).toBe(true)
  })

  it('returns false when content fits in the viewport', () => {
    const element = document.createElement('div')
    Object.defineProperty(element, 'scrollHeight', { value: 200, configurable: true })
    Object.defineProperty(element, 'clientHeight', { value: 200, configurable: true })

    expect(hasVerticalOverflow(element)).toBe(false)
  })
})

describe('observeElementScrollState', () => {
  const originalResizeObserver = window.ResizeObserver
  const disconnect = jest.fn()

  beforeEach(() => {
    window.ResizeObserver = jest.fn().mockImplementation(() => ({ observe: jest.fn(), disconnect }))
  })

  afterEach(() => {
    window.ResizeObserver = originalResizeObserver
    disconnect.mockClear()
  })

  function createElement() {
    const element = document.createElement('div')
    Object.defineProperty(element, 'scrollHeight', { value: 1000, configurable: true })
    Object.defineProperty(element, 'clientHeight', { value: 200, configurable: true })
    return element
  }

  it('reports the state immediately, on scroll, and on content change', () => {
    const element = createElement()
    let notifyContentChange: () => void = () => undefined
    const callback = jest.fn()

    observeElementScrollState(
      element,
      (onChange) => {
        notifyContentChange = onChange
        return () => undefined
      },
      callback,
    )
    expect(callback).toHaveBeenLastCalledWith({ canScroll: true, isAtBottom: false })

    element.scrollTop = 800
    element.dispatchEvent(new Event('scroll'))
    expect(callback).toHaveBeenLastCalledWith({ canScroll: true, isAtBottom: true })

    Object.defineProperty(element, 'scrollHeight', { value: 2000, configurable: true })
    notifyContentChange()
    expect(callback).toHaveBeenLastCalledWith({ canScroll: true, isAtBottom: false })
  })

  it('stops reporting after disposal', () => {
    const element = createElement()
    const disposeContentChange = jest.fn()
    const callback = jest.fn()

    const dispose = observeElementScrollState(element, () => disposeContentChange, callback)
    dispose()
    callback.mockClear()

    element.dispatchEvent(new Event('scroll'))

    expect(callback).not.toHaveBeenCalled()
    expect(disconnect).toHaveBeenCalled()
    expect(disposeContentChange).toHaveBeenCalled()
  })
})
