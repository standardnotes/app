import BaseMigration, { PartialSchema } from './BaseMigration'

class MockMigration extends BaseMigration {
  override get version() {
    return '0.0.0'
  }

  override upgrade(data: PartialSchema) {
    return data
  }

  override downgrade(data: PartialSchema) {
    return data
  }
}

describe('BaseMigration', () => {
  const mockMigration = new MockMigration()

  it('should throw error if version is not in the semantic version scheme', () => {
    expect(() => {
      mockMigration.run({ schemaVersion: '0.0.0.0', groups: [] })
    }).toThrowError("'0.0.0.0' is not in the semantic version scheme: MAJOR.MINOR.PATCH")
  })

  it('should throw error if version is not a number', () => {
    expect(() => {
      mockMigration.run({ schemaVersion: 'a.0.0', groups: [] })
    }).toThrowError('MAJOR version should be a number')
    expect(() => {
      mockMigration.run({ schemaVersion: '0.a.0', groups: [] })
    }).toThrowError('MINOR version should be a number')
    expect(() => {
      mockMigration.run({ schemaVersion: '0.0.a', groups: [] })
    }).toThrowError('PATCH version should be a number')
  })
})
