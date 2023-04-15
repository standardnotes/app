import { UuidGenerator } from '@standardnotes/utils'
import { SNApplication } from '@Lib/Application'
import { LoggingDomain, log } from '@Lib/Logging'
import { PayloadEmitSource, PayloadsByDuplicating } from '@standardnotes/models'

export class AccountMigrationService {
  constructor(private applicationImportingTo: SNApplication) {}

  deinit() {
    ;(this.applicationImportingTo as unknown) = undefined
  }

  async importAccount(email: string, password: string, server: string) {
    log(LoggingDomain.AccountMigration, 'Importing account')
    const identifier = UuidGenerator.GenerateUuid()
    const device = this.applicationImportingTo.deviceInterface

    const tempAppImportingFrom = new SNApplication({
      environment: this.applicationImportingTo.environment,
      platform: this.applicationImportingTo.platform,
      deviceInterface: this.applicationImportingTo.deviceInterface,
      crypto: this.applicationImportingTo.options.crypto,
      alertService: this.applicationImportingTo.alertService,
      identifier: identifier,
      defaultHost: server,
      appVersion: this.applicationImportingTo.options.appVersion,
    })

    device.setApplication(tempAppImportingFrom)

    log(LoggingDomain.AccountMigration, 'Preparing for launch')
    await tempAppImportingFrom.prepareForLaunch({
      receiveChallenge: this.applicationImportingTo.challengeService.sendChallenge,
    })
    log(LoggingDomain.AccountMigration, 'Launching')
    await tempAppImportingFrom.launch()

    log(LoggingDomain.AccountMigration, 'Signing in...')
    await tempAppImportingFrom.signIn(email, password, false, true, false, true)
    log(LoggingDomain.AccountMigration, 'Completed sign-in')

    const items = tempAppImportingFrom.items.items
    log(LoggingDomain.AccountMigration, `Importing ${items.length} items`)

    for (const item of items) {
      const payload = item.payload.copy()
      const resultingPayloads = PayloadsByDuplicating({
        payload,
        baseCollection: tempAppImportingFrom.payloadManager.getMasterCollection(),
        isConflict: false,
      })

      await this.applicationImportingTo.payloadManager.emitPayloads(resultingPayloads, PayloadEmitSource.LocalChanged)
    }

    log(LoggingDomain.AccountMigration, 'Finished importing items')

    device.removeApplication(tempAppImportingFrom)
  }
}
