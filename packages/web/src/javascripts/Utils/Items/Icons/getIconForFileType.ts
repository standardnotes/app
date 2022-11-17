import { IconType } from '@standardnotes/models'

export function getIconForFileType(type: string): IconType {
  let iconType: IconType = 'file-other'

  if (type === 'application/pdf') {
    iconType = 'file-pdf'
  }

  if (/word/.test(type)) {
    iconType = 'file-doc'
  }

  if (/powerpoint|presentation/.test(type)) {
    iconType = 'file-ppt'
  }

  if (/excel|spreadsheet/.test(type)) {
    iconType = 'file-xls'
  }

  if (/^image\//.test(type)) {
    iconType = 'file-image'
  }

  if (/^video\//.test(type)) {
    iconType = 'file-mov'
  }

  if (/^audio\//.test(type)) {
    iconType = 'file-music'
  }

  if (/(zip)|([tr]ar)|(7z)/.test(type)) {
    iconType = 'file-zip'
  }

  return iconType
}
