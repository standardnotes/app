enum MigrationAction {
  Upgrade = 'up',
  Downgrade = 'down',
  Nothing = 'nothing',
}

export type PartialSchema = {
  schemaVersion: string
  groups: any[]
}

const SemanticVersionParts = ['MAJOR', 'MINOR', 'PATCH']

abstract class BaseMigration {
  protected abstract get version(): string
  protected abstract upgrade(data: PartialSchema): PartialSchema
  protected abstract downgrade(data: PartialSchema): PartialSchema

  private parseVersion(version: string): number[] {
    const versionScheme = version.split('.')
    if (versionScheme.length !== SemanticVersionParts.length) {
      throw Error(`'${version}' is not in the semantic version scheme: ${SemanticVersionParts.join('.')}`)
    }

    const parsedVersion = versionScheme.map((value, index) => {
      const number = Number(value)
      if (isNaN(number)) {
        throw Error(`${SemanticVersionParts[index]} version should be a number`)
      }
      return number
    })
    return parsedVersion
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

  public run(data: PartialSchema): PartialSchema {
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
