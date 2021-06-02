import { WebApplication } from '@/ui_models/application';
import { SNTag } from '@standardnotes/snjs';
import { FunctionalComponent, RefObject } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Icon } from './Icon';
import { Disclosure, DisclosurePanel } from '@reach/disclosure';
import { useCloseOnBlur } from './utils';
import { AppState } from '@/ui_models/app_state';

type Props = {
  application: WebApplication;
  appState: AppState;
  tagsRef: RefObject<HTMLButtonElement[]>;
  tabIndex: number;
};

export const AutocompleteTagInput: FunctionalComponent<Props> = ({
  application,
  appState,
  tagsRef,
  tabIndex,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownMaxHeight, setDropdownMaxHeight] =
    useState<number | 'auto'>('auto');
  const [hintVisible, setHintVisible] = useState(true);

  const getActiveNoteTagResults = (query: string) => {
    const { activeNote } = appState.activeNote;
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

  const [closeOnBlur] = useCloseOnBlur(
    dropdownRef,
    (visible: boolean) => {
      setDropdownVisible(visible);
      clearResults();
    }
  );

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
    await appState.activeNote.addTagToActiveNote(tag);
    clearResults();
  };

  const createAndAddNewTag = async () => {
    const newTag = await application.findOrCreateTag(searchQuery);
    await appState.activeNote.addTagToActiveNote(newTag);
    clearResults();
  };

  const onTagHintClick = async () => {
    await createAndAddNewTag();
  };

  const onFormSubmit = async (event: Event) => {
    event.preventDefault();
    await createAndAddNewTag();
  };

  useEffect(() => {
    setHintVisible(
      searchQuery !== '' && !tagResults.some((tag) => tag.title === searchQuery)
    );
  }, [tagResults, searchQuery]);

  return (
    <form onSubmit={onFormSubmit} className="mt-2">
      <Disclosure open={dropdownVisible} onChange={showDropdown}>
        <input
          ref={inputRef}
          className="w-80 bg-default text-xs color-text no-border h-7 focus:outline-none focus:shadow-none focus:border-bottom"
          value={searchQuery}
          onChange={onSearchQueryChange}
          type="text"
          placeholder="Add tag"
          tabIndex={tabIndex}
          onBlur={closeOnBlur}
          onFocus={showDropdown}
          onKeyUp={(event) => {
            if (
              event.key === 'Backspace' &&
              searchQuery === '' &&
              tagsRef.current &&
              tagsRef.current.length > 1
            ) {
              tagsRef.current[tagsRef.current.length - 1].focus();
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
              {tagResults.map((tag) => {
                return (
                  <button
                    key={tag.uuid}
                    type="button"
                    className="sn-dropdown-item"
                    onClick={() => onTagOptionClick(tag)}
                    onBlur={closeOnBlur}
                    tabIndex={tabIndex}
                  >
                    <Icon type="hashtag" className="color-neutral mr-2 min-h-5 min-w-5" />
                    <span className="whitespace-nowrap overflow-hidden overflow-ellipsis">
                      {searchQuery === '' ? (
                        tag.title
                      ) : (
                        tag.title
                          .split(new RegExp(`(${searchQuery})`, 'gi'))
                          .map((substring, index) => (
                            <span
                              key={index}
                              className={`${
                                substring.toLowerCase() ===
                                searchQuery.toLowerCase()
                                  ? 'font-bold whitespace-pre-wrap'
                                  : 'whitespace-pre-wrap '
                              }`}
                            >
                              {substring}
                            </span>
                          ))
                      )}
                    </span>
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
                  type="button"
                  className="sn-dropdown-item"
                  onClick={onTagHintClick}
                  onBlur={closeOnBlur}
                  tabIndex={tabIndex}
                >
                  <span>Create new tag:</span>
                  <span className="bg-contrast rounded text-xs color-text py-1 pl-1 pr-2 flex items-center ml-2">
                    <Icon
                      type="hashtag"
                      className="sn-icon--small color-neutral mr-1"
                    />
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
