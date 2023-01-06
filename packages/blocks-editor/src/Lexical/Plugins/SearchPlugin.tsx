import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CloseIcon,
  SearchIcon,
} from '@standardnotes/icons';
import {COMMAND_PRIORITY_EDITOR, KEY_MODIFIER_COMMAND} from 'lexical';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {debounce} from '../Utils/debounce';

type SearchResult = {
  node: Text;
  startIndex: number;
  endIndex: number;
};

type SuperSearchContextData = {
  searchQuery: string;
  setSearchQuery: (searchQuery: string) => void;
  results: SearchResult[];
  addResult: (result: SearchResult) => void;
  clearResults: () => void;
  currentResultIndex: number;
  setCurrentResultIndex: (currentResultIndex: number) => void;
  goToNextResult: () => void;
  goToPreviousResult: () => void;
};

const SuperSearchContext = createContext<SuperSearchContextData | undefined>(
  undefined,
);

export const useSuperSearchContext = () => {
  const context = useContext(SuperSearchContext);

  if (!context) {
    throw new Error(
      'useSuperSearchContext must be used within a SuperSearchContextProvider',
    );
  }

  return context;
};

const createSearchHighlightElement = (
  result: SearchResult,
  rootElement: Element,
  containerElement: Element,
) => {
  const rootElementRect = rootElement.getBoundingClientRect();

  const range = document.createRange();
  range.setStart(result.node, result.startIndex);
  range.setEnd(result.node, result.endIndex);

  const rects = range.getClientRects();

  Array.from(rects).forEach((rect, index) => {
    const id = `search-${result.startIndex}-${result.endIndex}-${index}`;

    const existingHighlightElement = document.getElementById(id);

    if (existingHighlightElement) {
      return;
    }

    const highlightElement = document.createElement('div');
    highlightElement.style.position = 'absolute';
    highlightElement.style.zIndex = '1000';
    highlightElement.style.transform = `translate(${
      rect.left - rootElementRect.left
    }px, ${rect.top - rootElementRect.top}px)`;
    highlightElement.style.width = `${rect.width}px`;
    highlightElement.style.height = `${rect.height}px`;
    highlightElement.style.backgroundColor = 'var(--sn-stylekit-info-color)';
    highlightElement.style.opacity = '0.5';
    highlightElement.className = 'search-highlight';
    highlightElement.id = id;

    containerElement.appendChild(highlightElement);
  });
};

export const SuperSearchContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [editor] = useLexicalComposerContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);

  const [currentResultIndex, setCurrentResultIndex] = useState(-1);
  useEffect(() => {
    if (currentResultIndex === -1) {
      return;
    }
    const result = results[currentResultIndex];
    editor.getEditorState().read(() => {
      const rootElement = editor.getRootElement();
      const containerElement =
        rootElement?.parentElement?.getElementsByClassName(
          'search-highlight-container',
        )[0];
      document.querySelectorAll('.search-highlight').forEach((element) => {
        element.remove();
      });
      result.node.parentElement?.scrollIntoView({
        block: 'center',
      });
      if (!rootElement || !containerElement) {
        return;
      }
      createSearchHighlightElement(result, rootElement, containerElement);
    });
  }, [currentResultIndex, results]);

  const goToNextResult = useCallback(
    () =>
      setCurrentResultIndex((currentResultIndex) =>
        currentResultIndex + 1 < results.length
          ? currentResultIndex + 1
          : currentResultIndex,
      ),
    [results.length],
  );

  const goToPreviousResult = useCallback(
    () =>
      setCurrentResultIndex((currentResultIndex) =>
        currentResultIndex - 1 >= 0
          ? currentResultIndex - 1
          : currentResultIndex,
      ),
    [],
  );

  const clearResults = useCallback(() => {
    setResults([]);
    setCurrentResultIndex(-1);
  }, []);

  const addResult = useCallback((result: SearchResult) => {
    setResults((results) => [...results, result]);
  }, []);

  const value = useMemo(
    () => ({
      searchQuery,
      setSearchQuery,
      results,
      addResult,
      clearResults,
      currentResultIndex,
      setCurrentResultIndex,
      goToNextResult,
      goToPreviousResult,
    }),
    [
      searchQuery,
      setSearchQuery,
      results,
      addResult,
      clearResults,
      currentResultIndex,
      setCurrentResultIndex,
      goToNextResult,
      goToPreviousResult,
    ],
  );

  return (
    <SuperSearchContext.Provider value={value}>
      {children}
    </SuperSearchContext.Provider>
  );
};

