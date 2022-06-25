import { PartialSchema } from './BaseMigration'
import { MigrationClasses } from './versions'

class MigrationService {
  private getMigrationInstances() {
    return MigrationClasses.map((migrationClass) => {
      return new migrationClass()
    })
  }

  public performMigrations(data: PartialSchema) {
    this.getMigrationInstances().forEach((migration) => {
      const result = migration.run(data)
      data = result
    })
    return data
  }
}

export default MigrationService
