import { Icon, IconType } from '@/components/Icon';
import { FeaturesState } from '@/ui_models/app_state/features_state';
import { TagsState } from '@/ui_models/app_state/tags_state';
import '@reach/tooltip/styles.css';
import { SNSmartTag } from '@standardnotes/snjs';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { useCallback } from 'preact/hooks';

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
    const level = 0;
    const isSelected = tagsState.selected === tag;
    const isSmartTagsEnabled = features.enableNativeSmartTagsFeature;

    const selectCurrentTag = useCallback(() => {
      tagsState.selected = tag;
    }, [tagsState, tag]);

    // TODO: add back rename smart tags.

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
              <div className={`title`}>{tag.title}</div>
              {tag.isAllTag && (
                <div className="count">{tagsState.allNotesCount}</div>
              )}
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
