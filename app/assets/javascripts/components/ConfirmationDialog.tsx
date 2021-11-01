import { ComponentChildren, FunctionComponent } from 'preact';
import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogLabel,
} from '@reach/alert-dialog';
import { useRef } from 'preact/hooks';

export const ConfirmationDialog: FunctionComponent<{
  title: string | ComponentChildren;
}> = ({ title, children }) => {
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
          className="max-w-89 bg-default rounded shadow-overlay focus:padded-ring-info px-9 py-9 flex flex-col items-center"
        >
          <AlertDialogLabel>{title}</AlertDialogLabel>
          <div className="min-h-2" />

          <AlertDialogDescription className="flex flex-col items-center">
            {children}
          </AlertDialogDescription>
        </div>
      </div>
    </AlertDialog>
  );
};
