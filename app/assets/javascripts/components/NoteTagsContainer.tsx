import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';
import { toDirective } from './utils';
import { AutocompleteTagInput } from './AutocompleteTagInput';
import { WebApplication } from '@/ui_models/application';
import { NoteTag } from './NoteTag';
import { useEffect } from 'preact/hooks';

type Props = {
  application: WebApplication;
  appState: AppState;
};

const NoteTagsContainer = observer(({ application, appState }: Props) => {
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
        <AutocompleteTagInput application={application} appState={appState} />
      </div>
  );
});

export const NoteTagsContainerDirective = toDirective<Props>(NoteTagsContainer);
