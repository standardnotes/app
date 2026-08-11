import { RefObject } from 'react'
import { WebView } from 'react-native-webview'

/** Payloads above this are split before postMessage (Android OOM on large strings). */
export const BRIDGE_CHUNK_THRESHOLD_BYTES = 16 * 1024 * 1024

const CHUNK_SIZE_BYTES = 4 * 1024 * 1024

export function postReplyToWebView(
  webViewRef: RefObject<WebView | null>,
  messageId: string | number,
  returnValue: unknown,
): void {
  const webView = webViewRef.current
  if (!webView) {
    return
  }

  const payload = JSON.stringify({ messageId, returnValue, messageType: 'reply' })

  if (payload.length <= BRIDGE_CHUNK_THRESHOLD_BYTES) {
    webView.postMessage(payload)
    return
  }

  const totalChunks = Math.ceil(payload.length / CHUNK_SIZE_BYTES)
  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * CHUNK_SIZE_BYTES
    webView.postMessage(
      JSON.stringify({
        messageType: 'reply-chunk',
        messageId,
        chunkIndex,
        totalChunks,
        chunk: payload.slice(start, start + CHUNK_SIZE_BYTES),
      }),
    )
  }

  webView.postMessage(JSON.stringify({ messageType: 'reply-done', messageId }))
}
