import { UuidString } from '@Lib/Types/UuidString'

export type TemplateNoteViewControllerOptions = {
  title?: string
  tag?: UuidString
  createdAt?: Date
  autofocusBehavior?: TemplateNoteViewAutofocusBehavior
}

export type TemplateNoteViewAutofocusBehavior = 'title' | 'editor'
