import { FeatureDescription } from '@standardnotes/features'
import { isNullOrUndefined, joinPaths } from '@standardnotes/utils'
import { SettingName, SubscriptionSettingName } from '@standardnotes/settings'
import { Uuid, ErrorTag } from '@standardnotes/common'
import {
  AbstractService,
  ApiServiceInterface,
  InternalEventBusInterface,
  IntegrityApiInterface,
  ItemsServerInterface,
  StorageKey,
  ApiServiceEvent,
  MetaReceivedData,
  DiagnosticInfo,
  KeyValueStoreInterface,
  API_MESSAGE_GENERIC_SYNC_FAIL,
  API_MESSAGE_GENERIC_TOKEN_REFRESH_FAIL,
  API_MESSAGE_CHANGE_CREDENTIALS_IN_PROGRESS,
  API_MESSAGE_FAILED_ACCESS_PURCHASE,
  API_MESSAGE_FAILED_CREATE_FILE_TOKEN,
  API_MESSAGE_FAILED_GET_SETTINGS,
  API_MESSAGE_FAILED_LISTED_REGISTRATION,
  API_MESSAGE_FAILED_OFFLINE_ACTIVATION,
  API_MESSAGE_FAILED_OFFLINE_FEATURES,
  API_MESSAGE_FAILED_SUBSCRIPTION_INFO,
  API_MESSAGE_FAILED_UPDATE_SETTINGS,
  API_MESSAGE_GENERIC_CHANGE_CREDENTIALS_FAIL,
  API_MESSAGE_GENERIC_INTEGRITY_CHECK_FAIL,
  API_MESSAGE_GENERIC_INVALID_LOGIN,
  API_MESSAGE_GENERIC_SINGLE_ITEM_SYNC_FAIL,
  API_MESSAGE_INVALID_SESSION,
  API_MESSAGE_LOGIN_IN_PROGRESS,
  API_MESSAGE_TOKEN_REFRESH_IN_PROGRESS,
} from '@standardnotes/services'
import { FilesApiInterface } from '@standardnotes/files'
import { ServerSyncPushContextualPayload, SNFeatureRepo, FileContent } from '@standardnotes/models'
import * as Responses from '@standardnotes/responses'
import { LegacySession, MapperInterface, Session, SessionToken } from '@standardnotes/domain-core'
import { HttpResponseMeta } from '@standardnotes/api'
import { SNRootKeyParams } from '@standardnotes/encryption'
import { ApiEndpointParam, ClientDisplayableError, CreateValetTokenPayload } from '@standardnotes/responses'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'

import { HttpParams, HttpRequest, HttpVerb, SNHttpService } from './HttpService'
import { isUrlFirstParty, TRUSTED_FEATURE_HOSTS } from '@Lib/Hosts'
import { Paths } from './Paths'
import { DiskStorageService } from '../Storage/DiskStorageService'
import { UuidString } from '../../Types/UuidString'
import merge from 'lodash/merge'
import { SettingsServerInterface } from '../Settings/SettingsServerInterface'
import { Strings } from '@Lib/Strings'

/** Legacy api version field to be specified in params when calling v0 APIs. */
const V0_API_VERSION = '20200115'

type InvalidSessionObserver = (revoked: boolean) => void

