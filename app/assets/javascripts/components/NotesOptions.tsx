import { AppState } from '@/ui_models/app_state';
import { Icon } from './Icon';
import { Switch } from './Switch';
import { observer } from 'mobx-react-lite';
import { useRef, useState, useEffect, useMemo } from 'preact/hooks';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@reach/disclosure';
import { SNApplication, SNNote } from '@standardnotes/snjs/dist/@types';
import { WebApplication } from '@/ui_models/application';
import { KeyboardModifier } from '@/services/ioService';
import { FunctionComponent } from 'preact';

type Props = {
  application: WebApplication;
  appState: AppState;
  closeOnBlur: (event: { relatedTarget: EventTarget | null }) => void;
  onSubmenuChange?: (submenuOpen: boolean) => void;
};

type DeletePermanentlyButtonProps = {
  closeOnBlur: Props['closeOnBlur'];
  onClick: () => void;
};

const DeletePermanentlyButton = ({
  closeOnBlur,
  onClick,
}: DeletePermanentlyButtonProps) => (
  <button onBlur={closeOnBlur} className="sn-dropdown-item" onClick={onClick}>
    <Icon type="close" className="color-danger mr-2" />
    <span className="color-danger">Delete permanently</span>
  </button>
);

const getWordCount = (text: string) => {
  if (text.trim().length === 0) {
    return 0;
  }
  return text.split(/\s+/).length;
};

const getParagraphCount = (text: string) => {
  if (text.trim().length === 0) {
    return 0;
  }
  return text.replace(/\n$/gm, '').split(/\n/).length;
};

const countNoteAttributes = (text: string) => {
  try {
    JSON.parse(text);
    return {
      characters: 'N/A',
      words: 'N/A',
      paragraphs: 'N/A',
    };
  } catch {
    const characters = text.length;
    const words = getWordCount(text);
    const paragraphs = getParagraphCount(text);

    return {
      characters,
      words,
      paragraphs,
    };
  }
};

const calculateReadTime = (words: number) => {
  const timeToRead = Math.round(words / 200);
  if (timeToRead === 0) {
    return '< 1 minute';
  } else {
    return `${timeToRead} ${timeToRead > 1 ? 'minutes' : 'minute'}`;
  }
};

const formatDate = (date: Date | undefined) => {
  if (!date) return;
  return `${date.toDateString()} ${date.toLocaleTimeString()}`;
};

const NoteAttributes: FunctionComponent<{ application: SNApplication, note: SNNote }> = ({ application, note }) => {
  const { words, characters, paragraphs } = useMemo(
    () => countNoteAttributes(note.text),
    [note.text]
  );

  const readTime = useMemo(
    () => (typeof words === 'number' ? calculateReadTime(words) : 'N/A'),
    [words]
  );

  const dateLastModified = useMemo(
    () => formatDate(note.userModifiedDate),
    [note.userModifiedDate]
  );

  const dateCreated = useMemo(
    () => formatDate(note.created_at),
    [note.created_at]
  );

  const editor = application.componentManager.editorForNote(note);
  const format = editor?.package_info?.file_type || 'txt';

  return (
    <div className="px-3 pt-1.5 pb-1 text-xs color-neutral font-medium">
      {typeof words === 'number' && (format === 'txt' || format === 'md') ? (
        <>
          <div className="mb-1">
            {words} words · {characters} characters · {paragraphs} paragraphs
          </div>
          <div className="mb-1">
            <span className="font-semibold">Read time:</span> {readTime}
          </div>
        </>
      ) : null}
      <div className="mb-1">
        <span className="font-semibold">Last modified:</span> {dateLastModified}
      </div>
      <div className="mb-1">
        <span className="font-semibold">Created:</span> {dateCreated}
      </div>
      <div>
        <span className="font-semibold">Note ID:</span> {note.uuid}
      </div>
    </div>
  );
};

