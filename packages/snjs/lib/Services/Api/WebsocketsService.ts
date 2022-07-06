import { UserRolesChangedEvent } from '@standardnotes/domain-events'
import { DiskStorageService } from '../Storage/DiskStorageService'
import { AbstractService, InternalEventBusInterface, StorageKey } from '@standardnotes/services'

export enum WebSocketsServiceEvent {
  UserRoleMessageReceived = 'WebSocketMessageReceived',
}

export class SNWebSocketsService extends AbstractService<WebSocketsServiceEvent, UserRolesChangedEvent> {
  private webSocket?: WebSocket

  constructor(
    private storageService: DiskStorageService,
    private webSocketUrl: string | undefined,
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

  public startWebSocketConnection(authToken: string): void {
    if (this.webSocketUrl) {
      try {
        this.webSocket = new WebSocket(`${this.webSocketUrl}?authToken=Bearer+${authToken}`)
        this.webSocket.onmessage = this.onWebSocketMessage.bind(this)
        this.webSocket.onclose = this.onWebSocketClose.bind(this)
      } catch (e) {
        console.error('Error starting WebSocket connection', e)
      }
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

  override deinit(): void {
    super.deinit()
    ;(this.storageService as unknown) = undefined
    this.closeWebSocketConnection()
  }
}
