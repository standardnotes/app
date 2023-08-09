import { SNFeatureRepo } from '@standardnotes/models'
import { MutatorClientInterface } from '@standardnotes/services'

export class MigrateFeatureRepoToOfflineEntitlementsUseCase {
  private readonly LEGACY_PROD_EXT_ORIGIN = 'https://extensions.standardnotes.org'

  constructor(private mutator: MutatorClientInterface) {}

  async execute(dto: { featureRepos: SNFeatureRepo[]; prodOfflineFeaturesUrl: string }): Promise<SNFeatureRepo[]> {
    const updatedRepos: SNFeatureRepo[] = []
    for (const item of dto.featureRepos) {
      if (item.migratedToOfflineEntitlements) {
        continue
      }

      if (!item.onlineUrl) {
        continue
      }

      const repoUrl = item.onlineUrl
      const { origin } = new URL(repoUrl)

      if (!origin.includes(this.LEGACY_PROD_EXT_ORIGIN)) {
        continue
      }

      const userKeyMatch = repoUrl.match(/\w{32,64}/)
      if (userKeyMatch && userKeyMatch.length > 0) {
        const userKey = userKeyMatch[0]

        const updatedRepo = await this.mutator.changeFeatureRepo(item, (m) => {
          m.offlineFeaturesUrl = dto.prodOfflineFeaturesUrl
          m.offlineKey = userKey
          m.migratedToOfflineEntitlements = true
        })

        updatedRepos.push(updatedRepo)
      }
    }

    return updatedRepos
  }
}
