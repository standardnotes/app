import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogLabel,
} from '@reach/alert-dialog';
import { FunctionalComponent } from 'preact';
import { Icon } from './Icon';
import { PremiumIllustration } from '@standardnotes/stylekit';
import { useRef } from 'preact/hooks';

type Props = {
  featureName: string;
  onClose: () => void;
  showModal: boolean;
};

export const PremiumFeaturesModal: FunctionalComponent<Props> = ({
  featureName,
  onClose,
  showModal,
}) => {
  const plansButtonRef = useRef<HTMLButtonElement>(null);

  const onClickPlans = () => {
    if (window._plans_url) {
      window.location.assign(window._plans_url);
    }
  };

  return showModal ? (
    <AlertDialog leastDestructiveRef={plansButtonRef}>
      <div tabIndex={-1} className="sn-component">
        <div
          tabIndex={0}
          className="max-w-89 bg-default rounded shadow-overlay p-4"
        >
          <AlertDialogLabel>
            <div className="flex justify-end p-1">
              <button
                className="flex p-0 cursor-pointer bg-transparent border-0"
                onClick={onClose}
                aria-label="Close modal"
              >
                <Icon className="color-neutral" type="close" />
              </button>
            </div>
            <div
              className="flex items-center justify-center p-1"
              aria-hidden={true}
            >
              <PremiumIllustration className="mb-2" />
            </div>
            <div className="text-lg text-center font-bold mb-1">
              Enable Premium Features
            </div>
          </AlertDialogLabel>
          <AlertDialogDescription className="text-sm text-center color-grey-1 px-4.5 mb-2">
            In order to use <span className="font-semibold">{featureName}</span>{' '}
            and other premium features, please purchase a subscription or
            upgrade your current plan.
          </AlertDialogDescription>
          <div className="p-4">
            <button
              onClick={onClickPlans}
              className="w-full rounded no-border py-2 font-bold bg-info color-info-contrast hover:brightness-130 focus:brightness-130 cursor-pointer"
              ref={plansButtonRef}
            >
              See Plans
            </button>
          </div>
        </div>
      </div>
    </AlertDialog>
  ) : null;
};
