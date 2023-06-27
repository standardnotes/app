import {
  DecryptedPayloadInterface,
  ItemContent,
  ItemsKeyInterface,
  KeySystemItemsKeyInterface,
  KeySystemRootKeyInterface,
  RootKeyInterface,
} from '@standardnotes/models'
import { EncryptedOutputParameters, ErrorDecryptingParameters } from '../../Types/EncryptedParameters'
import { DecryptedParameters } from '../../Types/DecryptedParameters'

export interface AsyncOperatorInterface {
  generateEncryptedParametersAsync(
    payload: DecryptedPayloadInterface,
    key: ItemsKeyInterface | KeySystemItemsKeyInterface | KeySystemRootKeyInterface | RootKeyInterface,
  ): Promise<EncryptedOutputParameters>

  generateDecryptedParametersAsync<C extends ItemContent = ItemContent>(
    encrypted: EncryptedOutputParameters,
    key: ItemsKeyInterface | KeySystemItemsKeyInterface | KeySystemRootKeyInterface | RootKeyInterface,
  ): Promise<DecryptedParameters<C> | ErrorDecryptingParameters>
}
