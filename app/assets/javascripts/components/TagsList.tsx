import { confirmDialog } from '@/services/alertService';
import { STRING_DELETE_TAG } from '@/strings';
import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { isMobile } from '@/utils';
import { SNTag, TagMutator } from '@standardnotes/snjs';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { useCallback } from 'preact/hooks';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { RootTagDropZone, TagsListItem } from './TagsListItem';
import { toDirective } from './utils';

type Props = {
  application: WebApplication;
  appState: AppState;
};

const tagsWithOptionalTemplate = (
  template: SNTag | undefined,
  tags: SNTag[]
): SNTag[] => {
  if (!template) {
    return tags;
  }
  return [template, ...tags];
};

export const TagsList: FunctionComponent<Props> = observer(
  ({ application, appState }) => {
    const templateTag = appState.templateTag;
    const rootTags = appState.tags.rootTags;

    const allTags = tagsWithOptionalTemplate(templateTag, rootTags);

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

    const backend = isMobile({ tablet: true }) ? TouchBackend : HTML5Backend;

    return (
      <>
        <DndProvider backend={backend}>
          {allTags.length === 0 ? (
            <div className="no-tags-placeholder">
              No tags. Create one using the add button above.
            </div>
          ) : (
            <>
              {allTags.map((tag) => {
                return (
                  <TagsListItem
                    level={0}
                    key={tag.uuid}
                    tag={tag}
                    tagsState={appState.tags}
                    selectTag={selectTag}
                    saveTag={saveTag}
                    removeTag={removeTag}
                    appState={appState}
                  />
                );
              })}
              <RootTagDropZone tagsState={appState.tags} />
            </>
          )}
        </DndProvider>
      </>
    );
  }
);

export const TagsListDirective = toDirective<Props>(TagsList);
