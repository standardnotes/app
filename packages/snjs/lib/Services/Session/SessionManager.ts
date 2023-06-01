import {
  AlertService,
  AbstractService,
  InternalEventBusInterface,
  StorageKey,
  ChallengePrompt,
  ChallengeValidation,
  ChallengeKeyboardType,
  ChallengeReason,
  ChallengePromptTitle,
  EncryptionService,
  SessionsClientInterface,
  SessionManagerResponse,
  SessionStrings,
  SignInStrings,
  INVALID_PASSWORD_COST,
  API_MESSAGE_FALLBACK_LOGIN_FAIL,
  API_MESSAGE_GENERIC_SYNC_FAIL,
  EXPIRED_PROTOCOL_VERSION,
  StrictSignInFailed,
  UNSUPPORTED_KEY_DERIVATION,
  UNSUPPORTED_PROTOCOL_VERSION,
  Challenge,
  InternalEventHandlerInterface,
  InternalEventInterface,
  ApiServiceEvent,
  SessionRefreshedData,
  SessionEvent,
  SuccessfullyChangedCredentialsEventData,
} from '@standardnotes/services'
import { Base64String } from '@standardnotes/sncrypto-common'
import {
  ClientDisplayableError,
  SessionBody,
  ErrorTag,
  HttpResponse,
  isErrorResponse,
  SessionListEntry,
  User,
  AvailableSubscriptions,
  KeyParamsResponse,
  SignInResponse,
  ChangeCredentialsResponse,
  SessionListResponse,
  HttpSuccessResponse,
} from '@standardnotes/responses'
import { CopyPayloadWithContentOverride } from '@standardnotes/models'
import { LegacySession, MapperInterface, Result, Session, SessionToken } from '@standardnotes/domain-core'
import { KeyParamsFromApiResponse, SNRootKeyParams, SNRootKey } from '@standardnotes/encryption'
import { Subscription } from '@standardnotes/security'
import * as Common from '@standardnotes/common'

import { RawStorageValue } from './Sessions/Types'
import { ShareToken } from './ShareToken'
import { SNApiService } from '../Api/ApiService'
import { DiskStorageService } from '../Storage/DiskStorageService'
import { SNWebSocketsService } from '../Api/WebsocketsService'
import { Strings } from '@Lib/Strings'
import { UuidString } from '@Lib/Types/UuidString'
import { ChallengeResponse, ChallengeService } from '../Challenge'
import {
  ApiCallError,
  ErrorMessage,
  HttpServiceInterface,
  UserApiServiceInterface,
  UserRegistrationResponseBody,
} from '@standardnotes/api'

export const MINIMUM_PASSWORD_LENGTH = 8
export const MissingAccountParams = 'missing-params'

const cleanedEmailString = (email: string) => {
  return email.trim().toLowerCase()
}

/**
 * The session manager is responsible for loading initial user state, and any relevant
 * server credentials, such as the session token. It also exposes methods for registering
 * for a new account, signing into an existing one, or changing an account password.
 */
