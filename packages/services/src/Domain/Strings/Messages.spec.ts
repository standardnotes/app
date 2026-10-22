import { ValetTokenOperation } from '@standardnotes/responses'
import { messageForCreateValetTokenFailure } from './Messages'

describe('messageForCreateValetTokenFailure', () => {
  it('returns a clear message for expired subscription on download', () => {
    const message = messageForCreateValetTokenFailure('expired-subscription', ValetTokenOperation.Read)
    expect(message).toContain('subscription has expired')
    expect(message).toContain('downloaded')
    expect(message).not.toContain('expired-subscription')
    expect(message).not.toContain('Account settings')
  })

  it('returns a clear message for expired subscription on upload', () => {
    const message = messageForCreateValetTokenFailure('expired-subscription', ValetTokenOperation.Write)
    expect(message).toContain('subscription has expired')
    expect(message).toContain('uploaded')
  })

  it('returns a clear message for missing subscription', () => {
    const message = messageForCreateValetTokenFailure('no-subscription', ValetTokenOperation.Read)
    expect(message).toContain('active subscription')
    expect(message).not.toContain('Account settings')
    expect(message).not.toContain('no-subscription')
  })

  it('falls back to generic file token error for unknown reasons', () => {
    const message = messageForCreateValetTokenFailure('something-else')
    expect(message).toContain('Failed to create file token')
  })
})
