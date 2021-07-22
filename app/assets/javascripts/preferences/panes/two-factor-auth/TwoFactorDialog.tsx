import { ComponentChildren, FunctionComponent } from 'preact';
import { IconButton } from '../../../components/IconButton';
import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogLabel,
} from '@reach/alert-dialog';
import { useRef } from 'preact/hooks';

/**
 * TwoFactorDialog is AlertDialog styled for 2FA
 * Can be generalized but more use cases are needed
 */
export const TwoFactorDialog: FunctionComponent<{
  children: ComponentChildren;
}> = ({ children }) => {
  const ldRef = useRef<HTMLButtonElement>();

  return (
    <AlertDialog leastDestructiveRef={ldRef}>
      <div className="sn-component">
        <div className="w-160 bg-default rounded shadow-overlay focus:padded-ring-info">
          {children}
        </div>
      </div>
    </AlertDialog>
  );
};

export const TwoFactorDialogLabel: FunctionComponent<{
  closeDialog: () => void;
}> = ({ children, closeDialog }) => (
  <AlertDialogLabel className="">
    <div className="px-4 pt-4 pb-3 flex flex-row">
      <div className="flex-grow color-black text-lg font-bold">{children}</div>
      <IconButton
        className="color-grey-1 h-5 w-5"
        icon="close"
        onClick={() => closeDialog()}
      />
    </div>
    <hr className="h-1px bg-border no-border m-0" />
  </AlertDialogLabel>
);

export const TwoFactorDialogDescription: FunctionComponent = ({ children }) => (
  <AlertDialogDescription className="px-4 py-4">
    {children}
  </AlertDialogDescription>
);

export const TwoFactorDialogButtons: FunctionComponent = ({ children }) => (
  <>
    <hr className="h-1px bg-border no-border m-0" />
    <div className="px-4 py-4 flex flex-row justify-end gap-3">{children}</div>
  </>
);
