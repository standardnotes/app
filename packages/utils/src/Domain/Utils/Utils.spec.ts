import * as DOMPurifyLib from 'dompurify'
import { JSDOM } from 'jsdom'
import { sortByKey, withoutLastElement } from './Utils'

const window = new JSDOM('').window
const DOMPurify = DOMPurifyLib(window as never)

describe('Utils', () => {
  it('sanitizeHtmlString', () => {
    const dirty = '<svg><animate onbegin=alert(1) attributeName=x dur=1s>'
    const cleaned = DOMPurify.sanitize(dirty)
    expect(cleaned).toEqual('<svg></svg>')
  })

  it('without last works', () => {
    expect(withoutLastElement([])).toEqual([])
    expect(withoutLastElement(['a'])).toEqual([])
    expect(withoutLastElement(['a', 'b'])).toEqual(['a'])
    expect(withoutLastElement(['a', 'b', 'c'])).toEqual(['a', 'b'])
  })

  const sortByKey_INPUT = [
    { id: 'aza', age: 0, missing: 7 },
    { id: 'aaa', age: 12, missing: 8 },
    { id: 'ace', age: 12, missing: 0 },
    { id: 'zzz', age: -9 },
  ]

  it('sortByKey sort by key', () => {
    const input = sortByKey_INPUT

    expect(sortByKey(input, 'id')).toEqual([
      { id: 'aaa', age: 12, missing: 8 },
      { id: 'ace', age: 12, missing: 0 },
      { id: 'aza', age: 0, missing: 7 },
      { id: 'zzz', age: -9 },
    ])

    expect(sortByKey(input, 'age')).toEqual([
      { id: 'zzz', age: -9 },
      { id: 'aza', age: 0, missing: 7 },
      { id: 'aaa', age: 12, missing: 8 },
      { id: 'ace', age: 12, missing: 0 },
    ])

    expect(sortByKey(input, 'missing')).toEqual([
      { id: 'ace', age: 12, missing: 0 },
      { id: 'aza', age: 0, missing: 7 },
      { id: 'aaa', age: 12, missing: 8 },
      { id: 'zzz', age: -9 },
    ])
  })

  it('sortByKey does not mutate the input & creates a new array', () => {
    const input = sortByKey_INPUT
    const initial = [...input]

    expect(sortByKey(input, 'id')).not.toBe(input)
    expect(initial).toEqual(input)
  })
})
