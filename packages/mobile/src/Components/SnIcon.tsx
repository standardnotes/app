import ArchiveIcon from '@standardnotes/icons/dist/mobile-exports/ic-archive.svg'
import AttachmentFileIcon from '@standardnotes/icons/dist/mobile-exports/ic-attachment-file.svg'
import AuthenticatorIcon from '@standardnotes/icons/dist/mobile-exports/ic-authenticator.svg'
import ClearCircleFilledIcon from '@standardnotes/icons/dist/mobile-exports/ic-clear-circle-filled.svg'
import CodeIcon from '@standardnotes/icons/dist/mobile-exports/ic-code.svg'
import FileDocIcon from '@standardnotes/icons/dist/mobile-exports/ic-file-doc.svg'
import FileImageIcon from '@standardnotes/icons/dist/mobile-exports/ic-file-image.svg'
import FileMovIcon from '@standardnotes/icons/dist/mobile-exports/ic-file-mov.svg'
import FileMusicIcon from '@standardnotes/icons/dist/mobile-exports/ic-file-music.svg'
import FileOtherIcon from '@standardnotes/icons/dist/mobile-exports/ic-file-other.svg'
import FilePdfIcon from '@standardnotes/icons/dist/mobile-exports/ic-file-pdf.svg'
import FilePptIcon from '@standardnotes/icons/dist/mobile-exports/ic-file-ppt.svg'
import FileXlsIcon from '@standardnotes/icons/dist/mobile-exports/ic-file-xls.svg'
import FileZipIcon from '@standardnotes/icons/dist/mobile-exports/ic-file-zip.svg'
import LockFilledIcon from '@standardnotes/icons/dist/mobile-exports/ic-lock-filled.svg'
import MarkdownIcon from '@standardnotes/icons/dist/mobile-exports/ic-markdown.svg'
import NotesIcon from '@standardnotes/icons/dist/mobile-exports/ic-notes.svg'
import OpenInIcon from '@standardnotes/icons/dist/mobile-exports/ic-open-in.svg'
import PencilOffIcon from '@standardnotes/icons/dist/mobile-exports/ic-pencil-off.svg'
import PinFilledIcon from '@standardnotes/icons/dist/mobile-exports/ic-pin-filled.svg'
import SpreadsheetsIcon from '@standardnotes/icons/dist/mobile-exports/ic-spreadsheets.svg'
import TasksIcon from '@standardnotes/icons/dist/mobile-exports/ic-tasks.svg'
import PlainTextIcon from '@standardnotes/icons/dist/mobile-exports/ic-text-paragraph.svg'
import RichTextIcon from '@standardnotes/icons/dist/mobile-exports/ic-text-rich.svg'
import TrashFilledIcon from '@standardnotes/icons/dist/mobile-exports/ic-trash-filled.svg'
import UserAddIcon from '@standardnotes/icons/dist/mobile-exports/ic-user-add.svg'
import FilesIllustration from '@standardnotes/icons/dist/mobile-exports/il-files.svg'
import { IconType } from '@standardnotes/snjs'
import React, { FC, useContext } from 'react'
import { SvgProps } from 'react-native-svg'
import { ThemeContext } from 'styled-components'
import { iconStyles } from './/Icon.styled'

type TIcons = {
  [key in IconType]: FC<SvgProps>
}

const ICONS: Partial<TIcons> = {
  'pencil-off': PencilOffIcon,
  'plain-text': PlainTextIcon,
  'rich-text': RichTextIcon,
  code: CodeIcon,
  markdown: MarkdownIcon,
  spreadsheets: SpreadsheetsIcon,
  tasks: TasksIcon,
  authenticator: AuthenticatorIcon,
  'trash-filled': TrashFilledIcon,
  'pin-filled': PinFilledIcon,
  archive: ArchiveIcon,
  'user-add': UserAddIcon,
  'open-in': OpenInIcon,
  notes: NotesIcon,
  'attachment-file': AttachmentFileIcon,
  'files-illustration': FilesIllustration,
  'file-doc': FileDocIcon,
  'file-image': FileImageIcon,
  'file-mov': FileMovIcon,
  'file-music': FileMusicIcon,
  'file-other': FileOtherIcon,
  'file-pdf': FilePdfIcon,
  'file-ppt': FilePptIcon,
  'file-xls': FileXlsIcon,
  'file-zip': FileZipIcon,
  'clear-circle-filled': ClearCircleFilledIcon,
  'lock-filled': LockFilledIcon,
}

type Props = {
  type: IconType
  fill?: string
  style?: Record<string, unknown>
  width?: number
  height?: number
}

export const SnIcon = ({ type, fill, width, height, style = {} }: Props) => {
  const theme = useContext(ThemeContext)
  const fillColor = fill || theme.stylekitPalSky

  const IconComponent = ICONS[type]

  if (!IconComponent) {
    return null
  }

  let customSizes = {}
  if (width !== undefined) {
    customSizes = {
      ...customSizes,
      width,
    }
  }
  if (height !== undefined) {
    customSizes = {
      ...customSizes,
      height,
    }
  }

  return <IconComponent fill={fillColor} {...customSizes} style={[iconStyles.icon, style]} />
}
