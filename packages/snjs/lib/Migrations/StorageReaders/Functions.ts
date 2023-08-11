import { Environment, ApplicationIdentifier } from '@standardnotes/models'
import { compareSemVersions, isRightVersionGreaterThanLeft } from '@Lib/Version'
import { DeviceInterface } from '@standardnotes/services'
import { StorageReader } from './Reader'
import * as ReaderClasses from './Versions'

function ReaderClassForVersion(version: string): typeof ReaderClasses.StorageReader2_0_0 {
  /** Sort readers by newest first */
  const allReaders = Object.values(ReaderClasses).sort((a, b) => {
    return compareSemVersions(a.version(), b.version()) * -1
  })
  for (const reader of allReaders) {
    if (reader.version() === version) {
      return reader
    }
    if (isRightVersionGreaterThanLeft(reader.version(), version)) {
      return reader
    }
  }

  throw Error(`Cannot find reader for version ${version}`)
}

export function CreateReader(
  version: string,
  deviceInterface: DeviceInterface,
  identifier: ApplicationIdentifier,
  environment: Environment,
): StorageReader {
  const readerClass = ReaderClassForVersion(version)
  return new readerClass(deviceInterface, identifier, environment)
}
