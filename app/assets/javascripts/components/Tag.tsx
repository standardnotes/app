import { FunctionalComponent } from 'preact';
import { Icon } from './Icon';

type TagProps = {
  title: string;
  className?: string;
};

export const Tag: FunctionalComponent<TagProps> = ({ title, className }) => (
  <span
    className={`bg-contrast rounded text-xs color-text p-1 flex items-center ${className ?? ''}`}
  >
    <Icon type="hashtag" className="sn-icon--small color-neutral mr-1" />
    {title}
  </span>
);
