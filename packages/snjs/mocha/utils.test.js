
chai.use(chaiAsPromised)
const expect = chai.expect

describe('utils', () => {
  it('findInArray', async () => {
    expect(findInArray).to.be.ok
    const array = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]
    expect(findInArray(array, 'id', 1)).to.be.ok
    expect(findInArray(array, 'id', 'foo')).to.not.be.ok
  })

  it('isNullOrUndefined', () => {
    expect(isNullOrUndefined(null)).to.equal(true)
    expect(isNullOrUndefined(undefined)).to.equal(true)
    expect(isNullOrUndefined(1)).to.equal(false)
    expect(isNullOrUndefined('foo')).to.equal(false)
    expect(isNullOrUndefined({})).to.equal(false)
    expect(isNullOrUndefined([null])).to.equal(false)
  })

  it('isValidUrl', () => {
    expect(isValidUrl('http://foo.com')).to.equal(true)
    expect(isValidUrl('https://foo.com')).to.equal(true)
    expect(isValidUrl('http://localhost:3000')).to.equal(true)
    expect(isValidUrl('http://localhost:3000/foo/bar')).to.equal(true)
    expect(isValidUrl('http://192.168.1:3000/foo/bar')).to.equal(true)
    expect(isValidUrl('://foo.com')).to.equal(false)
    expect(isValidUrl('{foo}/foo/com')).to.equal(false)
    expect(isValidUrl('foo.com')).to.equal(false)
    expect(isValidUrl('www.foo.com')).to.equal(false)
  })

  it('extendArray', () => {
    const array = [1, 2, 3]
    const original = array.slice()
    const extended = [4, 5, 6]
    extendArray(array, extended)
    expect(array).to.eql(original.concat(extended))
  })

  it('arraysEqual', () => {
    expect(arraysEqual([1, 2, 3], [3, 2, 1])).to.equal(true)
    expect(arraysEqual([2, 3], [3, 2, 1])).to.equal(false)
    expect(arraysEqual([1, 2], [1, 2, 2])).to.equal(false)
    expect(arraysEqual([1, 2, 3], [2, 3, 1])).to.equal(true)
    expect(arraysEqual([1], [3])).to.equal(false)
  })

  it('top level compare', () => {
    const left = { a: 1, b: 2 }
    const right = { a: 1, b: 2 }
    const middle = { a: 2, b: 1 }
    expect(topLevelCompare(left, right)).to.equal(true)
    expect(topLevelCompare(right, left)).to.equal(true)
    expect(topLevelCompare(left, middle)).to.equal(false)
    expect(topLevelCompare(middle, right)).to.equal(false)
  })

  it('jsonParseEmbeddedKeys', () => {
    const object = {
      a: { foo: 'bar' },
      b: JSON.stringify({ foo: 'bar' }),
    }
    const parsed = jsonParseEmbeddedKeys(object)
    expect(typeof parsed.a).to.equal('object')
    expect(typeof parsed.b).to.equal('object')
  })

  it('omitUndefined', () => {
    const object = {
      foo: '123',
      bar: undefined,
    }
    const omitted = omitUndefinedCopy(object)
    expect(Object.keys(omitted).includes('bar')).to.equal(false)
  })

  it('dateSorted', () => {
    const objects = [{ date: new Date(10) }, { date: new Date(5) }, { date: new Date(7) }]

    /** ascending */
    const ascending = dateSorted(objects, 'date', true)
    expect(ascending[0].date.getTime()).to.equal(5)
    expect(ascending[1].date.getTime()).to.equal(7)
    expect(ascending[2].date.getTime()).to.equal(10)

    /** descending */
    const descending = dateSorted(objects, 'date', false)
    expect(descending[0].date.getTime()).to.equal(10)
    expect(descending[1].date.getTime()).to.equal(7)
    expect(descending[2].date.getTime()).to.equal(5)
  })

  describe('subtractFromArray', () => {
    it('Removes all items appearing in the array', () => {
      const array = [1, 2, 3, 4, 5]
      subtractFromArray(array, [1, 3, 5])
      expect(array).to.eql([2, 4])
    })

    it('Ignores items not appearing in the array', () => {
      const array = [1, 2, 3, 4, 5]
      subtractFromArray(array, [0, 1, 3, 5])
      expect(array).to.eql([2, 4])
    })
  })

  describe('removeFromArray', () => {
    it('Removes the first item appearing in the array', () => {
      const array = [1, 1, 2, 3]
      removeFromArray(array, 1)
      expect(array).to.eql([1, 2, 3])
      removeFromArray(array, 2)
      expect(array).to.eql([1, 3])
    })

    it('Ignores items not appearing in the array', () => {
      const array = [1, 2, 3]
      removeFromArray(array, 0)
      expect(array).to.eql([1, 2, 3])
      removeFromArray(array, {})
    })
  })

  it('removeFromIndex', () => {
    const array = [1, 2, 3]
    removeFromIndex(array, 1)
    expect(array).to.eql([1, 3])
  })

  it('arrayByDifference', () => {
    const array = [1, 2, 3, 4]
    const array2 = [2, 3]
    const result = arrayByDifference(array, array2)
    expect(result).to.eql([1, 4])
  })

  it('uniqCombineObjArrays', () => {
    const arrayA = [{ a: 'a', b: 'a' }]
    const arrayB = [
      { a: 'a', b: 'a' },
      { a: '2', b: '2' },
    ]

    const result = uniqCombineObjArrays(arrayA, arrayB, ['a', 'b'])
    expect(result.length).to.equal(2)
  })

  it('uniqueArrayByKey', () => {
    const arrayA = [{ uuid: 1 }, { uuid: 2 }]
    const arrayB = [{ uuid: 1 }, { uuid: 2 }, { uuid: 1 }, { uuid: 2 }]

    const result = uniqueArrayByKey(arrayA.concat(arrayB), ['uuid'])
    expect(result.length).to.equal(2)
  })

  it('filterFromArray function predicate', () => {
    const array = [{ uuid: 1 }, { uuid: 2 }, { uuid: 3 }]

    filterFromArray(array, (o) => o.uuid === 1)
    expect(array.length).to.equal(2)
  })

  it('lodash merge should behave as expected', () => {
    const a = {
      content: {
        references: [{ a: 'a' }],
      },
    }
    const b = {
      content: {
        references: [],
      },
    }
    // merging a with b should replace total content
    deepMerge(a, b)
    expect(a.content.references).to.eql([])
  })

  it('truncates hex string', () => {
    const hex256 = 'f0e4c2f76c58916ec258f246851bea091d14d4247a2fc3e18694461b1816e13b'
    const desiredBits = 128
    const expectedLength = 32
    const result = truncateHexString(hex256, desiredBits)
    expect(result.length).to.equal(expectedLength)
  })

  it('convertTimestampToMilliseconds', () => {
    expect(convertTimestampToMilliseconds(1633636950)).to.equal(1633636950000)
    expect(convertTimestampToMilliseconds(1633636950123)).to.equal(1633636950123)
    expect(convertTimestampToMilliseconds(1633636950123456)).to.equal(1633636950123)
  })

  describe('isSameDay', () => {
    it('returns true if two dates are on the same day', () => {
      const dateA = new Date(2021, 1, 16, 16, 30, 0)
      const dateB = new Date(2021, 1, 16, 17, 30, 0)

      const result = isSameDay(dateA, dateB)
      expect(result).to.equal(true)
    })

    it('returns false if two dates are not on the same day', () => {
      const dateA = new Date(2021, 1, 16, 16, 30, 0)
      const dateB = new Date(2021, 1, 17, 17, 30, 0)

      const result = isSameDay(dateA, dateB)
      expect(result).to.equal(false)
    })
  })

  describe('naturalSort', () => {
    let items
    beforeEach(() => {
      items = [
        {
          someProperty: 'a',
        },
        {
          someProperty: 'b',
        },
        {
          someProperty: '2',
        },
        {
          someProperty: 'A',
        },
        {
          someProperty: '1',
        },
      ]
    })

    it('sorts elements in natural order in ascending direction by default', () => {
      const result = naturalSort(items, 'someProperty')
      expect(result).lengthOf(items.length)
      expect(result[0]).to.equal(items[4])
      expect(result[1]).to.equal(items[2])
      expect(result[2]).to.equal(items[0])
      expect(result[3]).to.equal(items[3])
      expect(result[4]).to.equal(items[1])
    })

    it('sorts elements in natural order in descending direction', () => {
      const result = naturalSort(items, 'someProperty', 'desc')
      expect(result).lengthOf(items.length)
      expect(result[0]).to.equal(items[1])
      expect(result[1]).to.equal(items[3])
      expect(result[2]).to.equal(items[0])
      expect(result[3]).to.equal(items[2])
      expect(result[4]).to.equal(items[4])
    })
  })
})
