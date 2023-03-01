import { ErrorMessage } from '../../Error/ErrorMessage'
import { ApiCallError } from '../../Error/ApiCallError'

import { WebSocketApiServiceInterface } from './WebSocketApiServiceInterface'
import { WebSocketApiOperations } from './WebSocketApiOperations'
import { WebSocketServerInterface } from '../../Server'
import { HttpResponse } from '@standardnotes/responses'
import { WebSocketConnectionTokenResponseBody } from '../../Response'

export class WebSocketApiService implements WebSocketApiServiceInterface {
  private operationsInProgress: Map<WebSocketApiOperations, boolean>

  constructor(private webSocketServer: WebSocketServerInterface) {
    this.operationsInProgress = new Map()
  }

  async createConnectionToken(): Promise<HttpResponse<WebSocketConnectionTokenResponseBody>> {
    if (this.operationsInProgress.get(WebSocketApiOperations.CreatingConnectionToken)) {
      throw new ApiCallError(ErrorMessage.GenericInProgress)
    }

    this.operationsInProgress.set(WebSocketApiOperations.CreatingConnectionToken, true)

    try {
      const response = await this.webSocketServer.createConnectionToken({})

      this.operationsInProgress.set(WebSocketApiOperations.CreatingConnectionToken, false)

      return response
    } catch (error) {
      throw new ApiCallError(ErrorMessage.GenericFail)
    }
  }
}
