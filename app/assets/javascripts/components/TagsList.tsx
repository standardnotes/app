import { confirmDialog } from '@/services/alertService';
import { STRING_DELETE_TAG } from '@/strings';
import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { SNTag, TagMutator } from '@standardnotes/snjs';
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
        const allTags = withTemplate(templateTag, appState.tags.tags);

        const selectTag = useCallback((tag: SNTag) => {
            // TODO(laurent): is this something we could move to the app state?
            // I am not familiar how conflict are managed, but it looks like we just "ignore" the conflict on select.
            if (tag.conflictOf) {
                application.changeAndSaveItem(tag.uuid, (mutator) => {
                    mutator.conflictOf = undefined;
                });
            }
            appState.setSelectedTag(tag);
        }, [application, appState]);

        const saveTag = useCallback(async (tag: SNTag, newTitle: string) => {
            const templateTag = appState.templateTag;

            const hasEmptyTitle = newTitle.length === 0;
            const hasNotChangedTitle = newTitle === tag.title;
            const isTemplateChange = templateTag && tag.uuid === templateTag.uuid;
            const hasDuplicatedTitle = !!application.findTagByTitle(newTitle);

            // End the edition mode
            appState.templateTag = undefined;
            appState.editingTag = undefined;

            // Abort early if the user inputs invalid data
            if (hasEmptyTitle || hasNotChangedTitle) {
                return;
            }

            if (hasDuplicatedTitle) {
                application.alertService?.alert(
                    "A tag with this name already exists."
                );
                return;
            }

            // Update the store
            if (isTemplateChange) {
                const insertedTag = await application.insertItem(templateTag);
                const changedTag = await application.changeItem<TagMutator>(insertedTag.uuid, (m) => {
                    m.title = newTitle;
                });

                selectTag(changedTag as SNTag);

                await application.saveItem(insertedTag.uuid);
            } else {
                await application.changeAndSaveItem<TagMutator>(tag.uuid, (mutator) => {
                    mutator.title = newTitle;
                });
            }
        }, [appState, application, selectTag]);

        const removeTag = useCallback(async (tag: SNTag) => {
            if (await confirmDialog({
                text: STRING_DELETE_TAG,
                confirmButtonStyle: 'danger'
            })) {
                application.deleteItem(tag);
                selectTag(allTags[0]);
            }
        }, [allTags, application, selectTag]);

        return (
            <>
                {allTags.length === 0
                    ? <div className="no-tags-placeholder">
                        | No tags. Create one using the add button above.
                    </div>
                    : <>
                        {allTags.map(tag => {
                            return <TagsListItem
                                key={tag.uuid}
                                tag={tag}
                                selectTag={selectTag}
                                saveTag={saveTag}
                                removeTag={removeTag}
                                appState={appState}
                            />;
                        })}
                    </>
                }
            </>
        );
    }
);

export const TagsListDirective = toDirective<Props>(
    TagsList,
    // TODO(laurent): Check with the team what we need here.
    {
        // setShowMenuFalse: '=',
        state: '&',
    }
);
