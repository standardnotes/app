import { AppState } from '@/ui_models/app_state';
import { SNTag } from '@standardnotes/snjs';
import { observer } from 'mobx-react-lite';
import { Icon } from './Icon';

type Props = {
  appState: AppState;
  tagResult: SNTag;
  closeOnBlur: (event: { relatedTarget: EventTarget | null }) => void;
};

export const AutocompleteTagResult = observer(
  ({ appState, tagResult, closeOnBlur }: Props) => {
    const { autocompleteInputElement, autocompleteSearchQuery, autocompleteTagResults } = appState.noteTags;

    const onTagOptionClick = async (tag: SNTag) => {
      await appState.noteTags.addTagToActiveNote(tag);
      appState.noteTags.clearAutocompleteSearch();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const tagResultIndex = appState.noteTags.getTagIndex(tagResult, autocompleteTagResults);
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          if (tagResultIndex === 0) {
            autocompleteInputElement?.focus();
          } else {
            appState.noteTags.getPreviousAutocompleteTagResultElement(tagResult)?.focus();
          }
          break;
        case 'ArrowDown':
          event.preventDefault();
          appState.noteTags.getNextAutocompleteTagResultElement(tagResult)?.focus();
          break;
        default:
          return;
      }
    };

    return (
      <button
        ref={(element) => {
          if (element) {
            appState.noteTags.setAutocompleteTagResultElement(
              tagResult,
              element
            );
          }
        }}
        type="button"
        className="sn-dropdown-item"
        onClick={() => onTagOptionClick(tagResult)}
        onBlur={closeOnBlur}
        onKeyDown={onKeyDown}
      >
        <Icon type="hashtag" className="color-neutral mr-2 min-h-5 min-w-5" />
        <span className="whitespace-nowrap overflow-hidden overflow-ellipsis">
          {autocompleteSearchQuery === ''
            ? tagResult.title
            : tagResult.title
                .split(new RegExp(`(${autocompleteSearchQuery})`, 'gi'))
                .map((substring, index) => (
                  <span
                    key={index}
                    className={`${
                      substring.toLowerCase() ===
                      autocompleteSearchQuery.toLowerCase()
                        ? 'font-bold whitespace-pre-wrap'
                        : 'whitespace-pre-wrap '
                    }`}
                  >
                    {substring}
                  </span>
                ))}
        </span>
      </button>
    );
  }
);
