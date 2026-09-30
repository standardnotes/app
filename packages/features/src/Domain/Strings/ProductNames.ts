export const AppName = 'Standard Notes'

export const ListedName = 'Listed'
export const SuperName = 'Super'
export const ClipperName = 'Web Clipper'
export const FileSafeName = 'FileSafe'
export const BoldName = 'Bold'
export const AuthenticatorName = 'Authenticator'
export const SpreadsheetName = 'Spreadsheet'
export const CodeEditorName = 'Code'
export const RichTextEditorName = 'Rich Text'
export const MarkdownEditorName = 'Markdown'
export const ChecklistEditorName = 'Checklist'

export const CorePlanName = 'Core'
export const PlusPlanName = 'Plus'
export const ProPlanName = 'Pro'
export const ProfessionalPlanName = 'Professional'

export function jtString(value: unknown): string {
  return Array.isArray(value) ? value.join('') : String(value)
}
