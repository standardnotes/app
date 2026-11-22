import { FreeLlmApiConfig } from './config'

export interface ResponsesCreateParams {
  instructions?: string
  input: string
  model?: string
}

export interface ConnectionTestResult {
  ok: boolean
  latencyMs: number
  replyPreview?: string
  error?: string
  testedAt: number
}

interface ResponsesOutputContentPart {
  type?: string
  text?: string
}

interface ResponsesOutputItem {
  type?: string
  content?: ResponsesOutputContentPart[]
}

interface RawApiResponse {
  output_text?: string
  output?: ResponsesOutputItem[]
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
  error?: {
    message?: string
  }
}

export function extractResponseText(payload: RawApiResponse): string {
  if (typeof payload.output_text === 'string' && payload.output_text.length > 0) {
    return payload.output_text
  }

  if (Array.isArray(payload.output)) {
    const parts: string[] = []
    for (const item of payload.output) {
      if (!Array.isArray(item.content)) {
        continue
      }
      for (const contentPart of item.content) {
        if (typeof contentPart.text === 'string' && contentPart.text.length > 0) {
          parts.push(contentPart.text)
        }
      }
    }
    if (parts.length > 0) {
      return parts.join('\n')
    }
  }

  const fallbackChoice = payload.choices?.[0]?.message?.content
  if (typeof fallbackChoice === 'string') {
    return fallbackChoice
  }

  return ''
}

const DEFAULT_REQUEST_TIMEOUT_MS = 90000

export class FreeLlmApiClient {
  async createResponse(
    config: FreeLlmApiConfig,
    params: ResponsesCreateParams,
    signal?: AbortSignal,
    timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  ): Promise<string> {
    const baseURL = config.baseURL.replace(/\/+$/, '')
    const endpoint = `${baseURL}/responses`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (config.apiKey.trim()) {
      headers.Authorization = `Bearer ${config.apiKey.trim()}`
    }

    const internalAbort = new AbortController()
    let didTimeout = false
    const onExternalAbort = () => internalAbort.abort()
    if (signal) {
      if (signal.aborted) {
        internalAbort.abort()
      } else {
        signal.addEventListener('abort', onExternalAbort, { once: true })
      }
    }
    const timer = setTimeout(() => {
      didTimeout = true
      internalAbort.abort()
    }, timeoutMs)

    let response: Response
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: params.model || config.model || 'auto',
          instructions: params.instructions,
          input: params.input,
        }),
        signal: internalAbort.signal,
      })
    } catch (error) {
      if (didTimeout) {
        throw new Error(`FreeLLM API timed out after ${Math.round(timeoutMs / 1000)}s.`)
      }
      if ((error as Error).name === 'AbortError') {
        throw error
      }
      throw new Error(
        `Could not reach FreeLLM API at ${baseURL}. Make sure your local server is running and allows CORS.`,
      )
    } finally {
      clearTimeout(timer)
      signal?.removeEventListener('abort', onExternalAbort)
    }

    const rawText = await response.text()
    let parsed: RawApiResponse | undefined
    try {
      parsed = JSON.parse(rawText) as RawApiResponse
    } catch {
      parsed = undefined
    }

    if (!response.ok) {
      const apiError = parsed?.error?.message || rawText || `HTTP ${response.status}`
      throw new Error(`FreeLLM API error (${response.status}): ${apiError}`)
    }

    if (!parsed) {
      return rawText
    }

    const text = extractResponseText(parsed)
    if (!text) {
      throw new Error('FreeLLM API returned an empty response.')
    }

    return text
  }

  async testConnection(config: FreeLlmApiConfig): Promise<ConnectionTestResult> {
    const start = Date.now()
    const abortController = new AbortController()
    const timeout = setTimeout(() => abortController.abort(), 15000)

    try {
      const reply = await this.createResponse(
        config,
        {
          instructions: 'Reply concisely with "OK".',
          input: 'Connection test. Reply with OK.',
        },
        abortController.signal,
      )
      return {
        ok: true,
        latencyMs: Date.now() - start,
        replyPreview: reply.trim().slice(0, 120),
        testedAt: Date.now(),
      }
    } catch (error) {
      const message =
        (error as Error).name === 'AbortError'
          ? 'Connection timed out after 15s.'
          : error instanceof Error
          ? error.message
          : 'Unknown connection error.'
      return {
        ok: false,
        latencyMs: Date.now() - start,
        error: message,
        testedAt: Date.now(),
      }
    } finally {
      clearTimeout(timeout)
    }
  }
}
