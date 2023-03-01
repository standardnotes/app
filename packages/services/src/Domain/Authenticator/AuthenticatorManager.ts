/* istanbul ignore file */

import { AuthenticatorApiServiceInterface } from '@standardnotes/api'
import { Username, Uuid } from '@standardnotes/domain-core'
import { isErrorResponse } from '@standardnotes/responses'

import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { AbstractService } from '../Service/AbstractService'
import { AuthenticatorClientInterface } from './AuthenticatorClientInterface'

export class AuthenticatorManager extends AbstractService implements AuthenticatorClientInterface {
  constructor(
    private authenticatorApiService: AuthenticatorApiServiceInterface,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)
  }

  async list(): Promise<{ id: string; name: string }[]> {
    try {
      const result = await this.authenticatorApiService.list()

      if (isErrorResponse(result)) {
        return []
      }

      return result.data.authenticators
    } catch (error) {
      return []
    }
  }

  async delete(authenticatorId: Uuid): Promise<boolean> {
    try {
      const result = await this.authenticatorApiService.delete(authenticatorId.value)
      if (isErrorResponse(result)) {
        return false
      }

      return true
    } catch (error) {
      return false
    }
  }

  async generateRegistrationOptions(): Promise<Record<string, unknown> | null> {
    try {
      const result = await this.authenticatorApiService.generateRegistrationOptions()

      if (isErrorResponse(result)) {
        return null
      }

      return result.data.options
    } catch (error) {
      return null
    }
  }

  async verifyRegistrationResponse(
    userUuid: Uuid,
    name: string,
    registrationCredential: Record<string, unknown>,
  ): Promise<boolean> {
    try {
      const result = await this.authenticatorApiService.verifyRegistrationResponse(
        userUuid.value,
        name,
        registrationCredential,
      )

      if (isErrorResponse(result)) {
        return false
      }

      return result.data.success
    } catch (error) {
      return false
    }
  }

  async generateAuthenticationOptions(username: Username): Promise<Record<string, unknown> | null> {
    try {
      const result = await this.authenticatorApiService.generateAuthenticationOptions(username.value)

      if (isErrorResponse(result)) {
        return null
      }

      return result.data.options
    } catch (error) {
      return null
    }
  }
}
