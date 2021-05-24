import { WebApplication } from '@/ui_models/application';
import { SNTag } from '@standardnotes/snjs';
import { FunctionalComponent } from 'preact';
import { useRef, useState } from 'preact/hooks';
import { Icon } from './Icon';
import { Disclosure, DisclosurePanel } from '@reach/disclosure';
import { useCloseOnBlur } from './utils';
import { AppState } from '@/ui_models/app_state';

type Props = {
  application: WebApplication;
  appState: AppState;
};

export const AutocompleteTagInput: FunctionalComponent<Props> = ({
  application,
  appState,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownMaxHeight, setDropdownMaxHeight] =
    useState<number | 'auto'>('auto');

  const getActiveNoteTagResults = (query: string) => {
    const { activeNote } = appState.notes;
    return application.searchTags(query, activeNote);
  };

  const [tagResults, setTagResults] = useState<SNTag[]>(() => {
    return getActiveNoteTagResults('');
  });

  const inputRef = useRef<HTMLInputElement>();
  const dropdownRef = useRef<HTMLDivElement>();
  const [closeOnBlur] = useCloseOnBlur(dropdownRef, (visible: boolean) =>
    setDropdownVisible(visible)
  );

  const showDropdown = () => {
    const { clientHeight } = document.documentElement;
    const inputRect = inputRef.current.getBoundingClientRect();
    setDropdownMaxHeight(clientHeight - inputRect.bottom - 32 * 2);
    setDropdownVisible(true);
  };

  const onSearchQueryChange = (event: Event) => {
    const query = (event.target as HTMLInputElement).value;
    const tags = getActiveNoteTagResults(query);

    setSearchQuery(query);
    setTagResults(tags);
    setDropdownVisible(tags.length > 0);
  };

  return (
    <form onSubmit={(event) => event.preventDefault()} className="mt-2">
      <Disclosure open={dropdownVisible} onChange={showDropdown}>
        <input
          ref={inputRef}
          className="min-w-80 text-xs no-border h-7 focus:outline-none focus:shadow-none focus:border-bottom"
          value={searchQuery}
          onChange={onSearchQueryChange}
          type="text"
          onBlur={closeOnBlur}
          onFocus={() => {
            if (tagResults.length > 0) {
              showDropdown();
            }
          }}
        />
        {dropdownVisible && (
          <DisclosurePanel
            ref={dropdownRef}
            className="sn-dropdown flex flex-col py-2 overflow-y-scroll absolute"
            style={{ maxHeight: dropdownMaxHeight }}
          >
            {tagResults.map((tag) => {
              return (
                <button
                  key={tag.uuid}
                  className={`flex items-center border-0 focus:inner-ring-info cursor-pointer
                  hover:bg-contrast color-text bg-transparent px-3 text-left py-1.5`}
                  onClick={() => appState.notes.addTagToActiveNote(tag)}
                  onBlur={closeOnBlur}
                >
                  <Icon type="hashtag" className="color-neutral mr-2" />
                  {tag.title
                    .toLowerCase()
                    .split(new RegExp(`(${searchQuery})`, 'gi'))
                    .map((substring, index) => (
                      <span
                        key={index}
                        className={
                          substring?.toLowerCase() === searchQuery.toLowerCase()
                            ? 'font-bold whitespace-pre-wrap'
                            : 'whitespace-pre-wrap'
                        }
                      >
                        {substring}
                      </span>
                    ))}
                </button>
              );
            })}
          </DisclosurePanel>
        )}
      </Disclosure>
    </form>
  );
};
