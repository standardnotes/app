import { useEffect, useRef, useState } from 'preact/hooks';
import { Disclosure, DisclosurePanel } from '@reach/disclosure';
import { useCloseOnBlur } from './utils';
import { AppState } from '@/ui_models/app_state';
import { AutocompleteTagResult } from './AutocompleteTagResult';
import { AutocompleteTagHint } from './AutocompleteTagHint';
import { observer } from 'mobx-react-lite';
import { SNTag } from '@standardnotes/snjs';

type Props = {
  appState: AppState;
};

export const AutocompleteTagInput = observer(({ appState }: Props) => {
  const {
    autocompleteInputFocused,
    autocompleteSearchQuery,
    autocompleteTagHintVisible,
    autocompleteTagResults,
    tags,
    tagsContainerMaxWidth,
  } = appState.noteTags;

  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownMaxHeight, setDropdownMaxHeight] =
    useState<number | 'auto'>('auto');

  const dropdownRef = useRef<HTMLDivElement>();
  const inputRef = useRef<HTMLInputElement>();

  const [closeOnBlur] = useCloseOnBlur(dropdownRef, (visible: boolean) => {
    setDropdownVisible(visible);
    appState.noteTags.clearAutocompleteSearch();
  });

  const showDropdown = () => {
    const { clientHeight } = document.documentElement;
    const inputRect = inputRef.current.getBoundingClientRect();
    setDropdownMaxHeight(clientHeight - inputRect.bottom - 32 * 2);
    setDropdownVisible(true);
  };

  const onSearchQueryChange = (event: Event) => {
    const query = (event.target as HTMLInputElement).value;

    if (query === '') {
      appState.noteTags.clearAutocompleteSearch();
    } else {
      appState.noteTags.setAutocompleteSearchQuery(query);
      appState.noteTags.searchActiveNoteAutocompleteTags();
    }
  };

  const onFormSubmit = async (event: Event) => {
    event.preventDefault();
    if (autocompleteSearchQuery !== '') {
      await appState.noteTags.createAndAddNewTag();
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'Backspace':
      case 'ArrowLeft':
        if (autocompleteSearchQuery === '' && tags.length > 0) {
          appState.noteTags.setFocusedTagUuid(tags[tags.length - 1].uuid);
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (autocompleteTagResults.length > 0) {
          appState.noteTags.setFocusedTagResultUuid(autocompleteTagResults[0].uuid);
        } else if (autocompleteTagHintVisible) {
          appState.noteTags.setAutocompleteTagHintFocused(true);
        }
        break;
      default:
        return;
    }
  };

  const onFocus = () => {
    showDropdown();
    appState.noteTags.setAutocompleteInputFocused(true);
  };

  const onBlur = (event: FocusEvent) => {
    closeOnBlur(event);
    appState.noteTags.setAutocompleteInputFocused(false);
  };

  useEffect(() => {
    if (autocompleteInputFocused) {
      inputRef.current.focus();
      appState.noteTags.setAutocompleteInputFocused(false);
    }
  }, [appState.noteTags, autocompleteInputFocused]);

  return (
    <form
      onSubmit={onFormSubmit}
      className={`${tags.length > 0 ? 'mt-2' : ''}`}
    >
      <Disclosure open={dropdownVisible} onChange={showDropdown}>
        <input
          ref={inputRef}
          className={`${tags.length > 0 ? 'w-80' : 'w-70 mr-10'} bg-transparent text-xs
            color-text no-border h-7 focus:outline-none focus:shadow-none focus:border-bottom`}
          value={autocompleteSearchQuery}
          onChange={onSearchQueryChange}
          type="text"
          placeholder="Add tag"
          onBlur={onBlur}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
        />
        {dropdownVisible && (autocompleteTagResults.length > 0 || autocompleteTagHintVisible) && (
          <DisclosurePanel
            ref={dropdownRef}
            className={`${tags.length > 0 ? 'w-80' : 'w-70 mr-10'} sn-dropdown flex flex-col py-2 absolute`}
            style={{ maxHeight: dropdownMaxHeight, maxWidth: tagsContainerMaxWidth }}
            onBlur={closeOnBlur}
          >
            <div className="overflow-y-auto">
              {autocompleteTagResults.map((tagResult: SNTag) => (
                <AutocompleteTagResult
                  key={tagResult.uuid}
                  appState={appState}
                  tagResult={tagResult}
                  closeOnBlur={closeOnBlur}
                />
              ))}
            </div>
            {autocompleteTagHintVisible && (
              <AutocompleteTagHint
                appState={appState}
                closeOnBlur={closeOnBlur}
              />
            )}
          </DisclosurePanel>
        )}
      </Disclosure>
    </form>
  );
});
