import { Icon } from '@/components/Icon';
import { FeaturesState } from '@/ui_models/app_state/features_state';
import { TagsState } from '@/ui_models/app_state/tags_state';
import '@reach/tooltip/styles.css';
import {
  SmartView,
  SystemViewId,
  IconType,
  isSystemView,
} from '@standardnotes/snjs';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

type Props = {
  view: SmartView;
  tagsState: TagsState;
  features: FeaturesState;
};

const PADDING_BASE_PX = 14;
const PADDING_PER_LEVEL_PX = 21;

const smartViewIconType = (view: SmartView): IconType => {
  if (view.uuid === SystemViewId.AllNotes) {
    return 'notes';
  }
  if (view.uuid === SystemViewId.ArchivedNotes) {
    return 'archive';
  }
  if (view.uuid === SystemViewId.TrashedNotes) {
    return 'trash';
  }
  if (view.uuid === SystemViewId.UntaggedNotes) {
    return 'hashtag-off';
  }

  return 'hashtag';
};

export const SmartViewsListItem: FunctionComponent<Props> = observer(
  ({ view, tagsState }) => {
    const [title, setTitle] = useState(view.title || '');
    const inputRef = useRef<HTMLInputElement>(null);

    const level = 0;
    const isSelected = tagsState.selected === view;
    const isEditing = tagsState.editingTag === view;

    useEffect(() => {
      setTitle(view.title || '');
    }, [setTitle, view]);

    const selectCurrentTag = useCallback(() => {
      tagsState.selected = view;
    }, [tagsState, view]);

    const onBlur = useCallback(() => {
      tagsState.save(view, title);
      setTitle(view.title);
    }, [tagsState, view, title, setTitle]);

    const onInput = useCallback(
      (e: Event) => {
        const value = (e.target as HTMLInputElement).value;
        setTitle(value);
      },
      [setTitle]
    );

    const onKeyUp = useCallback(
      (e: KeyboardEvent) => {
        if (e.code === 'Enter') {
          inputRef.current?.blur();
          e.preventDefault();
        }
      },
      [inputRef]
    );

    useEffect(() => {
      if (isEditing) {
        inputRef.current?.focus();
      }
    }, [inputRef, isEditing]);

    const onClickRename = useCallback(() => {
      tagsState.editingTag = view;
    }, [tagsState, view]);

    const onClickSave = useCallback(() => {
      inputRef.current?.blur();
    }, [inputRef]);

    const onClickDelete = useCallback(() => {
      tagsState.remove(view, true);
    }, [tagsState, view]);

    const isFaded = false;
    const iconType = smartViewIconType(view);

    return (
      <>
        <div
          className={`tag ${isSelected ? 'selected' : ''} ${
            isFaded ? 'faded' : ''
          }`}
          onClick={selectCurrentTag}
          style={{
            paddingLeft: `${level * PADDING_PER_LEVEL_PX + PADDING_BASE_PX}px`,
          }}
        >
          {!view.errorDecrypting ? (
            <div className="tag-info">
              <div className={`tag-icon mr-1`}>
                <Icon
                  type={iconType}
                  className={`${isSelected ? 'color-info' : 'color-neutral'}`}
                />
              </div>
              <input
                className={`title ${isEditing ? 'editing' : ''}`}
                disabled={!isEditing}
                id={`react-tag-${view.uuid}`}
                onBlur={onBlur}
                onInput={onInput}
                value={title}
                onKeyUp={onKeyUp}
                spellCheck={false}
                ref={inputRef}
              />
              <div className="count">
                {view.uuid === SystemViewId.AllNotes && tagsState.allNotesCount}
              </div>
            </div>
          ) : null}
          {!isSystemView(view) && (
            <div className="meta">
              {view.conflictOf && (
                <div className="danger small-text font-bold">
                  Conflicted Copy {view.conflictOf}
                </div>
              )}
              {view.errorDecrypting && !view.waitingForKey && (
                <div className="danger small-text font-bold">Missing Keys</div>
              )}
              {view.errorDecrypting && view.waitingForKey && (
                <div className="info small-text font-bold">
                  Waiting For Keys
                </div>
              )}
              {isSelected && (
                <div className="menu">
                  {!isEditing && (
                    <a className="item" onClick={onClickRename}>
                      Rename
                    </a>
                  )}
                  {isEditing && (
                    <a className="item" onClick={onClickSave}>
                      Save
                    </a>
                  )}
                  <a className="item" onClick={onClickDelete}>
                    Delete
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </>
    );
  }
);
