import { UuidString, VaultListingInterface } from '@standardnotes/snjs'

export type TemplateNoteViewControllerOptions = {
  title?: string
  tag?: UuidString
  vault?: VaultListingInterface
  createdAt?: Date
  autofocusBehavior?: TemplateNoteViewAutofocusBehavior
}

export type TemplateNoteViewAutofocusBehavior = 'title' | 'editor'
