import {
  htmlToText,
  sleep,
  truncateString,
} from './../src/utils'

describe('Utils', () => {
  describe('htmlToText', () => {
    it('should extract text from html string', () => {
      let htmlString = '<div><p>This is a test.</p></div>'
      let textResult = htmlToText(htmlString)
      expect(textResult).toEqual('This is a test.')

      htmlString = '<custom-element>Testing.</custom-element>'
      textResult = htmlToText(htmlString)
      expect(textResult).toEqual('Testing.')
    })

    it('should return an empty string is no text is found', () => {
      const htmlString = '<span></span>'
      const textResult = htmlToText(htmlString)
      expect(textResult).toEqual('')
    })
  })

  describe('truncateString', () => {
    it('should truncate a text up to the defined limit', () => {
      const text = 'This is a simple test. It should not be truncated.'
      const textResult = truncateString(text, 21)
      expect(textResult).toBe('This is a simple test...')
    })

    it('should return the same text if the text length is less than or equal to the defined limit', () => {
      const text = 'This is a simple test. It should not be truncated.'
      const textResult = truncateString(text, text.length + 10)
      expect(textResult).toBe('This is a simple test. It should not be truncated.')
    })
  })

  describe('sleep', () => {
    it('should wait for the specified time', () => {
      jest.useFakeTimers()

      sleep(2)

      jest.runAllTimers()

      expect(setTimeout).toHaveBeenCalledTimes(1)
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 2000)
    })
  })
})
