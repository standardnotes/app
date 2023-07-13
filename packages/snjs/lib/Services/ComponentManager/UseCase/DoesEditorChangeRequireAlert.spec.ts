import {
  FeatureIdentifier,
  FindNativeFeature,
  IframeComponentFeatureDescription,
  UIFeatureDescriptionTypes,
} from '@standardnotes/features'
import { DoesEditorChangeRequireAlertUseCase } from './DoesEditorChangeRequireAlert'
import { UIFeature } from '@standardnotes/models'

const nativeFeatureAsUIFeature = <F extends UIFeatureDescriptionTypes>(identifier: FeatureIdentifier) => {
  return new UIFeature(FindNativeFeature<F>(identifier)!)
}

describe('editor change alert', () => {
  let usecase: DoesEditorChangeRequireAlertUseCase

  beforeEach(() => {
    usecase = new DoesEditorChangeRequireAlertUseCase()
  })

  it('should not require alert switching from plain editor', () => {
    const component = nativeFeatureAsUIFeature<IframeComponentFeatureDescription>(FeatureIdentifier.MarkdownProEditor)!
    const requiresAlert = usecase.execute(undefined, component)
    expect(requiresAlert).toBe(false)
  })

  it('should not require alert switching to plain editor', () => {
    const component = nativeFeatureAsUIFeature<IframeComponentFeatureDescription>(FeatureIdentifier.MarkdownProEditor)!
    const requiresAlert = usecase.execute(component, undefined)
    expect(requiresAlert).toBe(false)
  })

  it('should not require alert switching from a markdown editor', () => {
    const htmlEditor = nativeFeatureAsUIFeature<IframeComponentFeatureDescription>(FeatureIdentifier.PlusEditor)!
    const markdownEditor = nativeFeatureAsUIFeature<IframeComponentFeatureDescription>(
      FeatureIdentifier.MarkdownProEditor,
    )
    const requiresAlert = usecase.execute(markdownEditor, htmlEditor)
    expect(requiresAlert).toBe(false)
  })

  it('should not require alert switching to a markdown editor', () => {
    const htmlEditor = nativeFeatureAsUIFeature<IframeComponentFeatureDescription>(FeatureIdentifier.PlusEditor)!
    const markdownEditor = nativeFeatureAsUIFeature<IframeComponentFeatureDescription>(
      FeatureIdentifier.MarkdownProEditor,
    )
    const requiresAlert = usecase.execute(htmlEditor, markdownEditor)
    expect(requiresAlert).toBe(false)
  })

  it('should not require alert switching from & to a html editor', () => {
    const htmlEditor = nativeFeatureAsUIFeature<IframeComponentFeatureDescription>(FeatureIdentifier.PlusEditor)!
    const requiresAlert = usecase.execute(htmlEditor, htmlEditor)
    expect(requiresAlert).toBe(false)
  })

  it('should require alert switching from a html editor to custom editor', () => {
    const htmlEditor = nativeFeatureAsUIFeature<IframeComponentFeatureDescription>(FeatureIdentifier.PlusEditor)!
    const customEditor = nativeFeatureAsUIFeature<IframeComponentFeatureDescription>(FeatureIdentifier.TokenVaultEditor)
    const requiresAlert = usecase.execute(htmlEditor, customEditor)
    expect(requiresAlert).toBe(true)
  })

  it('should require alert switching from a custom editor to html editor', () => {
    const htmlEditor = nativeFeatureAsUIFeature<IframeComponentFeatureDescription>(FeatureIdentifier.PlusEditor)!
    const customEditor = nativeFeatureAsUIFeature<IframeComponentFeatureDescription>(FeatureIdentifier.TokenVaultEditor)
    const requiresAlert = usecase.execute(customEditor, htmlEditor)
    expect(requiresAlert).toBe(true)
  })

  it('should require alert switching from a custom editor to custom editor', () => {
    const customEditor = nativeFeatureAsUIFeature<IframeComponentFeatureDescription>(FeatureIdentifier.TokenVaultEditor)
    const requiresAlert = usecase.execute(customEditor, customEditor)
    expect(requiresAlert).toBe(true)
  })
})
