import { ItemManagerInterface, PreferenceServiceInterface } from '@standardnotes/services'
import { GetDefaultEditorIdentifier } from './GetDefaultEditorIdentifier'
import { ComponentArea, FeatureIdentifier } from '@standardnotes/features'
import { SNComponent, SNTag } from '@standardnotes/models'

describe('getDefaultEditorIdentifier', () => {
  let usecase: GetDefaultEditorIdentifier
  let preferences: PreferenceServiceInterface
  let items: ItemManagerInterface

  beforeEach(() => {
    preferences = {} as jest.Mocked<PreferenceServiceInterface>
    preferences.getValue = jest.fn()

    items = {} as jest.Mocked<ItemManagerInterface>
    items.getDisplayableComponents = jest.fn().mockReturnValue([])

    usecase = new GetDefaultEditorIdentifier(preferences, items)
  })

  it('should return plain editor if no default tag editor or component editor', () => {
    const editorIdentifier = usecase.execute().getValue()

    expect(editorIdentifier).toEqual(FeatureIdentifier.PlainEditor)
  })

  it('should return pref key based value if available', () => {
    preferences.getValue = jest.fn().mockReturnValue(FeatureIdentifier.SuperEditor)

    const editorIdentifier = usecase.execute().getValue()

    expect(editorIdentifier).toEqual(FeatureIdentifier.SuperEditor)
  })

  it('should return default tag identifier if tag supplied', () => {
    const tag = {
      preferences: {
        editorIdentifier: FeatureIdentifier.SuperEditor,
      },
    } as jest.Mocked<SNTag>

    const editorIdentifier = usecase.execute(tag).getValue()

    expect(editorIdentifier).toEqual(FeatureIdentifier.SuperEditor)
  })

  it('should return legacy editor identifier', () => {
    const editor = {
      legacyIsDefaultEditor: jest.fn().mockReturnValue(true),
      identifier: FeatureIdentifier.MarkdownProEditor,
      area: ComponentArea.Editor,
    } as unknown as jest.Mocked<SNComponent>

    items.getDisplayableComponents = jest.fn().mockReturnValue([editor])

    const editorIdentifier = usecase.execute().getValue()

    expect(editorIdentifier).toEqual(FeatureIdentifier.MarkdownProEditor)
  })
})
