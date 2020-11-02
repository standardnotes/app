import { SNNote } from 'snjs';
export declare enum NoteSortKey {
    CreatedAt = "created_at",
    UserUpdatedAt = "userModifiedDate",
    Title = "title",
    /** @legacy Use UserUpdatedAt instead */
    UpdatedAt = "updated_at",
    /** @legacy Use UserUpdatedAt instead */
    ClientUpdatedAt = "client_updated_at"
}
export declare function notePassesFilter(note: SNNote, showArchived: boolean, hidePinned: boolean, filterText: string): boolean;
