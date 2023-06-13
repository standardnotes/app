import { DecryptedItemInterface, PersistentSignatureData, TrustedContactInterface } from '@standardnotes/models'
import { ItemManagerInterface } from './../../Item/ItemManagerInterface'
import { ValidateItemSignerUseCase } from './ValidateItemSigner'

describe('validate item signer use case', () => {
  let usecase: ValidateItemSignerUseCase
  let items: ItemManagerInterface

  const trustedContact = {} as jest.Mocked<TrustedContactInterface>
  trustedContact.isSigningKeyTrusted = jest.fn().mockReturnValue(true)

  beforeEach(() => {
    items = {} as jest.Mocked<ItemManagerInterface>
    usecase = new ValidateItemSignerUseCase(items)
  })

  describe('has last edited by uuid', () => {
    describe('trusted contact not found', () => {
      beforeEach(() => {
        items.itemsMatchingPredicate = jest.fn().mockReturnValue([])
      })

      it('should return invalid signing is required', () => {
        const item = {
          last_edited_by_uuid: 'uuid-123',
          shared_vault_uuid: 'shared-vault-123',
          signatureData: undefined,
        } as jest.Mocked<DecryptedItemInterface>

        const result = usecase.execute(item)
        expect(result).toEqual('no')
      })

      it('should return not applicable signing is not required', () => {
        const item = {
          last_edited_by_uuid: 'uuid-123',
          signatureData: undefined,
        } as jest.Mocked<DecryptedItemInterface>

        const result = usecase.execute(item)
        expect(result).toEqual('not-applicable')
      })
    })

    describe('trusted contact found for last editor', () => {
      beforeEach(() => {
        items.itemsMatchingPredicate = jest.fn().mockReturnValue([trustedContact])
      })

      describe('does not have signature data', () => {
        it('should return invalid if signing is required', () => {
          const item = {
            last_edited_by_uuid: 'uuid-123',
            shared_vault_uuid: 'shared-vault-123',
            signatureData: undefined,
          } as jest.Mocked<DecryptedItemInterface>

          const result = usecase.execute(item)
          expect(result).toEqual('no')
        })

        it('should return not applicable if signing is not required', () => {
          const item = {
            last_edited_by_uuid: 'uuid-123',
            signatureData: undefined,
          } as jest.Mocked<DecryptedItemInterface>

          const result = usecase.execute(item)
          expect(result).toEqual('not-applicable')
        })
      })

      describe('has signature data', () => {
        describe('signature data does not have result', () => {
          it('should return invalid if signing is required', () => {
            const item = {
              last_edited_by_uuid: 'uuid-123',
              shared_vault_uuid: 'shared-vault-123',
              signatureData: {
                required: true,
              } as jest.Mocked<PersistentSignatureData>,
            } as jest.Mocked<DecryptedItemInterface>

            const result = usecase.execute(item)
            expect(result).toEqual('no')
          })

          it('should return not applicable if signing is not required', () => {
            const item = {
              last_edited_by_uuid: 'uuid-123',
              signatureData: {
                required: false,
              } as jest.Mocked<PersistentSignatureData>,
            } as jest.Mocked<DecryptedItemInterface>

            const result = usecase.execute(item)
            expect(result).toEqual('not-applicable')
          })
        })

        describe('signature data has result', () => {
          it('should return invalid if signature result does not pass', () => {
            const item = {
              last_edited_by_uuid: 'uuid-123',
              shared_vault_uuid: 'shared-vault-123',
              signatureData: {
                required: true,
                result: {
                  passes: false,
                },
              } as jest.Mocked<PersistentSignatureData>,
            } as jest.Mocked<DecryptedItemInterface>

            const result = usecase.execute(item)
            expect(result).toEqual('no')
          })

          it('should return invalid if signature result passes and a trusted contact is NOT found for signature public key', () => {
            const item = {
              last_edited_by_uuid: 'uuid-123',
              shared_vault_uuid: 'shared-vault-123',
              signatureData: {
                required: true,
                result: {
                  passes: true,
                  publicKey: 'pk-123',
                },
              } as jest.Mocked<PersistentSignatureData>,
            } as jest.Mocked<DecryptedItemInterface>

            items.itemsMatchingPredicate = jest.fn().mockReturnValue([])

            const result = usecase.execute(item)
            expect(result).toEqual('no')
          })

          it('should return valid if signature result passes and a trusted contact is found for signature public key', () => {
            const item = {
              last_edited_by_uuid: 'uuid-123',
              shared_vault_uuid: 'shared-vault-123',
              signatureData: {
                required: true,
                result: {
                  passes: true,
                  publicKey: 'pk-123',
                },
              } as jest.Mocked<PersistentSignatureData>,
            } as jest.Mocked<DecryptedItemInterface>

            items.itemsMatchingPredicate = jest.fn().mockReturnValue([trustedContact])

            const result = usecase.execute(item)
            expect(result).toEqual('yes')
          })
        })
      })
    })
  })

  describe('has no last edited by uuid', () => {
    describe('does not have signature data', () => {
      it('should return invalid if signing is required', () => {
        const item = {
          shared_vault_uuid: 'shared-vault-123',
          signatureData: undefined,
        } as jest.Mocked<DecryptedItemInterface>

        const result = usecase.execute(item)
        expect(result).toEqual('no')
      })

      it('should return not applicable if signing is not required', () => {
        const item = {
          signatureData: undefined,
        } as jest.Mocked<DecryptedItemInterface>

        const result = usecase.execute(item)
        expect(result).toEqual('not-applicable')
      })
    })

    describe('has signature data', () => {
      describe('signature data does not have result', () => {
        it('should return invalid if signing is required', () => {
          const item = {
            shared_vault_uuid: 'shared-vault-123',
            signatureData: {
              required: true,
            } as jest.Mocked<PersistentSignatureData>,
          } as jest.Mocked<DecryptedItemInterface>

          const result = usecase.execute(item)
          expect(result).toEqual('no')
        })

        it('should return not applicable if signing is not required', () => {
          const item = {
            signatureData: {
              required: false,
            } as jest.Mocked<PersistentSignatureData>,
          } as jest.Mocked<DecryptedItemInterface>

          const result = usecase.execute(item)
          expect(result).toEqual('not-applicable')
        })
      })

      describe('signature data has result', () => {
        it('should return invalid if signature result does not pass', () => {
          const item = {
            shared_vault_uuid: 'shared-vault-123',
            signatureData: {
              required: true,
              result: {
                passes: false,
              },
            } as jest.Mocked<PersistentSignatureData>,
          } as jest.Mocked<DecryptedItemInterface>

          const result = usecase.execute(item)
          expect(result).toEqual('no')
        })

        it('should return invalid if signature result passes and a trusted contact is NOT found for signature public key', () => {
          const item = {
            shared_vault_uuid: 'shared-vault-123',
            signatureData: {
              required: true,
              result: {
                passes: true,
                publicKey: 'pk-123',
              },
            } as jest.Mocked<PersistentSignatureData>,
          } as jest.Mocked<DecryptedItemInterface>

          items.getItems = jest.fn().mockReturnValue([])

          const result = usecase.execute(item)
          expect(result).toEqual('no')
        })

        it('should return valid if signature result passes and a trusted contact is found for signature public key', () => {
          const item = {
            shared_vault_uuid: 'shared-vault-123',
            signatureData: {
              required: true,
              result: {
                passes: true,
                publicKey: 'pk-123',
              },
            } as jest.Mocked<PersistentSignatureData>,
          } as jest.Mocked<DecryptedItemInterface>

          items.getItems = jest.fn().mockReturnValue([trustedContact])

          const result = usecase.execute(item)
          expect(result).toEqual('yes')
        })
      })
    })
  })
})
