import { ContentType } from '@standardnotes/snjs'

export type ItemPayload = {
  content_type?: ContentType
  content?: any
  [key: string]: any
}
