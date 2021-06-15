import PencilOffIcon from '../../icons/ic-pencil-off.svg';
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
import { toDirective } from './utils';
import { FunctionalComponent } from 'preact';

const ICONS = {
  'pencil-off': PencilOffIcon,
  'rich-text': RichTextIcon,
  'trash': TrashIcon,
  'pin': PinIcon,
  'unpin': UnpinIcon,
  'archive': ArchiveIcon,
  'unarchive': UnarchiveIcon,
  'hashtag': HashtagIcon,
  'chevron-right': ChevronRightIcon,
  'restore': RestoreIcon,
  'close': CloseIcon,
  'password': PasswordIcon,
  'trash-sweep': TrashSweepIcon,
  'more': MoreIcon,
  'tune': TuneIcon,
};

type Props = {
  type: keyof (typeof ICONS);
  className: string;
}

export const Icon: FunctionalComponent<Props> = ({ type, className }) => {
  const IconComponent = ICONS[type];
  return <IconComponent className={`sn-icon ${className}`} />;
};

export const IconDirective = toDirective<Props>(
  Icon,
  {
    type: '@',
    className: '@',
  }
);
