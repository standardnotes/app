import { WorkspaceType } from '@standardnotes/common'
import { HttpServiceInterface } from '../../Http'
import { WorkspaceCreationResponse } from '../../Response/Workspace/WorkspaceCreationResponse'
import { WorkspaceInvitationResponse } from '../../Response/Workspace/WorkspaceInvitationResponse'

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
      workspaceType: WorkspaceType.Private,
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

  it('should inivte to a workspace', async () => {
    httpService.post = jest.fn().mockReturnValue({
      data: { uuid: 'i-1-2-3' },
    } as jest.Mocked<WorkspaceInvitationResponse>)

    const response = await createServer().inviteToWorkspace({
      inviteeEmail: 'test@test.te',
      workspaceUuid: 'w-1-2-3',
    })

    expect(response).toEqual({
      data: {
        uuid: 'i-1-2-3',
      },
    })
  })
})
