/**
 * @jest-environment jsdom
 */

import { DEFAULT_SCROLL_BOTTOM_THRESHOLD, isScrolledToBottom, hasVerticalOverflow } from './isScrolledToBottom'

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
