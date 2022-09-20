import {
  AlertService,
  AbstractService,
  InternalEventBusInterface,
  StorageKey,
  DiagnosticInfo,
  ChallengePrompt,
  ChallengeValidation,
  ChallengeKeyboardType,
  ChallengeReason,
  ChallengePromptTitle,
  EncryptionService,
} from '@standardnotes/services'
import { Base64String } from '@standardnotes/sncrypto-common'
import { ClientDisplayableError } from '@standardnotes/responses'
import { CopyPayloadWithContentOverride } from '@standardnotes/models'
import { isNullOrUndefined } from '@standardnotes/utils'
import { JwtSession } from './Sessions/JwtSession'
import { KeyParamsFromApiResponse, SNRootKeyParams, SNRootKey, CreateNewRootKey } from '@standardnotes/encryption'
import { SessionStrings, SignInStrings } from '../Api/Messages'
import { RemoteSession, RawStorageValue } from './Sessions/Types'
import { Session } from './Sessions/Session'
import { SessionFromRawStorageValue } from './Sessions/Generator'
import { SessionsClientInterface } from './SessionsClientInterface'
import { ShareToken } from './ShareToken'
import { SNApiService } from '../Api/ApiService'
import { DiskStorageService } from '../Storage/DiskStorageService'
import { SNWebSocketsService } from '../Api/WebsocketsService'
import { Strings } from '@Lib/Strings'
import { Subscription } from '@standardnotes/security'
import { TokenSession } from './Sessions/TokenSession'
import { UuidString } from '@Lib/Types/UuidString'
import * as Common from '@standardnotes/common'
import * as Messages from '../Api/Messages'
import * as Responses from '@standardnotes/responses'
import { Challenge, ChallengeService } from '../Challenge'
import {
  ApiCallError,
  ErrorMessage,
  HttpErrorResponseBody,
  HttpServiceInterface,
  UserApiServiceInterface,
  UserRegistrationResponseBody,
} from '@standardnotes/api'

export const MINIMUM_PASSWORD_LENGTH = 8
export const MissingAccountParams = 'missing-params'

type SessionManagerResponse = {
  response: Responses.HttpResponse
  rootKey?: SNRootKey
  keyParams?: Common.AnyKeyParamsContent
}

const cleanedEmailString = (email: string) => {
  return email.trim().toLowerCase()
}

export enum SessionEvent {
  Restored = 'SessionRestored',
  Revoked = 'SessionRevoked',
}

/**
 * The session manager is responsible for loading initial user state, and any relevant
 * server credentials, such as the session token. It also exposes methods for registering
 * for a new account, signing into an existing one, or changing an account password.
 */
export class SNSessionManager extends AbstractService<SessionEvent> implements SessionsClientInterface {
  private user?: Responses.User
  private isSessionRenewChallengePresented = false

