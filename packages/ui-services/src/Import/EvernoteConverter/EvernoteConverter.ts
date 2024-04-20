import { FileItem, SNTag } from '@standardnotes/models'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import utc from 'dayjs/plugin/utc'
import { GenerateUuid } from '@standardnotes/services'
import MD5 from 'crypto-js/md5'
import Base64 from 'crypto-js/enc-base64'
import { Converter, UploadFileFn } from '../Converter'
import { ConversionResult } from '../ConversionResult'
import { getBlobFromBase64 } from '../Utils'
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const dateFormat = 'YYYYMMDDTHHmmss'

export type EvernoteResource = {
  hash: string
  data: string
  fileName: string
  mimeType: string
}

export class EvernoteConverter implements Converter {
  constructor(private _generateUuid: GenerateUuid) {}

  getImportType(): string {
    return 'evernote'
  }

  getFileExtension(): string {
    return 'enex'
  }

  isContentValid(content: string): boolean {
    return content.includes('<en-export') && content.includes('</en-export>')
  }

  convert: Converter['convert'] = async (
    file,
    {
      insertNote,
      insertTag,
      linkItems,
      canUploadFiles,
      canUseSuper,
      convertHTMLToSuper,
      readFileAsText,
      uploadFile,
      cleanupItems,
    },
  ) => {
    const content = await readFileAsText(file)

    const xmlDoc = this.loadXMLString(content, 'xml')
    const xmlNotes = xmlDoc.getElementsByTagName('note')
    const tags: SNTag[] = []

    function findTag(title: string | null) {
      return tags.filter(function (tag) {
        return tag.content.title == title
      })[0]
    }

    const successful: ConversionResult['successful'] = []
    const errored: ConversionResult['errored'] = []

    for (const [index, xmlNote] of Array.from(xmlNotes).entries()) {
      const filesToPotentiallyCleanup: FileItem[] = []
      try {
        const title = xmlNote.getElementsByTagName('title')[0].textContent
        const created = xmlNote.getElementsByTagName('created')[0]?.textContent
        const updatedNodes = xmlNote.getElementsByTagName('updated')
        const updated = updatedNodes.length ? updatedNodes[0].textContent : null
        const resources = Array.from(xmlNote.getElementsByTagName('resource'))
          .map(this.getResourceFromElement)
          .filter(Boolean) as EvernoteResource[]

        const contentNode = xmlNote.getElementsByTagName('content')[0]
        let contentXmlString = this.getXmlStringFromContentElement(contentNode)
        if (!contentXmlString) {
          continue
        }
        // Convert any en-media self-closing tags to normal closing tags
        contentXmlString = contentXmlString.replace(/<((en-media)[^<>]+)\/>/g, '<$1></$2>')
        const content = this.loadXMLString(contentXmlString, 'html')

        const noteElement = content.getElementsByTagName('en-note')[0] as HTMLElement

        const unorderedLists = Array.from(noteElement.getElementsByTagName('ul'))

        if (canUseSuper) {
          this.convertTopLevelDivsToParagraphs(noteElement)
          this.convertListsToSuperFormatIfApplicable(unorderedLists)
          this.convertLeftPaddingToSuperIndent(noteElement)
        }

        this.removeEmptyAndOrphanListElements(noteElement)
        this.unwrapTopLevelBreaks(noteElement)

        // Some notes have <font> tags that contain separate <span> tags with text
        // which causes broken paragraphs in the note.
        const fontElements = Array.from(noteElement.getElementsByTagName('font'))
        for (const fontElement of fontElements) {
          fontElement.childNodes.forEach((childNode) => {
            childNode.textContent += ' '
          })
          fontElement.innerText = fontElement.textContent || ''
        }

        const mediaElements = Array.from(noteElement.getElementsByTagName('en-media'))
        const { uploadedFiles } = await this.replaceMediaElementsWithResources(
          mediaElements,
          resources,
          canUploadFiles,
          uploadFile,
        )
        filesToPotentiallyCleanup.push(...uploadedFiles)

        let contentHTML = noteElement.innerHTML
        if (!canUseSuper) {
          contentHTML = contentHTML.replace(/<\/div>/g, '</div>\n')
          contentHTML = contentHTML.replace(/<li[^>]*>/g, '\n')
          contentHTML = contentHTML.trim()
        }
        const text = !canUseSuper
          ? this.stripHTML(contentHTML)
          : convertHTMLToSuper(contentHTML, {
              addLineBreaks: false,
            })

        const createdAtDate = created ? dayjs.utc(created, dateFormat).toDate() : new Date()
        const updatedAtDate = updated ? dayjs.utc(updated, dateFormat).toDate() : createdAtDate

        const note = await insertNote({
          createdAt: createdAtDate,
          updatedAt: updatedAtDate,
          title: !title ? `Imported note ${index + 1} from Evernote` : title,
          text,
          useSuperIfPossible: canUseSuper,
        })

        successful.push(note)

        for (const uploadedFile of uploadedFiles) {
          await linkItems(note, uploadedFile)
          successful.push(uploadedFile)
        }

        const xmlTags = xmlNote.getElementsByTagName('tag')
        for (const tagXml of Array.from(xmlTags)) {
          const tagName = tagXml.childNodes[0].nodeValue
          let tag = findTag(tagName)

          if (!tag) {
            const now = new Date()
            tag = await insertTag({
              createdAt: now,
              updatedAt: now,
              title: tagName || `Imported tag ${index + 1} from Evernote`,
              references: [],
            })
            tags.push(tag)
            successful.push(tag)
          }

          await linkItems(note, tag)
        }
      } catch (error) {
        console.error(error)
        errored.push({
          name: xmlNote.getElementsByTagName('title')?.[0]?.textContent || `${file.name} - Note #${index}`,
          error: error as Error,
        })
        cleanupItems(filesToPotentiallyCleanup).catch(console.error)
        continue
      }
    }

    return {
      successful,
      errored,
    }
  }

