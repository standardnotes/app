import { ItemManagerInterface, PreferenceServiceInterface } from '@standardnotes/services'
import { GetDefaultEditorIdentifier } from './GetDefaultEditorIdentifier'
import { ComponentArea, NativeFeatureIdentifier } from '@standardnotes/features'
import { ComponentItem, SNTag } from '@standardnotes/models'

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

    expect(editorIdentifier).toEqual(NativeFeatureIdentifier.TYPES.PlainEditor)
  })

  it('should return pref key based value if available', () => {
    preferences.getValue = jest.fn().mockReturnValue(NativeFeatureIdentifier.TYPES.SuperEditor)

    const editorIdentifier = usecase.execute().getValue()

    expect(editorIdentifier).toEqual(NativeFeatureIdentifier.TYPES.SuperEditor)
  })

  it('should return default tag identifier if tag supplied', () => {
    const tag = {
      preferences: {
        editorIdentifier: NativeFeatureIdentifier.TYPES.SuperEditor,
      },
    } as jest.Mocked<SNTag>

    const editorIdentifier = usecase.execute(tag).getValue()

    expect(editorIdentifier).toEqual(NativeFeatureIdentifier.TYPES.SuperEditor)
  })

  it('should return legacy editor identifier', () => {
    const editor = {
      legacyIsDefaultEditor: jest.fn().mockReturnValue(true),
      identifier: NativeFeatureIdentifier.TYPES.DeprecatedMarkdownProEditor,
      area: ComponentArea.Editor,
    } as unknown as jest.Mocked<ComponentItem>

    items.getDisplayableComponents = jest.fn().mockReturnValue([editor])

    const editorIdentifier = usecase.execute().getValue()

    expect(editorIdentifier).toEqual(NativeFeatureIdentifier.TYPES.DeprecatedMarkdownProEditor)
  })
})
