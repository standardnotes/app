import { FunctionComponent } from 'preact';

import { IconButton } from '../../../IconButton';

import { useState } from 'preact/hooks';

export const CopyButton: FunctionComponent<{ copyValue: string }> = ({
  copyValue: secretKey,
}) => {
  const [isCopied, setCopied] = useState(false);
  return (
    <IconButton
      focusable={false}
      title="Copy to clipboard"
      icon={isCopied ? 'check' : 'copy'}
      className={isCopied ? 'success' : undefined}
      onClick={() => {
        navigator?.clipboard?.writeText(secretKey);
        setCopied(() => true);
      }}
    />
  );
};
