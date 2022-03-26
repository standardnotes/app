import { ChallengePrompt, ChallengeValidation } from '@standardnotes/snjs';
import { FunctionComponent } from 'preact';
import { DecoratedInput } from '../DecoratedInput';
import { DecoratedPasswordInput } from '../DecoratedPasswordInput';

type Props = {
  prompt: ChallengePrompt;
  onValueChange: (value: string | number, prompt: ChallengePrompt) => void;
  isInvalid: boolean;
};

export const ChallengeModalPrompt: FunctionComponent<Props> = ({
  prompt,
  onValueChange,
  isInvalid,
}) => {
  return (
    <>
      {prompt.validation === ChallengeValidation.ProtectionSessionDuration ? (
        <></>
      ) : (
        <>
          {prompt.secureTextEntry ? (
            <DecoratedPasswordInput
              className={isInvalid ? 'border-danger' : ''}
              onChange={(value) => onValueChange(value, prompt)}
            />
          ) : (
            <DecoratedInput
              className={isInvalid ? 'border-danger' : ''}
              onChange={(value) => onValueChange(value, prompt)}
            />
          )}
        </>
      )}
      {isInvalid && (
        <div className="text-sm color-danger mt-3">
          Invalid authentication, please try again.
        </div>
      )}
    </>
  );
};
