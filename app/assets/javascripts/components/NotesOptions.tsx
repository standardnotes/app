import { AppState } from '@/ui_models/app_state';
import { Icon } from './Icon';
import { Switch } from './Switch';
import { observer } from 'mobx-react-lite';
import { useRef, useState, useEffect } from 'preact/hooks';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@reach/disclosure';

type Props = {
  appState: AppState;
  closeOnBlur: (event: { relatedTarget: EventTarget | null }) => void;
  onSubmenuChange?: (submenuOpen: boolean) => void;
};

const MAX_TAGS_MENU_HEIGHT = 320;

export const NotesOptions = observer(
  ({ appState, closeOnBlur, onSubmenuChange }: Props) => {
    const [tagsMenuOpen, setTagsMenuOpen] = useState(false);
    const [tagsMenuPosition, setTagsMenuPosition] = useState({
      top: 0,
      right: 0,
    });

    const notes = Object.values(appState.notes.selectedNotes);
    const hidePreviews = notes.some((note) => note.hidePreview);
    const locked = notes.some((note) => note.locked);
    const archived = notes.some((note) => note.archived);
    const trashed = notes.some((note) => note.trashed);
    const pinned = notes.some((note) => note.pinned);

    const tagsButtonRef = useRef<HTMLButtonElement>();

    const iconClass = 'fill-current color-neutral mr-2';
    const buttonClass =
      'flex items-center border-0 focus:inner-ring-info ' +
      'cursor-pointer hover:bg-contrast color-text bg-transparent px-3 ' +
      'text-left';

    useEffect(() => {
      if (onSubmenuChange) {
        onSubmenuChange(tagsMenuOpen);
      } 
    }, [tagsMenuOpen, onSubmenuChange]);

    return (
      <>
        <Switch
          onBlur={closeOnBlur}
          className="px-3 py-1.5"
          checked={locked}
          onChange={() => {
            appState.notes.setLockSelectedNotes(!locked);
          }}
        >
          <span className="flex items-center">
            <Icon type="pencil-off" className={iconClass} />
            Prevent editing
          </span>
        </Switch>
        <Switch
          onBlur={closeOnBlur}
          className="px-3 py-1.5"
          checked={!hidePreviews}
          onChange={() => {
            appState.notes.setHideSelectedNotePreviews(!hidePreviews);
          }}
        >
          <span className="flex items-center">
            <Icon type="rich-text" className={iconClass} />
            Show preview
          </span>
        </Switch>
        <div className="h-1px my-2 bg-border"></div>
        {appState.tags.tagsCount > 0 && (
          <Disclosure
            open={tagsMenuOpen}
            onChange={() => {
              const buttonRect = tagsButtonRef.current.getBoundingClientRect();
              const { offsetTop, offsetWidth } = tagsButtonRef.current;
              setTagsMenuPosition({
                top: offsetTop,
                right:
                  buttonRect.right + MAX_TAGS_MENU_HEIGHT > document.body.clientWidth
                    ? offsetWidth
                    : -offsetWidth,
              });
              setTagsMenuOpen(!tagsMenuOpen);
            }}
          >
            <DisclosureButton
              onKeyUp={(event) => {
                if (event.key === 'Escape') {
                  setTagsMenuOpen(false);
                }
              }}
              onBlur={closeOnBlur}
              ref={tagsButtonRef}
              className={`${buttonClass} py-1.5 justify-between`}
            >
              <div className="flex items-center">
                <Icon type="hashtag" className={iconClass} />
                {'Add tag'}
              </div>
              <Icon
                type="chevron-right"
                className="fill-current color-neutral"
              />
            </DisclosureButton>
            <DisclosurePanel
              onKeyUp={(event) => {
                if (event.key === 'Escape') {
                  setTagsMenuOpen(false);
                  tagsButtonRef.current.focus();
                }
              }}
              style={{
                ...tagsMenuPosition,
              }}
              className="sn-dropdown sn-dropdown-anchor-right flex flex-col py-2 max-h-80 overflow-y-scroll"
            >
              {appState.tags.tags.map((tag) => (
                <button
                  key={tag.title}
                  className={`${buttonClass} py-2`}
                  onBlur={closeOnBlur}
                  onClick={() => {
                    appState.notes.isTagInSelectedNotes(tag)
                      ? appState.notes.removeTagFromSelectedNotes(tag)
                      : appState.notes.addTagToSelectedNotes(tag);
                  }}
                >
                  <span className={appState.notes.isTagInSelectedNotes(tag) ? 'font-bold' : ''}>
                    {tag.title}
                  </span>
                </button>
              ))}
            </DisclosurePanel>
          </Disclosure>
        )}
        <button
          onBlur={closeOnBlur}
          className={`${buttonClass} py-1.5`}
          onClick={() => {
            appState.notes.setPinSelectedNotes(!pinned);
          }}
        >
          <Icon
            type={pinned ? 'unpin' : 'pin'}
            className={iconClass}
          />
          {appState.notes.selectedNotesCount > 1
            ? pinned
              ? 'Unpin notes'
              : 'Pin notes'
            : pinned
            ? 'Unpin note'
            : 'Pin note'}
        </button>
        <button
          onBlur={closeOnBlur}
          className={`${buttonClass} py-1.5`}
          onClick={() => {
            appState.notes.setArchiveSelectedNotes(!archived);
          }}
        >
          <Icon
            type={archived ? 'unarchive' : 'archive'}
            className={iconClass}
          />
          {archived ? 'Unarchive' : 'Archive'}
        </button>
        <button
          onBlur={closeOnBlur}
          className={`${buttonClass} py-1.5`}
          onClick={async () => {
            await appState.notes.setTrashSelectedNotes(!trashed);
          }}
        >
          <Icon type={trashed ? 'restore' : 'trash'} className={iconClass} />
          {trashed ? 'Restore' : 'Move to Trash'}
        </button>
        {appState.selectedTag?.isTrashTag && (
          <button
            onBlur={closeOnBlur}
            className={`${buttonClass} py-1.5`}
            onClick={async () => {
              await appState.notes.deleteNotesPermanently();
            }}
          >
            <Icon type="close" className="fill-current color-danger mr-2" />
            <span className="color-danger">Delete Permanently</span>
          </button>
          )}
      </>
    );
  }
);
