import { TasksState } from '../tasks-slice'
import BaseMigration, { PartialData } from './BaseMigration'
import MigrationService from './MigrationService'

class MockMigration extends BaseMigration {
  override get version() {
    return '1.0.123'
  }

  override upgrade(data: PartialData) {
    return {
      ...data,
      schemaVersion: this.version
    }
  }

  override downgrade(data: PartialData) {
    return {
      ...data,
      schemaVersion: this.version
    }
  }
}

describe('MigrationService', () => {
  it('should upgrade 1.0.0 to 1.0.123', () => {
    const testData: Partial<TasksState> = {
      schemaVersion: '1.0.0',
      groups: [
        {
          name: 'Test group #1',
          tasks: [
            {
              id: 'some-id',
              description: 'A simple task',
              completed: false,
              createdAt: new Date(),
            },
            {
              id: 'another-id',
              description: 'Another simple task',
              completed: true,
              createdAt: new Date(),
            },
          ],
          collapsed: true,
        },
        {
          name: 'Test group #2',
          tasks: [
            {
              id: 'yet-another-id',
              description: 'Yet another simple task',
              completed: true,
              createdAt: new Date(),
            },
          ],
        },
      ],
    }

    const migrationClasses = [MockMigration]
    const migrationService = new MigrationService(migrationClasses)
    const result = migrationService.performMigrations(testData as any)

    expect(result).toEqual<Partial<TasksState>>({
      ...testData,
      schemaVersion: '1.0.123',
    })
  })

  it('should do nothing if latest version', () => {
    const testData: Partial<TasksState> = {
      schemaVersion: '1.0.123',
      groups: [
        {
          name: 'Test group #1',
          tasks: [
            {
              id: 'some-id',
              description: 'A simple task',
              completed: false,
              createdAt: new Date(),
            },
          ],
          collapsed: true,
        },
        {
          name: 'Test group #2',
          tasks: [
            {
              id: 'yet-another-id',
              description: 'Yet another simple task',
              completed: true,
              createdAt: new Date(),
            },
          ],
        },
      ],
    }

    const migrationClasses = [MockMigration]
    const migrationService = new MigrationService(migrationClasses)
    const result = migrationService.performMigrations(testData as any)

    expect(result).toBe(testData)
  })

  it('should downgrade if version > 1.0.123', () => {
    const testData: Partial<TasksState> = {
      schemaVersion: '1.0.130',
      groups: [
        {
          name: 'Test group #1',
          tasks: [
            {
              id: 'some-id',
              description: 'A simple task',
              completed: false,
              createdAt: new Date(),
            },
          ],
          collapsed: true,
        },
        {
          name: 'Test group #2',
          tasks: [
            {
              id: 'yet-another-id',
              description: 'Yet another simple task',
              completed: true,
              createdAt: new Date(),
            },
          ],
        },
      ],
    }

    const migrationClasses = [MockMigration]
    const migrationService = new MigrationService(migrationClasses)
    const result = migrationService.performMigrations(testData as any)

    expect(result).toMatchObject(
      expect.objectContaining({
        schemaVersion: '1.0.123',
        groups: testData.groups,
      }),
    )
  })
})
