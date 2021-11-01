import { FunctionComponent } from 'preact';
import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogLabel,
} from '@node_modules/@reach/alert-dialog';
import { useRef } from '@node_modules/preact/hooks';

export const ModalDialog: FunctionComponent = ({ children }) => {
  const ldRef = useRef<HTMLButtonElement>(null);

  return (
    <AlertDialog leastDestructiveRef={ldRef}>
      {/* sn-component is focusable by default, but doesn't stretch to child width
          resulting in a badly focused dialog. Utility classes are not available
          at the sn-component level, only below it. tabIndex -1 disables focus
          and enables it on the child component */}
      <div tabIndex={-1} className="sn-component">
        <div
          tabIndex={0}
          className="sk-panel w-160 bg-default rounded shadow-overlay focus:padded-ring-info"
        >
          {children}
        </div>
      </div>
    </AlertDialog>
  );
};

export const ModalDialogLabel: FunctionComponent<{
  closeDialog: () => void;
  className?: string;
}> = ({ children, closeDialog, className }) => (
  <AlertDialogLabel className={className}>
    <div className="w-full flex flex-row justify-between items-center">
      <div className="flex-grow color-text text-base font-medium">
        {children}
      </div>
      <div
        tabIndex={0}
        className="font-bold color-info cursor-pointer"
        onClick={closeDialog}
      >
        Close
      </div>
    </div>
    <hr className="h-1px bg-border no-border m-0" />
  </AlertDialogLabel>
);

export const ModalDialogDescription: FunctionComponent<{ className?: string }> =
  ({ children, className = '' }) => (
    <AlertDialogDescription
      className={`px-4 py-4 flex flex-row items-center ${className}`}
    >
      {children}
    </AlertDialogDescription>
  );

export const ModalDialogButtons: FunctionComponent<{ className?: string }> = ({
  children,
  className,
}) => (
  <>
    <hr className="h-1px bg-border no-border m-0" />
    <div className={`px-4 py-4 flex flex-row items-center ${className}`}>
      {children != undefined && Array.isArray(children)
        ? children.map((child, idx, arr) => (
            <>
              {child}
              {idx < arr.length - 1 ? <div className="min-w-3" /> : undefined}
            </>
          ))
        : children}
    </div>
  </>
);

export default ModalDialog;
