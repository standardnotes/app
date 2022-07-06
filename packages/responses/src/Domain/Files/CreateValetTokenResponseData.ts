export type CreateValetTokenResponseData =
  | {
      success: true
      valetToken: string
    }
  | {
      success: false
      reason: 'no-subscription' | 'expired-subscription' | 'invalid-parameters'
    }
