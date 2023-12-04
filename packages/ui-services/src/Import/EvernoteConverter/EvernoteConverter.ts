import { DecryptedTransferPayload, NoteContent, TagContent } from '@standardnotes/models'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import utc from 'dayjs/plugin/utc'
import { GenerateUuid } from '@standardnotes/services'
import { NoteType } from '@standardnotes/features'
import MD5 from 'crypto-js/md5'
import Base64 from 'crypto-js/enc-base64'
import { Converter } from '../Converter'
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
    { createNote, createTag, canUseSuper, convertHTMLToSuper, readFileAsText },
  ) => {
    const content = await readFileAsText(file)

    const xmlDoc = this.loadXMLString(content, 'xml')
    const xmlNotes = xmlDoc.getElementsByTagName('note')
    const notes: DecryptedTransferPayload<NoteContent>[] = []
    const tags: DecryptedTransferPayload<TagContent>[] = []

    function findTag(title: string | null) {
      return tags.filter(function (tag) {
        return tag.content.title == title
      })[0]
    }

    for (const [index, xmlNote] of Array.from(xmlNotes).entries()) {
      const title = xmlNote.getElementsByTagName('title')[0].textContent
      const created = xmlNote.getElementsByTagName('created')[0]?.textContent
      const updatedNodes = xmlNote.getElementsByTagName('updated')
      const updated = updatedNodes.length ? updatedNodes[0].textContent : null
      const resources = Array.from(xmlNote.getElementsByTagName('resource'))
        .map(this.getResourceFromElement)
        .filter(Boolean) as EvernoteResource[]

      const contentNode = xmlNote.getElementsByTagName('content')[0]
      const contentXmlString = this.getXmlStringFromContentElement(contentNode)
      if (!contentXmlString) {
        continue
      }
      const contentXml = this.loadXMLString(contentXmlString, 'html')

      const noteElement = contentXml.getElementsByTagName('en-note')[0]

      const unorderedLists = Array.from(noteElement.getElementsByTagName('ul'))
      if (canUseSuper) {
        this.convertListsToSuperFormatIfApplicable(unorderedLists)
      }

      // Remove empty lists and orphan list items
      Array.from(noteElement.getElementsByTagName('ul')).forEach((ul) => {
        if (ul.children.length === 0) {
          ul.remove()
        }
      })
      Array.from(noteElement.getElementsByTagName('ol')).forEach((ol) => {
        if (ol.children.length === 0) {
          ol.remove()
        }
      })
      Array.from(noteElement.getElementsByTagName('li')).forEach((li) => {
        if (li.children.length === 0 || li.closest('ul, ol') === null) {
          li.remove()
        }
      })

      const mediaElements = Array.from(noteElement.getElementsByTagName('en-media'))
      this.replaceMediaElementsWithResources(mediaElements, resources)

      // Some notes have <font> tags that contain separate <span> tags with text
      // which causes broken paragraphs in the note.
      const fontElements = Array.from(noteElement.getElementsByTagName('font'))
      for (const fontElement of fontElements) {
        fontElement.childNodes.forEach((childNode) => {
          childNode.textContent += ' '
        })
        fontElement.innerText = fontElement.textContent || ''
      }

      let contentHTML = noteElement.innerHTML
      if (!canUseSuper) {
        contentHTML = contentHTML.replace(/<\/div>/g, '</div>\n')
        contentHTML = contentHTML.replace(/<li[^>]*>/g, '\n')
        contentHTML = contentHTML.trim()
      }
      const text = !canUseSuper ? this.stripHTML(contentHTML) : convertHTMLToSuper(contentHTML)

      const createdAtDate = created ? dayjs.utc(created, dateFormat).toDate() : new Date()
      const updatedAtDate = updated ? dayjs.utc(updated, dateFormat).toDate() : createdAtDate

      const note = createNote({
        createdAt: createdAtDate,
        updatedAt: updatedAtDate,
        title: !title ? `Imported note ${index + 1} from Evernote` : title,
        text,
        noteType: NoteType.Super,
      })

      const xmlTags = xmlNote.getElementsByTagName('tag')
      for (const tagXml of Array.from(xmlTags)) {
        const tagName = tagXml.childNodes[0].nodeValue
        let tag = findTag(tagName)
        if (!tag) {
          const now = new Date()
          tag = createTag({
            createdAt: now,
            updatedAt: now,
            title: tagName || `Imported tag ${index + 1} from Evernote`,
          })
          tags.push(tag)
        }

        note.content.references.push({ content_type: tag.content_type, uuid: tag.uuid })
        tag.content.references.push({ content_type: note.content_type, uuid: note.uuid })
      }

      notes.push(note)
    }

    const allItems: DecryptedTransferPayload[] = [...notes, ...tags]
    if (allItems.length === 0) {
      throw new Error('Could not parse any notes or tags from Evernote file.')
    }

    return allItems
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

  replaceMediaElementsWithResources(mediaElements: Element[], resources: EvernoteResource[]): number {
    let replacedElements = 0
    for (const mediaElement of mediaElements) {
      const hash = mediaElement.getAttribute('hash')
      const resource = resources.find((resource) => resource && resource.hash === hash)
      if (!resource) {
        continue
      }
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
      if (!mediaElement.parentNode) {
        continue
      }
      mediaElement.parentNode.replaceChild(resourceElement, mediaElement)
      replacedElements++
    }
    return replacedElements
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
