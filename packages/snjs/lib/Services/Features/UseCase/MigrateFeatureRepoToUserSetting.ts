import { SettingsClientInterface } from '@Lib/Services/Settings/SettingsClientInterface'
import { SettingName } from '@standardnotes/domain-core'
import { SNFeatureRepo } from '@standardnotes/models'
import { MutatorClientInterface } from '@standardnotes/services'

export class MigrateFeatureRepoToUserSettingUseCase {
  constructor(
    private mutator: MutatorClientInterface,
    private settings: SettingsClientInterface,
  ) {}

  async execute(featureRepos: SNFeatureRepo[] = []): Promise<void> {
    for (const item of featureRepos) {
      if (item.migratedToUserSetting) {
        continue
      }

      if (!item.onlineUrl) {
        continue
      }

      const repoUrl: string = item.onlineUrl
      const userKeyMatch = repoUrl.match(/\w{32,64}/)

      if (userKeyMatch && userKeyMatch.length > 0) {
        const userKey = userKeyMatch[0]
        await this.settings.updateSetting(SettingName.create(SettingName.NAMES.ExtensionKey).getValue(), userKey, true)

        await this.mutator.changeFeatureRepo(item, (m) => {
          m.migratedToUserSetting = true
        })
      }
    }
  }
}
