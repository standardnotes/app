import {
  ChallengePrompt,
  ChallengeValidation,
  ProtectionSessionDurations,
} from '@standardnotes/snjs';
import { FunctionComponent } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { DecoratedInput } from '../DecoratedInput';
import { DecoratedPasswordInput } from '../DecoratedPasswordInput';
import { ChallengeModalValues } from './ChallengeModal';

type Props = {
  prompt: ChallengePrompt;
  values: ChallengeModalValues;
  index: number;
  onValueChange: (value: string | number, prompt: ChallengePrompt) => void;
  isInvalid: boolean;
};

export const ChallengeModalPrompt: FunctionComponent<Props> = ({
  prompt,
  values,
  index,
  onValueChange,
  isInvalid,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (index === 0) {
      inputRef.current?.focus();
    }
  }, [index]);

  useEffect(() => {
    if (isInvalid) {
      inputRef.current?.focus();
    }
  }, [isInvalid]);

  return (
    <>
      {prompt.validation === ChallengeValidation.ProtectionSessionDuration ? (
        <>
          <div className="sk-horizontal-group mt-3">
            <div className="sk-p sk-bold">Allow protected access for</div>
            {ProtectionSessionDurations.map((option) => (
              <label>
                <input
                  type="radio"
                  name={`${prompt.id}-session-duration`}
                  className={
                    'sk-a info ' +
                    (option.valueInSeconds === values[prompt.id].value
                      ? 'boxed'
                      : '')
                  }
                  checked={option.valueInSeconds === values[prompt.id].value}
                  onClick={(event) => {
                    event.preventDefault();
                    onValueChange(option.valueInSeconds, prompt);
                  }}
                />
                {option.label}
              </label>
            ))}
          </div>
        </>
      ) : (
        <>
          {prompt.secureTextEntry ? (
            <DecoratedPasswordInput
              ref={inputRef}
              placeholder={prompt.placeholder}
              className={`w-full max-w-68 ${isInvalid ? 'border-danger' : ''}`}
              onChange={(value) => onValueChange(value, prompt)}
            />
          ) : (
            <DecoratedInput
              ref={inputRef}
              placeholder={prompt.placeholder}
              className={`w-full max-w-68 ${isInvalid ? 'border-danger' : ''}`}
              onChange={(value) => onValueChange(value, prompt)}
            />
          )}
        </>
      )}
      {isInvalid && (
        <div className="text-sm color-danger mt-2">
          Invalid authentication, please try again.
        </div>
      )}
    </>
  );
};
