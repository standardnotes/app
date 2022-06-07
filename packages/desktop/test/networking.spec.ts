import anyTest, { TestFn } from 'ava'
import { promises as fs } from 'fs'
import http from 'http'
import { AddressInfo } from 'net'
import path from 'path'
import { createDriver, Driver } from './driver'
import { createTmpDir } from './testUtils'

const test = anyTest as TestFn<Driver>

const tmpDir = createTmpDir(__filename)

const sampleData = {
  title: 'Diamond Dove',
  meter: {
    4: 4,
  },
  instruments: ['Piano', 'Chiptune'],
}

let server: http.Server
let serverAddress: string

test.before(
  (): Promise<any> =>
    Promise.all([
      tmpDir.make(),
      new Promise((resolve) => {
        server = http.createServer((_req, res) => {
          res.write(JSON.stringify(sampleData))
          res.end()
        })
        server.listen(0, '127.0.0.1', () => {
          const { address, port } = server.address() as AddressInfo
          serverAddress = `http://${address}:${port}`
          resolve(null)
        })
      }),
    ]),
)

test.after((): Promise<any> => Promise.all([tmpDir.clean(), new Promise((resolve) => server.close(resolve))]))

test.beforeEach(async (t) => {
  t.context = await createDriver()
})
test.afterEach((t) => t.context.stop())

test('downloads a JSON file', async (t) => {
  t.deepEqual(await t.context.net.getJSON(serverAddress), sampleData)
})

test('downloads a folder to the specified location', async (t) => {
  const filePath = path.join(tmpDir.path, 'fileName.json')
  await t.context.net.downloadFile(serverAddress + '/file', filePath)
  const fileContents = await fs.readFile(filePath, 'utf8')
  t.is(JSON.stringify(sampleData), fileContents)
})
