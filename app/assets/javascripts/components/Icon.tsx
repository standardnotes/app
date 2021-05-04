import PencilOffIcon from '../../icons/ic-pencil-off.svg';
import RichTextIcon from '../../icons/ic-text-rich.svg';
import TrashIcon from '../../icons/ic-trash.svg';
import PinIcon from '../../icons/ic-pin.svg';
import UnpinIcon from '../../icons/ic-pin-off.svg';
import ArchiveIcon from '../../icons/ic-archive.svg';
import UnarchiveIcon from '../../icons/ic-unarchive.svg';
import HashtagIcon from '../../icons/ic-hashtag.svg';
import ChevronRightIcon from '../../icons/ic-chevron-right.svg';
import { toDirective } from './utils';

export enum IconType {
  PencilOff = 'pencil-off',
  RichText = 'rich-text',
  Trash = 'trash',
  Pin = 'pin',
  Unpin = 'unpin',
  Archive = 'archive',
  Unarchive = 'unarchive',
  Hashtag = 'hashtag',
  ChevronRight = 'chevron-right',
}

const ICONS = {
  [IconType.PencilOff]: PencilOffIcon,
  [IconType.RichText]: RichTextIcon,
  [IconType.Trash]: TrashIcon,
  [IconType.Pin]: PinIcon,
  [IconType.Unpin]: UnpinIcon,
  [IconType.Archive]: ArchiveIcon,
  [IconType.Unarchive]: UnarchiveIcon,
  [IconType.Hashtag]: HashtagIcon,
  [IconType.ChevronRight]: ChevronRightIcon,
};

type Props = {
  type: IconType;
  className: string;
}

export const Icon: React.FC<Props> = ({ type, className }) => {
  const IconComponent = ICONS[type];
  return type ? <IconComponent className={className} /> : null;
};

export const IconDirective = toDirective<Props>(
  Icon,
  {
    type: '@',
    className: '@',
  }
);
