import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';
import { Icon } from './Icon';

type Props = {
  appState: AppState;
  closeOnBlur: (event: { relatedTarget: EventTarget | null }) => void;
};

export const AutocompleteTagHint = observer(
  ({ appState, closeOnBlur }: Props) => {
    const { autocompleteSearchQuery, autocompleteTagResults } =
      appState.activeNote;

    const onTagHintClick = async () => {
      await appState.activeNote.createAndAddNewTag();
    };

    return (
      <>
        {autocompleteTagResults.length > 0 && (
          <div className="h-1px my-2 bg-border"></div>
        )}
        <button
          type="button"
          className="sn-dropdown-item"
          onClick={onTagHintClick}
          onBlur={closeOnBlur}
        >
          <span>Create new tag:</span>
          <span className="bg-contrast rounded text-xs color-text py-1 pl-1 pr-2 flex items-center ml-2">
            <Icon
              type="hashtag"
              className="sn-icon--small color-neutral mr-1"
            />
            {autocompleteSearchQuery}
          </span>
        </button>
      </>
    );
  }
);
