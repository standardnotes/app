import { WorkspaceCreationResponse } from '../../Response/Workspace/WorkspaceCreationResponse'
import { WorkspaceServerInterface } from '../../Server/Workspace/WorkspaceServerInterface'

import { WorkspaceApiOperations } from './WorkspaceApiOperations'
import { WorkspaceApiService } from './WorkspaceApiService'

describe('WorkspaceApiService', () => {
  let workspaceServer: WorkspaceServerInterface

  const createService = () => new WorkspaceApiService(workspaceServer)

  beforeEach(() => {
    workspaceServer = {} as jest.Mocked<WorkspaceServerInterface>
    workspaceServer.createWorkspace = jest.fn().mockReturnValue({
      data: { uuid: '1-2-3' },
    } as jest.Mocked<WorkspaceCreationResponse>)
  })

  it('should create a workspace', async () => {
    const response = await createService().createWorkspace({
      encryptedPrivateKey: 'foo',
      encryptedWorkspaceKey: 'bar',
      publicKey: 'buzz'
    })

    expect(response).toEqual({
      data: {
        uuid: '1-2-3',
      },
    })
    expect(workspaceServer.createWorkspace).toHaveBeenCalledWith({
      encryptedPrivateKey: 'foo',
      encryptedWorkspaceKey: 'bar',
      publicKey: 'buzz'
    })
  })

  it('should not create a workspace if it is already creating', async () => {
    const service = createService()
    Object.defineProperty(service, 'operationsInProgress', {
      get: () => new Map([[WorkspaceApiOperations.Creating, true]]),
    })

    let error = null
    try {
      await service.createWorkspace({
        encryptedPrivateKey: 'foo',
        encryptedWorkspaceKey: 'bar',
        publicKey: 'buzz'
      })
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).not.toBeNull()
  })

  it('should not create a workspace if the server fails', async () => {
    workspaceServer.createWorkspace = jest.fn().mockImplementation(() => {
      throw new Error('Oops')
    })

    let error = null
    try {
      await createService().createWorkspace({
        encryptedPrivateKey: 'foo',
        encryptedWorkspaceKey: 'bar',
        publicKey: 'buzz'
      })
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).not.toBeNull()
  })
})
