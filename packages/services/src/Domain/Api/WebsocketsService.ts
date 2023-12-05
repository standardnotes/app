import { isErrorResponse } from '@standardnotes/responses'
import { DomainEventInterface } from '@standardnotes/domain-events'
import { WebSocketApiServiceInterface } from '@standardnotes/api'
import { WebSocketsServiceEvent } from './WebSocketsServiceEvent'
import { StorageServiceInterface } from '../Storage/StorageServiceInterface'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { AbstractService } from '../Service/AbstractService'
import { StorageKey } from '../Storage/StorageKeys'
import { Result } from '@standardnotes/domain-core'

export class WebSocketsService extends AbstractService<WebSocketsServiceEvent, DomainEventInterface> {
  private CLOSE_CONNECTION_CODE = 3123
  private HEARTBEAT_DELAY = 360_000

  private webSocket?: WebSocket
  private webSocketHeartbeatInterval?: NodeJS.Timer

  constructor(
    private storageService: StorageServiceInterface,
    private webSocketUrl: string | undefined,
    private webSocketApiService: WebSocketApiServiceInterface,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)
  }

  public setWebSocketUrl(url: string | undefined): void {
    this.webSocketUrl = url
    this.storageService.setValue(StorageKey.WebSocketUrl, url)
  }

  public loadWebSocketUrl(): void {
    const storedValue = this.storageService.getValue<string | undefined>(StorageKey.WebSocketUrl)
    this.webSocketUrl =
      storedValue ||
      this.webSocketUrl ||
      (
        window as {
          _websocket_url?: string
        }
      )._websocket_url
  }

  async startWebSocketConnection(): Promise<Result<void>> {
    if (!this.webSocketUrl) {
      return Result.fail('WebSocket URL is not set')
    }

    const webSocketConectionToken = await this.createWebSocketConnectionToken()
    if (webSocketConectionToken === undefined) {
      return Result.fail('Failed to create WebSocket connection token')
    }

    try {
      this.webSocket = new WebSocket(`${this.webSocketUrl}?authToken=${webSocketConectionToken}`)
      this.webSocket.onmessage = this.onWebSocketMessage.bind(this)
      this.webSocket.onclose = this.onWebSocketClose.bind(this)
      this.webSocket.onopen = this.beginWebSocketHeartbeat.bind(this)

      return Result.ok()
    } catch (error) {
      return Result.fail(`Error starting WebSocket connection: ${(error as Error).message}`)
    }
  }

  isWebSocketConnectionOpen(): boolean {
    return this.webSocket?.readyState === WebSocket.OPEN
  }

  public closeWebSocketConnection(): void {
    this.webSocket?.close(this.CLOSE_CONNECTION_CODE, 'Closing application')
  }

  private beginWebSocketHeartbeat(): void {
    this.webSocketHeartbeatInterval = setInterval(this.websocketHeartbeat.bind(this), this.HEARTBEAT_DELAY)
  }

  private websocketHeartbeat(): void {
    if (this.webSocket?.readyState === WebSocket.OPEN) {
      this.webSocket.send('ping')
    }
  }

  private onWebSocketMessage(messageEvent: MessageEvent) {
    const eventData = JSON.parse(messageEvent.data)
    switch (eventData.type) {
      case 'ITEMS_CHANGED_ON_SERVER':
        void this.notifyEvent(WebSocketsServiceEvent.ItemsChangedOnServer, eventData)
        break
      case 'USER_ROLES_CHANGED':
        void this.notifyEvent(WebSocketsServiceEvent.UserRoleMessageReceived, eventData)
        break
      case 'NOTIFICATION_ADDED_FOR_USER':
        void this.notifyEvent(WebSocketsServiceEvent.NotificationAddedForUser, eventData.payload)
        break
      case 'MESSAGE_SENT_TO_USER':
        void this.notifyEvent(WebSocketsServiceEvent.MessageSentToUser, eventData.payload)
        break
      case 'USER_INVITED_TO_SHARED_VAULT':
        void this.notifyEvent(WebSocketsServiceEvent.UserInvitedToSharedVault, eventData.payload)
        break
      default:
        break
    }
  }

  private onWebSocketClose(event: CloseEvent) {
    if (this.webSocketHeartbeatInterval) {
      clearInterval(this.webSocketHeartbeatInterval)
    }
    this.webSocketHeartbeatInterval = undefined

    const closedByApplication = event.code === this.CLOSE_CONNECTION_CODE
    if (closedByApplication) {
      this.webSocket = undefined

      return
    }

    if (this.webSocket?.readyState === WebSocket.CLOSED) {
      void this.startWebSocketConnection()
    }
  }

  private async createWebSocketConnectionToken(): Promise<string | undefined> {
    try {
      const response = await this.webSocketApiService.createConnectionToken()
      if (isErrorResponse(response)) {
        console.error(response.data.error)

        return undefined
      }

      return response.data.token
    } catch (error) {
      console.error('Caught error:', (error as Error).message)

      return undefined
    }
  }

  override deinit(): void {
    super.deinit()
    ;(this.storageService as unknown) = undefined
    ;(this.webSocketApiService as unknown) = undefined
    this.closeWebSocketConnection()
  }
}
