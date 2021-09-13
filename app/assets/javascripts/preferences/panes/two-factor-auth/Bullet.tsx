import { FunctionComponent } from 'preact';

export const Bullet: FunctionComponent<{ className?: string }> = ({
  className = '',
}) => <div className={` text-sm ${className} mr-2`}>●</div>;
