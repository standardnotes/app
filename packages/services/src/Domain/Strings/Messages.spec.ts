import { ValetTokenOperation } from '@standardnotes/responses'
import { FileStrings } from './Messages'

describe('FileStrings.ValetTokenFailureMessage', () => {
  it('returns a clear message for expired subscription on download', () => {
    const message = FileStrings.ValetTokenFailureMessage('expired-subscription', ValetTokenOperation.Read)
    expect(message).toContain('subscription has expired')
    expect(message).toContain('downloaded')
    expect(message).not.toContain('expired-subscription')
    expect(message).not.toContain('Account settings')
  })

  it('returns a clear message for expired subscription on upload', () => {
    const message = FileStrings.ValetTokenFailureMessage('expired-subscription', ValetTokenOperation.Write)
    expect(message).toContain('subscription has expired')
    expect(message).toContain('uploaded')
  })

  it('returns a clear message for missing subscription', () => {
    const message = FileStrings.ValetTokenFailureMessage('no-subscription', ValetTokenOperation.Read)
    expect(message).toContain('active subscription')
    expect(message).not.toContain('Account settings')
    expect(message).not.toContain('no-subscription')
  })

  it('falls back to generic file token error for unknown reasons', () => {
    const message = FileStrings.ValetTokenFailureMessage('something-else')
    expect(message).toContain('Failed to create file token')
  })
})

describe('FileStrings.ValetTokenPreviewFailureMessage', () => {
  it('returns a preview message for expired subscription', () => {
    const message = FileStrings.ValetTokenPreviewFailureMessage('expired-subscription')
    expect(message).toContain('cannot be previewed')
    expect(message).toContain('subscription has expired')
  })

  it('returns a preview message for missing subscription', () => {
    const message = FileStrings.ValetTokenPreviewFailureMessage('no-subscription')
    expect(message).toContain('cannot be previewed')
    expect(message).toContain('active subscription')
  })

  it('returns undefined for other reasons', () => {
    expect(FileStrings.ValetTokenPreviewFailureMessage('invalid-parameters')).toBeUndefined()
    expect(FileStrings.ValetTokenPreviewFailureMessage(undefined)).toBeUndefined()
  })
})