  getXmlStringFromContentElement(contentElement: Element) {
    let contentXmlString
    /** Find the node with the content */
    for (const node of Array.from(contentElement.childNodes)) {
      if (node instanceof CDATASection) {
        contentXmlString = node.nodeValue
        break
      }
    }
    return contentXmlString
  }

  getMD5HashFromBase64(b64Data: string) {
    const bytes = Base64.parse(b64Data)
    return MD5(bytes).toString()
  }

  getResourceFromElement = (element: Element): EvernoteResource | undefined => {
    const mimeType = element.getElementsByTagName('mime')[0]?.textContent

    if (!mimeType) {
      return
    }

    const attributes = element.getElementsByTagName('resource-attributes')[0]
    const sourceUrl = attributes.getElementsByTagName('source-url')[0]?.textContent

    const fileName =
      attributes.getElementsByTagName('file-name')[0]?.textContent || this._generateUuid.execute().getValue()

    const dataElement = element.getElementsByTagName('data')[0]
    const encoding = dataElement.getAttribute('encoding')
    const dataContentWithoutNewLines = dataElement.textContent?.replace(/\n/g, '')

    if (!dataContentWithoutNewLines) {
      return
    }

    const data = 'data:' + mimeType + ';' + encoding + ',' + dataContentWithoutNewLines

    let hash = ''
    if (sourceUrl && sourceUrl.startsWith('en-cache')) {
      const splitSourceUrl = sourceUrl.split('+')
      hash = splitSourceUrl[splitSourceUrl.length - 2]
    } else if (encoding === 'base64') {
      hash = this.getMD5HashFromBase64(dataContentWithoutNewLines)
    }

    if (!hash) {
      return
    }

    return {
      hash,
      data,
      fileName,
      mimeType,
    } as EvernoteResource
  }

  convertTopLevelDivsToParagraphs(noteElement: HTMLElement) {
    noteElement.querySelectorAll('div').forEach((div) => {
      if (div.parentElement === noteElement) {
        changeElementTag(div, 'p')
      }
    })
  }

  convertListsToSuperFormatIfApplicable(unorderedLists: HTMLUListElement[]) {
    for (const unorderedList of unorderedLists) {
      if (unorderedList.style.getPropertyValue('--en-todo') !== 'true') {
        continue
      }

      unorderedList.setAttribute('__lexicallisttype', 'check')

      const listItems = unorderedList.getElementsByTagName('li')
      for (const listItem of Array.from(listItems)) {
        listItem.setAttribute('aria-checked', listItem.style.getPropertyValue('--en-checked'))
      }
    }
  }

  convertLeftPaddingToSuperIndent(noteElement: HTMLElement) {
    noteElement.querySelectorAll('p').forEach((element) => {
      const paddingLeft = element.style.paddingLeft
      if (paddingLeft) {
        // Lexical uses multiples of 20px for indent while Evernote uses multiples of 40px
        const indent = parseInt(paddingLeft) / 2
        element.style.textIndent = `${indent}px`
        element.style.paddingLeft = ''
      }
    })
  }