export class SNApiService
  extends AbstractService<ApiServiceEvent.MetaReceived, MetaReceivedData>
  implements
    ApiServiceInterface,
    FilesApiInterface,
    IntegrityApiInterface,
    ItemsServerInterface,
    SettingsServerInterface
{
  private session: Session | LegacySession | null
  public user?: Responses.User
  private registering = false
  private authenticating = false
  private changing = false
  private refreshingSession = false
  private invalidSessionObserver?: InvalidSessionObserver
  private filesHost?: string

  constructor(
    private httpService: SNHttpService,
    private storageService: DiskStorageService,
    private host: string,
    private inMemoryStore: KeyValueStoreInterface<string>,
    private crypto: PureCryptoInterface,
    private sessionStorageMapper: MapperInterface<Session, Record<string, unknown>>,
    private legacySessionStorageMapper: MapperInterface<LegacySession, Record<string, unknown>>,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)

    this.session = null
  }

  override deinit(): void {
    ;(this.httpService as unknown) = undefined
    ;(this.storageService as unknown) = undefined
    this.invalidSessionObserver = undefined
    this.session = null
    super.deinit()
  }

  public setUser(user?: Responses.User): void {
    this.user = user
  }

  /**
   * When a we receive a 401 error from the server, we'll notify the observer.
   * Note that this applies only to sessions that are totally invalid. Sessions that
   * are expired but can be renewed are still considered to be valid. In those cases,
   * the server response is 498.
   * If the session has been revoked, then the observer will have its first
   * argument set to true.
   */
  public setInvalidSessionObserver(observer: InvalidSessionObserver): void {
    this.invalidSessionObserver = observer
  }

  public loadHost(): string {
    const storedValue = this.storageService.getValue<string | undefined>(StorageKey.ServerHost)
    this.host = storedValue || this.host
    return this.host
  }

  public async setHost(host: string): Promise<void> {
    this.host = host
    this.storageService.setValue(StorageKey.ServerHost, host)
  }

  public getHost(): string {
    return this.host
  }

  public isThirdPartyHostUsed(): boolean {
    const applicationHost = this.getHost() || ''
    return !isUrlFirstParty(applicationHost)
  }

  public getFilesHost(): string {
    if (!this.filesHost) {
      throw Error('Attempting to access undefined filesHost')
    }
    return this.filesHost
  }

  public setSession(session: Session | LegacySession, persist = true): void {
    this.session = session
    if (persist) {
      let sessionProjection: Record<string, unknown>
      if (session instanceof Session) {
        sessionProjection = this.sessionStorageMapper.toProjection(session)
      } else {
        sessionProjection = this.legacySessionStorageMapper.toProjection(session)
      }

      this.storageService.setValue(StorageKey.Session, sessionProjection)
    }
  }

  public getSession(): Session | LegacySession | null {
    return this.session
  }

  public get apiVersion() {
    return V0_API_VERSION
  }

  private params(inParams: Record<string | number | symbol, unknown>): HttpParams {
    const params = merge(inParams, {
      [ApiEndpointParam.ApiVersion]: this.apiVersion,
    })
    return params
  }

  public createErrorResponse(message: string, status?: Responses.StatusCode): Responses.HttpResponse {
    return { error: { message, status } } as Responses.HttpResponse
  }

  private errorResponseWithFallbackMessage(response: Responses.HttpResponse, message: string) {
    if (!response.error?.message) {
      response.error = {
        ...response.error,
        status: response.error?.status ?? Responses.StatusCode.UnknownError,
        message,
      }
    }
    return response
  }

  public processMetaObject(meta: HttpResponseMeta) {
    if (meta.auth && meta.auth.userUuid && meta.auth.roles) {
      void this.notifyEvent(ApiServiceEvent.MetaReceived, {
        userUuid: meta.auth.userUuid,
        userRoles: meta.auth.roles,
      })
    }

    if (meta.server?.filesServerUrl) {
      this.filesHost = meta.server?.filesServerUrl
    }
  }

  private processResponse(response: Responses.HttpResponse) {
    if (response.meta) {
      this.processMetaObject(response.meta)
    }
  }

  private async request(params: {
    verb: HttpVerb
    url: string
    fallbackErrorMessage: string
    params?: HttpParams
    rawBytes?: Uint8Array
    authentication?: string
    customHeaders?: Record<string, string>[]
    responseType?: XMLHttpRequestResponseType
    external?: boolean
  }) {
    try {
      const response = await this.httpService.runHttp(params)
      this.processResponse(response)
      return response
    } catch (errorResponse) {
      return this.errorResponseWithFallbackMessage(errorResponse as Responses.HttpResponse, params.fallbackErrorMessage)
    }
  }

  /**
   * @param mfaKeyPath  The params path the server expects for authentication against
   *                    a particular mfa challenge. A value of foo would mean the server
   *                    would receive parameters as params['foo'] with value equal to mfaCode.
   * @param mfaCode     The mfa challenge response value.
   */
  async getAccountKeyParams(dto: {
    email: string
    mfaKeyPath?: string
    mfaCode?: string
  }): Promise<Responses.KeyParamsResponse | Responses.HttpResponse> {
    const codeVerifier = this.crypto.generateRandomKey(256)
    this.inMemoryStore.setValue(StorageKey.CodeVerifier, codeVerifier)

    const codeChallenge = this.crypto.base64URLEncode(await this.crypto.sha256(codeVerifier))

    const params = this.params({
      email: dto.email,
      code_challenge: codeChallenge,
    })

    if (dto.mfaKeyPath !== undefined && dto.mfaCode !== undefined) {
      params[dto.mfaKeyPath] = dto.mfaCode
    }

    return this.request({
      verb: HttpVerb.Post,
      url: joinPaths(this.host, Paths.v2.keyParams),
      fallbackErrorMessage: API_MESSAGE_GENERIC_INVALID_LOGIN,
      params,
      /** A session is optional here, if valid, endpoint bypasses 2FA and returns additional params */
      authentication: this.getSessionAccessToken(),
    })
  }

  async signIn(dto: {
    email: string
    serverPassword: string
    ephemeral: boolean
  }): Promise<Responses.SignInResponse | Responses.HttpResponse> {
    if (this.authenticating) {
      return this.createErrorResponse(API_MESSAGE_LOGIN_IN_PROGRESS) as Responses.SignInResponse
    }
    this.authenticating = true
    const url = joinPaths(this.host, Paths.v2.signIn)
    const params = this.params({
      email: dto.email,
      password: dto.serverPassword,
      ephemeral: dto.ephemeral,
      code_verifier: this.inMemoryStore.getValue(StorageKey.CodeVerifier) as string,
    })

    const response = await this.request({
      verb: HttpVerb.Post,
      url,
      params,
      fallbackErrorMessage: API_MESSAGE_GENERIC_INVALID_LOGIN,
    })

    this.authenticating = false

    this.inMemoryStore.removeValue(StorageKey.CodeVerifier)

    return response
  }

  signOut(): Promise<Responses.SignOutResponse> {
    const url = joinPaths(this.host, Paths.v1.signOut)
    return this.httpService.postAbsolute(url, undefined, this.getSessionAccessToken()).catch((errorResponse) => {
      return errorResponse
    }) as Promise<Responses.SignOutResponse>
  }

  async changeCredentials(parameters: {
    userUuid: UuidString
    currentServerPassword: string
    newServerPassword: string
    newKeyParams: SNRootKeyParams
    newEmail?: string
  }): Promise<Responses.ChangeCredentialsResponse | Responses.HttpResponse> {
    if (this.changing) {
      return this.createErrorResponse(API_MESSAGE_CHANGE_CREDENTIALS_IN_PROGRESS)
    }
    const preprocessingError = this.preprocessingError()
    if (preprocessingError) {
      return preprocessingError
    }
    this.changing = true
    const url = joinPaths(this.host, Paths.v1.changeCredentials(parameters.userUuid) as string)
    const params = this.params({
      current_password: parameters.currentServerPassword,
      new_password: parameters.newServerPassword,
      new_email: parameters.newEmail,
      ...parameters.newKeyParams.getPortableValue(),
    })
    const response = await this.httpService
      .putAbsolute(url, params, this.getSessionAccessToken())
      .catch(async (errorResponse) => {
        if (Responses.isErrorResponseExpiredToken(errorResponse)) {
          return this.refreshSessionThenRetryRequest({
            verb: HttpVerb.Put,
            url,
            params,
          })
        }
        return this.errorResponseWithFallbackMessage(errorResponse, API_MESSAGE_GENERIC_CHANGE_CREDENTIALS_FAIL)
      })

    this.processResponse(response)

    this.changing = false
    return response
  }

  async sync(
    payloads: ServerSyncPushContextualPayload[],
    lastSyncToken: string,
    paginationToken: string,
    limit: number,
  ): Promise<Responses.RawSyncResponse | Responses.HttpResponse> {
    const preprocessingError = this.preprocessingError()
    if (preprocessingError) {
      return preprocessingError
    }
    const url = joinPaths(this.host, Paths.v1.sync)
    const params = this.params({
      [ApiEndpointParam.SyncPayloads]: payloads,
      [ApiEndpointParam.LastSyncToken]: lastSyncToken,
      [ApiEndpointParam.PaginationToken]: paginationToken,
      [ApiEndpointParam.SyncDlLimit]: limit,
    })
    const response = await this.httpService
      .postAbsolute(url, params, this.getSessionAccessToken())
      .catch<Responses.HttpResponse>(async (errorResponse) => {
        this.preprocessAuthenticatedErrorResponse(errorResponse)
        if (Responses.isErrorResponseExpiredToken(errorResponse)) {
          return this.refreshSessionThenRetryRequest({
            verb: HttpVerb.Post,
            url,
            params,
          })
        }
        return this.errorResponseWithFallbackMessage(errorResponse, API_MESSAGE_GENERIC_SYNC_FAIL)
      })
    this.processResponse(response)

    return response
  }

  private async refreshSessionThenRetryRequest(httpRequest: HttpRequest): Promise<Responses.HttpResponse> {
    const sessionResponse = await this.refreshSession()
    if (sessionResponse.error || isNullOrUndefined(sessionResponse.data)) {
      return sessionResponse
    } else {
      return this.httpService
        .runHttp({
          ...httpRequest,
          authentication: this.getSessionAccessToken(),
        })
        .catch((errorResponse) => {
          return errorResponse
        })
    }
  }

  async refreshSession(): Promise<Responses.SessionRenewalResponse | Responses.HttpResponse> {
    const preprocessingError = this.preprocessingError()
    if (preprocessingError) {
      return preprocessingError
    }
    this.refreshingSession = true
    const url = joinPaths(this.host, Paths.v1.refreshSession)
    const session = this.session as Session
    const params = this.params({
      access_token: session.accessToken.value,
      refresh_token: session.refreshToken.value,
    })
    const result = await this.httpService
      .postAbsolute(url, params)
      .then(async (response) => {
        const sessionRenewalResponse = response as Responses.SessionRenewalResponse
        if (
          sessionRenewalResponse.error ||
          sessionRenewalResponse.data?.error ||
          !sessionRenewalResponse.data.session
        ) {
          return null
        }

        const accessTokenOrError = SessionToken.create(
          sessionRenewalResponse.data.session.access_token,
          sessionRenewalResponse.data.session.access_expiration,
        )
        if (accessTokenOrError.isFailed()) {
          return null
        }
        const accessToken = accessTokenOrError.getValue()

        const refreshTokenOrError = SessionToken.create(
          sessionRenewalResponse.data.session.refresh_token,
          sessionRenewalResponse.data.session.refresh_expiration,
        )
        if (refreshTokenOrError.isFailed()) {
          return null
        }
        const refreshToken = refreshTokenOrError.getValue()

        const sessionOrError = Session.create(
          accessToken,
          refreshToken,
          sessionRenewalResponse.data.session.readonly_access,
        )
        if (sessionOrError.isFailed()) {
          return null
        }
        const session = sessionOrError.getValue()

        this.session = session

        this.setSession(session)
        this.processResponse(response)
        return response
      })
      .catch((errorResponse) => {
        this.preprocessAuthenticatedErrorResponse(errorResponse)
        return this.errorResponseWithFallbackMessage(errorResponse, API_MESSAGE_GENERIC_TOKEN_REFRESH_FAIL)
      })
    this.refreshingSession = false

    if (result === null) {
      return this.createErrorResponse(API_MESSAGE_INVALID_SESSION)
    }

    return result
  }

  async getSessionsList(): Promise<Responses.SessionListResponse | Responses.HttpResponse> {
    const preprocessingError = this.preprocessingError()
    if (preprocessingError) {
      return preprocessingError
    }
    const url = joinPaths(this.host, Paths.v1.sessions)
    const response = await this.httpService
      .getAbsolute(url, {}, this.getSessionAccessToken())
      .catch(async (errorResponse) => {
        this.preprocessAuthenticatedErrorResponse(errorResponse)
        if (Responses.isErrorResponseExpiredToken(errorResponse)) {
          return this.refreshSessionThenRetryRequest({
            verb: HttpVerb.Get,
            url,
          })
        }
        return this.errorResponseWithFallbackMessage(errorResponse, API_MESSAGE_GENERIC_SYNC_FAIL)
      })
    this.processResponse(response)

    return response
  }

  async deleteSession(sessionId: UuidString): Promise<Responses.HttpResponse> {
    const preprocessingError = this.preprocessingError()
    if (preprocessingError) {
      return preprocessingError
    }
    const url = joinPaths(this.host, <string>Paths.v1.session(sessionId))
    const response: Responses.SessionListResponse | Responses.HttpResponse = await this.httpService
      .deleteAbsolute(url, { uuid: sessionId }, this.getSessionAccessToken())
      .catch((error: Responses.HttpResponse) => {
        const errorResponse = error as Responses.HttpResponse
        this.preprocessAuthenticatedErrorResponse(errorResponse)
        if (Responses.isErrorResponseExpiredToken(errorResponse)) {
          return this.refreshSessionThenRetryRequest({
            verb: HttpVerb.Delete,
            url,
          })
        }
        return this.errorResponseWithFallbackMessage(errorResponse, API_MESSAGE_GENERIC_SYNC_FAIL)
      })
    this.processResponse(response)
    return response
  }

  async getUserFeatures(userUuid: UuidString): Promise<Responses.HttpResponse | Responses.UserFeaturesResponse> {
    const url = joinPaths(this.host, Paths.v1.userFeatures(userUuid))
    const response = await this.httpService
      .getAbsolute(url, undefined, this.getSessionAccessToken())
      .catch((errorResponse: Responses.HttpResponse) => {
        this.preprocessAuthenticatedErrorResponse(errorResponse)
        if (Responses.isErrorResponseExpiredToken(errorResponse)) {
          return this.refreshSessionThenRetryRequest({
            verb: HttpVerb.Get,
            url,
          })
        }
        return this.errorResponseWithFallbackMessage(errorResponse, API_MESSAGE_GENERIC_SYNC_FAIL)
      })
    this.processResponse(response)
    return response
  }

  private async tokenRefreshableRequest<T extends Responses.MinimalHttpResponse>(
    params: HttpRequest & { fallbackErrorMessage: string },
  ): Promise<T> {
    const preprocessingError = this.preprocessingError()
    if (preprocessingError) {
      return preprocessingError as T
    }
    const response: T | Responses.HttpResponse = await this.httpService
      .runHttp(params)
      .catch((errorResponse: Responses.HttpResponse) => {
        this.preprocessAuthenticatedErrorResponse(errorResponse)
        if (Responses.isErrorResponseExpiredToken(errorResponse)) {
          return this.refreshSessionThenRetryRequest(params)
        }
        return this.errorResponseWithFallbackMessage(errorResponse, params.fallbackErrorMessage)
      })
    this.processResponse(response)
    return response as T
  }

  async listSettings(userUuid: UuidString): Promise<Responses.ListSettingsResponse> {
    return await this.tokenRefreshableRequest<Responses.ListSettingsResponse>({
      verb: HttpVerb.Get,
      url: joinPaths(this.host, Paths.v1.settings(userUuid)),
      fallbackErrorMessage: API_MESSAGE_FAILED_GET_SETTINGS,
      authentication: this.getSessionAccessToken(),
    })
  }

  async updateSetting(
    userUuid: UuidString,
    settingName: string,
    settingValue: string | null,
    sensitive: boolean,
  ): Promise<Responses.UpdateSettingResponse> {
    const params = {
      name: settingName,
      value: settingValue,
      sensitive: sensitive,
    }
    return this.tokenRefreshableRequest<Responses.UpdateSettingResponse>({
      verb: HttpVerb.Put,
      url: joinPaths(this.host, Paths.v1.settings(userUuid)),
      authentication: this.getSessionAccessToken(),
      fallbackErrorMessage: API_MESSAGE_FAILED_UPDATE_SETTINGS,
      params,
    })
  }

  async getSetting(userUuid: UuidString, settingName: SettingName): Promise<Responses.GetSettingResponse> {
    return await this.tokenRefreshableRequest<Responses.GetSettingResponse>({
      verb: HttpVerb.Get,
      url: joinPaths(this.host, Paths.v1.setting(userUuid, settingName.toLowerCase() as SettingName)),
      authentication: this.getSessionAccessToken(),
      fallbackErrorMessage: API_MESSAGE_FAILED_GET_SETTINGS,
    })
  }

  async getSubscriptionSetting(
    userUuid: UuidString,
    settingName: SubscriptionSettingName,
  ): Promise<Responses.GetSettingResponse> {
    return await this.tokenRefreshableRequest<Responses.GetSettingResponse>({
      verb: HttpVerb.Get,
      url: joinPaths(
        this.host,
        Paths.v1.subscriptionSetting(userUuid, settingName.toLowerCase() as SubscriptionSettingName),
      ),
      authentication: this.getSessionAccessToken(),
      fallbackErrorMessage: API_MESSAGE_FAILED_GET_SETTINGS,
    })
  }

  async deleteSetting(userUuid: UuidString, settingName: SettingName): Promise<Responses.DeleteSettingResponse> {
    return this.tokenRefreshableRequest<Responses.DeleteSettingResponse>({
      verb: HttpVerb.Delete,
      url: joinPaths(this.host, Paths.v1.setting(userUuid, settingName)),
      authentication: this.getSessionAccessToken(),
      fallbackErrorMessage: API_MESSAGE_FAILED_UPDATE_SETTINGS,
    })
  }

  public downloadFeatureUrl(url: string): Promise<Responses.HttpResponse> {
    return this.request({
      verb: HttpVerb.Get,
      url,
      external: true,
      fallbackErrorMessage: API_MESSAGE_GENERIC_INVALID_LOGIN,
    })
  }

  public async getSubscription(userUuid: string): Promise<Responses.HttpResponse | Responses.GetSubscriptionResponse> {
    const url = joinPaths(this.host, Paths.v1.subscription(userUuid))
    const response = await this.tokenRefreshableRequest({
      verb: HttpVerb.Get,
      url,
      authentication: this.getSessionAccessToken(),
      fallbackErrorMessage: API_MESSAGE_FAILED_SUBSCRIPTION_INFO,
    })
    return response
  }

  public async getAvailableSubscriptions(): Promise<
    Responses.HttpResponse | Responses.GetAvailableSubscriptionsResponse
  > {
    const url = joinPaths(this.host, Paths.v2.subscriptions)
    const response = await this.request({
      verb: HttpVerb.Get,
      url,
      fallbackErrorMessage: API_MESSAGE_FAILED_SUBSCRIPTION_INFO,
    })
    return response
  }

  public async getNewSubscriptionToken(): Promise<string | undefined> {
    const url = joinPaths(this.host, Paths.v1.subscriptionTokens)
    const response: Responses.HttpResponse | Responses.PostSubscriptionTokensResponse = await this.request({
      verb: HttpVerb.Post,
      url,
      authentication: this.getSessionAccessToken(),
      fallbackErrorMessage: API_MESSAGE_FAILED_ACCESS_PURCHASE,
    })
    return (response as Responses.PostSubscriptionTokensResponse).data?.token
  }

  public async downloadOfflineFeaturesFromRepo(
    repo: SNFeatureRepo,
  ): Promise<{ features: FeatureDescription[] } | ClientDisplayableError> {
    try {
      const featuresUrl = repo.offlineFeaturesUrl
      const extensionKey = repo.offlineKey
      if (!featuresUrl || !extensionKey) {
        throw Error('Cannot download offline repo without url and offlineKEy')
      }

      const { host } = new URL(featuresUrl)

      if (!TRUSTED_FEATURE_HOSTS.includes(host)) {
        return new ClientDisplayableError('This offline features host is not in the trusted allowlist.')
      }

      const response: Responses.HttpResponse | Responses.GetOfflineFeaturesResponse = await this.request({
        verb: HttpVerb.Get,
        url: featuresUrl,
        fallbackErrorMessage: API_MESSAGE_FAILED_OFFLINE_FEATURES,
        customHeaders: [{ key: 'x-offline-token', value: extensionKey }],
      })

      if (response.error) {
        return ClientDisplayableError.FromError(response.error)
      }
      return {
        features: (response as Responses.GetOfflineFeaturesResponse).data?.features || [],
      }
    } catch {
      return new ClientDisplayableError(API_MESSAGE_FAILED_OFFLINE_ACTIVATION)
    }
  }

  public async registerForListedAccount(): Promise<Responses.ListedRegistrationResponse> {
    if (!this.user) {
      throw Error('Cannot register for Listed without user account.')
    }
    return await this.tokenRefreshableRequest<Responses.ListedRegistrationResponse>({
      verb: HttpVerb.Post,
      url: joinPaths(this.host, Paths.v1.listedRegistration(this.user.uuid)),
      fallbackErrorMessage: API_MESSAGE_FAILED_LISTED_REGISTRATION,
      authentication: this.getSessionAccessToken(),
    })
  }

  public async createFileValetToken(
    remoteIdentifier: string,
    operation: 'write' | 'read' | 'delete',
    unencryptedFileSize?: number,
  ): Promise<string | ClientDisplayableError> {
    const url = joinPaths(this.host, Paths.v1.createFileValetToken)

    const params: CreateValetTokenPayload = {
      operation,
      resources: [{ remoteIdentifier, unencryptedFileSize: unencryptedFileSize || 0 }],
    }

    const response = await this.tokenRefreshableRequest<Responses.CreateValetTokenResponse>({
      verb: HttpVerb.Post,
      url: url,
      authentication: this.getSessionAccessToken(),
      fallbackErrorMessage: API_MESSAGE_FAILED_CREATE_FILE_TOKEN,
      params,
    })

    if (!response.data?.success) {
      return new ClientDisplayableError(response.data?.reason as string, undefined, response.data?.reason as string)
    }

    return response.data?.valetToken
  }

  public async startUploadSession(apiToken: string): Promise<Responses.StartUploadSessionResponse> {
    const url = joinPaths(this.getFilesHost(), Paths.v1.startUploadSession)

    const response: Responses.HttpResponse | Responses.StartUploadSessionResponse = await this.tokenRefreshableRequest({
      verb: HttpVerb.Post,
      url,
      customHeaders: [{ key: 'x-valet-token', value: apiToken }],
      fallbackErrorMessage: Strings.Network.Files.FailedStartUploadSession,
    })

    return response as Responses.StartUploadSessionResponse
  }

  public async deleteFile(apiToken: string): Promise<Responses.MinimalHttpResponse> {
    const url = joinPaths(this.getFilesHost(), Paths.v1.deleteFile)

    const response: Responses.HttpResponse | Responses.StartUploadSessionResponse = await this.tokenRefreshableRequest({
      verb: HttpVerb.Delete,
      url,
      customHeaders: [{ key: 'x-valet-token', value: apiToken }],
      fallbackErrorMessage: Strings.Network.Files.FailedDeleteFile,
    })

    return response as Responses.MinimalHttpResponse
  }

  public async uploadFileBytes(apiToken: string, chunkId: number, encryptedBytes: Uint8Array): Promise<boolean> {
    if (chunkId === 0) {
      throw Error('chunkId must start with 1')
    }
    const url = joinPaths(this.getFilesHost(), Paths.v1.uploadFileChunk)

    const response: Responses.HttpResponse | Responses.UploadFileChunkResponse = await this.tokenRefreshableRequest({
      verb: HttpVerb.Post,
      url,
      rawBytes: encryptedBytes,
      customHeaders: [
        { key: 'x-valet-token', value: apiToken },
        { key: 'x-chunk-id', value: chunkId.toString() },
        { key: 'Content-Type', value: 'application/octet-stream' },
      ],
      fallbackErrorMessage: Strings.Network.Files.FailedUploadFileChunk,
    })

    return (response as Responses.UploadFileChunkResponse).success
  }

  public async closeUploadSession(apiToken: string): Promise<boolean> {
    const url = joinPaths(this.getFilesHost(), Paths.v1.closeUploadSession)

    const response: Responses.HttpResponse | Responses.CloseUploadSessionResponse = await this.tokenRefreshableRequest({
      verb: HttpVerb.Post,
      url,
      customHeaders: [{ key: 'x-valet-token', value: apiToken }],
      fallbackErrorMessage: Strings.Network.Files.FailedCloseUploadSession,
    })

    return (response as Responses.CloseUploadSessionResponse).success
  }

  public getFilesDownloadUrl(): string {
    return joinPaths(this.getFilesHost(), Paths.v1.downloadFileChunk)
  }

  public async downloadFile(
    file: { encryptedChunkSizes: FileContent['encryptedChunkSizes'] },
    chunkIndex = 0,
    apiToken: string,
    contentRangeStart: number,
    onBytesReceived: (bytes: Uint8Array) => Promise<void>,
  ): Promise<ClientDisplayableError | undefined> {
    const url = this.getFilesDownloadUrl()
    const pullChunkSize = file.encryptedChunkSizes[chunkIndex]

    const response: Responses.HttpResponse | Responses.DownloadFileChunkResponse =
      await this.tokenRefreshableRequest<Responses.DownloadFileChunkResponse>({
        verb: HttpVerb.Get,
        url,
        customHeaders: [
          { key: 'x-valet-token', value: apiToken },
          {
            key: 'x-chunk-size',
            value: pullChunkSize.toString(),
          },
          { key: 'range', value: `bytes=${contentRangeStart}-` },
        ],
        fallbackErrorMessage: Strings.Network.Files.FailedDownloadFileChunk,
        responseType: 'arraybuffer',
      })

    const contentRangeHeader = (<Map<string, string | null>>response.headers).get('content-range')
    if (!contentRangeHeader) {
      return new ClientDisplayableError('Could not obtain content-range header while downloading file chunk')
    }

    const matches = contentRangeHeader.match(/(^[a-zA-Z][\w]*)\s+(\d+)\s?-\s?(\d+)?\s?\/?\s?(\d+|\*)?/)
    if (!matches || matches.length !== 5) {
      return new ClientDisplayableError('Malformed content-range header in response when downloading file chunk')
    }

    const rangeStart = +matches[2]
    const rangeEnd = +matches[3]
    const totalSize = +matches[4]

    const bytesReceived = new Uint8Array(response.data as ArrayBuffer)

    await onBytesReceived(bytesReceived)

    if (rangeEnd < totalSize - 1) {
      return this.downloadFile(file, ++chunkIndex, apiToken, rangeStart + pullChunkSize, onBytesReceived)
    }

    return undefined
  }

  async checkIntegrity(integrityPayloads: Responses.IntegrityPayload[]): Promise<Responses.CheckIntegrityResponse> {
    return await this.tokenRefreshableRequest<Responses.CheckIntegrityResponse>({
      verb: HttpVerb.Post,
      url: joinPaths(this.host, Paths.v1.checkIntegrity),
      params: {
        integrityPayloads,
      },
      fallbackErrorMessage: API_MESSAGE_GENERIC_INTEGRITY_CHECK_FAIL,
      authentication: this.getSessionAccessToken(),
    })
  }

  async getSingleItem(itemUuid: Uuid): Promise<Responses.GetSingleItemResponse> {
    return await this.tokenRefreshableRequest<Responses.GetSingleItemResponse>({
      verb: HttpVerb.Get,
      url: joinPaths(this.host, Paths.v1.getSingleItem(itemUuid)),
      fallbackErrorMessage: API_MESSAGE_GENERIC_SINGLE_ITEM_SYNC_FAIL,
      authentication: this.getSessionAccessToken(),
    })
  }

  private preprocessingError() {
    if (this.refreshingSession) {
      return this.createErrorResponse(API_MESSAGE_TOKEN_REFRESH_IN_PROGRESS)
    }
    if (!this.session) {
      return this.createErrorResponse(API_MESSAGE_INVALID_SESSION)
    }
    return undefined
  }

  /** Handle errored responses to authenticated requests */
  private preprocessAuthenticatedErrorResponse(response: Responses.HttpResponse) {
    if (response.status === Responses.StatusCode.HttpStatusInvalidSession && this.session) {
      this.invalidSessionObserver?.(response.error?.tag === ErrorTag.RevokedSession)
    }
  }

  private getSessionAccessToken(): string | undefined {
    if (!this.session) {
      return undefined
    }

    if (this.session instanceof Session) {
      return this.session.accessToken.value
    }

    return this.session.accessToken
  }

  override getDiagnostics(): Promise<DiagnosticInfo | undefined> {
    return Promise.resolve({
      api: {
        hasSession: this.session != undefined,
        user: this.user,
        registering: this.registering,
        authenticating: this.authenticating,
        changing: this.changing,
        refreshingSession: this.refreshingSession,
        filesHost: this.filesHost,
        host: this.host,
      },
    })
  }
}
