import { EditorFeatureDescription, IframeComponentFeatureDescription } from '@standardnotes/features'
import { UIFeature } from '@standardnotes/models'

export class DoesEditorChangeRequireAlertUseCase {
  execute(
    from: UIFeature<IframeComponentFeatureDescription | EditorFeatureDescription> | undefined,
    to: UIFeature<IframeComponentFeatureDescription | EditorFeatureDescription> | undefined,
  ): boolean {
    if (!from || !to) {
      return false
    }

    const fromFileType = from.fileType
    const toFileType = to.fileType
    const isEitherMarkdown = fromFileType === 'md' || toFileType === 'md'
    const areBothHtml = fromFileType === 'html' && toFileType === 'html'

    if (isEitherMarkdown || areBothHtml) {
      return false
    } else {
      return true
    }
  }
}
