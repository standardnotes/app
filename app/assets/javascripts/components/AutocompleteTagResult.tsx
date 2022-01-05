import { AppState } from '@/ui_models/app_state';
import { SNTag } from '@standardnotes/snjs';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef } from 'preact/hooks';
import { Icon } from './Icon';

type Props = {
  appState: AppState;
  tagResult: SNTag;
  closeOnBlur: (event: { relatedTarget: EventTarget | null }) => void;
};

export const AutocompleteTagResult = observer(
  ({ appState, tagResult, closeOnBlur }: Props) => {
    const {
      autocompleteSearchQuery,
      autocompleteTagHintVisible,
      autocompleteTagResults,
      focusedTagResultUuid,
    } = appState.noteTags;

    const tagResultRef = useRef<HTMLButtonElement>(null);

    const title = tagResult.title;
    const prefixTitle = appState.noteTags.getPrefixTitle(tagResult);

    const onTagOptionClick = async (tag: SNTag) => {
      await appState.noteTags.addTagToActiveNote(tag);
      appState.noteTags.clearAutocompleteSearch();
      appState.noteTags.setAutocompleteInputFocused(true);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const tagResultIndex = appState.noteTags.getTagIndex(
        tagResult,
        autocompleteTagResults
      );
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          if (tagResultIndex === 0) {
            appState.noteTags.setAutocompleteInputFocused(true);
          } else {
            appState.noteTags.focusPreviousTagResult(tagResult);
          }
          break;
        case 'ArrowDown':
          event.preventDefault();
          if (
            tagResultIndex === autocompleteTagResults.length - 1 &&
            autocompleteTagHintVisible
          ) {
            appState.noteTags.setAutocompleteTagHintFocused(true);
          } else {
            appState.noteTags.focusNextTagResult(tagResult);
          }
          break;
        default:
          return;
      }
    };

    const onFocus = () => {
      appState.noteTags.setFocusedTagResultUuid(tagResult.uuid);
    };

    const onBlur = (event: FocusEvent) => {
      closeOnBlur(event);
      appState.noteTags.setFocusedTagResultUuid(undefined);
    };

    useEffect(() => {
      if (focusedTagResultUuid === tagResult.uuid) {
        tagResultRef.current!.focus();
        appState.noteTags.setFocusedTagResultUuid(undefined);
      }
    }, [appState.noteTags, focusedTagResultUuid, tagResult]);

    return (
      <button
        ref={tagResultRef}
        type="button"
        className="sn-dropdown-item focus:bg-info focus:color-info-contrast"
        onClick={() => onTagOptionClick(tagResult)}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        tabIndex={-1}
      >
        <Icon type="hashtag" className="color-neutral mr-2 min-h-5 min-w-5" />
        <span className="whitespace-nowrap overflow-hidden overflow-ellipsis">
          {prefixTitle && <span className="grey-2">{prefixTitle}</span>}
          {autocompleteSearchQuery === ''
            ? title
            : title
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
