import { WebApplication } from '@/ui_models/application';
import { SNTag } from '@standardnotes/snjs';
import { FunctionalComponent, RefObject } from 'preact';
import { useRef, useState } from 'preact/hooks';
import { Icon } from './Icon';
import { Disclosure, DisclosurePanel } from '@reach/disclosure';
import { useCloseOnBlur } from './utils';
import { AppState } from '@/ui_models/app_state';

type Props = {
  application: WebApplication;
  appState: AppState;
  lastTagRef: RefObject<HTMLButtonElement>;
};

export const AutocompleteTagInput: FunctionalComponent<Props> = ({
  application,
  appState,
  lastTagRef,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownMaxHeight, setDropdownMaxHeight] =
    useState<number | 'auto'>('auto');
  const [hintVisible, setHintVisible] = useState(true);

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
    const tags = getActiveNoteTagResults(query);
    setTagResults(tags);
    setHintVisible(query !== '' && !tags.some((tag) => tag.title === query));
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
          onKeyUp={(event) => {
            if (event.key === 'Backspace') {
              lastTagRef.current?.focus();
            }
          }}
        />
        {dropdownVisible && (
          <DisclosurePanel
            ref={dropdownRef}
            className="sn-dropdown flex flex-col py-2 absolute"
            style={{ maxHeight: dropdownMaxHeight }}
          >
            <div className="overflow-y-scroll">
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
            </div>
            {hintVisible && (
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
                  <span
                    className="bg-contrast rounded text-xs color-text p-1 flex ml-2"
                  >
                    <Icon type="hashtag" className="sn-icon--small color-neutral mr-1" />
                    {searchQuery}
                  </span>
                </button>
              </>
            )}
          </DisclosurePanel>
        )}
      </Disclosure>
    </form>
  );
};
