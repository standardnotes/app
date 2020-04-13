import { SNNote, SNTag } from 'snjs';
export declare enum NoteSortKey {
    CreatedAt = "created_at",
    UpdatedAt = "updated_at",
    ClientUpdatedAt = "client_updated_at",
    Title = "title"
}
export declare function filterAndSortNotes(notes: SNNote[], selectedTag: SNTag, showArchived: boolean, hidePinned: boolean, filterText: string, sortBy: string, reverse: boolean): SNNote[];
export declare function filterNotes(notes: SNNote[], selectedTag: SNTag, showArchived: boolean, hidePinned: boolean, filterText: string): SNNote[];
export declare function sortNotes(notes: SNNote[] | undefined, sortBy: string, reverse: boolean): SNNote[];
