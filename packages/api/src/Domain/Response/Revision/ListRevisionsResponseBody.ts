export interface ListRevisionsResponseBody {
  revisions: Array<{
    uuid: string
    content_type: string
    created_at: string
    updated_at: string
    required_role: string
  }>
}
