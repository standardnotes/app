import { DecryptedItemMutator } from '../../Abstract/Item'
import { TrustedContactContent } from './TrustedContactContent'
import { TrustedContactInterface } from './TrustedContactInterface'
import { ContactPublicKeySet } from './PublicKeySet/ContactPublicKeySet'
import { PortablePublicKeySet } from './PublicKeySet/PortablePublicKeySet'
import { ContactPublicKeySetJsonInterface } from './PublicKeySet/ContactPublicKeySetJsonInterface'

export class TrustedContactMutator extends DecryptedItemMutator<TrustedContactContent, TrustedContactInterface> {
  set name(newName: string) {
    this.mutableContent.name = newName
  }

  addPublicKey(keySet: PortablePublicKeySet): void {
    const newKey = new ContactPublicKeySet({
      encryption: keySet.encryption,
      signing: keySet.signing,
      timestamp: new Date(),
      isRevoked: false,
      previousKeySet: this.immutableItem.publicKeySet,
    })

    this.mutableContent.publicKeySet = newKey
  }

  revokePublicKeySet(publicKeySet: PortablePublicKeySet): void {
    const mutableKeySet = this.immutableItem.publicKeySet.mutableCopy()

    const matchingKeySet = mutableKeySet.findKeySet({
      targetEncryptionPublicKey: publicKeySet.encryption,
      targetSigningPublicKey: publicKeySet.signing,
    })

    if (!matchingKeySet) {
      return
    }

    matchingKeySet.isRevoked = true

    this.mutableContent.publicKeySet = mutableKeySet
  }

  replacePublicKeySet(publicKeySet: ContactPublicKeySetJsonInterface): void {
    this.mutableContent.publicKeySet = publicKeySet
  }
}