const SearchDialog = ({closeDialog}: {closeDialog: () => void}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    searchQuery,
    setSearchQuery,
    results,
    goToNextResult,
    goToPreviousResult,
    currentResultIndex,
  } = useSuperSearchContext();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div
      className="bg-default border-border absolute right-6 top-4 flex items-center gap-2 rounded border py-2 px-2"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          closeDialog();
        }
        if (event.ctrlKey && event.key === 'f') {
          event.preventDefault();
          closeDialog();
        }
      }}>
      <input
        type="text"
        placeholder="Search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="border-border rounded border p-1 px-2"
        ref={inputRef}
      />
      {results.length > 0 && (
        <span className="text-text">
          {currentResultIndex > -1 ? currentResultIndex + 1 + ' of ' : null}
          {results.length} results
        </span>
      )}
      <button
        className="border-border hover:bg-contrast flex items-center rounded border p-1.5"
        onClick={goToPreviousResult}>
        <ArrowUpIcon className="text-text h-4 w-4 fill-current" />
      </button>
      <button
        className="border-border hover:bg-contrast flex items-center rounded border p-1.5"
        onClick={goToNextResult}>
        <ArrowDownIcon className="text-text h-4 w-4 fill-current" />
      </button>
      <button
        className="border-border hover:bg-contrast flex items-center rounded border p-1.5"
        onClick={() => {
          setSearchQuery('');
          closeDialog();
        }}>
        <CloseIcon className="text-text h-4 w-4 fill-current" />
      </button>
    </div>
  );
};

const textNodesInElement = (element: HTMLElement) => {
  const textNodes: Text[] = [];
  const walk = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
  let node = walk.nextNode();
  while (node) {
    textNodes.push(node as Text);
    node = walk.nextNode();
  }
  return textNodes;
};

export const SearchPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const [showDialog, setShowDialog] = useState(false);
  const {searchQuery, addResult, clearResults} = useSuperSearchContext();

  useEffect(() => {
    return editor.registerCommand<KeyboardEvent>(
      KEY_MODIFIER_COMMAND,
      (event: KeyboardEvent) => {
        const isCmdF =
          event.key === 'f' &&
          !event.altKey &&
          (event.metaKey || event.ctrlKey);

        if (!isCmdF) {
          return false;
        }

        event.preventDefault();
        event.stopPropagation();

        setShowDialog((show) => !show);

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, []);

  const handleSearch = useCallback((searchQuery: string) => {
    document.querySelectorAll('.search-highlight').forEach((element) => {
      element.remove();
    });

    clearResults();

    if (!searchQuery) {
      return;
    }

    editor.getEditorState().read(() => {
      const rootElement = editor.getRootElement();

      if (!rootElement) {
        return;
      }

      const textNodes = textNodesInElement(rootElement);

      textNodes.forEach((node) => {
        const text = node.textContent || '';

        const indices: number[] = [];
        let index = -1;

        while ((index = text.indexOf(searchQuery, index + 1)) !== -1) {
          indices.push(index);
        }

        indices.forEach((index) => {
          const startIndex = index;
          const endIndex = startIndex + searchQuery.length;

          addResult({
            node,
            startIndex,
            endIndex,
          });
        });
      });
    });
  }, []);

  const debouncedHandleSearch = useMemo(() => debounce(handleSearch, 250), []);

  useEffect(() => {
    debouncedHandleSearch(searchQuery);
  }, [searchQuery]);

  return (
    <>
      {showDialog && <SearchDialog closeDialog={() => setShowDialog(false)} />}
      {/** @TODO Replace with better mobile UX */}
      <div className="absolute top-4 left-[1rem] md:hidden">
        <button
          className="border-border bg-default rounded-full border p-1"
          onClick={() => setShowDialog(true)}>
          <SearchIcon className="text-text h-4 w-4 fill-current" />
        </button>
      </div>
    </>
  );
};
