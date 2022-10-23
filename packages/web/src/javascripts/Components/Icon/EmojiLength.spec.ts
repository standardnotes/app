/**
 * @jest-environment jsdom
 */

import { getEmojiLength } from './EmojiLength'

describe('emoji length', () => {
  it('returns the correct length', () => {
    expect(getEmojiLength('✍️')).toEqual(1)
    expect(getEmojiLength('👩‍👩‍👧‍👦')).toEqual(1)
    expect(getEmojiLength('👩‍❤️‍💋‍👩')).toEqual(1)
  })
})
