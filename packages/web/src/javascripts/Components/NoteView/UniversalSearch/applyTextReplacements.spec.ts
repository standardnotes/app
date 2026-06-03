import { applyTextReplacements } from './applyTextReplacements'

describe('applyTextReplacements', () => {
  it('returns the original text when there are no ranges', () => {
    expect(applyTextReplacements('hello world', [], 'bye')).toBe('hello world')
  })

  it('replaces multiple matches in one pass', () => {
    const result = applyTextReplacements(
      'hello hello',
      [
        { start: 0, end: 5 },
        { start: 6, end: 11 },
      ],
      'bye',
    )

    expect(result).toBe('bye bye')
  })

  it('handles replacements with different lengths', () => {
    const result = applyTextReplacements(
      'aa aa',
      [
        { start: 0, end: 2 },
        { start: 3, end: 5 },
      ],
      'b',
    )

    expect(result).toBe('b b')
  })
})
