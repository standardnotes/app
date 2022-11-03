import FileLoader from './../src/fileLoader'
import { expandedFileSafeSyntax } from './../src/fileSafeHtml'

const fileSafeInstance = {
  findFileDescriptor: jest.fn((fileSafeId) => {
    return {
      uuid: fileSafeId,
      content: {
        fileType: 'image/png'
      }
    }
  }),
  downloadFileFromDescriptor: jest.fn().mockResolvedValue({}),
  decryptFile: jest.fn().mockResolvedValue({}),
  createTemporaryFileUrl: jest.fn(({ _base64Data, _dataType }) => {
    return 'http://localhost/'
  })
}

const getElementsBySelector = jest.fn().mockImplementation((selector: string) => {
  const results = []
  const htmlString = '<p id="xxxyyy">This is a test.</p>' +
    '<p>[FileSafe:abc1xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:Test file.png]</p>' +
    '<p>This is another test.</p>'

  const expandedHtml = expandedFileSafeSyntax(htmlString)

  const divElement = document.createElement('div')
  divElement.innerHTML = expandedHtml
  divElement.querySelectorAll(selector).forEach((element) => results.push(element))

  return results
})

const preprocessElement = jest.fn((element: Element): Element => {
  return element
})

const insertElement = jest.fn((_element: Element, _inVicinityOfElement: Element | null, _insertionType: string) => {
  return
})

describe('FileLoader', () => {
  let fileLoader: FileLoader

  beforeEach(() => {
    fileLoader = new FileLoader({
      fileSafeInstance,
      getElementsBySelector,
      preprocessElement,
      insertElement
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('new Instance', () => {
    expect(fileLoader).toBeDefined()
  })

  test('fileTypeForElementType', () => {
    expect(fileLoader.fileTypeForElementType('image/png')).toBe('img')
    expect(fileLoader.fileTypeForElementType('image/jpg')).toBe('img')
    expect(fileLoader.fileTypeForElementType('image/jpeg')).toBe('img')
    expect(fileLoader.fileTypeForElementType('image/gif')).toBe('img')
    expect(fileLoader.fileTypeForElementType('image/bmp')).toBe('img')
    expect(fileLoader.fileTypeForElementType('video/mp4')).toBe('video')
    expect(fileLoader.fileTypeForElementType('audio/mpeg')).toBe('audio')
    expect(fileLoader.fileTypeForElementType('audio/mp3')).toBe('audio')
  })

  test('loadFileSafeElements', () => {
    fileLoader.loadFileSafeElements()
    expect(getElementsBySelector).toBeCalledTimes(1)
    expect(getElementsBySelector).toBeCalledWith('*[fsplaceholder]')
  })

  test('loadFileSafeElement', async () => {
    const fsElement = getElementsBySelector('*[fsplaceholder]')[0]
    const loadFileSafeElementResult = await fileLoader.loadFileSafeElement(fsElement)

    const fsid = fsElement.getAttribute('fsid')

    expect(fileLoader['uuidToFileTempUrlAndTypeMapping']).toHaveProperty(fsid)
    expect(fileLoader['uuidToFileTempUrlAndTypeMapping'][fsid]).toEqual({
      fileType: 'image/png',
      url: 'http://localhost/',
      fsName: 'Test file.png'
    })

    expect(loadFileSafeElementResult).toBe(true)
  })

  test('insertStatusAtCursor', () => {
    const insertStatusAtCursorResult = fileLoader.insertStatusAtCursor('Testing')
    expect(insertStatusAtCursorResult).toBeTruthy()
  })

  test('removeCursorStatus', () => {
    fileLoader.removeCursorStatus('xxxyyy')

    expect(getElementsBySelector).toBeCalledTimes(1)
    expect(getElementsBySelector).toBeCalledWith('#xxxyyy')
  })

  describe('insertElementNearElement', () => {
    it('should insert element as a child element', () => {
      const nodeToInsert = getElementsBySelector('*[fsplaceholder]')[0]
      const inVicinityOf = document.createElement('div')
      const insertElementNearElementResult = fileLoader.insertElementNearElement(nodeToInsert, inVicinityOf)

      expect(preprocessElement).toBeCalledTimes(1)
      expect(preprocessElement).toBeCalledWith(nodeToInsert)

      expect(insertElement).toBeCalledTimes(1)
      expect(insertElement).toBeCalledWith(nodeToInsert, inVicinityOf, 'child')

      expect(insertElementNearElementResult).toBe(nodeToInsert)
    })

    it('should insert figure element as a child element', () => {
      const nodeToInsert = getElementsBySelector('*[fsplaceholder]')[0]
      const inVicinityOf = document.createElement('div')

      const figureElement = document.createElement('figure')
      preprocessElement.mockReturnValueOnce(figureElement)

      const insertElementNearElementResult = fileLoader.insertElementNearElement(nodeToInsert, inVicinityOf)

      expect(preprocessElement).toBeCalledTimes(1)
      expect(preprocessElement).toBeCalledWith(nodeToInsert)

      expect(insertElement).toBeCalledTimes(1)
      expect(insertElement).toBeCalledWith(figureElement, inVicinityOf, 'child')

      expect(insertElementNearElementResult).toBe(figureElement)
    })

    it('should insert figure element after itself if we have a <p> ancestor', () => {
      const nodeToInsert = getElementsBySelector('*[fsplaceholder]')[0]
      const inVicinityOf = document.createElement('p')

      const figureElement = document.createElement('figure')
      preprocessElement.mockReturnValueOnce(figureElement)

      const insertElementNearElementResult = fileLoader.insertElementNearElement(nodeToInsert, inVicinityOf)

      expect(preprocessElement).toBeCalledTimes(1)
      expect(preprocessElement).toBeCalledWith(nodeToInsert)

      expect(insertElement).toBeCalledTimes(1)
      expect(insertElement).toBeCalledWith(figureElement, inVicinityOf, 'afterend')

      expect(insertElementNearElementResult).toBe(figureElement)
    })
  })
})
