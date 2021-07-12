import { FunctionComponent } from 'preact';

export const TitleBar: FunctionComponent<{ className?: string }> = ({
  children,
  className,
}) => <div className={`sn-titlebar ${className ?? ''}`}>{children}</div>;

export const Title: FunctionComponent<{ className?: string }> = ({
  children,
  className,
}) => {
  return <div className={`sn-title ${className ?? ''}`}>{children}</div>;
};
