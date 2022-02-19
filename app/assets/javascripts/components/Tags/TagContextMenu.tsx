import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { useCallback, useEffect, useRef } from 'preact/hooks';
import { Icon } from '../Icon';
import { Menu } from '../menu/Menu';
import { MenuItem, MenuItemType } from '../menu/MenuItem';
import { useCloseOnBlur } from '../utils';

type Props = {
  appState: AppState;
};

export const TagsContextMenu: FunctionComponent<Props> = observer(
  ({ appState }) => {
    const selectedTag = appState.tags.selected;

    if (!selectedTag) {
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
      appState.tags.setContextMenuOpen(false);
      appState.tags.setAddingSubtagTo(selectedTag);
    }, [appState.tags, selectedTag]);

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
            className={`py-1.5`}
            onClick={onClickAddSubtag}
          >
            <Icon type="add" className="color-neutral mr-2" />
            Add subtag
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
            className={`py-1.5 color-danger`}
            onClick={onClickDelete}
          >
            <Icon type="trash" className="mr-2" />
            Delete
          </MenuItem>
        </Menu>
      </div>
    ) : null;
  }
);