  removeEmptyAndOrphanListElements(noteElement: HTMLElement) {
    Array.from(noteElement.getElementsByTagName('ul, ol')).forEach((list) => {
      if (list.children.length === 0) {
        list.remove()
      }
    })
    Array.from(noteElement.getElementsByTagName('li')).forEach((li) => {
      const isEmpty = li.textContent === null || li.textContent.trim() === ''
      const isOrphan = !li.closest('ul, ol')
      if (isEmpty || isOrphan) {
        li.remove()
      }
    })
  }

  unwrapTopLevelBreaks(noteElement: HTMLElement) {
    Array.from(noteElement.querySelectorAll('* > p > br, * > div > br')).forEach((br) => {
      const parent = br.parentElement!
      const children = Array.from(parent.children)
      const isEveryChildBR = children.every((child) => child.tagName === 'BR')
      if (isEveryChildBR) {
        parent.replaceWith(children[0])
      }
    })
  }

  getHTMLElementFromResource(resource: EvernoteResource) {
    let resourceElement: HTMLElement = document.createElement('object')
    resourceElement.setAttribute('type', resource.mimeType)
    resourceElement.setAttribute('data', resource.data)
    if (resource.mimeType.startsWith('image/')) {
      resourceElement = document.createElement('img')
      resourceElement.setAttribute('src', resource.data)
      resourceElement.setAttribute('data-mime-type', resource.mimeType)
    } else if (resource.mimeType.startsWith('audio/')) {
      resourceElement = document.createElement('audio')
      resourceElement.setAttribute('controls', 'controls')
      const sourceElement = document.createElement('source')
      sourceElement.setAttribute('src', resource.data)
      sourceElement.setAttribute('type', resource.mimeType)
      resourceElement.appendChild(sourceElement)
    } else if (resource.mimeType.startsWith('video/')) {
      resourceElement = document.createElement('video')
      resourceElement.setAttribute('controls', 'controls')
      const sourceElement = document.createElement('source')
      sourceElement.setAttribute('src', resource.data)
      sourceElement.setAttribute('type', resource.mimeType)
      resourceElement.appendChild(sourceElement)
    }
    resourceElement.setAttribute('data-filename', resource.fileName)
    return resourceElement
  }

  async getFileFromResource(resource: EvernoteResource): Promise<File> {
    const blob = getBlobFromBase64(resource.data, resource.mimeType)
    return new File([blob], resource.fileName, { type: resource.mimeType })
  }

  async replaceMediaElementsWithResources(
    mediaElements: Element[],
    resources: EvernoteResource[],
    canUploadFiles: boolean,
    uploadFile: UploadFileFn,
  ): Promise<{
    replacedElements: HTMLElement[]
    uploadedFiles: FileItem[]
  }> {
    const replacedElements: HTMLElement[] = []
    const uploadedFiles = new Map<EvernoteResource['hash'], FileItem>()
    for (const mediaElement of mediaElements) {
      const hash = mediaElement.getAttribute('hash')
      const resource = resources.find((resource) => resource && resource.hash === hash)
      if (!resource) {
        continue
      }
      if (!mediaElement.parentNode) {
        continue
      }
      const existingFile = uploadedFiles.get(resource.hash)
      const fileItem = canUploadFiles
        ? existingFile
          ? existingFile
          : await uploadFile(await this.getFileFromResource(resource))
        : undefined
      if (fileItem) {
        const fileElement = document.createElement('div')
        fileElement.setAttribute('data-lexical-file-uuid', fileItem.uuid)
        mediaElement.parentNode.replaceChild(fileElement, mediaElement)
        replacedElements.push(fileElement)
        if (!existingFile) {
          uploadedFiles.set(resource.hash, fileItem)
        }
        continue
      }
      const resourceElement = this.getHTMLElementFromResource(resource)
      mediaElement.parentNode.replaceChild(resourceElement, mediaElement)
      replacedElements.push(resourceElement)
    }
    return {
      replacedElements,
      uploadedFiles: Array.from(uploadedFiles.values()),
    }
  }

  loadXMLString(string: string, type: 'html' | 'xml') {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(string, `text/${type}`)
    return xmlDoc
  }

  stripHTML(html: string) {
    const tmp = document.createElement('html')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }
}

function changeElementTag(element: HTMLElement, newTag: string) {
  const attributes = Array.prototype.slice.call(element.attributes)
  element.outerHTML = `<${newTag} ${attributes.map((attr) => attr.name + '="' + attr.value + '"').join(' ')}>${
    element.innerHTML
  }</${newTag}>`
}
