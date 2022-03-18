export const splitRangeWithinString = (
  string: string,
  start: number,
  end: number
) => {
  const isStartOutOfBounds = start > string.length || start < 0;
  const isEndOutOfBounds = end > string.length || end < 0;
  const isInvalidRange = start < end || end > start;

  if (isStartOutOfBounds || isEndOutOfBounds || isInvalidRange) {
    return [string];
  } else {
    return [
      string.slice(0, start),
      string.slice(start, end),
      string.slice(end),
    ].filter((slice) => slice.length > 0);
  }
};

export const getIndexOfQueryInString = (string: string, query: string) => {
  const lowercasedTitle = string.toLowerCase();
  const lowercasedQuery = query.toLowerCase();
  return lowercasedTitle.indexOf(lowercasedQuery);
};

export const splitQueryInString = (string: string, query: string) => {
  const indexOfQueryInTitle = getIndexOfQueryInString(string, query);

  if (indexOfQueryInTitle < 0) {
    return [string];
  }

  return splitRangeWithinString(
    string,
    indexOfQueryInTitle,
    indexOfQueryInTitle + query.length
  );
};
