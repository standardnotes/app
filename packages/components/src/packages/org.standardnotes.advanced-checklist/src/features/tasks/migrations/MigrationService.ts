import { PartialData } from './BaseMigration'
import { MigrationClasses } from './versions'

class MigrationService {
  private migrationClasses: any[]

  constructor(migrationClasses?: any[]) {
    this.migrationClasses = migrationClasses ?? MigrationClasses
  }

  private getMigrationInstances() {
    return this.migrationClasses.map((migrationClass) => {
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