export const NotesOptions = observer(
  ({ application, appState, closeOnBlur, onSubmenuChange }: Props) => {
    const [tagsMenuOpen, setTagsMenuOpen] = useState(false);
    const [tagsMenuPosition, setTagsMenuPosition] = useState<{
      top: number;
      right?: number;
      left?: number;
    }>({
      top: 0,
      right: 0,
    });
    const [tagsMenuMaxHeight, setTagsMenuMaxHeight] = useState<number | 'auto'>(
      'auto'
    );
    const [altKeyDown, setAltKeyDown] = useState(false);

    const toggleOn = (condition: (note: SNNote) => boolean) => {
      const notesMatchingAttribute = notes.filter(condition);
      const notesNotMatchingAttribute = notes.filter(
        (note) => !condition(note)
      );
      return notesMatchingAttribute.length > notesNotMatchingAttribute.length;
    };

    const notes = Object.values(appState.notes.selectedNotes);
    const hidePreviews = toggleOn((note) => note.hidePreview);
    const locked = toggleOn((note) => note.locked);
    const protect = toggleOn((note) => note.protected);
    const archived = notes.some((note) => note.archived);
    const unarchived = notes.some((note) => !note.archived);
    const trashed = notes.some((note) => note.trashed);
    const notTrashed = notes.some((note) => !note.trashed);
    const pinned = notes.some((note) => note.pinned);
    const unpinned = notes.some((note) => !note.pinned);
    const errored = notes.some((note) => note.errorDecrypting);

    const tagsButtonRef = useRef<HTMLButtonElement>(null);

    const iconClass = 'color-neutral mr-2';

    useEffect(() => {
      if (onSubmenuChange) {
        onSubmenuChange(tagsMenuOpen);
      }
    }, [tagsMenuOpen, onSubmenuChange]);

    useEffect(() => {
      const removeAltKeyObserver = application.io.addKeyObserver({
        modifiers: [KeyboardModifier.Alt],
        onKeyDown: () => {
          setAltKeyDown(true);
        },
        onKeyUp: () => {
          setAltKeyDown(false);
        },
      });

      return () => {
        removeAltKeyObserver();
      };
    }, [application]);

    const openTagsMenu = () => {
      const defaultFontSize = window.getComputedStyle(
        document.documentElement
      ).fontSize;
      const maxTagsMenuSize = parseFloat(defaultFontSize) * 30;
      const { clientWidth, clientHeight } = document.documentElement;
      const buttonRect = tagsButtonRef.current!.getBoundingClientRect();
      const footerHeight = 32;

      if (buttonRect.top + maxTagsMenuSize > clientHeight - footerHeight) {
        setTagsMenuMaxHeight(clientHeight - buttonRect.top - footerHeight - 2);
      }

      if (buttonRect.right + maxTagsMenuSize > clientWidth) {
        setTagsMenuPosition({
          top: buttonRect.top,
          right: clientWidth - buttonRect.left,
        });
      } else {
        setTagsMenuPosition({
          top: buttonRect.top,
          left: buttonRect.right,
        });
      }

      setTagsMenuOpen(!tagsMenuOpen);
    };

    const downloadSelectedItems = () => {
      notes.forEach((note) => {
        const editor = application.componentManager.editorForNote(note);
        const format = editor?.package_info?.file_type || 'txt';
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute(
          'href',
          'data:text/plain;charset=utf-8,' + encodeURIComponent(note.text)
        );
        downloadAnchor.setAttribute('download', `${note.title}.${format}`);
        downloadAnchor.click();
      });
    };

    const duplicateSelectedItems = () => {
      notes.forEach((note) => {
        application.duplicateItem(note);
      });
    };

    if (errored) {
      return (
        <>
          {notes.length === 1 ? (
            <div className="px-3 pt-1.5 pb-1 text-xs color-neutral font-medium">
              <div>
                <span className="font-semibold">Note ID:</span> {notes[0].uuid}
              </div>
            </div>
          ) : null}
          <DeletePermanentlyButton
            closeOnBlur={closeOnBlur}
            onClick={async () => {
              await appState.notes.deleteNotesPermanently();
            }}
          />
        </>
      );
    }

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
        <Switch
          onBlur={closeOnBlur}
          className="px-3 py-1.5"
          checked={protect}
          onChange={() => {
            appState.notes.setProtectSelectedNotes(!protect);
          }}
        >
          <span className="flex items-center">
            <Icon type="password" className={iconClass} />
            Protect
          </span>
        </Switch>
        <div className="min-h-1px my-2 bg-border"></div>
        {appState.tags.tagsCount > 0 && (
          <Disclosure open={tagsMenuOpen} onChange={openTagsMenu}>
            <DisclosureButton
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setTagsMenuOpen(false);
                }
              }}
              onBlur={closeOnBlur}
              ref={tagsButtonRef}
              className="sn-dropdown-item justify-between"
            >
              <div className="flex items-center">
                <Icon type="hashtag" className={iconClass} />
                {'Add tag'}
              </div>
              <Icon type="chevron-right" className="color-neutral" />
            </DisclosureButton>
            <DisclosurePanel
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setTagsMenuOpen(false);
                  tagsButtonRef.current!.focus();
                }
              }}
              style={{
                ...tagsMenuPosition,
                maxHeight: tagsMenuMaxHeight,
                position: 'fixed',
              }}
              className="sn-dropdown min-w-80 flex flex-col py-2 max-h-120 max-w-xs fixed overflow-y-auto"
            >
              {appState.tags.tags.map((tag) => (
                <button
                  key={tag.title}
                  className="sn-dropdown-item sn-dropdown-item--no-icon max-w-80"
                  onBlur={closeOnBlur}
                  onClick={() => {
                    appState.notes.isTagInSelectedNotes(tag)
                      ? appState.notes.removeTagFromSelectedNotes(tag)
                      : appState.notes.addTagToSelectedNotes(tag);
                  }}
                >
                  <span
                    className={`whitespace-nowrap overflow-hidden overflow-ellipsis
                      ${
                        appState.notes.isTagInSelectedNotes(tag)
                          ? 'font-bold'
                          : ''
                      }`}
                  >
                    {tag.title}
                  </span>
                </button>
              ))}
            </DisclosurePanel>
          </Disclosure>
        )}
        {unpinned && (
          <button
            onBlur={closeOnBlur}
            className="sn-dropdown-item"
            onClick={() => {
              appState.notes.setPinSelectedNotes(true);
            }}
          >
            <Icon type="pin" className={iconClass} />
            Pin to top
          </button>
        )}
        {pinned && (
          <button
            onBlur={closeOnBlur}
            className="sn-dropdown-item"
            onClick={() => {
              appState.notes.setPinSelectedNotes(false);
            }}
          >
            <Icon type="unpin" className={iconClass} />
            Unpin
          </button>
        )}
        <button
          onBlur={closeOnBlur}
          className="sn-dropdown-item"
          onClick={downloadSelectedItems}
        >
          <Icon type="download" className={iconClass} />
          Export
        </button>
        <button
          onBlur={closeOnBlur}
          className="sn-dropdown-item"
          onClick={duplicateSelectedItems}
        >
          <Icon type="copy" className={iconClass} />
          Duplicate
        </button>
        {unarchived && (
          <button
            onBlur={closeOnBlur}
            className="sn-dropdown-item"
            onClick={() => {
              appState.notes.setArchiveSelectedNotes(true);
            }}
          >
            <Icon type="archive" className={iconClass} />
            Archive
          </button>
        )}
        {archived && (
          <button
            onBlur={closeOnBlur}
            className="sn-dropdown-item"
            onClick={() => {
              appState.notes.setArchiveSelectedNotes(false);
            }}
          >
            <Icon type="unarchive" className={iconClass} />
            Unarchive
          </button>
        )}
        {notTrashed &&
          (altKeyDown ? (
            <DeletePermanentlyButton
              closeOnBlur={closeOnBlur}
              onClick={async () => {
                await appState.notes.deleteNotesPermanently();
              }}
            />
          ) : (
            <button
              onBlur={closeOnBlur}
              className="sn-dropdown-item"
              onClick={async () => {
                await appState.notes.setTrashSelectedNotes(true);
              }}
            >
              <Icon type="trash" className={iconClass} />
              Move to Trash
            </button>
          ))}
        {trashed && (
          <>
            <button
              onBlur={closeOnBlur}
              className="sn-dropdown-item"
              onClick={async () => {
                await appState.notes.setTrashSelectedNotes(false);
              }}
            >
              <Icon type="restore" className={iconClass} />
              Restore
            </button>
            <DeletePermanentlyButton
              closeOnBlur={closeOnBlur}
              onClick={async () => {
                await appState.notes.deleteNotesPermanently();
              }}
            />
            <button
              onBlur={closeOnBlur}
              className="sn-dropdown-item"
              onClick={async () => {
                await appState.notes.emptyTrash();
              }}
            >
              <div className="flex items-start">
                <Icon type="trash-sweep" className="color-danger mr-2" />
                <div className="flex-row">
                  <div className="color-danger">Empty Trash</div>
                  <div className="text-xs">
                    {appState.notes.trashedNotesCount} notes in Trash
                  </div>
                </div>
              </div>
            </button>
          </>
        )}
        {notes.length === 1 ? (
          <>
            <div className="min-h-1px my-2 bg-border"></div>
            <NoteAttributes application={application} note={notes[0]} />
          </>
        ) : null}
      </>
    );
  }
);
