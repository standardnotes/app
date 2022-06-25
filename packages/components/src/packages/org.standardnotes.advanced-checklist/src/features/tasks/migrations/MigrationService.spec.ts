import MigrationService from './MigrationService'

describe('MigrationService', () => {
  it('should upgrade 1.0.0 to 1.0.1', () => {
    const testData = {
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

    const migrationService = new MigrationService()
    const result = migrationService.performMigrations(testData)

    expect(result).toMatchObject(
      expect.objectContaining({
        schemaVersion: '1.0.1',
        groups: [
          expect.objectContaining({
            ...testData.groups[0],
            collapsed: {
              group: true,
            },
          }),
          testData.groups[1],
        ],
      }),
    )
  })

  it('should do nothing if latest version', () => {
    const testData = {
      schemaVersion: '1.0.1',
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
          collapsed: {
            group: true,
          },
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

    const migrationService = new MigrationService()
    const result = migrationService.performMigrations(testData)

    expect(result).toBe(testData)
  })

  it('should downgrade if version > 1.0.1', () => {
    const testData = {
      schemaVersion: '1.0.100',
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
          collapsed: {
            group: true,
          },
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

    const migrationService = new MigrationService()
    const result = migrationService.performMigrations(testData)

    expect(result).toMatchObject(
      expect.objectContaining({
        schemaVersion: '1.0.1',
        groups: testData.groups,
      }),
    )
  })
})
