import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';
import { toDirective } from './utils';
import { AutocompleteTagInput } from './AutocompleteTagInput';
import { NoteTag } from './NoteTag';
import { useEffect } from 'preact/hooks';

type Props = {
  appState: AppState;
};

const NoteTagsContainer = observer(({ appState }: Props) => {
  const {
    tags,
    tagsContainerMaxWidth,
  } = appState.activeNote;

  useEffect(() => {
    appState.activeNote.reloadTagsContainerMaxWidth();
  }, [appState.activeNote]);

  return (
      <div
        className="bg-default flex flex-wrap pl-1 -ml-1 -ml-2"
        style={{
          maxWidth: tagsContainerMaxWidth,
        }}
      >
        {tags.map((tag) => (
          <NoteTag
            key={tag.uuid}
            appState={appState}
            tag={tag}
          />
        ))}
        <AutocompleteTagInput appState={appState} />
      </div>
  );
});

export const NoteTagsContainerDirective = toDirective<Props>(NoteTagsContainer);
