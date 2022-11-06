import { WebApplication } from '@/Application/Application'
import { NoteBlock, SNNote, BlockValues } from '@standardnotes/snjs'

type CommonInterface = {
  block: NoteBlock
  note: SNNote
  application: WebApplication
  onSizeChange?: (size: { width: number; height: number }) => void
  onFocus?: () => void
  onBlur?: () => void
}

/** An unmanaged block component handles its own saving */
export type UnmanagedBlockComponentInterface = CommonInterface

/** A managed block component does not handle its own saving and passes change events up */
export type ManagedBlockComponentInterface = CommonInterface & {
  onChange: (values: BlockValues) => void
  onFocus: () => void
  onBlur: () => void
}
