import {
  FileSafeSyntaxPattern,
  expandedFileSafeSyntax,
  fileSafeSyntaxToHtmlElement,
  removeFileSafeSyntaxFromHtml,
  insertionSyntaxForFileDescriptor,
  FileSafeFileMetadata,
  collapseFileSafeSyntax
} from './../src/fileSafeHtml'

const htmlString = '<p>This is a test.</p>' +
        '<p>[FileSafe:abc1xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:Test file.txt]</p>' +
        '<p>This is another test.</p>' +
        '<p>[filesafe:abc2xxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:Test file.txt]</p>' +
        '<p>[Filesafe:abc3xxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:Test file.txt]</p>' +
        '<p>[fileSafe:abc3xxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:Test file.txt]</p>'

describe('FileSafeHtml', () => {
  describe('FileSafeSyntaxPattern', () => {
    it('should match [FileSafe] syntax', () => {
      const results = htmlString.match(FileSafeSyntaxPattern)
      expect(results.length).toBe(1)
      expect(results[0]).toBe('<p>[FileSafe:abc1xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:Test file.txt]</p>')
    })
  })

  describe('expandedFileSafeSyntax', () => {
    it('should convert valid matches to ghost <p> tags', () => {
      const result = expandedFileSafeSyntax(htmlString)
      const domElement = document.createElement('html')
      domElement.innerHTML = result

      const ghostElements = domElement.querySelectorAll('p[fsid=abc1xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx]')
      expect(ghostElements.length).toBe(1)

      // Should include the rest of p tags.
      const allElements = domElement.querySelectorAll('p')
      expect(allElements.length).toBe(6)
    })
  })

  describe('fileSafeSyntaxToHtmlElement', () => {
    it('should return HTML string', () => {
      const result = fileSafeSyntaxToHtmlElement('<p>[FileSafe:abc4xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:Test file.txt]</p>')
      const domElement = document.createElement('html')
      domElement.innerHTML = result

      const ghostElements = domElement.getElementsByTagName('p')
      expect(ghostElements.length).toBe(1)

      const firstElement = ghostElements[0]
      expect(firstElement.getAttribute('fsid')).toBe('abc4xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx')
      expect(firstElement.getAttribute('fsname')).toBe('Test file.txt')
      expect(firstElement.getAttribute('fscollapsable')).toBe('true')
      expect(firstElement.getAttribute('ghost')).toBe('true')
      expect(firstElement.getAttribute('style')).toBe('display: none;')
    })

    it('should set width and height if present', () => {
      const result = fileSafeSyntaxToHtmlElement('<p>[FileSafe:abc5xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:Test file.png:100x150]</p>')
      const domElement = document.createElement('html')
      domElement.innerHTML = result

      const ghostElements = domElement.getElementsByTagName('p')
      expect(ghostElements.length).toBe(1)

      const firstElement = ghostElements[0]
      expect(firstElement.getAttribute('fsid')).toBe('abc5xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx')
      expect(firstElement.getAttribute('fsname')).toBe('Test file.png')
      expect(firstElement.getAttribute('fscollapsable')).toBe('true')
      expect(firstElement.getAttribute('ghost')).toBe('true')
      expect(firstElement.getAttribute('style')).toBe('display: none;')
      expect(firstElement.getAttribute('width')).toBe('100')
      expect(firstElement.getAttribute('height')).toBe('150')
    })
  })

  describe('collapseFileSafeSyntax', () => {
    it('should collapse syntax that is already expanded', () => {
      const initialHtmlString = '<p>[FileSafe:abc5xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:Test file.png:100x150]</p>'
      const expandedHtmlString = expandedFileSafeSyntax(initialHtmlString)
      const collapsedHtmlString = collapseFileSafeSyntax(expandedHtmlString)
      expect(collapsedHtmlString).toBe(initialHtmlString)
    })

    it('should remove remaining ghost elements', () => {
      const collapsedHtmlString = collapseFileSafeSyntax('<p ghost=true>Ghost element</p>')
      expect(collapsedHtmlString).toBe('')
    })
  })

  describe('removeFileSafeSyntaxFromHtml', () => {
    it('should remove all valid [FileSafe] syntax from HTML string', () => {
      const result = removeFileSafeSyntaxFromHtml(htmlString)

      const expectedResult = '<p>This is a test.</p>' +
      '<p>This is another test.</p>' +
      '<p>[filesafe:abc2xxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:Test file.txt]</p>' +
      '<p>[Filesafe:abc3xxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:Test file.txt]</p>' +
      '<p>[fileSafe:abc3xxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:Test file.txt]</p>'
      expect(result).toBe(expectedResult)
    })
  })

  describe('insertionSyntaxForFileDescriptor', () => {
    it('should create a new syntax from a file descriptor', () => {
      const fileDescriptor: FileSafeFileMetadata = {
        uuid: 'abc6xxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        content: {
          fileName: 'Test file.md'
        }
      }
      const result = insertionSyntaxForFileDescriptor(fileDescriptor)
      expect(result).toBe('[FileSafe:abc6xxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:Test file.md]')
    })
  })
})
