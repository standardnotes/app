import { DEFAULT_SECTIONS } from '../../tasks-slice'
import BaseMigration, { PartialData } from '../BaseMigration'

class Migration1_0_1 extends BaseMigration {
  protected override get version(): string {
    return '1.0.1'
  }

  protected override upgrade(data: PartialData): PartialData {
    const groups = data.groups.map((item) => ({
      ...item,
      sections: DEFAULT_SECTIONS,
    }))
    return {
      schemaVersion: this.version,
      groups,
    }
  }

  protected override downgrade(data: PartialData): PartialData {
    return {
      ...data,
      schemaVersion: this.version,
    }
  }
}

export default Migration1_0_1
