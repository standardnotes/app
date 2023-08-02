import * as DOMPurifyLib from 'dompurify'
import { JSDOM } from 'jsdom'
import { sortByKey, withoutLastElement, compareArrayReferences } from './Utils'

const window = new JSDOM('').window
const DOMPurify = DOMPurifyLib(window as never)

describe('Utils', () => {
  describe('compareArrayReferences', () => {
    it('should return true when both arrays are empty', () => {
      expect(compareArrayReferences([], [])).toBe(true)
    })

    it('should return true when both arrays have the same reference', () => {
      const obj = {}
      expect(compareArrayReferences([obj], [obj])).toBe(true)
    })

    it('should return false when arrays have different lengths', () => {
      const obj1 = {}
      const obj2 = {}
      expect(compareArrayReferences([obj1], [obj1, obj2])).toBe(false)
    })

    it('should return false when arrays have the same length but different references', () => {
      const obj1 = {}
      const obj2 = {}
      expect(compareArrayReferences([obj1], [obj2])).toBe(false)
    })

    it('should return true when arrays have multiple identical references', () => {
      const obj1 = {}
      const obj2 = {}
      expect(compareArrayReferences([obj1, obj2], [obj1, obj2])).toBe(true)
    })

    it('should return false when arrays have the same references in different order', () => {
      const obj1 = {}
      const obj2 = {}
      expect(compareArrayReferences([obj1, obj2], [obj2, obj1])).toBe(false)
    })
  })

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
