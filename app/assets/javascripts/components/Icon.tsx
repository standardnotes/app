import PencilOffIcon from '../../icons/ic-pencil-off.svg';
import PlainTextIcon from '../../icons/ic-text-paragraph.svg';
import RichTextIcon from '../../icons/ic-text-rich.svg';
import TrashIcon from '../../icons/ic-trash.svg';
import PinIcon from '../../icons/ic-pin.svg';
import UnpinIcon from '../../icons/ic-pin-off.svg';
import ArchiveIcon from '../../icons/ic-archive.svg';
import UnarchiveIcon from '../../icons/ic-unarchive.svg';
import HashtagIcon from '../../icons/ic-hashtag.svg';
import ChevronRightIcon from '../../icons/ic-chevron-right.svg';
import RestoreIcon from '../../icons/ic-restore.svg';
import CloseIcon from '../../icons/ic-close.svg';
import PasswordIcon from '../../icons/ic-textbox-password.svg';
import TrashSweepIcon from '../../icons/ic-trash-sweep.svg';
import MoreIcon from '../../icons/ic-more.svg';
import TuneIcon from '../../icons/ic-tune.svg';
import MenuArrowDownIcon from '../../icons/ic-menu-arrow-down.svg';
import AuthenticatorIcon from '../../icons/ic-authenticator.svg';
import SpreadsheetsIcon from '../../icons/ic-spreadsheets.svg';
import TasksIcon from '../../icons/ic-tasks.svg';
import MarkdownIcon from '../../icons/ic-markdown.svg';
import CodeIcon from '../../icons/ic-code.svg';

import AccessibilityIcon from '../../icons/ic-accessibility.svg';
import HelpIcon from '../../icons/ic-help.svg';
import KeyboardIcon from '../../icons/ic-keyboard.svg';
import ListedIcon from '../../icons/ic-listed.svg';
import SecurityIcon from '../../icons/ic-security.svg';
import SettingsIcon from '../../icons/ic-settings.svg';
import StarIcon from '../../icons/ic-star.svg';
import ThemesIcon from '../../icons/ic-themes.svg';
import UserIcon from '../../icons/ic-user.svg';
import CopyIcon from '../../icons/ic-copy.svg';
import DownloadIcon from '../../icons/ic-download.svg';
import InfoIcon from '../../icons/ic-info.svg';
import CheckIcon from '../../icons/ic-check.svg';
import CheckBoldIcon from '../../icons/ic-check-bold.svg';
import AccountCircleIcon from '../../icons/ic-account-circle.svg';
import CloudOffIcon from '../../icons/ic-cloud-off.svg';
import SignInIcon from '../../icons/ic-signin.svg';
import SignOutIcon from '../../icons/ic-signout.svg';
import CheckCircleIcon from '../../icons/ic-check-circle.svg';
import SyncIcon from '../../icons/ic-sync.svg';
import ArrowLeftIcon from '../../icons/ic-arrow-left.svg';
import ChevronDownIcon from '../../icons/ic-chevron-down.svg';
import EmailIcon from '../../icons/ic-email.svg';
import ServerIcon from '../../icons/ic-server.svg';
import EyeIcon from '../../icons/ic-eye.svg';
import EyeOffIcon from '../../icons/ic-eye-off.svg';
import LockIcon from '../../icons/ic-lock.svg';
import ArrowsSortUpIcon from '../../icons/ic-arrows-sort-up.svg';
import ArrowsSortDownIcon from '../../icons/ic-arrows-sort-down.svg';

import { toDirective } from './utils';
import { FunctionalComponent } from 'preact';

const ICONS = {
  'arrows-sort-up': ArrowsSortUpIcon,
  'arrows-sort-down': ArrowsSortDownIcon,
  lock: LockIcon,
  eye: EyeIcon,
  'eye-off': EyeOffIcon,
  server: ServerIcon,
  email: EmailIcon,
  'chevron-down': ChevronDownIcon,
  'arrow-left': ArrowLeftIcon,
  sync: SyncIcon,
  'check-circle': CheckCircleIcon,
  signIn: SignInIcon,
  signOut: SignOutIcon,
  'cloud-off': CloudOffIcon,
  'pencil-off': PencilOffIcon,
  'plain-text': PlainTextIcon,
  'rich-text': RichTextIcon,
  code: CodeIcon,
  markdown: MarkdownIcon,
  authenticator: AuthenticatorIcon,
  spreadsheets: SpreadsheetsIcon,
  tasks: TasksIcon,
  trash: TrashIcon,
  pin: PinIcon,
  unpin: UnpinIcon,
  archive: ArchiveIcon,
  unarchive: UnarchiveIcon,
  hashtag: HashtagIcon,
  'chevron-right': ChevronRightIcon,
  restore: RestoreIcon,
  close: CloseIcon,
  password: PasswordIcon,
  'trash-sweep': TrashSweepIcon,
  more: MoreIcon,
  tune: TuneIcon,
  accessibility: AccessibilityIcon,
  help: HelpIcon,
  keyboard: KeyboardIcon,
  listed: ListedIcon,
  security: SecurityIcon,
  settings: SettingsIcon,
  star: StarIcon,
  themes: ThemesIcon,
  user: UserIcon,
  copy: CopyIcon,
  download: DownloadIcon,
  info: InfoIcon,
  check: CheckIcon,
  'check-bold': CheckBoldIcon,
  'account-circle': AccountCircleIcon,
  'menu-arrow-down': MenuArrowDownIcon,
};

export type IconType = keyof typeof ICONS;

type Props = {
  type: IconType;
  className?: string;
};

export const Icon: FunctionalComponent<Props> = ({ type, className = '' }) => {
  const IconComponent = ICONS[type];
  return <IconComponent className={`sn-icon ${className}`} />;
};

export const IconDirective = toDirective<Props>(Icon, {
  type: '@',
  className: '@',
});
