import { FunctionComponent } from 'preact';

import { IconButton } from '../../../components/IconButton';

import { useState } from 'preact/hooks';

export const CopyButton: FunctionComponent<{ copyValue: string }> = ({ copyValue: secretKey }) => {
  const [isCopied, setCopied] = useState(false);
  return (
    <IconButton
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
