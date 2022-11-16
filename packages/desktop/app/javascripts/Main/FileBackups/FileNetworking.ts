import axios, { RawAxiosResponseHeaders } from 'axios'
import { WriteStream } from 'fs'

export async function downloadData(
  writeStream: WriteStream,
  url: string,
  headers: RawAxiosResponseHeaders,
): Promise<{
  headers: RawAxiosResponseHeaders
  status: number
}> {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    headers: headers,
  })

  if (String(response.status).startsWith('2')) {
    writeStream.write(response.data)
  }

  return { headers: response.headers, status: response.status }
}
