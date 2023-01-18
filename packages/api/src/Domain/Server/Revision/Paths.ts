const RevisionsPaths = {
  listRevisions: (itemUuid: string) => `/v2/items/${itemUuid}/revisions`,
  getRevision: (itemUuid: string, revisionUuid: string) => `/v2/items/${itemUuid}/revisions/${revisionUuid}`,
  deleteRevision: (itemUuid: string, revisionUuid: string) => `/v2/items/${itemUuid}/revisions/${revisionUuid}`,
}

export const Paths = {
  v2: {
    ...RevisionsPaths,
  },
}