  constructor(
    private diskStorageService: DiskStorageService,
    private apiService: SNApiService,
    private userApiService: UserApiServiceInterface,
    private alertService: AlertService,
    private protocolService: EncryptionService,
    private challengeService: ChallengeService,
    private webSocketsService: SNWebSocketsService,
    private httpService: HttpServiceInterface,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)
    apiService.setInvalidSessionObserver((revoked) => {
      if (revoked) {
        void this.notifyEvent(SessionEvent.Revoked)
      } else {
        void this.reauthenticateInvalidSession()
      }
    })
  }

  override deinit(): void {
    ;(this.protocolService as unknown) = undefined
    ;(this.diskStorageService as unknown) = undefined
    ;(this.apiService as unknown) = undefined
    ;(this.alertService as unknown) = undefined
    ;(this.challengeService as unknown) = undefined
    ;(this.webSocketsService as unknown) = undefined
    this.user = undefined
    super.deinit()
  }

  private setUser(user?: Responses.User) {
    this.user = user
    this.apiService.setUser(user)
  }

  async initializeFromDisk() {
    this.setUser(this.diskStorageService.getValue(StorageKey.User))

    if (!this.user) {
      const legacyUuidLookup = this.diskStorageService.getValue<string>(StorageKey.LegacyUuid)
      if (legacyUuidLookup) {
        this.setUser({ uuid: legacyUuidLookup, email: legacyUuidLookup })
      }
    }

    const rawSession = this.diskStorageService.getValue<RawStorageValue>(StorageKey.Session)
    if (rawSession) {
      const session = SessionFromRawStorageValue(rawSession)
      this.setSession(session, false)
      await this.webSocketsService.startWebSocketConnection(session.authorizationValue)
    }
  }

  private setSession(session: Session, persist = true): void {
    this.httpService.setAuthorizationToken(session.authorizationValue)

    this.apiService.setSession(session, persist)
  }

  public online() {
    return !this.offline()
  }

  public offline() {
    return isNullOrUndefined(this.apiService.getSession())
  }

  public getUser() {
    return this.user
  }

  public getSureUser() {
    return this.user as Responses.User
  }

  public getSession() {
    return this.apiService.getSession()
  }

  public async signOut() {
    this.setUser(undefined)
    const session = this.apiService.getSession()
    if (session && session.canExpire()) {
      await this.apiService.signOut()
      this.webSocketsService.closeWebSocketConnection()
    }
  }

  public isSignedIn(): boolean {
    return this.getUser() != undefined
  }

  public isSignedIntoFirstPartyServer(): boolean {
    return this.isSignedIn() && !this.apiService.isThirdPartyHostUsed()
  }

  public async reauthenticateInvalidSession(
    cancelable = true,
    onResponse?: (response: Responses.HttpResponse) => void,
  ): Promise<void> {
    if (this.isSessionRenewChallengePresented) {
      return
    }
    this.isSessionRenewChallengePresented = true
    const challenge = new Challenge(
      [
        new ChallengePrompt(ChallengeValidation.None, undefined, SessionStrings.EmailInputPlaceholder, false),
        new ChallengePrompt(ChallengeValidation.None, undefined, SessionStrings.PasswordInputPlaceholder),
      ],
      ChallengeReason.Custom,
      cancelable,
      SessionStrings.EnterEmailAndPassword,
      SessionStrings.RecoverSession(this.getUser()?.email),
    )
    return new Promise((resolve) => {
      this.challengeService.addChallengeObserver(challenge, {
        onCancel: () => {
          this.isSessionRenewChallengePresented = false
        },
        onComplete: () => {
          this.isSessionRenewChallengePresented = false
        },
        onNonvalidatedSubmit: async (challengeResponse) => {
          const email = challengeResponse.values[0].value as string
          const password = challengeResponse.values[1].value as string
          const currentKeyParams = this.protocolService.getAccountKeyParams()
          const signInResult = await this.signIn(
            email,
            password,
            false,
            this.diskStorageService.isEphemeralSession(),
            currentKeyParams?.version,
          )
          if (signInResult.response.error) {
            this.challengeService.setValidationStatusForChallenge(challenge, challengeResponse!.values[1], false)
            onResponse?.(signInResult.response)
          } else {
            resolve()
            this.challengeService.completeChallenge(challenge)
            void this.notifyEvent(SessionEvent.Restored)
            void this.alertService.alert(SessionStrings.SessionRestored)
          }
        },
      })
      void this.challengeService.promptForChallengeResponse(challenge)
    })
  }

  public async getSubscription(): Promise<ClientDisplayableError | Subscription> {
    const result = await this.apiService.getSubscription(this.getSureUser().uuid)

    if (result.error) {
      return ClientDisplayableError.FromError(result.error)
    }

    const subscription = (result as Responses.GetSubscriptionResponse).data!.subscription!

    return subscription
  }

  public async getAvailableSubscriptions(): Promise<Responses.AvailableSubscriptions | ClientDisplayableError> {
    const response = await this.apiService.getAvailableSubscriptions()

    if (response.error) {
      return ClientDisplayableError.FromError(response.error)
    }

    return (response as Responses.GetAvailableSubscriptionsResponse).data!
  }

  private async promptForMfaValue(): Promise<string | undefined> {
    const challenge = new Challenge(
      [
        new ChallengePrompt(
          ChallengeValidation.None,
          ChallengePromptTitle.Mfa,
          SessionStrings.MfaInputPlaceholder,
          false,
          ChallengeKeyboardType.Numeric,
        ),
      ],
      ChallengeReason.Custom,
      true,
      SessionStrings.EnterMfa,
    )

    const response = await this.challengeService.promptForChallengeResponse(challenge)

    if (response) {
      this.challengeService.completeChallenge(challenge)
      return response.values[0].value as string
    }

    return undefined
  }

  async register(email: string, password: string, ephemeral: boolean): Promise<UserRegistrationResponseBody> {
    if (password.length < MINIMUM_PASSWORD_LENGTH) {
      throw new ApiCallError(
        ErrorMessage.InsufficientPasswordMessage.replace('%LENGTH%', MINIMUM_PASSWORD_LENGTH.toString()),
      )
    }

    const { wrappingKey, canceled } = await this.challengeService.getWrappingKeyIfApplicable()
    if (canceled) {
      throw new ApiCallError(ErrorMessage.PasscodeRequired)
    }

    email = cleanedEmailString(email)

    const rootKey = await this.protocolService.createRootKey(email, password, Common.KeyParamsOrigination.Registration)
    const serverPassword = rootKey.serverPassword as string
    const keyParams = rootKey.keyParams

    const registerResponse = await this.userApiService.register(email, serverPassword, keyParams, ephemeral)

    if ('error' in registerResponse.data) {
      throw new ApiCallError((registerResponse.data as HttpErrorResponseBody).error.message)
    }

    await this.handleAuthResponse(registerResponse.data, rootKey, wrappingKey)

    return registerResponse.data
  }

  private async retrieveKeyParams(
    email: string,
    mfaKeyPath?: string,
    mfaCode?: string,
  ): Promise<{
    keyParams?: SNRootKeyParams
    response: Responses.KeyParamsResponse | Responses.HttpResponse
    mfaKeyPath?: string
    mfaCode?: string
  }> {
    const response = await this.apiService.getAccountKeyParams({
      email,
      mfaKeyPath,
      mfaCode,
    })

    if (response.error || isNullOrUndefined(response.data)) {
      if (mfaCode) {
        await this.alertService.alert(SignInStrings.IncorrectMfa)
      }
      if (response.error?.payload?.mfa_key) {
        /** Prompt for MFA code and try again */
        const inputtedCode = await this.promptForMfaValue()
        if (!inputtedCode) {
          /** User dismissed window without input */
          return {
            response: this.apiService.createErrorResponse(
              SignInStrings.SignInCanceledMissingMfa,
              Responses.StatusCode.CanceledMfa,
            ),
          }
        }
        return this.retrieveKeyParams(email, response.error.payload.mfa_key, inputtedCode)
      } else {
        return { response }
      }
    }
    /** Make sure to use client value for identifier/email */
    const keyParams = KeyParamsFromApiResponse(response as Responses.KeyParamsResponse, email)
    if (!keyParams || !keyParams.version) {
      return {
        response: this.apiService.createErrorResponse(Messages.API_MESSAGE_FALLBACK_LOGIN_FAIL),
      }
    }
    return { keyParams, response, mfaKeyPath, mfaCode }
  }

  public async signIn(
    email: string,
    password: string,
    strict = false,
    ephemeral = false,
    minAllowedVersion?: Common.ProtocolVersion,
  ): Promise<SessionManagerResponse> {
    const result = await this.performSignIn(email, password, strict, ephemeral, minAllowedVersion)
    if (
      result.response.error &&
      result.response.error.status !== Responses.StatusCode.LocalValidationError &&
      result.response.error.status !== Responses.StatusCode.CanceledMfa
    ) {
      const cleanedEmail = cleanedEmailString(email)
      if (cleanedEmail !== email) {
        /**
         * Try signing in with trimmed + lowercase version of email
         */
        return this.performSignIn(cleanedEmail, password, strict, ephemeral, minAllowedVersion)
      } else {
        return result
      }
    } else {
      return result
    }
  }

  private async performSignIn(
    email: string,
    password: string,
    strict = false,
    ephemeral = false,
    minAllowedVersion?: Common.ProtocolVersion,
  ): Promise<SessionManagerResponse> {
    const paramsResult = await this.retrieveKeyParams(email)
    if (paramsResult.response.error) {
      return {
        response: paramsResult.response,
      }
    }
    const keyParams = paramsResult.keyParams!
    if (!this.protocolService.supportedVersions().includes(keyParams.version)) {
      if (this.protocolService.isVersionNewerThanLibraryVersion(keyParams.version)) {
        return {
          response: this.apiService.createErrorResponse(Messages.UNSUPPORTED_PROTOCOL_VERSION),
        }
      } else {
        return {
          response: this.apiService.createErrorResponse(Messages.EXPIRED_PROTOCOL_VERSION),
        }
      }
    }

    if (Common.isProtocolVersionExpired(keyParams.version)) {
      /* Cost minimums only apply to now outdated versions (001 and 002) */
      const minimum = this.protocolService.costMinimumForVersion(keyParams.version)
      if (keyParams.content002.pw_cost < minimum) {
        return {
          response: this.apiService.createErrorResponse(Messages.INVALID_PASSWORD_COST),
        }
      }

      const expiredMessages = Strings.Confirm.ProtocolVersionExpired(keyParams.version)
      const confirmed = await this.alertService.confirm(
        expiredMessages.Message,
        expiredMessages.Title,
        expiredMessages.ConfirmButton,
      )

      if (!confirmed) {
        return {
          response: this.apiService.createErrorResponse(Messages.API_MESSAGE_FALLBACK_LOGIN_FAIL),
        }
      }
    }

    if (!this.protocolService.platformSupportsKeyDerivation(keyParams)) {
      return {
        response: this.apiService.createErrorResponse(Messages.UNSUPPORTED_KEY_DERIVATION),
      }
    }

    if (strict) {
      minAllowedVersion = this.protocolService.getLatestVersion()
    }

    if (!isNullOrUndefined(minAllowedVersion)) {
      if (!Common.leftVersionGreaterThanOrEqualToRight(keyParams.version, minAllowedVersion)) {
        return {
          response: this.apiService.createErrorResponse(
            Messages.StrictSignInFailed(keyParams.version, minAllowedVersion),
          ),
        }
      }
    }
    const rootKey = await this.protocolService.computeRootKey(password, keyParams)
    const signInResponse = await this.bypassChecksAndSignInWithRootKey(email, rootKey, ephemeral)
    return {
      response: signInResponse,
    }
  }

  public async bypassChecksAndSignInWithRootKey(
    email: string,
    rootKey: SNRootKey,
    ephemeral = false,
  ): Promise<Responses.SignInResponse | Responses.HttpResponse> {
    const { wrappingKey, canceled } = await this.challengeService.getWrappingKeyIfApplicable()

    if (canceled) {
      return this.apiService.createErrorResponse(
        SignInStrings.PasscodeRequired,
        Responses.StatusCode.LocalValidationError,
      )
    }

    const signInResponse = await this.apiService.signIn({
      email,
      serverPassword: rootKey.serverPassword!,
      ephemeral,
    })

    if (signInResponse.error || !signInResponse.data) {
      return signInResponse
    }

    const updatedKeyParams = (signInResponse as Responses.SignInResponse).data.key_params
    const expandedRootKey = new SNRootKey(
      CopyPayloadWithContentOverride(rootKey.payload, {
        keyParams: updatedKeyParams || rootKey.keyParams.getPortableValue(),
      }),
    )

    await this.handleSuccessAuthResponse(signInResponse as Responses.SignInResponse, expandedRootKey, wrappingKey)

    return signInResponse
  }

  public async changeCredentials(parameters: {
    currentServerPassword: string
    newRootKey: SNRootKey
    wrappingKey?: SNRootKey
    newEmail?: string
  }): Promise<SessionManagerResponse> {
    const userUuid = this.user!.uuid
    const response = await this.apiService.changeCredentials({
      userUuid,
      currentServerPassword: parameters.currentServerPassword,
      newServerPassword: parameters.newRootKey.serverPassword!,
      newKeyParams: parameters.newRootKey.keyParams,
      newEmail: parameters.newEmail,
    })

    return this.processChangeCredentialsResponse(
      response as Responses.ChangeCredentialsResponse,
      parameters.newRootKey,
      parameters.wrappingKey,
    )
  }

  public async getSessionsList(): Promise<
    (Responses.HttpResponse & { data: RemoteSession[] }) | Responses.HttpResponse
  > {
    const response = await this.apiService.getSessionsList()
    if (response.error || isNullOrUndefined(response.data)) {
      return response
    }
    ;(
      response as Responses.HttpResponse & {
        data: RemoteSession[]
      }
    ).data = (response as Responses.SessionListResponse).data
      .map<RemoteSession>((session) => ({
        ...session,
        updated_at: new Date(session.updated_at),
      }))
      .sort((s1: RemoteSession, s2: RemoteSession) => (s1.updated_at < s2.updated_at ? 1 : -1))
    return response
  }

  public async revokeSession(sessionId: UuidString): Promise<Responses.HttpResponse> {
    const response = await this.apiService.deleteSession(sessionId)
    return response
  }

  public async revokeAllOtherSessions(): Promise<void> {
    const response = await this.getSessionsList()
    if (response.error != undefined || response.data == undefined) {
      throw new Error(response.error?.message ?? Messages.API_MESSAGE_GENERIC_SYNC_FAIL)
    }
    const sessions = response.data as RemoteSession[]
    const otherSessions = sessions.filter((session) => !session.current)
    await Promise.all(otherSessions.map((session) => this.revokeSession(session.uuid)))
  }

  private async processChangeCredentialsResponse(
    response: Responses.ChangeCredentialsResponse,
    newRootKey: SNRootKey,
    wrappingKey?: SNRootKey,
  ): Promise<SessionManagerResponse> {
    if (!response.error && response.data) {
      await this.handleSuccessAuthResponse(response as Responses.ChangeCredentialsResponse, newRootKey, wrappingKey)
    }
    return {
      response: response,
      keyParams: (response as Responses.ChangeCredentialsResponse).data?.key_params,
    }
  }

  public async createDemoShareToken(): Promise<Base64String | ClientDisplayableError> {
    const session = this.getSession()
    if (!session) {
      return new ClientDisplayableError('Cannot generate share token without active session')
    }
    if (!(session instanceof TokenSession)) {
      return new ClientDisplayableError('Cannot generate share token with non-token session')
    }

    const keyParams = (await this.protocolService.getRootKeyParams()) as SNRootKeyParams

    const payload: ShareToken = {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      accessExpiration: session.accessExpiration,
      refreshExpiration: session.refreshExpiration,
      readonlyAccess: true,
      masterKey: this.protocolService.getRootKey()?.masterKey as string,
      keyParams: keyParams.content,
      user: this.getSureUser(),
      host: this.apiService.getHost(),
    }

    return this.protocolService.crypto.base64Encode(JSON.stringify(payload))
  }

  private decodeDemoShareToken(token: Base64String): ShareToken {
    const jsonString = this.protocolService.crypto.base64Decode(token)
    return JSON.parse(jsonString)
  }

  public async populateSessionFromDemoShareToken(token: Base64String): Promise<void> {
    const sharePayload = this.decodeDemoShareToken(token)

    const rootKey = CreateNewRootKey({
      masterKey: sharePayload.masterKey,
      keyParams: sharePayload.keyParams,
      version: sharePayload.keyParams.version,
    })

    const user = sharePayload.user

    const session = new TokenSession(
      sharePayload.accessToken,
      sharePayload.accessExpiration,
      sharePayload.refreshToken,
      sharePayload.refreshExpiration,
      sharePayload.readonlyAccess,
    )

    await this.populateSession(rootKey, user, session, sharePayload.host)
  }

  private async populateSession(
    rootKey: SNRootKey,
    user: Responses.User,
    session: Session,
    host: string,
    wrappingKey?: SNRootKey,
  ) {
    await this.protocolService.setRootKey(rootKey, wrappingKey)

    this.setUser(user)

    this.diskStorageService.setValue(StorageKey.User, user)

    void this.apiService.setHost(host)

    this.httpService.setHost(host)

    await this.setSession(session)

    this.webSocketsService.startWebSocketConnection(session.authorizationValue)
  }

  private async handleAuthResponse(body: UserRegistrationResponseBody, rootKey: SNRootKey, wrappingKey?: SNRootKey) {
    const session = new TokenSession(
      body.session.access_token,
      body.session.access_expiration,
      body.session.refresh_token,
      body.session.refresh_expiration,
      body.session.readonly_access,
    )
    await this.populateSession(rootKey, body.user, session, this.apiService.getHost(), wrappingKey)
  }

  /**
   * @deprecated use handleAuthResponse instead
   */
  private async handleSuccessAuthResponse(
    response: Responses.SignInResponse | Responses.ChangeCredentialsResponse,
    rootKey: SNRootKey,
    wrappingKey?: SNRootKey,
  ) {
    const { data } = response
    const user = data.user as Responses.User

    const isLegacyJwtResponse = data.token != undefined
    if (isLegacyJwtResponse) {
      const session = new JwtSession(data.token as string)
      await this.populateSession(rootKey, user, session, this.apiService.getHost(), wrappingKey)
    } else if (data.session) {
      const session = TokenSession.FromApiResponse(response)
      await this.populateSession(rootKey, user, session, this.apiService.getHost(), wrappingKey)
    }
  }

  override getDiagnostics(): Promise<DiagnosticInfo | undefined> {
    return Promise.resolve({
      session: {
        isSessionRenewChallengePresented: this.isSessionRenewChallengePresented,
        online: this.online(),
        offline: this.offline(),
        isSignedIn: this.isSignedIn(),
        isSignedIntoFirstPartyServer: this.isSignedIntoFirstPartyServer(),
      },
    })
  }
}
