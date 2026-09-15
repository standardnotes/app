import { findStringMatches } from './findStringMatches'

describe('findStringMatches', () => {
  it('returns non-overlapping matches', () => {
    expect(findStringMatches('aaaa', 'aa', false)).toEqual([
      { start: 0, end: 2 },
      { start: 2, end: 4 },
    ])
    expect(findStringMatches('aaa', 'aa', false)).toEqual([{ start: 0, end: 2 }])
  })

  it('finds multiple matches with optional case sensitivity', () => {
    expect(findStringMatches('Hello hello', 'hello', true)).toEqual([{ start: 6, end: 11 }])
    expect(findStringMatches('Hello hello', 'hello', false)).toEqual([
      { start: 0, end: 5 },
      { start: 6, end: 11 },
    ])
  })

  it('returns an empty array for an empty query', () => {
    expect(findStringMatches('hello', '', false)).toEqual([])
  })
})
