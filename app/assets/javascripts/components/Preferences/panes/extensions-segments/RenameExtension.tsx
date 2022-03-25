import { FunctionComponent } from 'preact';
import { useState, useRef, useEffect } from 'preact/hooks';

export const RenameExtension: FunctionComponent<{
  extensionName: string;
  changeName: (newName: string) => void;
}> = ({ extensionName, changeName }) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newExtensionName, setNewExtensionName] =
    useState<string>(extensionName);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming) {
      inputRef.current!.focus();
    }
  }, [inputRef, isRenaming]);

  const startRenaming = () => {
    setNewExtensionName(extensionName);
    setIsRenaming(true);
  };

  const cancelRename = () => {
    setNewExtensionName(extensionName);
    setIsRenaming(false);
  };

  const confirmRename = () => {
    if (!newExtensionName) {
      return;
    }
    changeName(newExtensionName);
    setIsRenaming(false);
  };

  return (
    <div className="flex flex-row mr-3 items-center">
      <input
        ref={inputRef}
        disabled={!isRenaming}
        autocomplete="off"
        className="flex-grow text-base font-bold no-border bg-default px-0 color-text"
        type="text"
        value={newExtensionName}
        onChange={({ target: input }) =>
          setNewExtensionName((input as HTMLInputElement)?.value)
        }
      />
      <div className="min-w-3" />
      {isRenaming ? (
        <>
          <a className="pt-1 cursor-pointer" onClick={confirmRename}>
            Confirm
          </a>
          <div className="min-w-3" />
          <a className="pt-1 cursor-pointer" onClick={cancelRename}>
            Cancel
          </a>
        </>
      ) : (
        <a className="pt-1 cursor-pointer" onClick={startRenaming}>
          Rename
        </a>
      )}
    </div>
  );
};
