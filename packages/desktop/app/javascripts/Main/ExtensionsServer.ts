import fs from 'fs'
import http, { IncomingMessage, ServerResponse } from 'http'
import mime from 'mime-types'
import path from 'path'
import { URL } from 'url'
import { extensions as str } from './Strings'
import { Paths } from './Types/Paths'
import { app } from 'electron'
import { FileErrorCodes } from './File/FileErrorCodes'

const Protocol = 'http'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function logError(...message: any) {
  console.error('extServer:', ...message)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function log(...message: any) {
  // eslint-disable-next-line no-console
  console.log('extServer:', ...message)
}

export function normalizeFilePath(requestUrl: string, host: string): string {
  const isThirdPartyComponent = requestUrl.startsWith('/Extensions')
  const isNativeComponent = requestUrl.startsWith('/components')
  if (!isThirdPartyComponent && !isNativeComponent) {
    throw new Error(`URL '${requestUrl}' falls outside of the extensions/features domain.`)
  }

  const removedPrefix = requestUrl.replace('/components', '').replace('/Extensions', '')

  const base = `${Protocol}://${host}`
  const url = new URL(removedPrefix, base)

  /**
   * Normalize path (parse '..' and '.') so that we prevent path traversal by
   * joining a fully resolved path to the Extensions dir.
   */
  const modifiedReqUrl = path.normalize(url.pathname)
  if (isThirdPartyComponent) {
    return path.join(Paths.extensionsDir, modifiedReqUrl)
  } else {
    return path.join(Paths.components, modifiedReqUrl)
  }
}

async function handleRequest(request: IncomingMessage, response: ServerResponse) {
  try {
    if (!request.url) {
      throw new Error('No url.')
    }
    if (!request.headers.host) {
      throw new Error('No `host` header.')
    }

    const filePath = normalizeFilePath(request.url, request.headers.host)

    const stat = await fs.promises.lstat(filePath)

    if (!stat.isFile()) {
      throw new Error('Client requested something that is not a file.')
    }

    const mimeType = mime.lookup(path.parse(filePath).ext)

    response.setHeader('Access-Control-Allow-Origin', '*')
    response.setHeader('Cache-Control', 'no-cache')
    response.setHeader('ETag', app.getVersion())
    response.setHeader('Content-Type', `${mimeType}; charset=utf-8`)

    const data = fs.readFileSync(filePath)

    response.writeHead(200)

    response.end(data)
  } catch (error) {
    onRequestError(error as Error, response)
  }
}

function onRequestError(error: Error | { code: string }, response: ServerResponse) {
  let responseCode: number
  let message: string

  if ('code' in error && error.code === FileErrorCodes.FileDoesNotExist) {
    responseCode = 404
    message = str().missingExtension
  } else {
    logError(error)
    responseCode = 500
    message = str().unableToLoadExtension
  }

  response.writeHead(responseCode)
  response.end(message)
}

export function createExtensionsServer(): string {
  const port = 45653
  const ip = '127.0.0.1'
  const host = `${Protocol}://${ip}:${port}`

  const initCallback = () => {
    log(`Server started at ${host}`)
  }

  try {
    http
      .createServer(handleRequest)
      .listen(port, ip, initCallback)
      .on('error', (err) => {
        console.error('Error listening on extServer', err)
      })
  } catch (error) {
    console.error('Error creating ext server', error)
  }

  return host
}
