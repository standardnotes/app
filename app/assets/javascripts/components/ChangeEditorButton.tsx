import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { MENU_MARGIN_FROM_APP_BORDER } from '@/views/constants';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@reach/disclosure';
import VisuallyHidden from '@reach/visually-hidden';
import { ComponentArea, SNComponent } from '@standardnotes/snjs';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Icon } from './Icon';
import { ChangeEditorMenu } from './NotesOptions/changeEditor/ChangeEditorMenu';
import { createEditorMenuGroups } from './NotesOptions/changeEditor/createEditorMenuGroups';
import { EditorMenuGroup } from './NotesOptions/ChangeEditorOption';
import { useCloseOnBlur } from './utils';

type Props = {
  application: WebApplication;
  appState: AppState;
  onClickPreprocessing?: () => Promise<void>;
};

export const ChangeEditorButton: FunctionComponent<Props> = observer(
  ({ application, appState, onClickPreprocessing }) => {
    const note = Object.values(appState.notes.selectedNotes)[0];
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState({
      top: 0,
      right: 0,
    });
    const [maxHeight, setMaxHeight] = useState<number | 'auto'>('auto');
    const buttonRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [closeOnBlur] = useCloseOnBlur(containerRef, setOpen);
    const [editors] = useState<SNComponent[]>(() =>
      application.componentManager
        .componentsForArea(ComponentArea.Editor)
        .sort((a, b) => {
          return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
        })
    );
    const [editorMenuGroups, setEditorMenuGroups] = useState<EditorMenuGroup[]>(
      []
    );
    const [currentEditor, setCurrentEditor] = useState<SNComponent>();

    useEffect(() => {
      setEditorMenuGroups(createEditorMenuGroups(editors));
    }, [editors]);

    useEffect(() => {
      if (note) {
        setCurrentEditor(application.componentManager.editorForNote(note));
      }
    }, [application, note]);

    const toggleChangeEditorMenu = async () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect) {
        const { clientHeight } = document.documentElement;
        const footerElementRect = document
          .getElementById('footer-bar')
          ?.getBoundingClientRect();
        const footerHeightInPx = footerElementRect?.height;

        if (footerHeightInPx) {
          setMaxHeight(
            clientHeight -
              rect.bottom -
              footerHeightInPx -
              MENU_MARGIN_FROM_APP_BORDER
          );
        }

        setPosition({
          top: rect.bottom,
          right: document.body.clientWidth - rect.right,
        });

        const newOpenState = !open;
        if (newOpenState && onClickPreprocessing) {
          await onClickPreprocessing();
        }

        setOpen(newOpenState);
      }
    };

    return (
      <div ref={containerRef}>
        <Disclosure open={open} onChange={toggleChangeEditorMenu}>
          <DisclosureButton
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setOpen(false);
              }
            }}
            onBlur={closeOnBlur}
            ref={buttonRef}
            className="sn-icon-button"
          >
            <VisuallyHidden>Change editor</VisuallyHidden>
            <Icon type="editor" className="block" />
          </DisclosureButton>
          <DisclosurePanel
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setOpen(false);
                buttonRef.current?.focus();
              }
            }}
            ref={panelRef}
            style={{
              ...position,
              maxHeight,
            }}
            className="sn-dropdown sn-dropdown--animated min-w-68 max-h-120 max-w-xs flex flex-col overflow-y-auto fixed"
            onBlur={closeOnBlur}
          >
            <ChangeEditorMenu
              closeOnBlur={closeOnBlur}
              application={application}
              isOpen={open}
              currentEditor={currentEditor}
              setSelectedEditor={setCurrentEditor}
              note={note}
              groups={editorMenuGroups}
            />
          </DisclosurePanel>
        </Disclosure>
      </div>
    );
  }
);
