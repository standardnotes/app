import Icon from '@/Components/Icon/Icon'
import { FunctionComponent } from 'react'
import { SNNote } from '@standardnotes/snjs'
import { LargeNoteThreshold } from '@/Constants/Constants'
import HorizontalSeparator from '../Shared/HorizontalSeparator'

export const NoteSizeWarning: FunctionComponent<{
  note: SNNote
}> = ({ note }) => {
  return new Blob([note.text]).size > LargeNoteThreshold ? (
    <>
      <HorizontalSeparator classes="mt-2" />
      <div className="bg-warning-faded relative flex items-center px-3 py-3.5">
        <Icon type="warning" className="mr-3 flex-shrink-0 text-accessory-tint-3" />
        <div className="leading-140% max-w-80% select-none text-warning">
          This note may have trouble syncing to the mobile application due to its size.
        </div>
      </div>
    </>
  ) : null
}
