import { FunctionComponent, useMemo } from 'react'
import { IconType } from '@standardnotes/snjs'

import {
  AccessibilityIcon,
  AccountCircleIcon,
  AddIcon,
  ArchiveIcon,
  ArrowLeftIcon,
  ArrowsSortDownIcon,
  ArrowsSortUpIcon,
  AttachmentFileIcon,
  AuthenticatorIcon,
  CheckBoldIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClearCircleFilledIcon,
  CloseIcon,
  CloudOffIcon,
  CodeIcon,
  CopyIcon,
  DashboardIcon,
  DownloadIcon,
  EditorIcon,
  EmailIcon,
  EyeIcon,
  EyeOffIcon,
  FileDocIcon,
  FileIcon,
  FileImageIcon,
  FileMovIcon,
  FileMusicIcon,
  FileOtherIcon,
  FilePdfIcon,
  FilePptIcon,
  FileXlsIcon,
  FileZipIcon,
  FolderIcon,
  HashtagIcon,
  HashtagOffIcon,
  HelpIcon,
  HistoryIcon,
  InfoIcon,
  KeyboardIcon,
  LinkIcon,
  LinkOffIcon,
  ListBulleted,
  ListedIcon,
  LockFilledIcon,
  LockIcon,
  MarkdownIcon,
  MenuArrowDownAlt,
  MenuArrowDownIcon,
  MenuArrowRightIcon,
  MenuCloseIcon,
  MoreIcon,
  NotesIcon,
  PasswordIcon,
  PencilFilledIcon,
  PencilIcon,
  PencilOffIcon,
  PinFilledIcon,
  PinIcon,
  PlainTextIcon,
  PremiumFeatureIcon,
  RestoreIcon,
  RichTextIcon,
  SearchIcon,
  SecurityIcon,
  ServerIcon,
  SettingsIcon,
  SignInIcon,
  SignOutIcon,
  SortDescendingIcon,
  SpreadsheetsIcon,
  StarIcon,
  SubtractIcon,
  SyncIcon,
  TasksIcon,
  ThemesIcon,
  TrashFilledIcon,
  TrashIcon,
  TrashSweepIcon,
  TuneIcon,
  UnarchiveIcon,
  UnpinIcon,
  UserAddIcon,
  UserIcon,
  UserSwitch,
  WarningIcon,
  WindowIcon,
} from '@standardnotes/icons'

export const ICONS = {
  'account-circle': AccountCircleIcon,
  'arrow-left': ArrowLeftIcon,
  'arrows-sort-down': ArrowsSortDownIcon,
  'arrows-sort-up': ArrowsSortUpIcon,
  'attachment-file': AttachmentFileIcon,
  'check-bold': CheckBoldIcon,
  'check-circle': CheckCircleIcon,
  'chevron-down': ChevronDownIcon,
  'chevron-right': ChevronRightIcon,
  'clear-circle-filled': ClearCircleFilledIcon,
  'cloud-off': CloudOffIcon,
  'eye-off': EyeOffIcon,
  'file-doc': FileDocIcon,
  'file-image': FileImageIcon,
  'file-mov': FileMovIcon,
  'file-music': FileMusicIcon,
  'file-other': FileOtherIcon,
  'file-pdf': FilePdfIcon,
  'file-ppt': FilePptIcon,
  'file-xls': FileXlsIcon,
  'file-zip': FileZipIcon,
  'hashtag-off': HashtagOffIcon,
  'link-off': LinkOffIcon,
  'list-bulleted': ListBulleted,
  'lock-filled': LockFilledIcon,
  'menu-arrow-down-alt': MenuArrowDownAlt,
  'menu-arrow-down': MenuArrowDownIcon,
  'menu-arrow-right': MenuArrowRightIcon,
  'menu-close': MenuCloseIcon,
  'pencil-filled': PencilFilledIcon,
  'pencil-off': PencilOffIcon,
  'pin-filled': PinFilledIcon,
  'plain-text': PlainTextIcon,
  'premium-feature': PremiumFeatureIcon,
  'rich-text': RichTextIcon,
  'sort-descending': SortDescendingIcon,
  'trash-filled': TrashFilledIcon,
  'trash-sweep': TrashSweepIcon,
  'user-add': UserAddIcon,
  'user-switch': UserSwitch,
  accessibility: AccessibilityIcon,
  add: AddIcon,
  archive: ArchiveIcon,
  authenticator: AuthenticatorIcon,
  check: CheckIcon,
  close: CloseIcon,
  code: CodeIcon,
  copy: CopyIcon,
  dashboard: DashboardIcon,
  download: DownloadIcon,
  editor: EditorIcon,
  email: EmailIcon,
  eye: EyeIcon,
  file: FileIcon,
  folder: FolderIcon,
  hashtag: HashtagIcon,
  help: HelpIcon,
  history: HistoryIcon,
  info: InfoIcon,
  keyboard: KeyboardIcon,
  link: LinkIcon,
  listed: ListedIcon,
  lock: LockIcon,
  markdown: MarkdownIcon,
  more: MoreIcon,
  notes: NotesIcon,
  password: PasswordIcon,
  pencil: PencilIcon,
  pin: PinIcon,
  restore: RestoreIcon,
  search: SearchIcon,
  security: SecurityIcon,
  server: ServerIcon,
  settings: SettingsIcon,
  signIn: SignInIcon,
  signOut: SignOutIcon,
  spreadsheets: SpreadsheetsIcon,
  star: StarIcon,
  subtract: SubtractIcon,
  sync: SyncIcon,
  tasks: TasksIcon,
  themes: ThemesIcon,
  trash: TrashIcon,
  tune: TuneIcon,
  unarchive: UnarchiveIcon,
  unpin: UnpinIcon,
  user: UserIcon,
  warning: WarningIcon,
  window: WindowIcon,
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
