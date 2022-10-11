import { WorkspaceType } from '@standardnotes/common'
import { HttpServiceInterface, HttpStatusCode } from '../../Http'
import { WorkspaceCreationResponse } from '../../Response/Workspace/WorkspaceCreationResponse'
import { WorkspaceInvitationAcceptingResponse } from '../../Response/Workspace/WorkspaceInvitationAcceptingResponse'
import { WorkspaceInvitationResponse } from '../../Response/Workspace/WorkspaceInvitationResponse'
import { WorkspaceListResponse } from '../../Response/Workspace/WorkspaceListResponse'

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

  it('should accept invitation to a workspace', async () => {
    httpService.post = jest.fn().mockReturnValue({
      data: { success: true },
    } as jest.Mocked<WorkspaceInvitationAcceptingResponse>)

    const response = await createServer().acceptInvite({
      encryptedPrivateKey: 'foo',
      inviteUuid: 'i-1-2-3',
      publicKey: 'bar',
      userUuid: 'u-1-2-3',
    })

    expect(response).toEqual({
      data: {
        success: true,
      },
    })
  })

  it('should list workspaces', async () => {
    httpService.get = jest.fn().mockReturnValue({
      status: HttpStatusCode.Success,
      data: { ownedWorkspaces: [], joinedWorkspaces: [] },
    } as jest.Mocked<WorkspaceListResponse>)

    const response = await createServer().listWorkspaces({})

    expect(response).toEqual({
      status: 200,
      data: { ownedWorkspaces: [], joinedWorkspaces: [] },
    })
  })
})
