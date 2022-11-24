import { Environment } from '@standardnotes/models'
import { ChangelogService } from './ChangelogService'
import { LegacyWebToDesktopVersionMapping } from './LegacyDesktopMapping'

describe('changelog service', () => {
  let changelogService: ChangelogService

  beforeEach(() => {
    changelogService = new ChangelogService(Environment.Desktop)
  })

  it('should use mapped version if web version less than or equal to 3.107.0', () => {
    const webVersion = '3.107.0'
    const desktopVersion = LegacyWebToDesktopVersionMapping[webVersion]

    const downloadUrl = changelogService.getDesktopDownloadsUrl(webVersion)
    expect(downloadUrl).toContain(desktopVersion)
  })

  it('should use direction version if greater than  3.107.0', () => {
    const webVersion = '3.108.0'

    const downloadUrl = changelogService.getDesktopDownloadsUrl(webVersion)
    expect(downloadUrl).toContain(webVersion)
  })
})
