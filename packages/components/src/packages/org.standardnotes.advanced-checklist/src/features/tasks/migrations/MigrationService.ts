import { PartialData } from './BaseMigration'
import { MigrationClasses } from './versions'

class MigrationService {
  private getMigrationInstances() {
    return MigrationClasses.map((migrationClass) => {
      return new migrationClass()
    })
  }

  public performMigrations(data: PartialData) {
    this.getMigrationInstances().forEach((migration) => {
      data = migration.run(data)
    })
    return data
  }
}

export default MigrationService
