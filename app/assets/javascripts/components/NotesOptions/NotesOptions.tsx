import { AppState } from '@/ui_models/app_state';
import { Icon } from '../Icon';
import { Switch } from '../Switch';
import { observer } from 'mobx-react-lite';
import { useState, useEffect, useMemo } from 'preact/hooks';
import { SNApplication, SNNote } from '@standardnotes/snjs';
import { WebApplication } from '@/ui_models/application';
import { KeyboardModifier } from '@/services/ioService';
import { FunctionComponent } from 'preact';
import { ChangeEditorOption } from './ChangeEditorOption';
import { BYTES_IN_ONE_MEGABYTE } from '@/constants';
import { ListedActionsOption } from './ListedActionsOption';
import { AddTagOption } from './AddTagOption';
import { addToast, dismissToast, ToastType } from '@standardnotes/stylekit';

export type NotesOptionsProps = {
  application: WebApplication;
  appState: AppState;
  closeOnBlur: (event: { relatedTarget: EventTarget | null }) => void;
};

type DeletePermanentlyButtonProps = {
  closeOnBlur: NotesOptionsProps['closeOnBlur'];
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

const iconClass = 'color-neutral mr-2';

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

const NoteAttributes: FunctionComponent<{
  application: SNApplication;
  note: SNNote;
}> = ({ application, note }) => {
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
    <div className="px-3 pt-1.5 pb-2.5 text-xs color-neutral font-medium">
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

const SpellcheckOptions: FunctionComponent<{
  appState: AppState;
  note: SNNote;
}> = ({ appState, note }) => {
  const editor = appState.application.componentManager.editorForNote(note);
  const spellcheckControllable = Boolean(
    !editor || editor.package_info.spellcheckControl
  );
  const noteSpellcheck = !spellcheckControllable
    ? true
    : note
    ? appState.notes.getSpellcheckStateForNote(note)
    : undefined;

  return (
    <div className="flex flex-col">
      <button
        className="sn-dropdown-item justify-between px-3 py-1"
        onClick={() => {
          appState.notes.toggleGlobalSpellcheckForNote(note);
        }}
        disabled={!spellcheckControllable}
      >
        <span className="flex items-center">
          <Icon type="notes" className={iconClass} />
          Spellcheck
        </span>
        <Switch
          className="px-0"
          checked={noteSpellcheck}
          disabled={!spellcheckControllable}
        />
      </button>
      {!spellcheckControllable && (
        <p className="text-xs px-3 py-1.5">
          Spellcheck cannot be controlled for this editor.
        </p>
      )}
    </div>
  );
};

const NOTE_SIZE_WARNING_THRESHOLD = 0.5 * BYTES_IN_ONE_MEGABYTE;

const NoteSizeWarning: FunctionComponent<{
  note: SNNote;
}> = ({ note }) =>
  new Blob([note.text]).size > NOTE_SIZE_WARNING_THRESHOLD ? (
    <div className="flex items-center px-3 py-3.5 relative bg-note-size-warning">
      <Icon
        type="warning"
        className="color-accessory-tint-3 flex-shrink-0 mr-3"
      />
      <div className="color-grey-0 select-none leading-140% max-w-80%">
        This note may have trouble syncing to the mobile application due to its
        size.
      </div>
    </div>
  ) : null;

export const NotesOptions = observer(
  ({ application, appState, closeOnBlur }: NotesOptionsProps) => {
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

    const getNoteFileName = (note: SNNote): string => {
      const editor = application.componentManager.editorForNote(note);
      const format = editor?.package_info?.file_type || 'txt';
      return `${note.title}.${format}`;
    };

    const downloadSelectedItems = async () => {
      if (notes.length === 1) {
        application
          .getArchiveService()
          .downloadData(new Blob([notes[0].text]), getNoteFileName(notes[0]));
        return;
      }

      if (notes.length > 1) {
        const loadingToastId = addToast({
          type: ToastType.Loading,
          message: `Exporting ${notes.length} notes...`,
        });
        await application.getArchiveService().downloadDataAsZip(
          notes.map((note) => {
            return {
              filename: getNoteFileName(note),
              content: new Blob([note.text]),
            };
          })
        );
        dismissToast(loadingToastId);
        addToast({
          type: ToastType.Success,
          message: `Exported ${notes.length} notes`,
        });
      }
    };

    const duplicateSelectedItems = () => {
      notes.forEach((note) => {
        application.mutator.duplicateItem(note);
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

    const openRevisionHistoryModal = () => {
      appState.notes.setShowRevisionHistoryModal(true);
    };

    return (
      <>
        {notes.length === 1 && (
          <>
            <button
              onBlur={closeOnBlur}
              className="sn-dropdown-item"
              onClick={openRevisionHistoryModal}
            >
              <Icon type="history" className={iconClass} />
              Note history
            </button>
            <div className="min-h-1px my-2 bg-border"></div>
          </>
        )}
        <button
          className="sn-dropdown-item justify-between"
          onClick={() => {
            appState.notes.setLockSelectedNotes(!locked);
          }}
          onBlur={closeOnBlur}
        >
          <span className="flex items-center">
            <Icon type="pencil-off" className={iconClass} />
            Prevent editing
          </span>
          <Switch className="px-0" checked={locked} />
        </button>
        <button
          className="sn-dropdown-item justify-between"
          onClick={() => {
            appState.notes.setHideSelectedNotePreviews(!hidePreviews);
          }}
          onBlur={closeOnBlur}
        >
          <span className="flex items-center">
            <Icon type="rich-text" className={iconClass} />
            Show preview
          </span>
          <Switch className="px-0" checked={!hidePreviews} />
        </button>
        <button
          className="sn-dropdown-item justify-between"
          onClick={() => {
            appState.notes.setProtectSelectedNotes(!protect);
          }}
          onBlur={closeOnBlur}
        >
          <span className="flex items-center">
            <Icon type="password" className={iconClass} />
            Protect
          </span>
          <Switch className="px-0" checked={protect} />
        </button>
        {notes.length === 1 && (
          <>
            <div className="min-h-1px my-2 bg-border"></div>
            <ChangeEditorOption
              appState={appState}
              application={application}
              note={notes[0]}
            />
          </>
        )}
        <div className="min-h-1px my-2 bg-border"></div>
        {appState.tags.tagsCount > 0 && <AddTagOption appState={appState} />}
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
              Move to trash
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
            <ListedActionsOption application={application} note={notes[0]} />
            <div className="min-h-1px my-2 bg-border"></div>
            <SpellcheckOptions appState={appState} note={notes[0]} />
            <div className="min-h-1px my-2 bg-border"></div>
            <NoteAttributes application={application} note={notes[0]} />
            <NoteSizeWarning note={notes[0]} />
          </>
        ) : null}
      </>
    );
  }
);
