import { FunctionComponent } from 'preact';
import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogLabel,
} from '@node_modules/@reach/alert-dialog';
import { useRef } from '@node_modules/preact/hooks';
import { IconButton } from '@/components/IconButton';

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
          className="w-160 bg-default rounded shadow-overlay focus:padded-ring-info"
        >
          {children}
        </div>
      </div>
    </AlertDialog>
  );
};

export const ModalDialogLabel: FunctionComponent<{
  closeDialog: () => void;
}> = ({ children, closeDialog }) => (
  <AlertDialogLabel className="">
    <div className="px-4 py-4 flex flex-row items-center">
      <div className="flex-grow color-text text-lg font-bold">{children}</div>
      <IconButton
        focusable={true}
        title="Close"
        className="color-neutral h-5 w-5"
        icon="close"
        onClick={() => closeDialog()}
      />
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

export const ModalDialogButtons: FunctionComponent = ({ children }) => (
  <>
    <hr className="h-1px bg-border no-border m-0" />
    <div className="px-4 py-4 flex flex-row justify-end items-center">
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
