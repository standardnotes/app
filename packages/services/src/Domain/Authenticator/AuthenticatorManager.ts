/* istanbul ignore file */

import { AuthenticatorApiServiceInterface } from '@standardnotes/api'
import { Username, Uuid } from '@standardnotes/domain-core'
import { isErrorResponse } from '@standardnotes/responses'
import { PrefKey } from '@standardnotes/models'

import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { AbstractService } from '../Service/AbstractService'
import { AuthenticatorClientInterface } from './AuthenticatorClientInterface'
import { PreferenceServiceInterface } from '../Preferences/PreferenceServiceInterface'

export class AuthenticatorManager extends AbstractService implements AuthenticatorClientInterface {
  constructor(
    private authenticatorApiService: AuthenticatorApiServiceInterface,
    private preferencesService: PreferenceServiceInterface,
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

      const authenticatorNames = this.getAuthenticatorNamesFromPreferences()

      const nameDecoratedAuthenticators: { id: string; name: string }[] = result.data.authenticators.map(
        (authenticator: { id: string }) => ({
          id: authenticator.id,
          name: authenticatorNames.has(authenticator.id)
            ? (authenticatorNames.get(authenticator.id) as string)
            : 'Security Key',
        }),
      )

      return nameDecoratedAuthenticators
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

      const authenticatorNames = this.getAuthenticatorNamesFromPreferences()
      authenticatorNames.delete(authenticatorId.value)

      await this.preferencesService.setValue(PrefKey.AuthenticatorNames, JSON.stringify([...authenticatorNames]))

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

      const authenticatorNames = this.getAuthenticatorNamesFromPreferences()
      authenticatorNames.set(result.data.id, name)

      await this.preferencesService.setValue(PrefKey.AuthenticatorNames, JSON.stringify([...authenticatorNames]))

      return true
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

  private getAuthenticatorNamesFromPreferences(): Map<string, string> {
    let authenticatorNames: Map<string, string> = new Map()
    const authenticatorNamesFromPreferences = this.preferencesService.getValue(PrefKey.AuthenticatorNames)
    if (authenticatorNamesFromPreferences !== undefined) {
      try {
        authenticatorNames = new Map(JSON.parse(authenticatorNamesFromPreferences))
      } catch (error) {
        authenticatorNames = new Map()
      }
    }

    return authenticatorNames
  }
}
