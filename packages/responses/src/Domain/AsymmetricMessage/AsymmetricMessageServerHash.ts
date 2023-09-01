export interface AsymmetricMessageServerHash {
  uuid: string
  recipient_uuid: string
  sender_uuid: string
  replaceability_identifier: string | null
  encrypted_message: string
  created_at_timestamp: number
  updated_at_timestamp: number
}
