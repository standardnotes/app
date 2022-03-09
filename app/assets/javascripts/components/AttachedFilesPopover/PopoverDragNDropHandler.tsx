import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/constants';
import { FunctionComponent } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import {
  AttachedFilesPopover,
  AttachedFilesPopoverProps,
} from './AttachedFilesPopover';

export const PopoverDragNDropHandler: FunctionComponent<
  AttachedFilesPopoverProps
> = ({ fileActionHandler, appState, application, note }) => {
  const dropzoneRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleDrag = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragIn = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    dragCounter.current = dragCounter.current + 1;

    if (event.dataTransfer?.items.length) {
      setIsDragging(true);
    }
  };

  const handleDragOut = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    dragCounter.current = dragCounter.current - 1;

    if (dragCounter.current > 0) {
      return;
    }

    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(false);

    if (event.dataTransfer?.files.length) {
      console.log(event.dataTransfer.files);
      event.dataTransfer.clearData();
      dragCounter.current = 0;
    }
  };

  useEffect(() => {
    const dropzoneElement = dropzoneRef.current;

    if (dropzoneElement) {
      dropzoneElement.addEventListener('dragenter', handleDragIn);
      dropzoneElement.addEventListener('dragleave', handleDragOut);
      dropzoneElement.addEventListener('dragover', handleDrag);
      dropzoneElement.addEventListener('drop', handleDrop);
    }

    return () => {
      dropzoneElement?.removeEventListener('dragenter', handleDragIn);
      dropzoneElement?.removeEventListener('dragleave', handleDragOut);
      dropzoneElement?.removeEventListener('dragover', handleDrag);
      dropzoneElement?.removeEventListener('drop', handleDrop);
    };
  }, []);

  return (
    <div
      ref={dropzoneRef}
      className="focus:shadow-none"
      tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
      style={{
        border: isDragging ? '2px dashed var(--sn-stylekit-info-color)' : '',
      }}
    >
      <AttachedFilesPopover
        application={application}
        appState={appState}
        note={note}
        fileActionHandler={fileActionHandler}
      />
    </div>
  );
};
