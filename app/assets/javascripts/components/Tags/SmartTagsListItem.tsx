import { Icon, IconType } from '@/components/Icon';
import { FeaturesState } from '@/ui_models/app_state/features_state';
import { TagsState } from '@/ui_models/app_state/tags_state';
import '@reach/tooltip/styles.css';
import { SNSmartTag } from '@standardnotes/snjs';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

type Props = {
  tag: SNSmartTag;
  tagsState: TagsState;
  features: FeaturesState;
};

const smartTagIconType = (tag: SNSmartTag): IconType => {
  if (tag.isAllTag) {
    return 'notes';
  }
  if (tag.isArchiveTag) {
    return 'archive';
  }
  if (tag.isTrashTag) {
    return 'trash';
  }
  return 'hashtag';
};

export const SmartTagsListItem: FunctionComponent<Props> = observer(
  ({ tag, tagsState, features }) => {
    const [title, setTitle] = useState(tag.title || '');
    const inputRef = useRef<HTMLInputElement>(null);

    const level = 0;
    const isSelected = tagsState.selected === tag;
    const isEditing = tagsState.editingTag === tag;
    const isSmartTagsEnabled = features.enableNativeSmartTagsFeature;

    useEffect(() => {
      setTitle(tag.title || '');
    }, [setTitle, tag]);

    const selectCurrentTag = useCallback(() => {
      tagsState.selected = tag;
    }, [tagsState, tag]);

    const onBlur = useCallback(() => {
      tagsState.save(tag, title);
      setTitle(tag.title);
    }, [tagsState, tag, title, setTitle]);

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
      tagsState.editingTag = tag;
    }, [tagsState, tag]);

    const onClickSave = useCallback(() => {
      inputRef.current?.blur();
    }, [inputRef]);

    const onClickDelete = useCallback(() => {
      tagsState.remove(tag);
    }, [tagsState, tag]);

    const isFaded = !isSmartTagsEnabled && !tag.isAllTag;
    const iconType = smartTagIconType(tag);

    return (
      <>
        <div
          className={`tag ${isSelected ? 'selected' : ''} ${
            isFaded ? 'faded' : ''
          }`}
          onClick={selectCurrentTag}
          style={{ paddingLeft: `${level + 0.5}rem` }}
        >
          {!tag.errorDecrypting ? (
            <div className="tag-info">
              {isSmartTagsEnabled && (
                <div className={`tag-icon mr-1`}>
                  <Icon
                    type={iconType}
                    className={`${isSelected ? 'color-info' : 'color-neutral'}`}
                  />
                </div>
              )}
              <input
                className={`title ${isEditing ? 'editing' : ''}`}
                id={`react-tag-${tag.uuid}`}
                onBlur={onBlur}
                onInput={onInput}
                value={title}
                onKeyUp={onKeyUp}
                spellCheck={false}
                ref={inputRef}
              />
              <div className="count">
                {tag.isAllTag && tagsState.allNotesCount}
              </div>
            </div>
          ) : null}
          {!tag.isSystemSmartTag && (
            <div className="meta">
              {tag.conflictOf && (
                <div className="danger small-text font-bold">
                  Conflicted Copy {tag.conflictOf}
                </div>
              )}
              {tag.errorDecrypting && !tag.waitingForKey && (
                <div className="danger small-text font-bold">Missing Keys</div>
              )}
              {tag.errorDecrypting && tag.waitingForKey && (
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
