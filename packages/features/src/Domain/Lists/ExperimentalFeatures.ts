import { SubscriptionName } from '@standardnotes/common'
import { NoteType } from '../Component/NoteType'
import { PermissionName } from '../Permission/PermissionName'
import { EditorFeatureDescription, FeatureDescription } from '../Feature/FeatureDescription'
import { FeatureIdentifier } from '../Feature/FeatureIdentifier'
import { FillEditorComponentDefaults } from './Utilities/FillEditorComponentDefaults'

export function experimentalFeatures(): FeatureDescription[] {
  const advancedChecklist: EditorFeatureDescription = FillEditorComponentDefaults({
    availableInSubscriptions: [SubscriptionName.PlusPlan, SubscriptionName.ProPlan],
    name: 'Advanced Checklist [Alpha]',
    identifier: FeatureIdentifier.AdvancedChecklist,
    note_type: NoteType.Task,
    spellcheckControl: true,
    file_type: 'json',
    interchangeable: false,
    permission_name: PermissionName.AdvancedChecklist,
    description: 'A task editor with grouping functionality.',
    index_path: 'build/index.html',
  })

  return [advancedChecklist]
}
