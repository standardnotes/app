import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';
import { toDirective } from './utils';
import { Icon } from './Icon';
import { AutocompleteTagInput } from './AutocompleteTagInput';
import { WebApplication } from '@/ui_models/application';
import { useRef } from 'preact/hooks';
import { SNTag } from '@standardnotes/snjs';

type Props = {
  application: WebApplication;
  appState: AppState;
};

const NoteTags = observer(({ application, appState }: Props) => {
  const { activeNoteTags } = appState.notes;
  const lastTagRef = useRef<HTMLButtonElement>();

  const onTagBackspacePress = async (tag: SNTag) => {
    await appState.notes.removeTagFromActiveNote(tag);
    lastTagRef.current?.focus();
  };

  return (
    <div className="flex flex-wrap">
      {activeNoteTags.map((tag, index) => (
        <button
          className={`bg-contrast border-0 rounded text-xs color-text py-1 pl-1 pr-2 flex items-center 
            mt-2 mr-2 cursor-pointer hover:bg-secondary-contrast focus:bg-secondary-contrast`}
          ref={index === activeNoteTags.length - 1 ? lastTagRef : undefined}
          onKeyUp={(event) => {
            if (event.key === 'Backspace') {
              onTagBackspacePress(tag);
            }
          }}
        >
          <Icon type="hashtag" className="sn-icon--small color-neutral mr-1" />
          <span className="max-w-md whitespace-nowrap overflow-hidden overflow-ellipsis">
            {tag.title}
          </span>
        </button>
      ))}
      <AutocompleteTagInput application={application} appState={appState} lastTagRef={lastTagRef} />
    </div>
  );
});

export const NoteTagsDirective = toDirective<Props>(NoteTags);
