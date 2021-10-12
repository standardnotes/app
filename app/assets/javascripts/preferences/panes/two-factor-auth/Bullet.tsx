import { FunctionComponent } from 'preact';

export const Bullet: FunctionComponent<{ className?: string }> = ({
  className = '',
}) => (
  <div className={`min-w-1 min-h-1 rounded-full bg-inverted-default ${className} mr-2`} />
);
