import AccessibilityIcon from '../../icons/ic-accessibility.svg';
import AccountCircleIcon from '../../icons/ic-account-circle.svg';
import AddIcon from '../../icons/ic-add.svg';
import ArchiveIcon from '../../icons/ic-archive.svg';
import ArrowLeftIcon from '../../icons/ic-arrow-left.svg';
import ArrowsSortDownIcon from '../../icons/ic-arrows-sort-down.svg';
import ArrowsSortUpIcon from '../../icons/ic-arrows-sort-up.svg';
import AuthenticatorIcon from '../../icons/ic-authenticator.svg';
import CheckBoldIcon from '../../icons/ic-check-bold.svg';
import CheckCircleIcon from '../../icons/ic-check-circle.svg';
import CheckIcon from '../../icons/ic-check.svg';
import ChevronDownIcon from '../../icons/ic-chevron-down.svg';
import ChevronRightIcon from '../../icons/ic-chevron-right.svg';
import CloseIcon from '../../icons/ic-close.svg';
import CloudOffIcon from '../../icons/ic-cloud-off.svg';
import CodeIcon from '../../icons/ic-code.svg';
import CopyIcon from '../../icons/ic-copy.svg';
import DownloadIcon from '../../icons/ic-download.svg';
import EditorIcon from '../../icons/ic-editor.svg';
import EmailIcon from '../../icons/ic-email.svg';
import EyeIcon from '../../icons/ic-eye.svg';
import EyeOffIcon from '../../icons/ic-eye-off.svg';
import HashtagIcon from '../../icons/ic-hashtag.svg';
import HistoryIcon from '../../icons/ic-history.svg';
import HelpIcon from '../../icons/ic-help.svg';
import InfoIcon from '../../icons/ic-info.svg';
import KeyboardIcon from '../../icons/ic-keyboard.svg';
import LinkOffIcon from '../../icons/ic-link-off.svg';
import ListBulleted from '../../icons/ic-list-bulleted.svg';
import ListedIcon from '../../icons/ic-listed.svg';
import LockFilledIcon from '../../icons/ic-lock-filled.svg';
import LockIcon from '../../icons/ic-lock.svg';
import MarkdownIcon from '../../icons/ic-markdown.svg';
import MenuArrowDownAlt from '../../icons/ic-menu-arrow-down-alt.svg';
import MenuArrowDownIcon from '../../icons/ic-menu-arrow-down.svg';
import MenuArrowRight from '../../icons/ic-menu-arrow-right.svg';
import MenuCloseIcon from '../../icons/ic-menu-close.svg';
import MoreIcon from '../../icons/ic-more.svg';
import NotesIcon from '../../icons/ic-notes.svg';
import PasswordIcon from '../../icons/ic-textbox-password.svg';
import PencilOffIcon from '../../icons/ic-pencil-off.svg';
import PinFilledIcon from '../../icons/ic-pin-filled.svg';
import PinIcon from '../../icons/ic-pin.svg';
import PlainTextIcon from '../../icons/ic-text-paragraph.svg';
import PremiumFeatureIcon from '../../icons/ic-premium-feature.svg';
import RestoreIcon from '../../icons/ic-restore.svg';
import RichTextIcon from '../../icons/ic-text-rich.svg';
import SecurityIcon from '../../icons/ic-security.svg';
import ServerIcon from '../../icons/ic-server.svg';
import SettingsIcon from '../../icons/ic-settings.svg';
import SignInIcon from '../../icons/ic-signin.svg';
import SignOutIcon from '../../icons/ic-signout.svg';
import SpreadsheetsIcon from '../../icons/ic-spreadsheets.svg';
import StarIcon from '../../icons/ic-star.svg';
import SyncIcon from '../../icons/ic-sync.svg';
import TasksIcon from '../../icons/ic-tasks.svg';
import ThemesIcon from '../../icons/ic-themes.svg';
import TrashFilledIcon from '../../icons/ic-trash-filled.svg';
import TrashIcon from '../../icons/ic-trash.svg';
import TrashSweepIcon from '../../icons/ic-trash-sweep.svg';
import TuneIcon from '../../icons/ic-tune.svg';
import UnarchiveIcon from '../../icons/ic-unarchive.svg';
import UnpinIcon from '../../icons/ic-pin-off.svg';
import UserIcon from '../../icons/ic-user.svg';
import UserSwitch from '../../icons/ic-user-switch.svg';
import WindowIcon from '../../icons/ic-window.svg';

import { FunctionalComponent } from 'preact';
import { IconType } from '@standardnotes/snjs';

const ICONS = {
  'account-circle': AccountCircleIcon,
  'arrow-left': ArrowLeftIcon,
  'arrows-sort-down': ArrowsSortDownIcon,
  'arrows-sort-up': ArrowsSortUpIcon,
  'check-bold': CheckBoldIcon,
  'check-circle': CheckCircleIcon,
  'chevron-down': ChevronDownIcon,
  'chevron-right': ChevronRightIcon,
  'cloud-off': CloudOffIcon,
  'eye-off': EyeOffIcon,
  'link-off': LinkOffIcon,
  'list-bulleted': ListBulleted,
  'lock-filled': LockFilledIcon,
  'menu-arrow-down-alt': MenuArrowDownAlt,
  'menu-arrow-down': MenuArrowDownIcon,
  'menu-arrow-right': MenuArrowRight,
  'menu-close': MenuCloseIcon,
  'pencil-off': PencilOffIcon,
  'pin-filled': PinFilledIcon,
  'plain-text': PlainTextIcon,
  'premium-feature': PremiumFeatureIcon,
  'rich-text': RichTextIcon,
  'trash-filled': TrashFilledIcon,
  'trash-sweep': TrashSweepIcon,
  'user-switch': UserSwitch,
  accessibility: AccessibilityIcon,
  add: AddIcon,
  archive: ArchiveIcon,
  authenticator: AuthenticatorIcon,
  check: CheckIcon,
  close: CloseIcon,
  code: CodeIcon,
  copy: CopyIcon,
  download: DownloadIcon,
  editor: EditorIcon,
  email: EmailIcon,
  eye: EyeIcon,
  hashtag: HashtagIcon,
  help: HelpIcon,
  history: HistoryIcon,
  info: InfoIcon,
  keyboard: KeyboardIcon,
  listed: ListedIcon,
  lock: LockIcon,
  markdown: MarkdownIcon,
  more: MoreIcon,
  notes: NotesIcon,
  password: PasswordIcon,
  pin: PinIcon,
  restore: RestoreIcon,
  security: SecurityIcon,
  server: ServerIcon,
  settings: SettingsIcon,
  signIn: SignInIcon,
  signOut: SignOutIcon,
  spellcheck: NotesIcon,
  spreadsheets: SpreadsheetsIcon,
  star: StarIcon,
  sync: SyncIcon,
  tasks: TasksIcon,
  themes: ThemesIcon,
  trash: TrashIcon,
  tune: TuneIcon,
  unarchive: UnarchiveIcon,
  unpin: UnpinIcon,
  user: UserIcon,
  window: WindowIcon,
};

type Props = {
  type: IconType;
  className?: string;
  ariaLabel?: string;
};

export const Icon: FunctionalComponent<Props> = ({
  type,
  className = '',
  ariaLabel,
}) => {
  const IconComponent = ICONS[type as keyof typeof ICONS];
  if (!IconComponent) {
    return null;
  }
  return (
    <IconComponent
      className={`sn-icon ${className}`}
      role="img"
      {...(ariaLabel ? { 'aria-label': ariaLabel } : {})}
    />
  );
};
