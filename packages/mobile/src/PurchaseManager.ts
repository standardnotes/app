import { AppleIAPProductId, AppleIAPReceipt } from '@standardnotes/snjs'
import { EmitterSubscription } from 'react-native'
import {
  endConnection,
  finishTransaction,
  getSubscriptions,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestSubscription,
  type ProductPurchase,
  type PurchaseError,
  type SubscriptionPurchase,
} from 'react-native-iap'
import { log, LoggingDomain } from './Lib/Logging'

export class PurchaseManager {
  private static instance: PurchaseManager
  private listenerDisposer: EmitterSubscription
  private errorDisposer: EmitterSubscription

  private constructor() {
    this.listenerDisposer = purchaseUpdatedListener((purchase: SubscriptionPurchase | ProductPurchase) => {
      log(LoggingDomain.AppleIAP, 'purchaseUpdatedListener', purchase)
      const receipt = purchase.transactionReceipt
      if (receipt) {
        void finishTransaction({ purchase, isConsumable: false })
      }
    })

    this.errorDisposer = purchaseErrorListener((error: PurchaseError) => {
      log(LoggingDomain.AppleIAP, 'purchaseErrorListener', error)
    })
  }

  public static getInstance(): PurchaseManager {
    if (!PurchaseManager.instance) {
      PurchaseManager.instance = new PurchaseManager()
    }

    return PurchaseManager.instance
  }

  deinit() {
    this.listenerDisposer.remove()
    this.errorDisposer.remove()
    void endConnection()
  }

  async purchase(sku: AppleIAPProductId): Promise<AppleIAPReceipt | undefined> {
    await initConnection()

    const subscriptions = await getSubscriptions({
      skus: [AppleIAPProductId.PlusPlanYearly, AppleIAPProductId.ProPlanYearly],
    })

    log(LoggingDomain.AppleIAP, 'Retrieved subscriptions', subscriptions)

    try {
      const result = await requestSubscription({ sku, andDangerouslyFinishTransactionAutomaticallyIOS: true })

      log(LoggingDomain.AppleIAP, 'Purchase result', result)

      if (result && result.transactionId && result.transactionDate) {
        return {
          transactionId: result.transactionId,
          productId: result.productId as AppleIAPProductId,
          transactionDate: String(result.transactionDate),
          transactionReceipt: result.transactionReceipt,
        }
      } else {
        log(LoggingDomain.AppleIAP, 'Purchase method returning undefined even though successful')
        return undefined
      }
    } catch (error) {
      log(LoggingDomain.AppleIAP, error)
      return undefined
    }
  }
}
