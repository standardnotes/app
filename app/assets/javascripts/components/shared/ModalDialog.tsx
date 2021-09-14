import { FunctionComponent } from 'preact';
import { AlertDialog, AlertDialogDescription, AlertDialogLabel } from '@node_modules/@reach/alert-dialog';
import { useRef } from '@node_modules/preact/hooks';
import { IconButton } from '@/components/IconButton';

type ModalDialogProps = {
  className?: string;
}

type ModalDialogItemProps = {
  showSeparator?: boolean;
}

type ModalDialogLabelProps = ModalDialogItemProps & {
  closeDialog: () => void;
}

export const ModalDialog: FunctionComponent<ModalDialogProps> = ({ children, className = '' }) => {
  const ldRef = useRef<HTMLButtonElement>();

  return (
    <AlertDialog leastDestructiveRef={ldRef}>
      {/* sn-component is focusable by default, but doesn't stretch to child width
          resulting in a badly focused dialog. Utility classes are not available
          at the sn-component level, only below it. tabIndex -1 disables focus
          and enables it on the child component */}
      <div tabIndex={-1} className="sn-component">
        <div
          tabIndex={0}
          className={`w-160 bg-default rounded shadow-overlay focus:padded-ring-info ${className}`}
        >
          {children}
        </div>
      </div>
    </AlertDialog>
  );
};

export const ModalDialogLabel: FunctionComponent<ModalDialogLabelProps> = ({
  children,
  closeDialog,
  showSeparator = true,
}) => {
  const extraVSpacingClass = showSeparator ? 'pb-3' : '';

  return (
    <AlertDialogLabel className="">
      <div className={`px-4 pt-4 ${extraVSpacingClass} flex flex-row`}>
        <div className="flex-grow color-black text-lg font-bold">
          {children}
        </div>
        <IconButton
          className="color-grey-1 h-5 w-5"
          icon="close"
          onClick={() => closeDialog()}
        />
      </div>
      {showSeparator && <hr className="h-1px bg-border no-border m-0" />}
    </AlertDialogLabel>
  );
};

export const ModalDialogDescription: FunctionComponent<ModalDialogItemProps> = ({
  children,
  showSeparator = true
}) => {
  const extraVSpacingClass = showSeparator ? 'py-4' : '';
  const extraHSpacingClass = showSeparator ? 'px-4' : 'mr-9 ml-9';

  return (
    <AlertDialogDescription className={`${extraHSpacingClass} ${extraVSpacingClass}`}>
      {children}
    </AlertDialogDescription>
  );
};

export const ModalDialogButtons: FunctionComponent<ModalDialogItemProps> = ({
  showSeparator = true,
  children
}) => {
  const extraVSpacingClass = showSeparator ? 'py-4' : 'pb-9 mt-4';
  const extraHSpacingClass = showSeparator ? 'px-4' : 'mr-9 ml-9';

  return (
    <>
      {showSeparator && <hr className="h-1px bg-border no-border m-0" />}
      <div className={`${extraHSpacingClass} ${extraVSpacingClass} flex flex-row justify-end gap-3 pb-9`}>{children}</div>
    </>
  );
};
