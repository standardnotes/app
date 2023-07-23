export interface AsymmetricMessageServerHash {
  uuid: string
  user_uuid: string
  sender_uuid: string
  replaceabilityIdentifier?: string
  encrypted_message: string
  created_at_timestamp: number
  updated_at_timestamp: number
}
