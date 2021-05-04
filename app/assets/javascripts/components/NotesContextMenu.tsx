import { AppState } from '@/ui_models/app_state';
import { toDirective, useCloseOnBlur } from './utils';
import { observer } from 'mobx-react-lite';
import { NotesOptions } from './NotesOptions';
import { useEffect, useRef } from 'preact/hooks';

type Props = {
  appState: AppState;
};

const NotesContextMenu = observer(({ appState }: Props) => {
  const contextMenuRef = useRef<HTMLDivElement>();
  const [closeOnBlur, setLockCloseOnBlur] = useCloseOnBlur(
    contextMenuRef,
    (open: boolean) => appState.notes.setContextMenuOpen(open)
  );

  const closeOnClickOutside = (event: MouseEvent) => {
    if (!contextMenuRef.current?.contains(event.target as Node)) { 
      appState.notes.setContextMenuOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('click', closeOnClickOutside);
    return () => {
      document.removeEventListener('click', closeOnClickOutside);
    };
  });

  return appState.notes.contextMenuOpen ? (
    <div
      ref={contextMenuRef}
      className="sn-dropdown max-w-80 flex flex-col py-2"
      style={{ position: 'absolute', ...appState.notes.contextMenuPosition }}
    >
      <NotesOptions
        appState={appState}
        closeOnBlur={closeOnBlur}
        setLockCloseOnBlur={setLockCloseOnBlur}
      />
    </div>
  ) : null;
});

export const NotesContextMenuDirective = toDirective<Props>(NotesContextMenu);
