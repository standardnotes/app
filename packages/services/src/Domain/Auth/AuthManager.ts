import { AuthApiServiceInterface } from '@standardnotes/api'
import { AnyKeyParamsContent } from '@standardnotes/common'
import { isErrorResponse, getCaptchaHeader } from '@standardnotes/responses'

import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { AbstractService } from '../Service/AbstractService'
import { AuthClientInterface } from './AuthClientInterface'

export class AuthManager extends AbstractService implements AuthClientInterface {
  constructor(
    private authApiService: AuthApiServiceInterface,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)
  }

  async generateRecoveryCodes(): Promise<string | false> {
    try {
      const result = await this.authApiService.generateRecoveryCodes()

      if (isErrorResponse(result)) {
        return false
      }

      return result.data.recoveryCodes
    } catch (error) {
      return false
    }
  }

  async recoveryKeyParams(dto: {
    username: string
    codeChallenge: string
    recoveryCodes: string
  }): Promise<AnyKeyParamsContent | false> {
    try {
      const result = await this.authApiService.recoveryKeyParams(dto)
      if (isErrorResponse(result)) {
        return false
      }

      return result.data.keyParams as AnyKeyParamsContent
    } catch (error) {
      return false
    }
  }

  async signInWithRecoveryCodes(
    dto: Parameters<AuthClientInterface['signInWithRecoveryCodes']>[0],
  ): ReturnType<AuthClientInterface['signInWithRecoveryCodes']> {
    try {
      const result = await this.authApiService.signInWithRecoveryCodes(dto)

      const captchaURL = getCaptchaHeader(result)

      if (captchaURL) {
        return {
          success: false,
          captchaURL,
        }
      }

      if (isErrorResponse(result)) {
        return {
          success: false,
          captchaURL: '',
        }
      }

      return {
        success: true,
        keyParams: result.data.key_params as AnyKeyParamsContent,
        session: result.data.session,
        user: result.data.user,
      }
    } catch (error) {
      return {
        success: false,
        captchaURL: '',
      }
    }
  }
}
