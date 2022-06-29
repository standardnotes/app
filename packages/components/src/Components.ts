const BaseEditorStaticFiles = ['index.html', 'dist', 'package.json']
const BaseThemeStaticFiles = ['dist', 'package.json']

const Editors = [
  {
    identifier: 'org.standardnotes.advanced-checklist',
    path: 'Editors/org.standardnotes.advanced-checklist',
    static_files: [...BaseEditorStaticFiles, 'build'],
  },
  {
    identifier: 'org.standardnotes.code-editor',
    path: 'Editors/org.standardnotes.code-editor',
    static_files: [...BaseEditorStaticFiles, 'vendor'],
  },
  {
    identifier: 'org.standardnotes.markdown-visual-editor',
    path: 'Editors/org.standardnotes.markdown-visual-editor',
    static_files: [...BaseEditorStaticFiles, 'build'],
  },
  {
    identifier: 'org.standardnotes.plus-editor',
    path: 'Editors/org.standardnotes.plus-editor',
    static_files: [...BaseEditorStaticFiles],
  },
  {
    identifier: 'org.standardnotes.standard-sheets',
    path: 'Editors/org.standardnotes.standard-sheets',
    static_files: [...BaseEditorStaticFiles],
  },
  {
    identifier: 'org.standardnotes.token-vault',
    path: 'Editors/org.standardnotes.token-vault',
    static_files: [...BaseEditorStaticFiles],
  },
  {
    identifier: 'org.standardnotes.simple-task-editor',
    path: 'Editors/org.standardnotes.simple-task-editor',
    static_files: [...BaseEditorStaticFiles],
  },
  {
    identifier: 'org.standardnotes.advanced-markdown-editor',
    path: 'Editors/org.standardnotes.advanced-markdown-editor',
    static_files: [...BaseEditorStaticFiles],
  },
]

const DeprecatedEditors = [
  {
    identifier: 'org.standardnotes.bold-editor',
    path: 'Deprecated/org.standardnotes.bold-editor',
    static_files: [...BaseEditorStaticFiles],
  },
  {
    identifier: 'org.standardnotes.simple-markdown-editor',
    path: 'Deprecated/org.standardnotes.simple-markdown-editor',
    static_files: [...BaseEditorStaticFiles],
  },
  {
    identifier: 'org.standardnotes.fancy-markdown-editor',
    path: 'Deprecated/org.standardnotes.fancy-markdown-editor',
    static_files: [...BaseEditorStaticFiles],
  },
  {
    identifier: 'org.standardnotes.minimal-markdown-editor',
    path: 'Deprecated/org.standardnotes.minimal-markdown-editor',
    static_files: [...BaseEditorStaticFiles],
  },
  {
    identifier: 'org.standardnotes.file-safe',
    path: 'Deprecated/org.standardnotes.file-safe',
    static_files: [...BaseEditorStaticFiles],
  },
]

const Themes = [
  {
    identifier: 'org.standardnotes.theme-autobiography',
    path: 'Themes/org.standardnotes.theme-autobiography',
    static_files: BaseThemeStaticFiles,
  },
  {
    identifier: 'org.standardnotes.theme-dynamic',
    path: 'Themes/org.standardnotes.theme-dynamic',
    static_files: BaseThemeStaticFiles,
  },
  {
    identifier: 'org.standardnotes.theme-focus',
    path: 'Themes/org.standardnotes.theme-focus',
    static_files: BaseThemeStaticFiles,
  },
  {
    identifier: 'org.standardnotes.theme-futura',
    path: 'Themes/org.standardnotes.theme-futura',
    static_files: BaseThemeStaticFiles,
  },
  {
    identifier: 'org.standardnotes.theme-midnight',
    path: 'Themes/org.standardnotes.theme-midnight',
    static_files: BaseThemeStaticFiles,
  },
  {
    identifier: 'org.standardnotes.theme-titanium',
    path: 'Themes/org.standardnotes.theme-titanium',
    static_files: BaseThemeStaticFiles,
  },
  {
    identifier: 'org.standardnotes.theme-solarized-dark',
    path: 'Themes/org.standardnotes.theme-solarized-dark',
    static_files: BaseThemeStaticFiles,
  },
]

const Components = [...Editors, ...DeprecatedEditors, ...Themes]

export { Components }
