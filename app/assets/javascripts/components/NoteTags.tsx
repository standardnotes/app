import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';
import { toDirective } from './utils';
import { Tag } from './Tag';
import { AutocompleteTagInput } from './AutocompleteTagInput';
import { WebApplication } from '@/ui_models/application';

type Props = {
  application: WebApplication;
  appState: AppState;
};

const NoteTags = observer(({ application, appState }: Props) => {
  return (
    <div className="flex flex-wrap">
      {appState.notes.activeNoteTags.map((tag) => (
        <Tag key={tag.uuid} title={tag.title} className="mt-2 mr-2" />
      ))}
      <AutocompleteTagInput application={application} appState={appState} />
    </div>
  );
});

export const NoteTagsDirective = toDirective<Props>(NoteTags);
