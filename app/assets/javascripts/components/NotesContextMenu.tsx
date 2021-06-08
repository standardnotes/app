import { AppState } from '@/ui_models/app_state';
import { toDirective, useCloseOnBlur, useCloseOnClickOutside } from './utils';
import { observer } from 'mobx-react-lite';
import { NotesOptions } from './NotesOptions';
import { useRef } from 'preact/hooks';

type Props = {
  appState: AppState;
};

const NotesContextMenu = observer(({ appState }: Props) => {
  const contextMenuRef = useRef<HTMLDivElement>();
  const [closeOnBlur] = useCloseOnBlur(
    contextMenuRef,
    (open: boolean) => appState.notes.setContextMenuOpen(open)
  );

  useCloseOnClickOutside(
    contextMenuRef, 
    (open: boolean) => appState.notes.setContextMenuOpen(open)
  );

  return appState.notes.contextMenuOpen ? (
    <div
      ref={contextMenuRef}
      className="sn-dropdown max-h-120 max-w-xs flex flex-col py-2 overflow-y-scroll fixed"
      style={{
        ...appState.notes.contextMenuPosition,
        maxHeight: appState.notes.contextMenuMaxHeight,
      }}
    >
      <NotesOptions appState={appState} closeOnBlur={closeOnBlur} />
    </div>
  ) : null;
});

export const NotesContextMenuDirective = toDirective<Props>(NotesContextMenu);
