import { IncomingMessage, net } from 'electron'
import fs from 'fs'
import path from 'path'
import { pipeline as pipelineFn } from 'stream'
import { promisify } from 'util'
import { MessageType } from '../../../../test/TestIpcMessage'
import { handleTestMessage } from '../Utils/Testing'
import { isTesting } from '../Utils/Utils'
import { FilesManager } from '../File/FilesManager'

const pipeline = promisify(pipelineFn)

if (isTesting()) {
  handleTestMessage(MessageType.GetJSON, getJSON)
  handleTestMessage(MessageType.DownloadFile, downloadFile)
}

/**
 * Downloads a file to the specified destination.
 * @param filePath path to the saved file (will be created if it does
 * not exist)
 */
export async function downloadFile(url: string, filePath: string): Promise<void> {
  await new FilesManager().ensureDirectoryExists(path.dirname(filePath))
  const response = await get(url)
  await pipeline(
    /**
     * IncomingMessage doesn't implement *every* property of ReadableStream
     * but still all the ones that pipeline needs
     * @see https://www.electronjs.org/docs/api/incoming-message
     */
    response as any,
    fs.createWriteStream(filePath),
  )
}

export async function getJSON<T>(url: string): Promise<T | undefined> {
  const response = await get(url)
  let data = ''
  return new Promise((resolve, reject) => {
    response
      .on('data', (chunk) => {
        data += chunk
      })
      .on('error', reject)
      .on('end', () => {
        try {
          const parsed = JSON.parse(data)
          resolve(parsed)
        } catch (error) {
          resolve(undefined)
        }
      })
  })
}

export function get(url: string): Promise<IncomingMessage> {
  const enum Method {
    Get = 'GET',
  }
  const enum RedirectMode {
    Follow = 'follow',
  }

  return new Promise<IncomingMessage>((resolve, reject) => {
    const request = net.request({
      url,
      method: Method.Get,
      redirect: RedirectMode.Follow,
    })
    request.on('response', resolve)
    request.on('error', reject)
    request.end()
  })
}
