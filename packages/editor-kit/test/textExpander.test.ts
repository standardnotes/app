import TextExpander from './../src/textExpander'

const patterns = [
  {
    regex: /text/gi,
    callback: jest.fn((matchedText) => matchedText)
  }
]

const beforeExpand = jest.fn()
const afterExpand = jest.fn()

const getCurrentLineText = jest.fn(() => 'Another line of text.')
const getPreviousLineText = jest.fn(() => 'A line of text.')

const replaceText = jest.fn(({ _regex, _replacement, _searchPreviousLine }) => {
  return 'replaceText'
})

describe('TextExpander', () => {
  let textExpander: TextExpander

  beforeEach(() => {
    textExpander = new TextExpander({
      patterns,
      beforeExpand,
      afterExpand,
      getCurrentLineText,
      getPreviousLineText,
      replaceText
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('new Instance', () => {
    expect(textExpander).toBeDefined()
  })

  it('should not call any of the passed callbacks', () => {
    expect(beforeExpand).not.toBeCalled()
    expect(afterExpand).not.toBeCalled()
    expect(getCurrentLineText).not.toBeCalled()
    expect(getPreviousLineText).not.toBeCalled()
    expect(replaceText).not.toBeCalled()
  })

  describe('onKeyUp', () => {
    let searchPatterns
    
    beforeEach(() => {
      searchPatterns = jest.spyOn(textExpander, 'searchPatterns')
    })

    test('when isEnter is true', () => {
      textExpander.onKeyUp({
        isEnter: true
      })
      expect(searchPatterns).toBeCalledTimes(1)
      expect(searchPatterns).toBeCalledWith({ searchPreviousLine: true })
    })

    test('when isPaste is true', () => {
      textExpander.onKeyUp({
        isSpace: true
      })
      expect(searchPatterns).toBeCalledTimes(1)
      expect(searchPatterns).toBeCalledWith({ searchPreviousLine: false })
    })

    test('when isSpace is true', () => {
      textExpander.onKeyUp({
        isSpace: true
      })
      expect(searchPatterns).toBeCalledTimes(1)
      expect(searchPatterns).toBeCalledWith({ searchPreviousLine: false })
    })
  })

  describe('searchPatterns', () => {
    it('should call getPreviousLineText() when searchPreviousLine is true', () => {
      textExpander.searchPatterns({ searchPreviousLine: true })
      expect(getPreviousLineText).toBeCalledTimes(1)
      expect(getCurrentLineText).not.toBeCalled()
    })

    it('should call getCurrentLineText() when searchPreviousLine is false', () => {
      textExpander.searchPatterns({ searchPreviousLine: false })
      expect(getCurrentLineText).toBeCalledTimes(1)
      expect(getPreviousLineText).not.toBeCalled()
    })
  })
})
