import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';
import { toDirective } from './utils';
import { Icon } from './Icon';
import { AutocompleteTagInput } from './AutocompleteTagInput';
import { WebApplication } from '@/ui_models/application';
import { useRef } from 'preact/hooks';

type Props = {
  application: WebApplication;
  appState: AppState;
};

const NoteTags = observer(({ application, appState }: Props) => {
  const { activeNoteTags } = appState.notes;
  const lastTagRef = useRef<HTMLButtonElement>();

  return (
    <div className="flex flex-wrap">
      {activeNoteTags.map((tag, index) => (
        <button
          className={`bg-contrast border-0 rounded text-xs color-text p-1 flex items-center 
            mt-2 mr-2 cursor-pointer hover:bg-secondary-contrast focus:bg-secondary-contrast`}
          ref={index === activeNoteTags.length - 1 ? lastTagRef : undefined}
        >
          <Icon type="hashtag" className="sn-icon--small color-neutral mr-1" />
          {tag.title}
        </button>
      ))}
      <AutocompleteTagInput application={application} appState={appState} lastTagRef={lastTagRef} />
    </div>
  );
});

export const NoteTagsDirective = toDirective<Props>(NoteTags);
