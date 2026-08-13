import { assertImportFileWithinSizeLimit, MaxImportFileSizeBytes } from './ImportLimits'

describe('ImportLimits', () => {
  it('rejects files over the configured limit', () => {
    const file = new File(['x'], 'note.html', { type: 'text/html' })
    Object.defineProperty(file, 'size', { value: MaxImportFileSizeBytes + 1 })
    expect(() => assertImportFileWithinSizeLimit(file)).toThrow('Import file is too large')
  })

  it('allows files at or below max import size', () => {
    const file = new File(['x'], 'note.html', { type: 'text/html' })
    Object.defineProperty(file, 'size', { value: MaxImportFileSizeBytes })
    expect(() => assertImportFileWithinSizeLimit(file)).not.toThrow()
  })
})
