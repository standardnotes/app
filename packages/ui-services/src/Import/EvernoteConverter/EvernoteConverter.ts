import { DecryptedTransferPayload, NoteContent, TagContent } from '@standardnotes/models'
import { readFileAsText } from '../Utils'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import utc from 'dayjs/plugin/utc'
import { ContentType } from '@standardnotes/domain-core'
import { GenerateUuid } from '@standardnotes/services'
import { SuperConverterServiceInterface } from '@standardnotes/files'
import { NativeFeatureIdentifier, NoteType } from '@standardnotes/features'
import MD5 from 'crypto-js/md5'
import Base64 from 'crypto-js/enc-base64'
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const dateFormat = 'YYYYMMDDTHHmmss'

type EvernoteResource = {
  hash: string
  data: string
  fileName: string
  mimeType: string
}

export class EvernoteConverter {
  constructor(
    private superConverterService: SuperConverterServiceInterface,
    private _generateUuid: GenerateUuid,
  ) {}

  async convertENEXFileToNotesAndTags(file: File, isEntitledToSuper: boolean): Promise<DecryptedTransferPayload[]> {
    const content = await readFileAsText(file)

    const notesAndTags = this.parseENEXData(content, isEntitledToSuper)

    return notesAndTags
  }

  parseENEXData(data: string, isEntitledToSuper = false) {
    const xmlDoc = this.loadXMLString(data, 'xml')
    const xmlNotes = xmlDoc.getElementsByTagName('note')
    const notes: DecryptedTransferPayload<NoteContent>[] = []
    const tags: DecryptedTransferPayload<TagContent>[] = []

    function findTag(title: string | null) {
      return tags.filter(function (tag) {
        return tag.content.title == title
      })[0]
    }

    function addTag(tag: DecryptedTransferPayload<TagContent>) {
      tags.push(tag)
    }

    for (const [index, xmlNote] of Array.from(xmlNotes).entries()) {
      const title = xmlNote.getElementsByTagName('title')[0].textContent
      const created = xmlNote.getElementsByTagName('created')[0]?.textContent
      const updatedNodes = xmlNote.getElementsByTagName('updated')
      const updated = updatedNodes.length ? updatedNodes[0].textContent : null
      const resources = Array.from(xmlNote.getElementsByTagName('resource'))
        .map(this.getResourceFromElement)
        .filter(Boolean)

      const contentNode = xmlNote.getElementsByTagName('content')[0]
      const contentXmlString = this.getXmlStringFromContentElement(contentNode)
      if (!contentXmlString) {
        continue
      }
      const contentXml = this.loadXMLString(contentXmlString, 'html')

      const noteElement = contentXml.getElementsByTagName('en-note')[0]

      const unorderedLists = Array.from(noteElement.getElementsByTagName('ul'))
      if (isEntitledToSuper) {
        this.convertListsToSuperFormatIfApplicable(unorderedLists)
      }

      const mediaElements = noteElement.getElementsByTagName('en-media')
      for (const mediaElement of Array.from(mediaElements)) {
        const hash = mediaElement.getAttribute('hash')
        const resource = resources.find((resource) => resource && resource.hash === hash)
        if (!resource) {
          continue
        }
        const imgElement = document.createElement('img')
        imgElement.setAttribute('src', resource.data)
        imgElement.setAttribute('alt', resource.fileName)
        mediaElement.parentNode?.replaceChild(imgElement, mediaElement)
      }

      let contentHTML = contentXml.getElementsByTagName('en-note')[0].innerHTML
      if (!isEntitledToSuper) {
        contentHTML = contentHTML.replace(/<\/div>/g, '</div>\n')
        contentHTML = contentHTML.replace(/<li[^>]*>/g, '\n')
        contentHTML = contentHTML.trim()
      }
      const text = !isEntitledToSuper
        ? this.stripHTML(contentHTML)
        : this.superConverterService.convertOtherFormatToSuperString(contentHTML, 'html')

      const createdAtDate = created ? dayjs.utc(created, dateFormat).toDate() : new Date()
      const updatedAtDate = updated ? dayjs.utc(updated, dateFormat).toDate() : createdAtDate

      const note: DecryptedTransferPayload<NoteContent> = {
        created_at: createdAtDate,
        created_at_timestamp: createdAtDate.getTime(),
        updated_at: updatedAtDate,
        updated_at_timestamp: updatedAtDate.getTime(),
        uuid: this._generateUuid.execute().getValue(),
        content_type: ContentType.TYPES.Note,
        content: {
          title: !title ? `Imported note ${index + 1} from Evernote` : title,
          text,
          references: [],
          ...(isEntitledToSuper
            ? {
                noteType: NoteType.Super,
                editorIdentifier: NativeFeatureIdentifier.TYPES.SuperEditor,
              }
            : {}),
        },
      }

      const xmlTags = xmlNote.getElementsByTagName('tag')
      for (const tagXml of Array.from(xmlTags)) {
        const tagName = tagXml.childNodes[0].nodeValue
        let tag = findTag(tagName)
        if (!tag) {
          const now = new Date()
          tag = {
            uuid: this._generateUuid.execute().getValue(),
            content_type: ContentType.TYPES.Tag,
            created_at: now,
            created_at_timestamp: now.getTime(),
            updated_at: now,
            updated_at_timestamp: now.getTime(),
            content: {
              title: tagName || `Imported tag ${index + 1} from Evernote`,
              expanded: false,
              iconString: '',
              references: [],
            },
          }
          addTag(tag)
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

  getResourceFromElement(element: Element, index: number): EvernoteResource | undefined {
    const mimeType = element.getElementsByTagName('mime')[0]?.textContent

    if (!mimeType) {
      return
    }

    const attributes = element.getElementsByTagName('resource-attributes')[0]
    const sourceUrl = attributes.getElementsByTagName('source-url')[0]?.textContent

    const fileName = attributes.getElementsByTagName('file-name')[0]?.textContent || `${mimeType}-${index}`

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

  loadXMLString(string: string, type: 'html' | 'xml') {
    let xmlDoc
    if (window.DOMParser) {
      const parser = new DOMParser()
      xmlDoc = parser.parseFromString(string, `text/${type}`)
    } else {
      throw new Error('Could not parse XML string')
    }
    return xmlDoc
  }

  stripHTML(html: string) {
    const tmp = document.createElement('html')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }
}
