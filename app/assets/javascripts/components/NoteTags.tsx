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
        <span className="bg-contrast rounded text-xs color-text p-1 flex items-center mt-2 mr-2">
          <Icon type="hashtag" className="small color-neutral mr-1" />
          {tag.title}
        </span>
      ))}
      <AutocompleteTagInput application={application} />
    </div>
  );
});

export const NoteTagsDirective = toDirective<Props>(NoteTags);
