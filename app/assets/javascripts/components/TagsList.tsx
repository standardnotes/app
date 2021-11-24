import { confirmDialog } from '@/services/alertService';
import { STRING_DELETE_TAG } from '@/strings';
import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { SNTag, TagMutator } from '@standardnotes/snjs';
import { observer } from 'mobx-react-lite';
import { FunctionComponent, JSX } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { toDirective } from './utils';

type Props = {
    application: WebApplication;
    appState: AppState;
};

type ItemProps = {
    tag: SNTag;
    selectTag: (tag: SNTag) => void;
    removeTag: (tag: SNTag) => void;
    saveTag: (tag: SNTag, newTitle: string) => void;
    appState: TagsListState;
}

type TagsListState = {
    readonly selectedTag: SNTag | undefined;
    editingTag: SNTag | undefined;
}

const TagItem: FunctionComponent<ItemProps> = observer(
    ({ tag, selectTag, saveTag, removeTag, appState }) => {
        const [title, setTitle] = useState(tag.title);
        const inputRef = useRef<HTMLInputElement>(null);

        const isSelected = appState.selectedTag === tag;
        const isEditing = appState.editingTag === tag;
        const noteCounts = tag.noteCount; // TODO: Check that the SNTag is an observable.

        useEffect(() => {
            setTitle(tag.title);
        }, [tag]);

        const selectCurrentTag = useCallback(() => {
            selectTag(tag);
        }, [selectTag, tag]);

        const onBlur = useCallback(() => {
            appState.editingTag = undefined;
            saveTag(tag, title);
        }, [appState, tag, saveTag, title]);

        const onInput = useCallback((e: JSX.TargetedEvent<HTMLInputElement>) => {
            const value = (e.target as HTMLInputElement).value;
            setTitle(value);
        }, [setTitle]);

        const onKeyUp = useCallback((e: KeyboardEvent) => {
            if (e.code === 'Enter') {
                inputRef.current?.blur();
                e.preventDefault();
            }
        }, [inputRef]);

        useEffect(() => {
            // NOTE(laurent): before we had 2 ways to focus,
            // sn-autofocus and the `document.getElementById('tag-' + tag.uuid)!.focus();` in tags_view.ts l373
            // I am remplacing this by a single focus trigger here.
            // TODO: Check I am not missing any behavior
            if (isEditing) {
                inputRef.current?.focus();
            }
        }, [isEditing]);

        const onClickRename = useCallback(() => {
            appState.editingTag = tag;
        }, [appState, tag]);

        const onClickSave = useCallback(() => {
            // NOTE(laurent): I use an implicit blur which trigger the main save code path.
            inputRef.current?.blur();
        }, []);

        const onClickDelete = useCallback(() => {
            removeTag(tag);
        }, [removeTag, tag]);

        return <div className={`tag ${isSelected ? 'selected' : ''}`} onClick={selectCurrentTag}>
            {
                // TODO: test this case.
                !tag.errorDecrypting
                    ? <div className="tag-info">
                        <div className="tag-icon">
                            #
                        </div>
                        <input className={`title ${isEditing ? 'editing' : ''}`}
                            id={`react-tag-${tag.uuid}`}
                            onBlur={onBlur}
                            onInput={onInput}
                            onClick={selectCurrentTag}
                            value={title}
                            onKeyUp={onKeyUp}
                            spellCheck={false}
                            ref={inputRef}
                        />
                        <div className="count">
                            {noteCounts}
                        </div>
                    </div>
                    : null
            }
            {
                // TODO: how to test this?
                tag.conflictOf
                    ? <div className="danger small-text font-bold">
                        Conflicted Copy {tag.conflictOf}
                    </div>
                    : null
            }
            {
                // TODO: how to test this?
                (tag.errorDecrypting && !tag.waitingForKey)
                    ? <div className="danger small-text font-bold">
                        Missing Keys
                    </div>
                    : null
            }
            {
                // TODO: how to test this?
                (tag.errorDecrypting && tag.waitingForKey)
                    ? <div className="info small-text font-bold">
                        Waiting For Keys
                    </div>
                    : null
            }
            {
                isSelected
                    ? <div className="menu">
                        {
                            !isEditing
                                ? <a className="item" onClick={onClickRename}>
                                    Rename
                                </a>
                                : null
                        }
                        {
                            isEditing
                                ? <a className="item" onClick={onClickSave}>
                                    Save
                                </a>
                                : null
                        }
                        <a className="item" onClick={onClickDelete}>
                            Delete
                        </a>
                    </div>
                    : null
            }

        </div>;
    }
);

const withTemplate = (template: SNTag | undefined, tags: SNTag[]): SNTag[] => {
    if (!template) {
        return tags;
    } else {
        return [template, ...tags];
    }
};

export const TagsList: FunctionComponent<Props> = observer(
    ({ application, appState }) => {
        const selectTag = useCallback((tag: SNTag) => {
            if (tag.conflictOf) {
                application.changeAndSaveItem(tag.uuid, (mutator) => {
                    mutator.conflictOf = undefined;
                });
            }
            appState.setSelectedTag(tag);
        }, [application, appState]);

        const saveTag = async (tag: SNTag, newTitle: string) => {
            const templateTag = appState.templateTag;

            const hasEmptyTitle = newTitle.length === 0;
            const hasNotChangedTitle = newTitle === tag.title;
            const isTemplateChange = templateTag && tag.uuid === templateTag.uuid;
            const hasDuplicatedTitle = !!application.findTagByTitle(newTitle);

            if (isTemplateChange) {
                appState.templateTag = undefined;
                appState.editingTag = undefined;

                if (hasEmptyTitle) {
                    return;
                }

                // saveNewTag
                if (hasDuplicatedTitle) {
                    application.alertService?.alert(
                        "A tag with this name already exists."
                    );
                    return;
                }

                const insertedTag = await application.insertItem(templateTag);
                const changedTag = await application.changeItem<TagMutator>(insertedTag.uuid, (m) => {
                    m.title = newTitle;
                });
                selectTag(changedTag as SNTag);

                if (!changedTag) {
                    throw new Error('The tag could not be updated');
                }

                await application.saveItem(changedTag.uuid);
                // END
            } else {
                appState.editingTag = undefined;

                if (hasEmptyTitle || hasNotChangedTitle) {
                    return;
                }

                if (hasDuplicatedTitle) {
                    application.alertService?.alert(
                        "A tag with this name already exists."
                    );
                    return;
                }

                await application.changeAndSaveItem<TagMutator>(tag.uuid, (mutator) => {
                    mutator.title = newTitle;
                });
            }
        };

        const removeTag = async (tag: SNTag) => {
            if (await confirmDialog({
                text: STRING_DELETE_TAG,
                confirmButtonStyle: 'danger'
            })) {
                application.deleteItem(tag);
                selectTag(allTags[0]);
            }
        };

        const templateTag = appState.templateTag;
        const allTags = withTemplate(templateTag, appState.tags.tags);

        return (
            <>
                {(allTags.length === 0 && !templateTag)
                    ? <div className="no-tags-placeholder">
                        | No tags. Create one using the add button above.
                    </div>
                    : <>
                        {allTags.map(tag => {
                            console.log(appState.selectedTag?.uuid);
                            return <TagItem
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
