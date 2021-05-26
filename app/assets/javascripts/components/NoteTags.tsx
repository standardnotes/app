import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';
import { toDirective } from './utils';
import { Icon } from './Icon';
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
        <button
          className={`bg-contrast border-0 rounded text-xs color-text p-1 flex items-center 
            mt-2 mr-2 cursor-pointer hover:bg-secondary-contrast focus:bg-secondary-contrast`}
        >
          <Icon type="hashtag" className="sn-icon--small color-neutral mr-1" />
          {tag.title}
        </button>
      ))}
      <AutocompleteTagInput application={application} appState={appState} />
    </div>
  );
});

export const NoteTagsDirective = toDirective<Props>(NoteTags);
