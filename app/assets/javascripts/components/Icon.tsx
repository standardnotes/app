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
import { toDirective } from './utils';

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
};

type Props = {
  type: keyof (typeof ICONS);
  className: string;
}

export const Icon: React.FC<Props> = ({ type, className }) => {
  const IconComponent = ICONS[type];
  return <IconComponent className={className} />;
};

export const IconDirective = toDirective<Props>(
  Icon,
  {
    type: '@',
    className: '@',
  }
);
