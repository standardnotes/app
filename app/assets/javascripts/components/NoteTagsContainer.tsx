import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';
import { AutocompleteTagInput } from './AutocompleteTagInput';
import { NoteTag } from './NoteTag';
import { useEffect } from 'preact/hooks';

type Props = {
  appState: AppState;
};

export const NoteTagsContainer = observer(({ appState }: Props) => {
  const { tags, tagsContainerMaxWidth } = appState.noteTags;

  useEffect(() => {
    appState.noteTags.reloadTagsContainerMaxWidth();
  }, [appState.noteTags]);

  return (
    <div
      className="bg-transparent flex flex-wrap min-w-80 -mt-1 -mr-2"
      style={{
        maxWidth: tagsContainerMaxWidth,
      }}
    >
      {tags.map((tag) => (
        <NoteTag key={tag.uuid} appState={appState} tag={tag} />
      ))}
      <AutocompleteTagInput appState={appState} />
    </div>
  );
});
