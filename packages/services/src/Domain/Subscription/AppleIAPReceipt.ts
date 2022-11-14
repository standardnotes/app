import { AppleIAPProductId } from './AppleIAPProductId'

export type AppleIAPReceipt = {
  productId: AppleIAPProductId
  transactionDate: string
  transactionId: string
  transactionReceipt: string
}
