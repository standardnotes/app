import { UserRolesChangedEvent } from '@standardnotes/domain-events'
import { AbstractService, InternalEventBusInterface, StorageKey } from '@standardnotes/services'
import { WebSocketApiServiceInterface } from '@standardnotes/api'

import { DiskStorageService } from '../Storage/DiskStorageService'

export enum WebSocketsServiceEvent {
  UserRoleMessageReceived = 'WebSocketMessageReceived',
}

export class SNWebSocketsService extends AbstractService<WebSocketsServiceEvent, UserRolesChangedEvent> {
  private webSocket?: WebSocket

  constructor(
    private storageService: DiskStorageService,
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

  async startWebSocketConnection(): Promise<void> {
    if (!this.webSocketUrl) {
      return
    }

    const webSocketConectionToken = await this.createWebSocketConnectionToken()
    if (webSocketConectionToken === undefined) {
      return
    }

    try {
      this.webSocket = new WebSocket(`${this.webSocketUrl}?authToken=${webSocketConectionToken}`)
      this.webSocket.onmessage = this.onWebSocketMessage.bind(this)
      this.webSocket.onclose = this.onWebSocketClose.bind(this)
    } catch (e) {
      console.error('Error starting WebSocket connection', e)
    }
  }

  public closeWebSocketConnection(): void {
    this.webSocket?.close()
  }

  private onWebSocketMessage(event: MessageEvent) {
    const eventData: UserRolesChangedEvent = JSON.parse(event.data)
    void this.notifyEvent(WebSocketsServiceEvent.UserRoleMessageReceived, eventData)
  }

  private onWebSocketClose() {
    this.webSocket = undefined
  }

  private async createWebSocketConnectionToken(): Promise<string | undefined> {
    try {
      const response = await this.webSocketApiService.createConnectionToken()
      if (response.data.error) {
        console.error(response.data.error)

        return undefined
      }

      return response.data.token
    } catch (error) {
      console.error((error as Error).message)

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
