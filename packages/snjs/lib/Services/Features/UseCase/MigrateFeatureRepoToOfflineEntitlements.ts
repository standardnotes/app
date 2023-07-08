import { LEGACY_PROD_EXT_ORIGIN, PROD_OFFLINE_FEATURES_URL } from '@Lib/Hosts'
import { SNFeatureRepo } from '@standardnotes/models'
import { MutatorClientInterface } from '@standardnotes/services'

export class MigrateFeatureRepoToOfflineEntitlementsUseCase {
  constructor(private mutator: MutatorClientInterface) {}

  async execute(featureRepos: SNFeatureRepo[] = []): Promise<SNFeatureRepo[]> {
    const updatedRepos: SNFeatureRepo[] = []
    for (const item of featureRepos) {
      if (item.migratedToOfflineEntitlements) {
        continue
      }

      if (!item.onlineUrl) {
        continue
      }

      const repoUrl = item.onlineUrl
      const { origin } = new URL(repoUrl)

      if (!origin.includes(LEGACY_PROD_EXT_ORIGIN)) {
        continue
      }

      const userKeyMatch = repoUrl.match(/\w{32,64}/)
      if (userKeyMatch && userKeyMatch.length > 0) {
        const userKey = userKeyMatch[0]

        const updatedRepo = await this.mutator.changeFeatureRepo(item, (m) => {
          m.offlineFeaturesUrl = PROD_OFFLINE_FEATURES_URL
          m.offlineKey = userKey
          m.migratedToOfflineEntitlements = true
        })

        updatedRepos.push(updatedRepo)
      }
    }

    return updatedRepos
  }
}
