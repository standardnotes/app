const SemanticVersionParts = ['MAJOR', 'MINOR', 'PATCH']

enum MigrationAction {
  Upgrade = 'up',
  Downgrade = 'down',
  Nothing = 'nothing',
}

export type PartialData = {
  schemaVersion: string
  defaultSections?: any[]
  groups: any[]
}

abstract class BaseMigration {
  protected abstract get version(): string
  protected abstract upgrade(data: PartialData): PartialData
  protected abstract downgrade(data: PartialData): PartialData

  private parseVersion(version: string): number[] {
    const versionScheme = version.split('.')
    if (versionScheme.length !== SemanticVersionParts.length) {
      throw Error(`'${version}' is not in the semantic version scheme: ${SemanticVersionParts.join('.')}`)
    }
    return versionScheme.map((value, index) => {
      const number = Number(value)
      if (isNaN(number)) {
        throw Error(`${SemanticVersionParts[index]} version should be a number`)
      }
      return number
    })
  }

  protected getAction(schemaVersion: string): MigrationAction {
    const fromVersion = this.parseVersion(schemaVersion)
    const toVersion = this.parseVersion(this.version)

    for (let index = 0; index < fromVersion.length; index++) {
      if (fromVersion[index] < toVersion[index]) {
        return MigrationAction.Upgrade
      }
      if (fromVersion[index] > toVersion[index]) {
        return MigrationAction.Downgrade
      }
    }
    return MigrationAction.Nothing
  }

  public run(data: PartialData): PartialData {
    const { schemaVersion } = data
    const migrationAction = this.getAction(schemaVersion)
    switch (migrationAction) {
      case MigrationAction.Upgrade:
        return this.upgrade(data)
      case MigrationAction.Downgrade:
        return this.downgrade(data)
      default:
        return data
    }
  }
}

export default BaseMigration
