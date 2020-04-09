export function filterAndSortNotes({ notes, selectedTag, showArchived, hidePinned, filterText, sortBy, reverse }: {
    notes: any;
    selectedTag: any;
    showArchived: any;
    hidePinned: any;
    filterText: any;
    sortBy: any;
    reverse: any;
}): any[];
export function filterNotes({ notes, selectedTag, showArchived, hidePinned, filterText }: {
    notes: any;
    selectedTag: any;
    showArchived: any;
    hidePinned: any;
    filterText: any;
}): any;
export function sortNotes({ notes, sortBy, reverse }: {
    notes?: any[] | undefined;
    sortBy: any;
    reverse: any;
}): any[];
export const SORT_KEY_CREATED_AT: "created_at";
export const SORT_KEY_UPDATED_AT: "updated_at";
export const SORT_KEY_CLIENT_UPDATED_AT: "client_updated_at";
export const SORT_KEY_TITLE: "title";
