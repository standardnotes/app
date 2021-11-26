import { confirmDialog } from '@/services/alertService';
import { STRING_DELETE_TAG } from '@/strings';
import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { SNTag, TagMutator } from '@standardnotes/snjs';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { useCallback } from 'preact/hooks';
import { TagsListItem } from './TagsListItem';
import { toDirective } from './utils';

type Props = {
  application: WebApplication;
  appState: AppState;
};

const withTemplate = (template: SNTag | undefined, tags: SNTag[]): SNTag[] => {
  if (!template) {
    return tags;
  } else {
    return [template, ...tags];
  }
};

export const TagsList: FunctionComponent<Props> = observer(
  ({ application, appState }) => {
    const templateTag = appState.templateTag;
    const tags = appState.tags.tags;
    const allTags = withTemplate(templateTag, tags);

    const selectTag = useCallback(
      (tag: SNTag) => {
        appState.setSelectedTag(tag);
      },
      [appState]
    );

    const saveTag = useCallback(
      async (tag: SNTag, newTitle: string) => {
        const templateTag = appState.templateTag;

        const hasEmptyTitle = newTitle.length === 0;
        const hasNotChangedTitle = newTitle === tag.title;
        const isTemplateChange = templateTag && tag.uuid === templateTag.uuid;
        const hasDuplicatedTitle = !!application.findTagByTitle(newTitle);

        runInAction(() => {
          appState.templateTag = undefined;
          appState.editingTag = undefined;
        });

        if (hasEmptyTitle || hasNotChangedTitle) {
          if (isTemplateChange) {
            appState.undoCreateNewTag();
          }
          return;
        }

        if (hasDuplicatedTitle) {
          if (isTemplateChange) {
            appState.undoCreateNewTag();
          }
          application.alertService?.alert(
            'A tag with this name already exists.'
          );
          return;
        }

        if (isTemplateChange) {
          const insertedTag = await application.insertItem(templateTag);
          const changedTag = await application.changeItem<TagMutator>(
            insertedTag.uuid,
            (m) => {
              m.title = newTitle;
            }
          );

          selectTag(changedTag as SNTag);
          await application.saveItem(insertedTag.uuid);
        } else {
          await application.changeAndSaveItem<TagMutator>(
            tag.uuid,
            (mutator) => {
              mutator.title = newTitle;
            }
          );
        }
      },
      [appState, application, selectTag]
    );

    const removeTag = useCallback(
      async (tag: SNTag) => {
        if (
          await confirmDialog({
            text: STRING_DELETE_TAG,
            confirmButtonStyle: 'danger',
          })
        ) {
          appState.removeTag(tag);
        }
      },
      [appState]
    );

    return (
      <>
        {allTags.length === 0 ? (
          <div className="no-tags-placeholder">
            No tags. Create one using the add button above.
          </div>
        ) : (
          <>
            {allTags.map((tag) => {
              return (
                <TagsListItem
                  key={tag.uuid}
                  tag={tag}
                  selectTag={selectTag}
                  saveTag={saveTag}
                  removeTag={removeTag}
                  appState={appState}
                />
              );
            })}
          </>
        )}
      </>
    );
  }
);

export const TagsListDirective = toDirective<Props>(TagsList);
