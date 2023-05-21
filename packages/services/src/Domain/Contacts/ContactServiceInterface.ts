import { TrustedContactInterface } from '@standardnotes/models'
import { AbstractService } from '../Service/AbstractService'

export interface ContactServiceInterface extends AbstractService {
  createTrustedContact(params: {
    name: string
    publicKey: string
    userUuid: string
  }): Promise<TrustedContactInterface | undefined>

  findTrustedContact(userUuid: string): TrustedContactInterface | undefined
}
