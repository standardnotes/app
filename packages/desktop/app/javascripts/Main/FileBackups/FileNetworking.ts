import { WriteStream } from 'fs'
import axios, { AxiosResponseHeaders, AxiosRequestHeaders } from 'axios'

export async function downloadData(
  writeStream: WriteStream,
  url: string,
  headers: AxiosRequestHeaders,
): Promise<{
  headers: AxiosResponseHeaders
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