export class SNSessionManager
  extends AbstractService<SessionEvent>
  implements SessionsClientInterface, InternalEventHandlerInterface
{
  private user?: User
  private isSessionRenewChallengePresented = false
  private session?: Session | LegacySession

  constructor(
    private diskStorageService: DiskStorageService,
    private apiService: SNApiService,
    private userApiService: UserApiServiceInterface,
    private alertService: AlertService,
    private protocolService: EncryptionService,
    private challengeService: ChallengeService,
    private webSocketsService: SNWebSocketsService,
    private httpService: HttpServiceInterface,
    private sessionStorageMapper: MapperInterface<Session, Record<string, unknown>>,
    private legacySessionStorageMapper: MapperInterface<LegacySession, Record<string, unknown>>,
    private workspaceIdentifier: string,
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

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === ApiServiceEvent.SessionRefreshed) {
      this.httpService.setSession((event.payload as SessionRefreshedData).session)
    }
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

  public getWorkspaceDisplayIdentifier(): string {
    if (this.user) {
      return this.user.email
    } else {
      return this.workspaceIdentifier
    }
  }

  private memoizeUser(user?: User) {
    this.user = user

    this.apiService.setUser(user)
  }

  public async getUserFromServer(): Promise<User | undefined> {
    const response = await this.userApiService.getCurrentUser(this.getSureUser().uuid)

    if (isErrorResponse(response)) {
      return undefined
    }

    return response.data as User
  }

  async initializeFromDisk() {
    this.memoizeUser(this.diskStorageService.getValue(StorageKey.User))

    if (!this.user) {
      const legacyUuidLookup = this.diskStorageService.getValue<string>(StorageKey.LegacyUuid)
      if (legacyUuidLookup) {
        this.memoizeUser({ uuid: legacyUuidLookup, email: legacyUuidLookup })
      }
    }

    const rawSession = this.diskStorageService.getValue<RawStorageValue>(StorageKey.Session)
    if (rawSession) {
      try {
        const session =
          'jwt' in rawSession
            ? this.legacySessionStorageMapper.toDomain(rawSession)
            : this.sessionStorageMapper.toDomain(rawSession)

        this.setSession(session, false)
      } catch (error) {
        console.error(`Could not deserialize session from storage: ${(error as Error).message}`)
      }
    }
  }

  private setSession(session: Session | LegacySession, persist = true): void {
    this.session = session

    if (session instanceof Session) {
      this.httpService.setSession(session)
    }

    this.apiService.setSession(session, persist)

    void this.webSocketsService.startWebSocketConnection()
  }

  public online() {
    return !this.offline()
  }

  public offline() {
    return this.apiService.getSession() == undefined
  }

  public getUser(): User | undefined {
    return this.user
  }

  public getSureUser(): User {
    return this.user as User
  }

  isUserMissingKeypair(): boolean {
    const user = this.getUser()

    if (!user) {
      throw Error('Attempting to access user public key when user is undefined')
    }

    return !user.publicKey
  }

  public getPublicKey(): string {
    const user = this.getUser()
    if (!user || !user.publicKey) {
      throw Error('Attempting to access publicKey when user is undefined')
    }
    return user.publicKey
  }

  public get userUuid(): string {
    const user = this.getUser()

    if (!user) {
      throw Error('Attempting to access userUuid when user is undefined')
    }

    return user.uuid
  }

  isCurrentSessionReadOnly(): boolean | undefined {
    if (this.session === undefined) {
      return undefined
    }

    if (this.session instanceof LegacySession) {
      return false
    }

    return this.session.isReadOnly()
  }

  public getSession() {
    return this.apiService.getSession()
  }

  public async signOut() {
    this.memoizeUser(undefined)

    const session = this.apiService.getSession()
    if (session && session instanceof Session) {
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
    onResponse?: (response: HttpResponse) => void,
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
          const { response } = await this.signIn(
            email,
            password,
            false,
            this.diskStorageService.isEphemeralSession(),
            currentKeyParams?.version,
          )
          if (isErrorResponse(response)) {
            this.challengeService.setValidationStatusForChallenge(
              challenge,
              (challengeResponse as ChallengeResponse).values[1],
              false,
            )
            onResponse?.(response)
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

  public async getSubscription(): Promise<ClientDisplayableError | Subscription | undefined> {
    const result = await this.apiService.getSubscription(this.getSureUser().uuid)

    if (isErrorResponse(result)) {
      return ClientDisplayableError.FromError(result.data?.error)
    }

    const subscription = result.data.subscription

    return subscription
  }

  public async getAvailableSubscriptions(): Promise<AvailableSubscriptions | ClientDisplayableError> {
    const response = await this.apiService.getAvailableSubscriptions()

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromError(response.data.error)
    }

    return response.data
  }

  private async promptForU2FVerification(username: string): Promise<Record<string, unknown> | undefined> {
    const challenge = new Challenge(
      [
        new ChallengePrompt(
          ChallengeValidation.Authenticator,
          ChallengePromptTitle.U2F,
          undefined,
          false,
          undefined,
          undefined,
          {
            username,
          },
        ),
      ],
      ChallengeReason.Custom,
      true,
      SessionStrings.InputU2FDevice,
    )

    const response = await this.challengeService.promptForChallengeResponse(challenge)

    if (!response) {
      return undefined
    }

    return response.values[0].value as Record<string, unknown>
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

    const { publicKey, privateKey } = this.protocolService.generateKeyPair()
    const encryptedPrivateKey = this.protocolService.encryptPrivateKeyWithRootKey(rootKey, privateKey)

    const registerResponse = await this.userApiService.register({
      email,
      serverPassword,
      keyParams,
      ephemeral,
      publicKey,
      encryptedPrivateKey,
    })

    if ('error' in registerResponse.data) {
      throw new ApiCallError(registerResponse.data.error.message)
    }

    await this.handleAuthentication({
      rootKey,
      wrappingKey,
      session: registerResponse.data.session,
      user: registerResponse.data.user,
    })

    return registerResponse.data
  }

  private async retrieveKeyParams(dto: {
    email: string
    mfaCode?: string
    authenticatorResponse?: Record<string, unknown>
  }): Promise<{
    keyParams?: SNRootKeyParams
    response: HttpResponse<KeyParamsResponse>
    mfaCode?: string
  }> {
    const response = await this.apiService.getAccountKeyParams(dto)

    if (isErrorResponse(response) || !response.data) {
      if (dto.mfaCode) {
        await this.alertService.alert(SignInStrings.IncorrectMfa)
      }

      const error = isErrorResponse(response) ? response.data.error : undefined

      if (response.data && [ErrorTag.U2FRequired, ErrorTag.MfaRequired].includes(error?.tag as ErrorTag)) {
        const isU2FRequired = error?.tag === ErrorTag.U2FRequired
        const result = isU2FRequired ? await this.promptForU2FVerification(dto.email) : await this.promptForMfaValue()
        if (!result) {
          return {
            response: this.apiService.createErrorResponse(
              SignInStrings.SignInCanceledMissingMfa,
              undefined,
              ErrorTag.ClientCanceledMfa,
            ),
          }
        }

        return this.retrieveKeyParams({
          email: dto.email,
          mfaCode: isU2FRequired ? undefined : (result as string),
          authenticatorResponse: isU2FRequired ? (result as Record<string, unknown>) : undefined,
        })
      } else {
        return { response }
      }
    }
    /** Make sure to use client value for identifier/email */
    const keyParams = KeyParamsFromApiResponse(response.data, dto.email)
    if (!keyParams || !keyParams.version) {
      return {
        response: this.apiService.createErrorResponse(API_MESSAGE_FALLBACK_LOGIN_FAIL),
      }
    }
    return { keyParams, response, mfaCode: dto.mfaCode }
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
      isErrorResponse(result.response) &&
      result.response.data.error.tag !== ErrorTag.ClientValidationError &&
      result.response.data.error.tag !== ErrorTag.ClientCanceledMfa
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
    const paramsResult = await this.retrieveKeyParams({
      email,
    })
    if (isErrorResponse(paramsResult.response)) {
      return {
        response: paramsResult.response,
      }
    }
    const keyParams = paramsResult.keyParams as SNRootKeyParams
    if (!this.protocolService.supportedVersions().includes(keyParams.version)) {
      if (this.protocolService.isVersionNewerThanLibraryVersion(keyParams.version)) {
        return {
          response: this.apiService.createErrorResponse(UNSUPPORTED_PROTOCOL_VERSION),
        }
      } else {
        return {
          response: this.apiService.createErrorResponse(EXPIRED_PROTOCOL_VERSION),
        }
      }
    }

    if (Common.isProtocolVersionExpired(keyParams.version)) {
      /* Cost minimums only apply to now outdated versions (001 and 002) */
      const minimum = this.protocolService.costMinimumForVersion(keyParams.version)
      if (keyParams.content002.pw_cost < minimum) {
        return {
          response: this.apiService.createErrorResponse(INVALID_PASSWORD_COST),
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
          response: this.apiService.createErrorResponse(API_MESSAGE_FALLBACK_LOGIN_FAIL),
        }
      }
    }

    if (!this.protocolService.platformSupportsKeyDerivation(keyParams)) {
      return {
        response: this.apiService.createErrorResponse(UNSUPPORTED_KEY_DERIVATION),
      }
    }

    if (strict) {
      minAllowedVersion = this.protocolService.getLatestVersion()
    }

    if (minAllowedVersion != undefined) {
      if (!Common.leftVersionGreaterThanOrEqualToRight(keyParams.version, minAllowedVersion)) {
        return {
          response: this.apiService.createErrorResponse(StrictSignInFailed(keyParams.version, minAllowedVersion)),
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
  ): Promise<HttpResponse<SignInResponse>> {
    const { wrappingKey, canceled } = await this.challengeService.getWrappingKeyIfApplicable()

    if (canceled) {
      return this.apiService.createErrorResponse(
        SignInStrings.PasscodeRequired,
        undefined,
        ErrorTag.ClientValidationError,
      )
    }

    const signInResponse = await this.apiService.signIn({
      email,
      serverPassword: rootKey.serverPassword as string,
      ephemeral,
    })

    if (!signInResponse.data || isErrorResponse(signInResponse)) {
      return signInResponse
    }

    const updatedKeyParams = signInResponse.data.key_params
    const expandedRootKey = new SNRootKey(
      CopyPayloadWithContentOverride(rootKey.payload, {
        keyParams: updatedKeyParams || rootKey.keyParams.getPortableValue(),
      }),
    )

    await this.handleSuccessAuthResponse(signInResponse, expandedRootKey, wrappingKey)

    return signInResponse
  }

  public async changeCredentials(parameters: {
    currentServerPassword: string
    newRootKey: SNRootKey
    wrappingKey?: SNRootKey
    newEmail?: string
  }): Promise<SessionManagerResponse> {
    const { publicKey: newPublicKey, privateKey: newPrivateKey } = this.protocolService.generateKeyPair()
    const encryptedPrivateKey = this.protocolService.encryptPrivateKeyWithRootKey(parameters.newRootKey, newPrivateKey)

    const userUuid = this.getSureUser().uuid
    const rawResponse = await this.apiService.changeCredentials({
      userUuid,
      currentServerPassword: parameters.currentServerPassword,
      newServerPassword: parameters.newRootKey.serverPassword as string,
      newKeyParams: parameters.newRootKey.keyParams,
      newEmail: parameters.newEmail,
      newPublicKey: newPublicKey,
      newEncryptedPrivateKey: encryptedPrivateKey,
    })

    const processedResponse = await this.processChangeCredentialsResponse(
      rawResponse,
      parameters.newRootKey,
      parameters.wrappingKey,
    )

    if (!isErrorResponse(rawResponse)) {
      const eventData: SuccessfullyChangedCredentialsEventData = {
        newPublicKey,
        newPrivateKey,
      }

      void this.notifyEvent(SessionEvent.SuccessfullyChangedCredentials, eventData)
    }

    return processedResponse
  }

  async updateAccountWithFirstTimeKeypair(): Promise<boolean> {
    if (!this.isUserMissingKeypair()) {
      throw Error('Cannot update account with first time keypair if user already has a keypair')
    }

    const rootKey = this.protocolService.getSureRootKey()
    const { publicKey, privateKey } = this.protocolService.generateKeyPair()
    const encryptedPrivateKey = this.protocolService.encryptPrivateKeyWithRootKey(rootKey, privateKey)

    const response = await this.userApiService.updateUser({
      userUuid: this.getSureUser().uuid,
      publicKey,
      encryptedPrivateKey,
    })

    if (isErrorResponse(response)) {
      return false
    }

    const user = this.getSureUser()
    user.publicKey = publicKey
    this.memoizeUser(user)
    this.diskStorageService.setValue(StorageKey.User, user)

    this.diskStorageService.setValue(StorageKey.AccountDecryptedPrivateKey, privateKey)

    return true
  }

  public async getSessionsList(): Promise<HttpResponse<SessionListEntry[]>> {
    const response = await this.apiService.getSessionsList()

    if (isErrorResponse(response)) {
      return response
    }

    response.data = response.data.sort((s1: SessionListEntry, s2: SessionListEntry) => {
      return new Date(s1.updated_at) < new Date(s2.updated_at) ? 1 : -1
    })

    return response
  }

  public async revokeSession(sessionId: UuidString): Promise<HttpResponse<SessionListResponse>> {
    return this.apiService.deleteSession(sessionId)
  }

  public async revokeAllOtherSessions(): Promise<void> {
    const response = await this.getSessionsList()
    if (isErrorResponse(response) || !response.data) {
      const error = isErrorResponse(response) ? response.data?.error : undefined
      throw new Error(error?.message ?? API_MESSAGE_GENERIC_SYNC_FAIL)
    }

    const otherSessions = response.data.filter((session) => !session.current)
    await Promise.all(otherSessions.map((session) => this.revokeSession(session.uuid)))
  }

  private async processChangeCredentialsResponse(
    response: HttpResponse<ChangeCredentialsResponse>,
    newRootKey: SNRootKey,
    wrappingKey?: SNRootKey,
  ): Promise<SessionManagerResponse> {
    if (isErrorResponse(response)) {
      return {
        response: response,
      }
    }

    await this.handleSuccessAuthResponse(response, newRootKey, wrappingKey)

    return {
      response: response,
      keyParams: response.data?.key_params,
    }
  }

  private decodeDemoShareToken(token: Base64String): ShareToken {
    const jsonString = this.protocolService.crypto.base64Decode(token)
    return JSON.parse(jsonString)
  }

  public async populateSessionFromDemoShareToken(token: Base64String): Promise<void> {
    const sharePayload = this.decodeDemoShareToken(token)

    await this.signIn(sharePayload.email, sharePayload.password, false, true)
  }

  private persistUserInfoChange(user: User) {
    if (user.encryptedPrivateKey) {
      const rootKey = this.protocolService.getRootKey()
      if (!rootKey) {
        throw Error('Cannot persist user info change without root key')
      }

      const decryptedPrivateKey = this.protocolService.decryptPrivateKeyWithRootKey(rootKey, user.encryptedPrivateKey)
      if (decryptedPrivateKey) {
        this.diskStorageService.setValue(StorageKey.AccountDecryptedPrivateKey, decryptedPrivateKey)
      } else {
        /** If failed to decrypt, do not trust keypair information */
        user.publicKey = undefined
        user.encryptedPrivateKey = undefined
      }
    } else {
      user.publicKey = undefined
      user.encryptedPrivateKey = undefined
    }

    this.memoizeUser(user)
    this.diskStorageService.setValue(StorageKey.User, user)
  }

  private async populateSession(
    rootKey: SNRootKey,
    user: User,
    session: Session | LegacySession,
    host: string,
    wrappingKey?: SNRootKey,
  ) {
    await this.protocolService.setRootKey(rootKey, wrappingKey)

    this.persistUserInfoChange(user)

    void this.apiService.setHost(host)
    this.httpService.setHost(host)

    this.setSession(session)
  }

  async handleAuthentication(dto: {
    session: SessionBody
    user: {
      uuid: string
      email: string
    }
    rootKey: SNRootKey
    wrappingKey?: SNRootKey
  }): Promise<void> {
    const sessionOrError = this.createSession(
      dto.session.access_token,
      dto.session.access_expiration,
      dto.session.refresh_token,
      dto.session.refresh_expiration,
      dto.session.readonly_access,
    )
    if (sessionOrError.isFailed()) {
      console.error(sessionOrError.getError())

      return
    }

    await this.populateSession(
      dto.rootKey,
      dto.user,
      sessionOrError.getValue(),
      this.apiService.getHost(),
      dto.wrappingKey,
    )
  }

  /**
   * @deprecated use handleAuthentication instead
   */
  private async handleSuccessAuthResponse(
    response: HttpSuccessResponse<SignInResponse | ChangeCredentialsResponse>,
    rootKey: SNRootKey,
    wrappingKey?: SNRootKey,
  ) {
    const { data } = response
    const user = data.user

    const isLegacyJwtResponse = data.token != undefined
    if (isLegacyJwtResponse) {
      const sessionOrError = LegacySession.create(data.token as string)
      if (!sessionOrError.isFailed() && user) {
        await this.populateSession(rootKey, user, sessionOrError.getValue(), this.apiService.getHost(), wrappingKey)
      }
    } else if (data.session) {
      const sessionOrError = this.createSession(
        data.session.access_token,
        data.session.access_expiration,
        data.session.refresh_token,
        data.session.refresh_expiration,
        data.session.readonly_access,
      )
      if (sessionOrError.isFailed()) {
        console.error(sessionOrError.getError())

        return
      }
      if (!user) {
        console.error('No user in response')

        return
      }

      await this.populateSession(rootKey, user, sessionOrError.getValue(), this.apiService.getHost(), wrappingKey)
    }
  }

  private createSession(
    accessTokenValue: string,
    accessExpiration: number,
    refreshTokenValue: string,
    refreshExpiration: number,
    readonlyAccess: boolean,
  ): Result<Session> {
    const accessTokenOrError = SessionToken.create(accessTokenValue, accessExpiration)
    if (accessTokenOrError.isFailed()) {
      return Result.fail(`Could not create session: ${accessTokenOrError.getError()}`)
    }
    const accessToken = accessTokenOrError.getValue()

    const refreshTokenOrError = SessionToken.create(refreshTokenValue, refreshExpiration)
    if (refreshTokenOrError.isFailed()) {
      return Result.fail(`Could not create session: ${refreshTokenOrError.getError()}`)
    }
    const refreshToken = refreshTokenOrError.getValue()

    const sessionOrError = Session.create(accessToken, refreshToken, readonlyAccess)
    if (sessionOrError.isFailed()) {
      return Result.fail(`Could not create session: ${sessionOrError.getError()}`)
    }

    return Result.ok(sessionOrError.getValue())
  }
}
