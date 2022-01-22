import { WebApplication } from '@/ui_models/application';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@reach/disclosure';
import { FeatureIdentifier } from '@standardnotes/features';
import { ComponentArea, SNComponent, SNNote } from '@standardnotes/snjs';
import { FunctionComponent } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Icon, IconType } from '../Icon';
import { useCloseOnBlur } from '../utils';
import { createEditorMenuGroups } from './changeEditor/createEditorMenuGroups';
import { EditorAccordionMenu } from './changeEditor/EditorAccordionMenu';

type ChangeEditorOptionProps = {
  application: WebApplication;
  note: SNNote;
};

type AccordionMenuGroup<T> = {
  icon?: IconType;
  iconClassName?: string;
  title: string;
  items: Array<T>;
};

export type EditorLike =
  | SNComponent
  | {
      name: string;
      identifier?: FeatureIdentifier;
    };

export type EditorMenuGroup = AccordionMenuGroup<EditorLike>;

export const ChangeEditorOption: FunctionComponent<ChangeEditorOptionProps> = ({
  application,
  note,
}) => {
  const [changeEditorMenuOpen, setChangeEditorMenuOpen] = useState(false);
  const [changeEditorMenuPosition, setChangeEditorMenuPosition] = useState<{
    top?: number | 'auto';
    right?: number | 'auto';
    bottom: number | 'auto';
    left?: number | 'auto';
  }>({
    right: 0,
    bottom: 0,
  });
  const changeEditorMenuRef = useRef<HTMLDivElement>(null);
  const changeEditorButtonRef = useRef<HTMLButtonElement>(null);
  const [closeEditorMenuOnBlur] = useCloseOnBlur(
    changeEditorMenuRef,
    setChangeEditorMenuOpen
  );
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
  const selectedEditor = application.componentManager.editorForNote(note);

  useEffect(() => {
    setEditorMenuGroups(createEditorMenuGroups(editors));
  }, [editors]);

  const toggleChangeEditorMenu = () => {
    const defaultFontSize = window.getComputedStyle(
      document.documentElement
    ).fontSize;
    const maxChangeEditorMenuSize = parseFloat(defaultFontSize) * 30;
    const { clientWidth, clientHeight } = document.documentElement;
    const buttonRect = changeEditorButtonRef.current?.getBoundingClientRect();
    const buttonParentRect =
      changeEditorButtonRef.current?.parentElement?.getBoundingClientRect();
    const footerHeightInPx = 32;

    if (buttonRect && buttonParentRect) {
      let positionBottom =
        clientHeight - buttonRect.bottom - buttonRect.height / 2;

      if (positionBottom < footerHeightInPx) {
        positionBottom = footerHeightInPx + 5;
      }

      if (buttonRect.right + maxChangeEditorMenuSize > clientWidth) {
        setChangeEditorMenuPosition({
          bottom: positionBottom,
          right: clientWidth - buttonRect.left,
        });
      } else {
        setChangeEditorMenuPosition({
          bottom: positionBottom,
          left: buttonRect.right,
        });
      }
    }

    setChangeEditorMenuOpen(!changeEditorMenuOpen);
  };

  useEffect(() => {
    if (changeEditorMenuOpen) {
      const changeEditorMenuBoundingRect =
        changeEditorMenuRef.current?.getBoundingClientRect();

      if (changeEditorMenuBoundingRect) {
        if (changeEditorMenuBoundingRect.y < 5) {
          setChangeEditorMenuPosition({
            ...changeEditorMenuPosition,
            top: 5,
            bottom: 'auto',
          });
        }
      }
    }
  }, [changeEditorMenuOpen, changeEditorMenuPosition]);

  return (
    <Disclosure open={changeEditorMenuOpen} onChange={toggleChangeEditorMenu}>
      <DisclosureButton
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setChangeEditorMenuOpen(false);
          }
        }}
        onBlur={closeEditorMenuOnBlur}
        ref={changeEditorButtonRef}
        className="sn-dropdown-item justify-between"
      >
        <div className="flex items-center">
          <Icon type="editor" className="color-neutral mr-2" />
          Change editor
        </div>
        <Icon type="chevron-right" className="color-neutral" />
      </DisclosureButton>
      <DisclosurePanel
        ref={changeEditorMenuRef}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setChangeEditorMenuOpen(false);
            changeEditorButtonRef.current?.focus();
          }
        }}
        style={{
          ...changeEditorMenuPosition,
          position: 'fixed',
        }}
        className="sn-dropdown min-w-80 flex flex-col py-2 max-h-120 max-w-xs fixed overflow-y-auto"
      >
        <EditorAccordionMenu
          groups={editorMenuGroups}
          selectedEditor={selectedEditor}
        />
      </DisclosurePanel>
    </Disclosure>
  );
};
