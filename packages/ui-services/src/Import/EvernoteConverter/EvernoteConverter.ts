import { DecryptedTransferPayload, NoteContent, TagContent } from '@standardnotes/models'
import { readFileAsText } from '../Utils'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import utc from 'dayjs/plugin/utc'
import { WebApplicationInterface } from '../../WebApplication/WebApplicationInterface'
import { ContentType } from '@standardnotes/domain-core'
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const dateFormat = 'YYYYMMDDTHHmmss'

export class EvernoteConverter {
  constructor(protected application: WebApplicationInterface) {}

  async convertENEXFileToNotesAndTags(file: File, stripHTML: boolean): Promise<DecryptedTransferPayload[]> {
    const content = await readFileAsText(file)

    const notesAndTags = this.parseENEXData(content, stripHTML)

    return notesAndTags
  }

  parseENEXData(data: string, stripHTML = false, defaultTagName = 'evernote') {
    const xmlDoc = this.loadXMLString(data, 'xml')
    const xmlNotes = xmlDoc.getElementsByTagName('note')
    const notes: DecryptedTransferPayload<NoteContent>[] = []
    const tags: DecryptedTransferPayload<TagContent>[] = []
    let defaultTag: DecryptedTransferPayload<TagContent> | undefined

    if (defaultTagName) {
      const now = new Date()
      defaultTag = {
        created_at: now,
        created_at_timestamp: now.getTime(),
        updated_at: now,
        updated_at_timestamp: now.getTime(),
        uuid: this.application.generateUUID(),
        content_type: ContentType.TYPES.Tag,
        content: {
          title: defaultTagName,
          expanded: false,
          iconString: '',
          references: [],
        },
      }
    }

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
      const created = xmlNote.getElementsByTagName('created')[0].textContent
      const updatedNodes = xmlNote.getElementsByTagName('updated')
      const updated = updatedNodes.length ? updatedNodes[0].textContent : null
      const contentNode = xmlNote.getElementsByTagName('content')[0]
      let contentXmlString
      /** Find the node with the content */
      for (const node of Array.from(contentNode.childNodes)) {
        if (node instanceof CDATASection) {
          contentXmlString = node.nodeValue
          break
        }
      }
      if (!contentXmlString) {
        continue
      }
      const contentXml = this.loadXMLString(contentXmlString, 'html')
      let contentHTML = contentXml.getElementsByTagName('en-note')[0].innerHTML
      if (stripHTML) {
        contentHTML = contentHTML.replace(/<\/div>/g, '</div>\n')
        contentHTML = contentHTML.replace(/<li[^>]*>/g, '\n')
        contentHTML = contentHTML.trim()
      }
      const text = stripHTML ? this.stripHTML(contentHTML) : contentHTML
      const createdAtDate = created ? dayjs.utc(created, dateFormat).toDate() : new Date()
      const updatedAtDate = updated ? dayjs.utc(updated, dateFormat).toDate() : createdAtDate
      const note: DecryptedTransferPayload<NoteContent> = {
        created_at: createdAtDate,
        created_at_timestamp: createdAtDate.getTime(),
        updated_at: updatedAtDate,
        updated_at_timestamp: updatedAtDate.getTime(),
        uuid: this.application.generateUUID(),
        content_type: ContentType.TYPES.Note,
        content: {
          title: !title ? `Imported note ${index + 1} from Evernote` : title,
          text,
          references: [],
        },
      }

      if (defaultTag) {
        defaultTag.content.references.push({
          content_type: ContentType.TYPES.Note,
          uuid: note.uuid,
        })
      }

      const xmlTags = xmlNote.getElementsByTagName('tag')
      for (const tagXml of Array.from(xmlTags)) {
        const tagName = tagXml.childNodes[0].nodeValue
        let tag = findTag(tagName)
        if (!tag) {
          const now = new Date()
          tag = {
            uuid: this.application.generateUUID(),
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
    if (defaultTag) {
      allItems.push(defaultTag)
    }

    return allItems
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
