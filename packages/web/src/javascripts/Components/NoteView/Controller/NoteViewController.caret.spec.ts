import { MutationType, NoteMutator, PrefKey, SNNote } from '@standardnotes/models'
import {
  AlertService,
  ComponentManagerInterface,
  ItemManagerInterface,
  MutatorClientInterface,
  PreferenceServiceInterface,
  SessionsClientInterface,
  SyncServiceInterface,
} from '@standardnotes/snjs'
import { IsNativeMobileWeb } from '@standardnotes/ui-services'
import { featureTrunkRestoreEditorPositionEnabled } from '@/FeatureTrunk'
import { NoteViewController } from './NoteViewController'

jest.mock('@/FeatureTrunk', () => ({ featureTrunkRestoreEditorPositionEnabled: jest.fn() }))

describe('NoteViewController caret capture', () => {
  let mutated: Partial<NoteMutator>
  let changeItem: jest.Mock
  let restoreEditorPosition: boolean
  let controller: NoteViewController

  beforeEach(async () => {
    ;(featureTrunkRestoreEditorPositionEnabled as jest.Mock).mockReturnValue(true)
    restoreEditorPosition = true
    mutated = {}
    changeItem = jest.fn(async (_note, callback) => callback(mutated))
    const note = { uuid: 'uuid', text: '' } as SNNote

    controller = new NoteViewController(
      note,
      { streamItems: jest.fn(() => () => undefined), findItem: jest.fn(() => note) } as unknown as ItemManagerInterface,
      { changeItem } as unknown as MutatorClientInterface,
      { sync: jest.fn() } as unknown as SyncServiceInterface,
      { isSignedIn: () => true, isSignedOut: () => false } as unknown as SessionsClientInterface,
      {
        getValue: (key: PrefKey, defaultValue: unknown) =>
          key === PrefKey.RestoreEditorPosition ? restoreEditorPosition : defaultValue,
      } as unknown as PreferenceServiceInterface,
      {} as ComponentManagerInterface,
      {} as AlertService,
      {} as IsNativeMobileWeb,
    )
    await controller.initialize()
    controller.getCaretOffset = () => 7
  })

  it('saves the caret together with the content', async () => {
    await controller.saveAndAwaitLocalPropagation({ text: 'hi', bypassDebouncer: true })

    expect(changeItem).toHaveBeenCalledTimes(1)
    expect(mutated).toMatchObject({ text: 'hi', lastCaretOffset: 7, lastCaretAt: expect.any(Number) })
  })

  it('does not save the caret when the preference is off', async () => {
    restoreEditorPosition = false

    await controller.saveAndAwaitLocalPropagation({ text: 'hi', bypassDebouncer: true })

    expect(mutated.lastCaretOffset).toBeUndefined()
  })

  it('saves only the caret, without updating timestamps, when closed', async () => {
    controller.deinit()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(changeItem.mock.calls[0][2]).toBe(MutationType.NoUpdateUserTimestamps)
    expect(mutated).toMatchObject({ lastCaretOffset: 7 })
    expect(mutated.text).toBeUndefined()
    expect(controller.dealloced).toBe(true)
  })
})
