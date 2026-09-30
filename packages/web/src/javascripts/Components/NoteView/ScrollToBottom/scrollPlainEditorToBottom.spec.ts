/**
 * @jest-environment jsdom
 */

import type { PlainEditorInterface } from '../PlainEditor/PlainEditor'
import { scrollPlainEditorToBottom } from './scrollPlainEditorToBottom'

describe('scrollPlainEditorToBottom', () => {
  it('delegates to plainEditor.scrollToEnd', () => {
    const scrollToEnd = jest.fn(() => true)
    const plainEditor = { scrollToEnd } as Pick<PlainEditorInterface, 'scrollToEnd'> as PlainEditorInterface

    expect(scrollPlainEditorToBottom(plainEditor)).toBe(true)
    expect(scrollToEnd).toHaveBeenCalledTimes(1)
  })
})
