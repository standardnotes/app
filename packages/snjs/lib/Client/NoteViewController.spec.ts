import { ContentType } from '@standardnotes/common'
import { MutatorService } from './../Services/Mutator/MutatorService'
import { SNComponentManager } from './../Services/ComponentManager/ComponentManager'
import { NoteType } from '@standardnotes/features'
import { SNApplication } from '..'
import { NoteViewController } from './NoteViewController'

describe('note view controller', () => {
  let application: SNApplication

  beforeEach(() => {
    application = {} as jest.Mocked<SNApplication>
    application.streamItems = jest.fn()

    const componentManager = {} as jest.Mocked<SNComponentManager>
    componentManager.getDefaultEditor = jest.fn()
    Object.defineProperty(application, 'componentManager', { value: componentManager })

    const mutator = {} as jest.Mocked<MutatorService>
    mutator.createTemplateItem = jest.fn()
    Object.defineProperty(application, 'mutator', { value: mutator })
  })

  it('should create notes with plaintext note type', async () => {
    const controller = new NoteViewController(application)
    await controller.initialize(false)

    expect(application.mutator.createTemplateItem).toHaveBeenCalledWith(
      ContentType.Note,
      expect.objectContaining({ noteType: NoteType.Plain }),
    )
  })
})
