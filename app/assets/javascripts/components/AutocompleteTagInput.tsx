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
    autocompleteTagResultElements,
    autocompleteInputElement,
    tagElements,
    tags,
  } = appState.noteTags;

  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownMaxHeight, setDropdownMaxHeight] =
    useState<number | 'auto'>('auto');

  const dropdownRef = useRef<HTMLDivElement>();

  const [closeOnBlur] = useCloseOnBlur(dropdownRef, (visible: boolean) => {
    setDropdownVisible(visible);
    appState.noteTags.clearAutocompleteSearch();
  });

  const showDropdown = () => {
    if (autocompleteInputElement) {
      const { clientHeight } = document.documentElement;
      const inputRect = autocompleteInputElement.getBoundingClientRect();
      setDropdownMaxHeight(clientHeight - inputRect.bottom - 32 * 2);
    }
    setDropdownVisible(true);
  };

  const onSearchQueryChange = (event: Event) => {
    const query = (event.target as HTMLInputElement).value;
    appState.noteTags.setAutocompleteSearchQuery(query);
    appState.noteTags.searchActiveNoteAutocompleteTags();
  };

  const onFormSubmit = async (event: Event) => {
    event.preventDefault();
    await appState.noteTags.createAndAddNewTag();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'Backspace':
        if (autocompleteSearchQuery === '' && tagElements.length > 0) {
          tagElements[tagElements.length - 1]?.focus();
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (autocompleteTagResultElements.length > 0) {
          autocompleteTagResultElements[0]?.focus();
        }
        break;
      default:
        return;
    }
  };

  useEffect(() => {
    appState.noteTags.searchActiveNoteAutocompleteTags();
  }, [appState.noteTags]);

  return (
    <form
      onSubmit={onFormSubmit}
      className={`${tags.length > 0 ? 'mt-2' : ''}`}
    >
      <Disclosure open={dropdownVisible} onChange={showDropdown}>
        <input
          ref={(element) => {
            if (element) {
              appState.noteTags.setAutocompleteInputElement(element);
            }
          }}
          className="w-80 bg-default text-xs color-text no-border h-7 focus:outline-none focus:shadow-none focus:border-bottom"
          value={autocompleteSearchQuery}
          onChange={onSearchQueryChange}
          type="text"
          placeholder="Add tag"
          onBlur={closeOnBlur}
          onFocus={showDropdown}
          onKeyDown={onKeyDown}
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
