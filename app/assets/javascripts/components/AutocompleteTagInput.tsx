import { WebApplication } from '@/ui_models/application';
import { SNTag } from '@standardnotes/snjs';
import { FunctionalComponent } from 'preact';
import { useRef, useState } from 'preact/hooks';
import { Icon } from './Icon';
import { Disclosure, DisclosurePanel } from '@reach/disclosure';
import { useCloseOnBlur } from './utils';
import { AppState } from '@/ui_models/app_state';
import { Tag } from './Tag';

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

  const clearResults = () => {
    setSearchQuery('');
    setTagResults(getActiveNoteTagResults(''));
  };

  const [closeOnBlur, setLockCloseOnBlur] = useCloseOnBlur(dropdownRef, (visible: boolean) => {
    setDropdownVisible(visible);
    clearResults();
  });

  const showDropdown = () => {
    const { clientHeight } = document.documentElement;
    const inputRect = inputRef.current.getBoundingClientRect();
    setDropdownMaxHeight(clientHeight - inputRect.bottom - 32 * 2);
    setDropdownVisible(true);
  };

  const onSearchQueryChange = (event: Event) => {
    const query = (event.target as HTMLInputElement).value;
    setTagResults(getActiveNoteTagResults(query));
    setSearchQuery(query);
  };

  const onTagOptionClick = async (tag: SNTag) => {
    setLockCloseOnBlur(true);
    await appState.notes.addTagToActiveNote(tag);
    inputRef.current.focus();
    setLockCloseOnBlur(false);
  };

  const createAndAddNewTag = async () => {
    const newTag = await application.findOrCreateTag(searchQuery);
    await appState.notes.addTagToActiveNote(newTag);
    clearResults();
  };

  const onTagHintClick = async () => {
    await createAndAddNewTag();
  };

  const onFormSubmit = async (event: Event) => {
    event.preventDefault();
    await createAndAddNewTag();
  };

  return (
    <form onSubmit={onFormSubmit} className="mt-2">
      <Disclosure open={dropdownVisible} onChange={showDropdown}>
        <input
          ref={inputRef}
          className="min-w-80 text-xs no-border h-7 focus:outline-none focus:shadow-none focus:border-bottom"
          value={searchQuery}
          onChange={onSearchQueryChange}
          type="text"
          onBlur={closeOnBlur}
          onFocus={showDropdown}
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
                  type="button"
                  className="sn-dropdown-item"
                  onClick={() => onTagOptionClick(tag)}
                  onBlur={closeOnBlur}
                >
                  <Icon type="hashtag" className="color-neutral mr-2" />
                  {tag.title
                    .split(new RegExp(`(${searchQuery})`, 'gi'))
                    .map((substring, index) => (
                      <span
                        key={index}
                        className={
                          substring.toLowerCase() === searchQuery.toLowerCase()
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
            {searchQuery !== '' && (
              <>
                {tagResults.length > 0 && (
                  <div className="h-1px my-2 bg-border"></div>
                )}
                <button
                  className="sn-dropdown-item"
                  onClick={onTagHintClick}
                  onBlur={closeOnBlur}
                >
                  <span>
                    Create new tag:
                  </span>
                  <Tag title={searchQuery} className="ml-2" />
                </button>
              </>
            )}
          </DisclosurePanel>
        )}
      </Disclosure>
    </form>
  );
};
