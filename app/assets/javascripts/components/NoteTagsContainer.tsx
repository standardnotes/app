import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';
import { AutocompleteTagInput } from './AutocompleteTagInput';
import { NoteTag } from './NoteTag';
import { useEffect } from 'preact/hooks';

type Props = {
  appState: AppState;
  readOnly?: boolean;
};

export const NoteTagsContainer = observer(
  ({ appState, readOnly = false }: Props) => {
    const { tags, tagsContainerMaxWidth } = appState.noteTags;

    useEffect(() => {
      appState.noteTags.reloadTagsContainerMaxWidth();
    }, [appState.noteTags]);

    return (
      <div
        className={`bg-transparent flex flex-wrap min-w-80 ${
          !readOnly ? '-mt-1 -mr-2' : ''
        }`}
        style={{
          maxWidth: tagsContainerMaxWidth,
        }}
      >
        {tags.map((tag) => (
          <NoteTag key={tag.uuid} appState={appState} tag={tag} />
        ))}
        {!readOnly && <AutocompleteTagInput appState={appState} />}
      </div>
    );
  }
);
