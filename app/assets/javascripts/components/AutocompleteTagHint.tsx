import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';
import { useRef, useEffect } from 'preact/hooks';
import { Icon } from './Icon';

type Props = {
  appState: AppState;
  closeOnBlur: (event: { relatedTarget: EventTarget | null }) => void;
};

export const AutocompleteTagHint = observer(
  ({ appState, closeOnBlur }: Props) => {
    const { autocompleteTagHintFocused } = appState.noteTags;

    const hintRef = useRef<HTMLButtonElement>();

    const { autocompleteSearchQuery, autocompleteTagResults } =
      appState.noteTags;

    const onTagHintClick = async () => {
      await appState.noteTags.createAndAddNewTag();
    };

    const onFocus = () => {
      appState.noteTags.setAutocompleteTagHintFocused(true);
    };

    const onBlur = (event: FocusEvent) => {
      closeOnBlur(event);
      appState.noteTags.setAutocompleteTagHintFocused(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        if (autocompleteTagResults.length > 0) {
          const lastTagResult =
            autocompleteTagResults[autocompleteTagResults.length - 1];
          appState.noteTags.setFocusedTagResultUuid(lastTagResult.uuid);
        } else {
          appState.noteTags.setAutocompleteInputFocused(true);
        }
      }
    };

    useEffect(() => {
      if (autocompleteTagHintFocused) {
        hintRef.current.focus();
      }
    }, [appState.noteTags, autocompleteTagHintFocused]);

    return (
      <>
        {autocompleteTagResults.length > 0 && (
          <div className="h-1px my-2 bg-border"></div>
        )}
        <button
          ref={hintRef}
          type="button"
          className="sn-dropdown-item"
          onClick={onTagHintClick}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
        >
          <span>Create new tag:</span>
          <span className="bg-contrast rounded text-xs color-text py-1 pl-1 pr-2 flex items-center ml-2">
            <Icon
              type="hashtag"
              className="sn-icon--small color-neutral mr-1"
            />
            <span className="max-w-40 whitespace-nowrap overflow-hidden overflow-ellipsis">
              {autocompleteSearchQuery}
            </span>
          </span>
        </button>
      </>
    );
  }
);
