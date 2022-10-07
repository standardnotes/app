import { HttpServiceInterface } from '../../Http'
import { WorkspaceCreationResponse } from '../../Response/Workspace/WorkspaceCreationResponse'

import { WorkspaceServer } from './WorkspaceServer'

describe('WorkspaceServer', () => {
  let httpService: HttpServiceInterface

  const createServer = () => new WorkspaceServer(httpService)

  beforeEach(() => {
    httpService = {} as jest.Mocked<HttpServiceInterface>
    httpService.post = jest.fn().mockReturnValue({
      data: { uuid: '1-2-3' },
    } as jest.Mocked<WorkspaceCreationResponse>)
  })

  it('should create a workspace', async () => {
    const response = await createServer().createWorkspace({
      encryptedPrivateKey: 'foo',
      encryptedWorkspaceKey: 'bar',
      publicKey: 'buzz',
    })

    expect(response).toEqual({
      data: {
        uuid: '1-2-3',
      },
    })
  })
})
