import { WorkspaceType } from '@standardnotes/common'
import { HttpStatusCode } from '../../Http'
import { WorkspaceCreationResponse } from '../../Response/Workspace/WorkspaceCreationResponse'
import { WorkspaceInvitationAcceptingResponse } from '../../Response/Workspace/WorkspaceInvitationAcceptingResponse'
import { WorkspaceInvitationResponse } from '../../Response/Workspace/WorkspaceInvitationResponse'
import { WorkspaceListResponse } from '../../Response/Workspace/WorkspaceListResponse'
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
    workspaceServer.inviteToWorkspace = jest.fn().mockReturnValue({
      data: { uuid: 'i-1-2-3' },
    } as jest.Mocked<WorkspaceInvitationResponse>)
    workspaceServer.acceptInvite = jest.fn().mockReturnValue({
      data: { success: true },
    } as jest.Mocked<WorkspaceInvitationAcceptingResponse>)
    workspaceServer.listWorkspaces = jest.fn().mockReturnValue({
      status: HttpStatusCode.Success,
      data: { ownedWorkspaces: [], joinedWorkspaces: [] },
    } as jest.Mocked<WorkspaceListResponse>)
  })

  it('should create a workspace', async () => {
    const response = await createService().createWorkspace({
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
    expect(workspaceServer.createWorkspace).toHaveBeenCalledWith({
      encryptedPrivateKey: 'foo',
      encryptedWorkspaceKey: 'bar',
      publicKey: 'buzz',
      workspaceType: 'private',
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
        workspaceType: WorkspaceType.Private,
        encryptedPrivateKey: 'foo',
        encryptedWorkspaceKey: 'bar',
        publicKey: 'buzz',
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
        workspaceType: WorkspaceType.Private,
        encryptedPrivateKey: 'foo',
        encryptedWorkspaceKey: 'bar',
        publicKey: 'buzz',
      })
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).not.toBeNull()
  })

  it('should invite to a workspace', async () => {
    const response = await createService().inviteToWorkspace({
      workspaceUuid: 'w-1-2-3',
      inviteeEmail: 'test@test.te',
    })

    expect(response).toEqual({
      data: {
        uuid: 'i-1-2-3',
      },
    })
    expect(workspaceServer.inviteToWorkspace).toHaveBeenCalledWith({
      workspaceUuid: 'w-1-2-3',
      inviteeEmail: 'test@test.te',
    })
  })

  it('should not invite to a workspace if it is already inviting', async () => {
    const service = createService()
    Object.defineProperty(service, 'operationsInProgress', {
      get: () => new Map([[WorkspaceApiOperations.Inviting, true]]),
    })

    let error = null
    try {
      await service.inviteToWorkspace({
        workspaceUuid: 'w-1-2-3',
        inviteeEmail: 'test@test.te',
      })
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).not.toBeNull()
  })

  it('should not invite to a workspace if the server fails', async () => {
    workspaceServer.inviteToWorkspace = jest.fn().mockImplementation(() => {
      throw new Error('Oops')
    })

    let error = null
    try {
      await createService().inviteToWorkspace({
        workspaceUuid: 'w-1-2-3',
        inviteeEmail: 'test@test.te',
      })
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).not.toBeNull()
  })

  it('should accept invite to a workspace', async () => {
    const response = await createService().acceptInvite({
      userUuid: 'u-1-2-3',
      inviteUuid: 'i-1-2-3',
      publicKey: 'foo',
      encryptedPrivateKey: 'bar',
    })

    expect(response).toEqual({
      data: {
        success: true,
      },
    })
    expect(workspaceServer.acceptInvite).toHaveBeenCalledWith({
      userUuid: 'u-1-2-3',
      inviteUuid: 'i-1-2-3',
      publicKey: 'foo',
      encryptedPrivateKey: 'bar',
    })
  })

  it('should not accept invite to a workspace if it is already accepting', async () => {
    const service = createService()
    Object.defineProperty(service, 'operationsInProgress', {
      get: () => new Map([[WorkspaceApiOperations.Accepting, true]]),
    })

    let error = null
    try {
      await service.acceptInvite({
        userUuid: 'u-1-2-3',
        inviteUuid: 'i-1-2-3',
        publicKey: 'foo',
        encryptedPrivateKey: 'bar',
      })
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).not.toBeNull()
  })

  it('should not accept invite to a workspace if the server fails', async () => {
    workspaceServer.acceptInvite = jest.fn().mockImplementation(() => {
      throw new Error('Oops')
    })

    let error = null
    try {
      await createService().acceptInvite({
        userUuid: 'u-1-2-3',
        inviteUuid: 'i-1-2-3',
        publicKey: 'foo',
        encryptedPrivateKey: 'bar',
      })
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).not.toBeNull()
  })

  it('should list workspaces', async () => {
    const response = await createService().listWorkspaces()

    expect(response).toEqual({
      status: 200,
      data: {
        ownedWorkspaces: [],
        joinedWorkspaces: [],
      },
    })
    expect(workspaceServer.listWorkspaces).toHaveBeenCalled()
  })

  it('should not list workspaces if it is already listing them', async () => {
    const service = createService()
    Object.defineProperty(service, 'operationsInProgress', {
      get: () => new Map([[WorkspaceApiOperations.ListingWorkspaces, true]]),
    })

    let error = null
    try {
      await service.listWorkspaces()
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).not.toBeNull()
  })

  it('should not list workspaces if the server fails', async () => {
    workspaceServer.listWorkspaces = jest.fn().mockImplementation(() => {
      throw new Error('Oops')
    })

    let error = null
    try {
      await createService().listWorkspaces()
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).not.toBeNull()
  })
})
