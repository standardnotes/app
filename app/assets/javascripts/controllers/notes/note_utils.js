export const SORT_KEY_CREATED_AT = 'created_at';
export const SORT_KEY_UPDATED_AT = 'updated_at';
export const SORT_KEY_CLIENT_UPDATED_AT = 'client_updated_at';
export const SORT_KEY_TITLE = 'title';

export function filterAndSortNotes({
  notes,
  selectedTag,
  showArchived,
  hidePinned,
  filterText,
  sortBy, 
  reverse
}) {
  const filtered = filterNotes({
    notes,
    selectedTag,
    showArchived,
    hidePinned,
    filterText,
  });
  const sorted = sortNotes({
    notes: filtered,
    sortBy,
    reverse
  });
  return sorted;
}

export function filterNotes({
  notes,
  selectedTag,
  showArchived,
  hidePinned,
  filterText
}) {
  return notes.filter((note) => {
    let canShowArchived = showArchived;
    const canShowPinned = !hidePinned;
    const isTrash = selectedTag.content.isTrashTag;
    if (!isTrash && note.content.trashed) {
      return false;
    }
    const isSmartTag = selectedTag.isSmartTag();
    if (isSmartTag) {
      canShowArchived = (
        canShowArchived ||
        selectedTag.content.isArchiveTag ||
        isTrash
      );
    }
    if (
      (note.archived && !canShowArchived) ||
      (note.pinned && !canShowPinned)
    ) {
      return false;
    }
    return noteMatchesQuery({
      note,
      query: filterText
    });
  });
}

function noteMatchesQuery({
  note,
  query
}) {
  if(query.length === 0) {
    return true;
  }
  const title = note.safeTitle().toLowerCase();
  const text = note.safeText().toLowerCase();
  const lowercaseText = query.toLowerCase();
  
  const quotedText = stringBetweenQuotes(lowercaseText);
  if(quotedText) {
    return title.includes(quotedText) || text.includes(quotedText);
  }
  
  if (stringIsUuid(lowercaseText)) {
    return note.uuid === lowercaseText;
  }

  const words = lowercaseText.split(" ");
  const matchesTitle = words.every((word) => {
    return title.indexOf(word) >= 0;
  });
  const matchesBody = words.every((word) => {
    return text.indexOf(word) >= 0;
  });
 
  return matchesTitle || matchesBody;
}

function stringBetweenQuotes(text) {
  const matches = text.match(/"(.*?)"/);
  return matches ? matches[1] : null;
}

function stringIsUuid(text) {
  const matches = text.match(
    /\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b/
  );
  // eslint-disable-next-line no-unneeded-ternary
  return matches ? true : false;
}

export function sortNotes({
  notes = [], 
  sortBy, 
  reverse
}) {
  const sortValueFn = (a, b, pinCheck = false) => {
    if (a.dummy) { return -1; }
    if (b.dummy) { return 1; }
    if (!pinCheck) {
      if (a.pinned && b.pinned) {
        return sortValueFn(a, b, true);
      }
      if (a.pinned) { return -1; }
      if (b.pinned) { return 1; }
    }

    let aValue = a[sortBy] || '';
    let bValue = b[sortBy] || '';
    let vector = 1;
    if (reverse) {
      vector *= -1;
    }
    if (sortBy === SORT_KEY_TITLE) {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
      if (aValue.length === 0 && bValue.length === 0) {
        return 0;
      } else if (aValue.length === 0 && bValue.length !== 0) {
        return 1 * vector;
      } else if (aValue.length !== 0 && bValue.length === 0) {
        return -1 * vector;
      } else {
        vector *= -1;
      }
    }
    if (aValue > bValue) { return -1 * vector; }
    else if (aValue < bValue) { return 1 * vector; }
    return 0;
  };

  const result = notes.sort(function (a, b) {
    return sortValueFn(a, b);
  });
  return result;
}
