import { useEffect, useRef, useState } from 'preact/hooks';
import { Disclosure, DisclosurePanel } from '@reach/disclosure';
import { useCloseOnBlur } from './utils';
import { AppState } from '@/ui_models/app_state';
import { AutocompleteTagResult } from './AutocompleteTagResult';
import { AutocompleteTagHint } from './AutocompleteTagHint';
import { observer } from 'mobx-react-lite';

type Props = {
  appState: AppState;
};

export const AutocompleteTagInput = observer(({ appState }: Props) => {
  const {
    autocompleteSearchQuery,
    autocompleteTagHintVisible,
    autocompleteTagResults,
    tagElements,
    tags,
  } = appState.activeNote;

  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownMaxHeight, setDropdownMaxHeight] =
    useState<number | 'auto'>('auto');

  const inputRef = useRef<HTMLInputElement>();
  const dropdownRef = useRef<HTMLDivElement>();

  const [closeOnBlur] = useCloseOnBlur(dropdownRef, (visible: boolean) => {
    setDropdownVisible(visible);
    appState.activeNote.clearAutocompleteSearch();
  });

  const showDropdown = () => {
    const { clientHeight } = document.documentElement;
    const inputRect = inputRef.current.getBoundingClientRect();
    setDropdownMaxHeight(clientHeight - inputRect.bottom - 32 * 2);
    setDropdownVisible(true);
  };

  const onSearchQueryChange = (event: Event) => {
    const query = (event.target as HTMLInputElement).value;
    appState.activeNote.setAutocompleteSearchQuery(query);
    appState.activeNote.searchActiveNoteAutocompleteTags();
  };

  const onFormSubmit = async (event: Event) => {
    event.preventDefault();
    await appState.activeNote.createAndAddNewTag();
  };

  useEffect(() => {
    appState.activeNote.searchActiveNoteAutocompleteTags();
  }, [appState.activeNote]);

  return (
    <form
      onSubmit={onFormSubmit}
      className={`${tags.length > 0 ? 'mt-2' : ''}`}
    >
      <Disclosure open={dropdownVisible} onChange={showDropdown}>
        <input
          ref={inputRef}
          className="w-80 bg-default text-xs color-text no-border h-7 focus:outline-none focus:shadow-none focus:border-bottom"
          value={autocompleteSearchQuery}
          onChange={onSearchQueryChange}
          type="text"
          placeholder="Add tag"
          onBlur={closeOnBlur}
          onFocus={showDropdown}
          onKeyUp={(event) => {
            if (
              event.key === 'Backspace' &&
              autocompleteSearchQuery === '' &&
              tagElements.length > 0
            ) {
              tagElements[tagElements.length - 1]?.focus();
            }
          }}
        />
        {dropdownVisible && (
          <DisclosurePanel
            ref={dropdownRef}
            className="sn-dropdown w-80 flex flex-col py-2 absolute"
            style={{ maxHeight: dropdownMaxHeight }}
          >
            <div className="overflow-y-scroll">
              {autocompleteTagResults.map((tagResult) => (
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
