import { WebApplication } from '@/Application/WebApplication'
import { SNNote } from '@standardnotes/snjs'

type CommonProps = {
  application: WebApplication
}

export type RevisionHistoryModalProps = CommonProps

export type RevisionHistoryModalContentProps = CommonProps & {
  note: SNNote
  dismissModal: () => void
}
