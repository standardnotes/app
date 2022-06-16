export interface PackageManagerInterface {
  syncComponents(components: Component[]): Promise<void>
}

export interface Component {
  uuid: string
  deleted: boolean
  content?: {
    name?: string
    autoupdateDisabled: boolean
    local_url?: string
    package_info: PackageInfo
  }
}

export type PackageInfo = {
  identifier: string
  version: string
  download_url: string
  latest_url: string
  url: string
}

export interface SyncTask {
  components: Component[]
}

export interface MappingFile {
  [key: string]: Readonly<ComponentMapping> | undefined
}

export interface ComponentMapping {
  location: string
  version?: string
}
