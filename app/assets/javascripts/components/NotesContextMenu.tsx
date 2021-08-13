import { AppState } from '@/ui_models/app_state';
import { toDirective, useCloseOnBlur, useCloseOnClickOutside } from './utils';
import { observer } from 'mobx-react-lite';
import { NotesOptions } from './NotesOptions';
import { useCallback, useEffect, useRef } from 'preact/hooks';
import { WebApplication } from '@/ui_models/application';

type Props = {
  application: WebApplication;
  appState: AppState;
};

const NotesContextMenu = observer(({ application, appState }: Props) => {
  const {
    contextMenuOpen,
    contextMenuPosition,
    contextMenuMaxHeight,
  } = appState.notes;

  const contextMenuRef = useRef<HTMLDivElement>();
  const [closeOnBlur] = useCloseOnBlur(
    contextMenuRef,
    (open: boolean) => appState.notes.setContextMenuOpen(open)
  );

  useCloseOnClickOutside(
    contextMenuRef, 
    (open: boolean) => appState.notes.setContextMenuOpen(open)
  );

  const reloadContextMenuLayout = useCallback(() => {
    appState.notes.reloadContextMenuLayout();
  }, [appState.notes]);

  useEffect(() => {
    window.addEventListener('resize', reloadContextMenuLayout);
    return () => {
      window.removeEventListener('resize', reloadContextMenuLayout);
    };
  }, [reloadContextMenuLayout]);

  return contextMenuOpen ? (
    <div
      ref={contextMenuRef}
      className="sn-dropdown min-w-80 max-h-120 max-w-xs flex flex-col py-2 overflow-y-auto fixed"
      style={{
        ...contextMenuPosition,
        maxHeight: contextMenuMaxHeight,
      }}
    >
      <NotesOptions
        application={application}
        appState={appState}
        closeOnBlur={closeOnBlur}
      />
    </div>
  ) : null;
});

export const NotesContextMenuDirective = toDirective<Props>(NotesContextMenu);
