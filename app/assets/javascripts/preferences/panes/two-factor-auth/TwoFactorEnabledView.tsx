import { CircleProgressTime } from '@/components/CircleProgressTime';
import { DecoratedInput } from '@/components/DecoratedInput';
import { IconButton } from '@/components/IconButton';
import { FunctionComponent } from 'preact';
import { downloadSecretKey } from './download-secret-key';
import { Text } from '../../components';

export const TwoFactorEnabledView: FunctionComponent<{
  secretKey: string;
  authCode: string;
}> = ({ secretKey, authCode }) => {
  const download = (
    <IconButton
      icon="download"
      onClick={() => {
        downloadSecretKey(secretKey);
      }}
    />
  );
  const copy = (
    <IconButton
      icon="copy"
      onClick={() => {
        navigator?.clipboard?.writeText(secretKey);
      }}
    />
  );
  const progress = <CircleProgressTime time={30000} />;
  return (
    <div className="flex flex-row gap-4">
      <div className="flex-grow flex flex-col">
        <Text>Secret Key</Text>
        <DecoratedInput
          disabled={true}
          right={[copy, download]}
          text={secretKey}
        />
      </div>
      <div className="w-30 flex flex-col">
        <Text>Authentication Code</Text>
        <DecoratedInput disabled={true} text={authCode} right={[progress]} />
      </div>
    </div>
  );
};
