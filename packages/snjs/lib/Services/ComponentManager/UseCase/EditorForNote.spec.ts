import { createNote } from '@Lib/Spec/SpecUtils'
import { FeatureIdentifier, NoteType } from '@standardnotes/features'
import { EditorForNoteUseCase } from './EditorForNote'
import { ItemManagerInterface } from '@standardnotes/services'

describe('EditorForNote', () => {
  let usecase: EditorForNoteUseCase
  let items: ItemManagerInterface

  beforeEach(() => {
    items = {} as jest.Mocked<ItemManagerInterface>
    usecase = new EditorForNoteUseCase(items)
  })

  it('getEditorForNote should return plain notes is note type is plain', () => {
    const note = createNote({
      noteType: NoteType.Plain,
    })

    expect(usecase.execute(note).featureIdentifier).toBe(FeatureIdentifier.PlainEditor)
  })

  it('getEditorForNote should call legacy function if no note editorIdentifier or noteType', () => {
    const note = createNote({})

    usecase['legacyGetEditorForNote'] = jest.fn()
    usecase.execute(note)

    expect(usecase['legacyGetEditorForNote']).toHaveBeenCalled()
  })
})
