import Icon from '@/Components/Icon/Icon'
import { FunctionComponent } from 'react'
import { SNNote } from '@standardnotes/snjs'
import { BYTES_IN_ONE_MEGABYTE } from '@/Constants/Constants'
import HorizontalSeparator from '../Shared/HorizontalSeparator'

export const NOTE_SIZE_WARNING_THRESHOLD = 0.5 * BYTES_IN_ONE_MEGABYTE

export const NoteSizeWarning: FunctionComponent<{
  note: SNNote
}> = ({ note }) => {
  return new Blob([note.text]).size > NOTE_SIZE_WARNING_THRESHOLD ? (
    <>
      <HorizontalSeparator classes="my-2" />
      <div className="bg-warning-faded relative flex items-center px-3 py-3.5">
        <Icon type="warning" className="mr-3 flex-shrink-0 text-accessory-tint-3" />
        <div className="leading-140% max-w-80% select-none text-warning">
          This note may have trouble syncing to the mobile application due to its size.
        </div>
      </div>
    </>
  ) : null
}
