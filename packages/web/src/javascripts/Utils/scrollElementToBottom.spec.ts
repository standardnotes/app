/**
 * @jest-environment jsdom
 */

import { scrollElementToBottom } from './scrollElementToBottom'

function createScrollableElement(scrollTop: number): HTMLElement {
  const element = document.createElement('div')
  Object.defineProperty(element, 'scrollHeight', { value: 1000, configurable: true })
  Object.defineProperty(element, 'clientHeight', { value: 200, configurable: true })
  element.scrollTop = scrollTop
  element.scrollTo = jest.fn()
  return element
}

describe('scrollElementToBottom', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('smooth scrolls to the bottom and calls back once on scrollend', () => {
    const element = createScrollableElement(0)
    const onScrollEnd = jest.fn()

    scrollElementToBottom(element, onScrollEnd)

    expect(element.scrollTo).toHaveBeenCalledWith({ top: 800, behavior: 'smooth' })
    expect(onScrollEnd).not.toHaveBeenCalled()

    element.dispatchEvent(new Event('scrollend'))
    jest.runAllTimers()

    expect(onScrollEnd).toHaveBeenCalledTimes(1)
  })

  it('calls back after the fallback delay when scrollend never fires', () => {
    const element = createScrollableElement(0)
    const onScrollEnd = jest.fn()

    scrollElementToBottom(element, onScrollEnd)
    jest.runAllTimers()

    expect(onScrollEnd).toHaveBeenCalledTimes(1)
  })

  it('calls back immediately when already at the bottom', () => {
    const element = createScrollableElement(800)
    const onScrollEnd = jest.fn()

    scrollElementToBottom(element, onScrollEnd)

    expect(element.scrollTo).not.toHaveBeenCalled()
    expect(onScrollEnd).toHaveBeenCalledTimes(1)
  })

  it('jumps instantly when the user prefers reduced motion', () => {
    const originalMatchMedia = window.matchMedia
    window.matchMedia = jest.fn().mockReturnValue({ matches: true })

    const element = createScrollableElement(0)
    const onScrollEnd = jest.fn()

    scrollElementToBottom(element, onScrollEnd)

    expect(element.scrollTo).not.toHaveBeenCalled()
    expect(element.scrollTop).toBe(800)
    expect(onScrollEnd).toHaveBeenCalledTimes(1)

    window.matchMedia = originalMatchMedia
  })
})
