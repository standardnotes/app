import { FunctionComponent, useMemo } from 'react'
import { IconType } from '@standardnotes/snjs'
import * as icons from '@standardnotes/icons'

export const ICONS = {
  'account-circle': icons.AccountCircleIcon,
  'arrow-left': icons.ArrowLeftIcon,
  'arrow-right': icons.ArrowRightIcon,
  'arrows-sort-down': icons.ArrowsSortDownIcon,
  'arrows-sort-up': icons.ArrowsSortUpIcon,
  'attachment-file': icons.AttachmentFileIcon,
  'check-bold': icons.CheckBoldIcon,
  'check-circle': icons.CheckCircleIcon,
  'chevron-down': icons.ChevronDownIcon,
  'chevron-left': icons.ChevronLeftIcon,
  'chevron-right': icons.ChevronRightIcon,
  'clear-circle-filled': icons.ClearCircleFilledIcon,
  'cloud-off': icons.CloudOffIcon,
  'diamond-filled': icons.DiamondFilledIcon,
  'eye-off': icons.EyeOffIcon,
  'file-doc': icons.FileDocIcon,
  'file-image': icons.FileImageIcon,
  'file-mov': icons.FileMovIcon,
  'file-music': icons.FileMusicIcon,
  'file-other': icons.FileOtherIcon,
  'file-pdf': icons.FilePdfIcon,
  'file-ppt': icons.FilePptIcon,
  'file-xls': icons.FileXlsIcon,
  'file-zip': icons.FileZipIcon,
  'hashtag-off': icons.HashtagOffIcon,
  'link-off': icons.LinkOffIcon,
  'list-bulleted': icons.ListBulleted,
  'lock-filled': icons.LockFilledIcon,
  'menu-arrow-down-alt': icons.MenuArrowDownAlt,
  'menu-arrow-down': icons.MenuArrowDownIcon,
  'menu-arrow-right': icons.MenuArrowRightIcon,
  'menu-close': icons.MenuCloseIcon,
  'menu-variant': icons.MenuVariantIcon,
  'notes-filled': icons.NotesFilledIcon,
  'pencil-filled': icons.PencilFilledIcon,
  'pencil-off': icons.PencilOffIcon,
  'pin-filled': icons.PinFilledIcon,
  'plain-text': icons.PlainTextIcon,
  'premium-feature': icons.PremiumFeatureIcon,
  'rich-text': icons.RichTextIcon,
  'sort-descending': icons.SortDescendingIcon,
  'star-circle-filled': icons.StarCircleFilled,
  'star-filled': icons.StarFilledIcon,
  'star-variant-filled': icons.StarVariantFilledIcon,
  'trash-filled': icons.TrashFilledIcon,
  'trash-sweep': icons.TrashSweepIcon,
  'user-add': icons.UserAddIcon,
  'user-switch': icons.UserSwitch,
  accessibility: icons.AccessibilityIcon,
  add: icons.AddIcon,
  archive: icons.ArchiveIcon,
  asterisk: icons.AsteriskIcon,
  authenticator: icons.AuthenticatorIcon,
  check: icons.CheckIcon,
  close: icons.CloseIcon,
  code: icons.CodeIcon,
  copy: icons.CopyIcon,
  dashboard: icons.DashboardIcon,
  diamond: icons.DiamondIcon,
  download: icons.DownloadIcon,
  editor: icons.EditorIcon,
  email: icons.EmailIcon,
  eye: icons.EyeIcon,
  file: icons.FileIcon,
  folder: icons.FolderIcon,
  fullscreen: icons.FullscreenIcon,
  hashtag: icons.HashtagIcon,
  help: icons.HelpIcon,
  history: icons.HistoryIcon,
  info: icons.InfoIcon,
  keyboard: icons.KeyboardIcon,
  link: icons.LinkIcon,
  listed: icons.ListedIcon,
  lock: icons.LockIcon,
  markdown: icons.MarkdownIcon,
  more: icons.MoreIcon,
  notes: icons.NotesIcon,
  password: icons.PasswordIcon,
  pencil: icons.PencilIcon,
  pin: icons.PinIcon,
  restore: icons.RestoreIcon,
  search: icons.SearchIcon,
  security: icons.SecurityIcon,
  server: icons.ServerIcon,
  settings: icons.SettingsIcon,
  share: icons.ShareIcon,
  signIn: icons.SignInIcon,
  signOut: icons.SignOutIcon,
  spreadsheets: icons.SpreadsheetsIcon,
  star: icons.StarIcon,
  subtract: icons.SubtractIcon,
  sync: icons.SyncIcon,
  tasks: icons.TasksIcon,
  themes: icons.ThemesIcon,
  trash: icons.TrashIcon,
  tune: icons.TuneIcon,
  unarchive: icons.UnarchiveIcon,
  unpin: icons.UnpinIcon,
  user: icons.UserIcon,
  view: icons.ViewIcon,
  warning: icons.WarningIcon,
  window: icons.WindowIcon,
}

type Props = {
  type: IconType
  className?: string
  ariaLabel?: string
  size?: 'small' | 'medium' | 'normal' | 'custom'
}

const Icon: FunctionComponent<Props> = ({ type, className = '', ariaLabel, size = 'normal' }) => {
  const IconComponent = ICONS[type as keyof typeof ICONS]

  const dimensions = useMemo(() => {
    switch (size) {
      case 'small':
        return 'w-3.5 h-3.5'
      case 'medium':
        return 'w-4 h-4'
      case 'custom':
        return ''
      default:
        return 'w-5 h-5'
    }
  }, [size])

  if (!IconComponent) {
    return null
  }

  return (
    <IconComponent
      className={`${dimensions} fill-current ${className}`}
      role="img"
      {...(ariaLabel ? { 'aria-label': ariaLabel } : { 'aria-hidden': true })}
    />
  )
}

export default Icon
