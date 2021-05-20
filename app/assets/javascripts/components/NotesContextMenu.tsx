import { AppState } from '@/ui_models/app_state';
import { toDirective, useCloseOnBlur } from './utils';
import { observer } from 'mobx-react-lite';
import { NotesOptions } from './NotesOptions';
import { useCallback, useEffect, useRef } from 'preact/hooks';

type Props = {
  appState: AppState;
};

const NotesContextMenu = observer(({ appState }: Props) => {
  const contextMenuRef = useRef<HTMLDivElement>();
  const [closeOnBlur] = useCloseOnBlur(
    contextMenuRef,
    (open: boolean) => appState.notes.setContextMenuOpen(open)
  );

  const closeOnClickOutside = useCallback((event: MouseEvent) => {
    if (!contextMenuRef.current?.contains(event.target as Node)) {
      appState.notes.setContextMenuOpen(false);
    }
  }, [appState]);

  useEffect(() => {
    document.addEventListener('click', closeOnClickOutside);
    return () => {
      document.removeEventListener('click', closeOnClickOutside);
    };
  }, [closeOnClickOutside]);

  return appState.notes.contextMenuOpen ? (
    <div
      ref={contextMenuRef}
      className="sn-dropdown max-w-80 flex flex-col py-2 overflow-y-scroll absolute"
      style={{ ...appState.notes.contextMenuPosition, maxHeight: appState.notes.contextMenuMaxHeight }}
    >
      <NotesOptions
        appState={appState}
        closeOnBlur={closeOnBlur}
      />
    </div>
  ) : null;
});

export const NotesContextMenuDirective = toDirective<Props>(NotesContextMenu);
