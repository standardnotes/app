import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { useCallback, useEffect, useRef } from 'preact/hooks';
import { Icon } from '../Icon';
import { Menu } from '../Menu/Menu';
import { MenuItem, MenuItemType } from '../Menu/MenuItem';
import { usePremiumModal } from '../Premium';
import { useCloseOnBlur } from '../utils';
import { SNTag } from '@standardnotes/snjs';

type Props = {
  appState: AppState;
};

export const TagsContextMenu: FunctionComponent<Props> = observer(
  ({ appState }) => {
    const premiumModal = usePremiumModal();
    const selectedTag = appState.tags.selected;

    if (!selectedTag || !(selectedTag instanceof SNTag)) {
      return null;
    }

    const { contextMenuOpen, contextMenuPosition, contextMenuMaxHeight } =
      appState.tags;

    const contextMenuRef = useRef<HTMLDivElement>(null);
    const [closeOnBlur] = useCloseOnBlur(contextMenuRef, (open: boolean) =>
      appState.tags.setContextMenuOpen(open)
    );

    const reloadContextMenuLayout = useCallback(() => {
      appState.tags.reloadContextMenuLayout();
    }, [appState.tags]);

    useEffect(() => {
      window.addEventListener('resize', reloadContextMenuLayout);
      return () => {
        window.removeEventListener('resize', reloadContextMenuLayout);
      };
    }, [reloadContextMenuLayout]);

    const onClickAddSubtag = useCallback(() => {
      if (!appState.features.hasFolders) {
        premiumModal.activate('Folders');
        return;
      }

      appState.tags.setContextMenuOpen(false);
      appState.tags.setAddingSubtagTo(selectedTag);
    }, [
      appState.features.hasFolders,
      appState.tags,
      premiumModal,
      selectedTag,
    ]);

    const onClickRename = useCallback(() => {
      appState.tags.setContextMenuOpen(false);
      appState.tags.editingTag = selectedTag;
    }, [appState.tags, selectedTag]);

    const onClickDelete = useCallback(() => {
      appState.tags.remove(selectedTag, true);
    }, [appState.tags, selectedTag]);

    return contextMenuOpen ? (
      <div
        ref={contextMenuRef}
        className="sn-dropdown min-w-60 max-h-120 max-w-xs flex flex-col py-2 overflow-y-auto fixed"
        style={{
          ...contextMenuPosition,
          maxHeight: contextMenuMaxHeight,
        }}
      >
        <Menu
          a11yLabel="Tag context menu"
          isOpen={contextMenuOpen}
          closeMenu={() => {
            appState.tags.setContextMenuOpen(false);
          }}
        >
          <MenuItem
            type={MenuItemType.IconButton}
            onBlur={closeOnBlur}
            className={`py-1.5 justify-between`}
            onClick={onClickAddSubtag}
          >
            <div className="flex items-center">
              <Icon type="add" className="color-neutral mr-2" />
              Add subtag
            </div>
            {!appState.features.hasFolders && <Icon type="premium-feature" />}
          </MenuItem>
          <MenuItem
            type={MenuItemType.IconButton}
            onBlur={closeOnBlur}
            className={`py-1.5`}
            onClick={onClickRename}
          >
            <Icon type="pencil-filled" className="color-neutral mr-2" />
            Rename
          </MenuItem>
          <MenuItem
            type={MenuItemType.IconButton}
            onBlur={closeOnBlur}
            className={`py-1.5`}
            onClick={onClickDelete}
          >
            <Icon type="trash" className="mr-2 color-danger" />
            <span className="color-danger">Delete</span>
          </MenuItem>
        </Menu>
      </div>
    ) : null;
  }
);
