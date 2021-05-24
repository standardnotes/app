import { WebApplication } from '@/ui_models/application';
import { SNTag } from '@standardnotes/snjs';
import { FunctionalComponent } from 'preact';
import { useRef, useState } from 'preact/hooks';
import { Icon } from './Icon';
import { Disclosure, DisclosurePanel } from '@reach/disclosure';
import { useCloseOnBlur } from './utils';

type Props = {
  application: WebApplication;
};

export const AutocompleteTagInput: FunctionalComponent<Props> = ({
  application,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tagResults, setTagResults] = useState<SNTag[]>(() => {
    return application.searchTags('');
  });
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>();
  const [closeOnBlur] = useCloseOnBlur(dropdownRef, (visible: boolean) =>
    setDropdownVisible(visible)
  );

  const onSearchQueryChange = (event: Event) => {
    const query = (event.target as HTMLInputElement).value;
    const tags = application.searchTags(query);

    setSearchQuery(query);
    setTagResults(tags);
    setDropdownVisible(tags.length > 0);
  };

  return (
    <form onSubmit={(event) => event.preventDefault()} className="mt-2">
      <Disclosure
        open={dropdownVisible}
        onChange={() => setDropdownVisible(true)}
      >
        <input
          className="min-w-80 text-xs no-border h-7 focus:outline-none focus:shadow-none focus:border-bottom"
          value={searchQuery}
          onChange={onSearchQueryChange}
          type="text"
          onBlur={closeOnBlur}
          onFocus={() => {
            if (tagResults.length > 0) {
              setDropdownVisible(true);
            }
          }}
        />
        {dropdownVisible && (
          <DisclosurePanel
            ref={dropdownRef}
            className="sn-dropdown flex flex-col py-2 max-h-120 overflow-y-scroll absolute"
          >
            {tagResults.map((tag) => {
              return (
                <button
                  key={tag.uuid}
                  className={`flex items-center border-0 focus:inner-ring-info cursor-pointer
                  hover:bg-contrast color-text bg-transparent px-3 text-left py-1.5`}
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
