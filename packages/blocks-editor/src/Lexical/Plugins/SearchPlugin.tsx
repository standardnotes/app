import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {ArrowDownIcon, ArrowUpIcon, CloseIcon} from '@standardnotes/icons';
import {
  $nodesOfType,
  COMMAND_PRIORITY_EDITOR,
  KEY_MODIFIER_COMMAND,
  TextNode,
} from 'lexical';
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

type ResultRect = {
  top: number;
  left: number;
  bottom: number;
  right: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

type SearchResult = {
  nodeKey: string;
  rectList: ResultRect[];
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
  rect: ResultRect,
  isCurrentResult: boolean,
  rootElement: Element,
  containerElement: Element,
) => {
  const rootElementRect = rootElement.getBoundingClientRect();

  const highlightElement = document.createElement('div');
  highlightElement.style.position = 'absolute';
  highlightElement.style.zIndex = '1000';
  highlightElement.style.transform = `translate(${
    rect.left - rootElementRect.left
  }px, ${rect.top - rootElementRect.top}px)`;
  highlightElement.style.width = `${rect.width}px`;
  highlightElement.style.height = `${rect.height}px`;
  highlightElement.style.backgroundColor = 'var(--sn-stylekit-info-color)';
  highlightElement.style.opacity = isCurrentResult ? '0.5' : '0.25';
  highlightElement.className =
    'search-highlight' + (isCurrentResult ? ' current' : '');

  containerElement.appendChild(highlightElement);
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
      const element = editor.getElementByKey(result.nodeKey);
      if (element) {
        element.scrollIntoView({
          block: 'center',
        });
      }
      document
        .querySelectorAll('.search-highlight.current')
        .forEach((element) => {
          element.remove();
        });
      Array.from(result.rectList).forEach((rect) => {
        if (!containerElement) {
          return;
        }
        createSearchHighlightElement(rect, true, rootElement, containerElement);
      });
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

const EditorScrollOffset = 100;

export const SearchPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const [showDialog, setShowDialog] = useState(false);
  const {searchQuery, results, addResult, clearResults} =
    useSuperSearchContext();

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

  useEffect(() => {
    document.querySelectorAll('.search-highlight').forEach((element) => {
      element.remove();
    });

    clearResults();

    if (!searchQuery) {
      return;
    }

    editor.getEditorState().read(() => {
      const textNodes = $nodesOfType(TextNode);

      textNodes.forEach((node) => {
        const text = node.getTextContent();

        const domElement = editor._keyToDOMMap.get(node.getKey());
        if (!domElement) {
          return;
        }

        const indices: number[] = [];
        let index = -1;

        while ((index = text.indexOf(searchQuery, index + 1)) !== -1) {
          indices.push(index);
        }

        indices.forEach((index) => {
          const startIndex = index;
          const endIndex = startIndex + searchQuery.length;

          const textNode = domElement.childNodes[0];

          try {
            const range = document.createRange();
            range.setStart(textNode, startIndex);
            range.setEnd(textNode, endIndex);

            const rectList = Array.from(range.getClientRects()).map((rect) => ({
              top: rect.top,
              left: rect.left,
              bottom: rect.bottom,
              right: rect.right,
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            }));

            addResult({
              nodeKey: node.getKey(),
              rectList,
            });
          } catch (error) {}
        });
      });
    });
  }, [searchQuery]);

  useEffect(() => {
    let root: HTMLElement | null | undefined;
    let highlightContainer: HTMLElement | undefined;

    editor.getEditorState().read(() => {
      root = editor.getRootElement();
      highlightContainer = root?.parentElement?.getElementsByClassName(
        'search-highlight-container',
      )[0] as HTMLElement | undefined;
    });

    if (!root) {
      return;
    }

    if (!highlightContainer) {
      return;
    }

    const handleScroll = () => {
      if (!root || !highlightContainer) {
        return;
      }

      highlightContainer.style.transform = `translateY(-${root.scrollTop}px)`;
    };

    const resizeHandler = new ResizeObserver(() => {
      if (!root || !highlightContainer) {
        return;
      }

      highlightContainer.style.height = `${root.clientHeight}px`;
    });
    resizeHandler.observe(root);
    root.addEventListener('scroll', handleScroll);

    return () => {
      resizeHandler.disconnect();
      root?.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    let root: HTMLElement | null | undefined;
    let highlightContainer: HTMLElement | undefined;

    editor.getEditorState().read(() => {
      root = editor.getRootElement();
      highlightContainer = root?.parentElement?.getElementsByClassName(
        'search-highlight-container',
      )[0] as HTMLElement | undefined;
    });

    if (!root) {
      return;
    }

    const createVisibleHighlights = () => {
      document.querySelectorAll('.search-highlight').forEach((element) => {
        element.remove();
      });

      results.forEach((result) => {
        if (!root) {
          return;
        }

        const {rectList} = result;
        const firstRect = rectList[0];

        const isFirstRectVisible =
          firstRect.top >= 0 &&
          firstRect.top >= root.scrollTop &&
          firstRect.bottom <=
            root.clientHeight + root.scrollTop + EditorScrollOffset;

        if (isFirstRectVisible) {
          setTimeout(() => {
            rectList.forEach((rect) => {
              if (!root) {
                return;
              }

              if (!highlightContainer) {
                return;
              }

              createSearchHighlightElement(
                rect,
                false,
                root,
                highlightContainer,
              );
            });
          });
        }
      });
    };

    const handleScroll = () => {
      if (!root) {
        return;
      }

      createVisibleHighlights();
    };

    let timeout: number | undefined;
    const handleScrollDebounced = () => {
      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = window.setTimeout(() => {
        handleScroll();
      });
    };

    createVisibleHighlights();

    root.addEventListener('scroll', handleScrollDebounced);

    return () => {
      root?.removeEventListener('scroll', handleScrollDebounced);
    };
  }, [editor, results]);

  return (
    <>
      {showDialog && <SearchDialog closeDialog={() => setShowDialog(false)} />}
    </>
  );
};
