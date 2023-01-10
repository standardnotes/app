import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {SearchResult} from './Types';

type SuperSearchContextData = {
  searchQuery: string;
  setSearchQuery: (searchQuery: string) => void;
  results: SearchResult[];
  addResult: (result: SearchResult) => void;
  setResults: (results: SearchResult[]) => void;
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

export const SuperSearchContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);

  const [currentResultIndex, setCurrentResultIndex] = useState(-1);

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
      setResults,
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
      setResults,
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
