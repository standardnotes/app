import { WebApplication } from '@/ui_models/application';
import { DialogContent, DialogOverlay } from '@reach/dialog';
import {
  Challenge,
  ChallengePrompt,
  ChallengeReason,
  ChallengeValue,
  removeFromArray,
} from '@standardnotes/snjs';
import { ProtectedIllustration } from '@standardnotes/stylekit';
import { FunctionComponent } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { ChallengeModalPrompt } from './ChallengePrompt';
import { OtherOptionsMenu } from './OtherOptionsMenu';

type InputValue = {
  prompt: ChallengePrompt;
  value: string | number | boolean;
  invalid: boolean;
};

export type ChallengeModalValues = Record<ChallengePrompt['id'], InputValue>;

type Props = {
  application: WebApplication;
  challenge: Challenge;
  onDismiss: (challenge: Challenge) => Promise<void>;
};

const validateValues = (
  values: ChallengeModalValues,
  prompts: ChallengePrompt[]
): ChallengeModalValues | undefined => {
  let hasInvalidValues = false;
  const validatedValues = { ...values };
  for (const prompt of prompts) {
    const value = validatedValues[prompt.id];
    if (typeof value.value === 'string' && value.value.length === 0) {
      validatedValues[prompt.id].invalid = true;
      hasInvalidValues = true;
    }
  }
  if (!hasInvalidValues) {
    return validatedValues;
  }
};

export const ChallengeModal: FunctionComponent<Props> = ({
  application,
  challenge,
  onDismiss,
}) => {
  const [values, setValues] = useState<ChallengeModalValues>(() => {
    const values = {} as ChallengeModalValues;
    for (const prompt of challenge.prompts) {
      values[prompt.id] = {
        prompt,
        value: prompt.initialValue ?? '',
        invalid: false,
      };
    }
    return values;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setProcessingPrompts] = useState<ChallengePrompt[]>([]);
  const [bypassModalFocusLock, setBypassModalFocusLock] = useState(false);

  const submit = async () => {
    const validatedValues = validateValues(values, challenge.prompts);
    if (!validatedValues) {
      return;
    }
    if (isSubmitting || isProcessing) {
      return;
    }
    setIsSubmitting(true);
    setIsProcessing(true);
    const valuesToProcess: ChallengeValue[] = [];
    for (const inputValue of Object.values(validatedValues)) {
      const rawValue = inputValue.value;
      const value = new ChallengeValue(inputValue.prompt, rawValue);
      valuesToProcess.push(value);
    }
    const processingPrompts = valuesToProcess.map((v) => v.prompt);
    setIsProcessing(processingPrompts.length > 0);
    setProcessingPrompts(processingPrompts);
    /**
     * Unfortunately neccessary to wait 50ms so that the above setState call completely
     * updates the UI to change processing state, before we enter into UI blocking operation
     * (crypto key generation)
     */
    setTimeout(() => {
      if (valuesToProcess.length > 0) {
        application.submitValuesForChallenge(challenge, valuesToProcess);
      } else {
        setIsProcessing(false);
      }
      setIsSubmitting(false);
    }, 50);
  };

  const onValueChange = useCallback(
    (value: string | number, prompt: ChallengePrompt) => {
      const newValues = { ...values };
      newValues[prompt.id].invalid = false;
      newValues[prompt.id].value = value;
      setValues(newValues);
    },
    [values]
  );

  const closeModal = () => {
    if (challenge.cancelable) {
      onDismiss(challenge);
    }
  };

  useEffect(() => {
    const removeChallengeObserver = application.addChallengeObserver(
      challenge,
      {
        onValidValue: (value) => {
          setValues((values) => {
            const newValues = { ...values };
            newValues[value.prompt.id].invalid = false;
            return newValues;
          });
          setProcessingPrompts((currentlyProcessingPrompts) => {
            const processingPrompts = currentlyProcessingPrompts.slice();
            removeFromArray(processingPrompts, value.prompt);
            setIsProcessing(processingPrompts.length > 0);
            return processingPrompts;
          });
        },
        onInvalidValue: (value) => {
          setValues((values) => {
            const newValues = { ...values };
            newValues[value.prompt.id].invalid = true;
            return newValues;
          });
          /** If custom validation, treat all values together and not individually */
          if (!value.prompt.validates) {
            setProcessingPrompts([]);
            setIsProcessing(false);
          } else {
            setProcessingPrompts((currentlyProcessingPrompts) => {
              const processingPrompts = currentlyProcessingPrompts.slice();
              removeFromArray(processingPrompts, value.prompt);
              setIsProcessing(processingPrompts.length > 0);
              return processingPrompts;
            });
          }
        },
        onComplete: () => {
          onDismiss(challenge);
        },
        onCancel: () => {
          onDismiss(challenge);
        },
      }
    );

    return () => {
      removeChallengeObserver();
    };
  }, [application, challenge, onDismiss]);

  if (!challenge.prompts) {
    return null;
  }

  return (
    <DialogOverlay
      className={`sn-component ${
        challenge.reason === ChallengeReason.ApplicationUnlock
          ? 'challenge-modal-overlay'
          : ''
      }`}
      onDismiss={closeModal}
      dangerouslyBypassFocusLock={bypassModalFocusLock}
    >
      <DialogContent
        className={`challenge-modal flex flex-col items-center bg-default px-9 py-12 rounded relative ${
          challenge.reason !== ChallengeReason.ApplicationUnlock
            ? 'shadow-overlay-light border-1 border-solid border-main'
            : 'focus:shadow-none'
        }`}
      >
        {challenge.cancelable && (
          <button
            onClick={closeModal}
            aria-label="Close modal"
            className="flex p-1 bg-transparent border-0 cursor-pointer absolute top-4 right-4"
          >
            <Icon type="close" className="color-neutral" />
          </button>
        )}
        <ProtectedIllustration className="w-30 h-30 mb-4" />
        <div className="font-bold text-base text-center mb-4">
          {challenge.heading}
        </div>
        <form
          className="flex flex-col items-center min-w-68 mb-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          {challenge.prompts.map((prompt, index) => (
            <ChallengeModalPrompt
              key={prompt.id}
              prompt={prompt}
              values={values}
              index={index}
              onValueChange={onValueChange}
              isInvalid={values[prompt.id].invalid}
            />
          ))}
        </form>
        <Button
          variant="primary"
          disabled={isProcessing}
          className="min-w-68 mb-3.5"
          onClick={() => {
            submit();
          }}
        >
          {isProcessing ? 'Generating Keys...' : 'Unlock'}
        </Button>
        <OtherOptionsMenu
          application={application}
          challenge={challenge}
          disabled={isProcessing}
          setBypassFocusLock={setBypassModalFocusLock}
        />
      </DialogContent>
    </DialogOverlay>
  );
};
