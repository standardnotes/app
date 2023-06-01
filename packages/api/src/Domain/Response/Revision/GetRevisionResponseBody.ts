export interface GetRevisionResponseBody {
  revision: {
    uuid: string
    item_uuid: string
    content: string | null
    content_type: string
    items_key_id: string | null
    enc_item_key: string | null
    auth_hash: string | null
    user_uuid: string
    vault_system_identifier: string | null
    group_uuid: string | null
    created_at: string
    updated_at: string
  }
}
