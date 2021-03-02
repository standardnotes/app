import { SNNote } from '@standardnotes/snjs';

export function notePassesFilter(
  note: SNNote,
  showArchived: boolean,
  hidePinned: boolean,
  filterText: string
): boolean {
  const canShowArchived = showArchived;
  const canShowPinned = !hidePinned;
  if ((note.archived && !canShowArchived) || (note.pinned && !canShowPinned)) {
    return false;
  }
  if (note.protected) {
    const match = noteMatchesQuery(note, filterText);
    /** Only match title to prevent leaking protected note text */
    return match === Match.Title || match === Match.TitleAndText;
  } else {
    return noteMatchesQuery(note, filterText) !== Match.None;
  }
}

enum Match {
  None = 0,
  Title = 1,
  Text = 2,
  TitleAndText = Title + Text,
  Uuid = 5,
}

function noteMatchesQuery(note: SNNote, query: string): Match {
  if (query.length === 0) {
    return Match.TitleAndText;
  }
  const title = note.safeTitle().toLowerCase();
  const text = note.safeText().toLowerCase();
  const lowercaseText = query.toLowerCase();
  const words = lowercaseText.split(' ');
  const quotedText = stringBetweenQuotes(lowercaseText);
  if (quotedText) {
    return (
      (title.includes(quotedText) ? Match.Title : Match.None) +
      (text.includes(quotedText) ? Match.Text : Match.None)
    );
  }
  if (stringIsUuid(lowercaseText)) {
    return note.uuid === lowercaseText ? Match.Uuid : Match.None;
  }
  const matchesTitle = words.every((word) => {
    return title.indexOf(word) >= 0;
  });
  const matchesBody = words.every((word) => {
    return text.indexOf(word) >= 0;
  });
  return (matchesTitle ? Match.Title : 0) + (matchesBody ? Match.Text : 0);
}

function stringBetweenQuotes(text: string) {
  const matches = text.match(/"(.*?)"/);
  return matches ? matches[1] : null;
}

function stringIsUuid(text: string) {
  const matches = text.match(
    /\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b/
  );
  // eslint-disable-next-line no-unneeded-ternary
  return matches ? true : false;
}
