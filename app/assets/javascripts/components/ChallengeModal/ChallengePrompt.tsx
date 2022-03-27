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
            {ProtectionSessionDurations.map((option) => {
              const selected =
                option.valueInSeconds === values[prompt.id].value;

              return (
                <label
                  className={`cursor-pointer ${
                    selected
                      ? 'bg-info color-info-contrast rounded px-2 py-1.5'
                      : 'color-info hover:underline'
                  }`}
                >
                  <input
                    type="radio"
                    name={`session-duration-${prompt.id}`}
                    className={'appearance-none m-0'}
                    style={{
                      marginRight: 0,
                    }}
                    checked={selected}
                    onChange={(event) => {
                      event.preventDefault();
                      onValueChange(option.valueInSeconds, prompt);
                    }}
                  />
                  {option.label}
                </label>
              );
            })}
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
