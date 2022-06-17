import { MobileTheme } from '@Root/Style/MobileTheme'
import { ComponentChecksumsType } from '@standardnotes/components-meta'
import RawComponentChecksumsFile from '@standardnotes/components-meta/dist/zips/checksums.json'
import { FeatureDescription, FeatureIdentifier, GetFeatures } from '@standardnotes/features'
import {
  ComponentMutator,
  EncryptionService,
  isRightVersionGreaterThanLeft,
  PermissionDialog,
  SNApplication,
  SNComponent,
  SNComponentManager,
  SNLog,
  SNNote,
} from '@standardnotes/snjs'
import { objectToCss } from '@Style/CssParser'
import { Base64 } from 'js-base64'
import RNFS, { DocumentDirectoryPath } from 'react-native-fs'
import StaticServer from 'react-native-static-server'
import { unzip } from 'react-native-zip-archive'
import { componentsCdn, version, name } from '../../package.json'
import { MobileThemeContent } from '../Style/MobileTheme'
import { IsDev } from './Utils'

const FeatureChecksums = RawComponentChecksumsFile as ComponentChecksumsType

export enum ComponentLoadingError {
  FailedDownload = 'FailedDownload',
  ChecksumMismatch = 'ChecksumMismatch',
  LocalServerFailure = 'LocalServerFailure',
  DoesntExist = 'DoesntExist',
  Unknown = 'Unknown',
}

const STATIC_SERVER_PORT = 8080
const BASE_DOCUMENTS_PATH = DocumentDirectoryPath
const COMPONENTS_PATH = '/components'

export class ComponentManager extends SNComponentManager {
  private mobileActiveTheme?: MobileTheme

  private staticServer!: StaticServer
  private staticServerUrl!: string
  private protocolService!: EncryptionService
  private thirdPartyIndexPaths: Record<string, string> = {}

  public async initialize(protocolService: EncryptionService) {
    this.loggingEnabled = true
    this.protocolService = protocolService
    await this.createServer()
  }

  private async createServer() {
    const path = `${BASE_DOCUMENTS_PATH}${COMPONENTS_PATH}`
    const server = new StaticServer(STATIC_SERVER_PORT, path, {
      localOnly: true,
    })
    try {
      const serverUrl = await server.start()
      this.staticServer = server
      this.staticServerUrl = serverUrl
    } catch (e) {
      void this.alertService.alert(
        'Unable to start component server. ' +
          'Editors other than the Plain Editor will fail to load. ' +
          'Please restart the app and try again.',
      )
      SNLog.error(e as any)
    }
  }

  override deinit() {
    super.deinit()
    void this.staticServer!.stop()
  }

  private cdnUrlForFeature(identifier: FeatureIdentifier): string {
    const cdn = IsDev ? componentsCdn.dev : componentsCdn.prod
    const appVersion = version
    const mobilePackageName = name
    const tagPath = `${mobilePackageName}@${appVersion}`.replaceAll('@', '%40')
    const url = `${cdn}${tagPath}/packages/components/dist/zips/${identifier}.zip`
    this.log('Getting zip from cdn url', url)
    return url
  }

  private downloadUrlForComponent(component: SNComponent): string | undefined {
    const identifier = component.identifier
    const nativeFeature = this.nativeFeatureForIdentifier(identifier)
    if (nativeFeature) {
      return this.cdnUrlForFeature(identifier)
    } else {
      return component.package_info?.download_url
    }
  }

  public isComponentDownloadable(component: SNComponent): boolean {
    const downloadUrl = this.downloadUrlForComponent(component)
    return !!downloadUrl
  }

  public async uninstallComponent(component: SNComponent) {
    const path = this.pathForComponent(component.identifier)
    if (await RNFS.exists(path)) {
      this.log('Deleting dir at', path)
      await RNFS.unlink(path)
    }
  }

  public async doesComponentNeedDownload(component: SNComponent): Promise<boolean> {
    const identifier = component.identifier
    const nativeFeature = this.nativeFeatureForIdentifier(identifier)
    const downloadUrl = this.downloadUrlForComponent(component)

    if (!downloadUrl) {
      throw Error('Attempting to download component with no download url')
    }

    const currentPackageJson = await this.getDownloadedComponentPackageJsonFile(identifier)
    const currentVersion = currentPackageJson?.version
    const newVersion = nativeFeature ? FeatureChecksums[identifier].version : component.package_info?.version

    if (!newVersion) {
      this.log('Cannot retrieve new version string for component', identifier)
      return false
    }

    this.log('Existing package version', currentVersion)
    this.log('Latest package version', newVersion)

    const shouldDownload = !currentPackageJson || isRightVersionGreaterThanLeft(currentVersion, newVersion)
    this.log('Needs upgrade', shouldDownload)

    return shouldDownload
  }

  public async downloadComponentOffline(component: SNComponent): Promise<ComponentLoadingError | undefined> {
    const identifier = component.identifier
    const downloadUrl = this.downloadUrlForComponent(component)

    if (!downloadUrl) {
      throw Error('Attempting to download component with no download url')
    }

    let error
    try {
      error = await this.performDownloadComponent(identifier, downloadUrl)
    } catch (e) {
      console.error(e)
      return ComponentLoadingError.Unknown
    }

    if (error) {
      return error
    }

    const componentPath = this.pathForComponent(identifier)
    if (!(await RNFS.exists(componentPath))) {
      this.log(`No component exists at path ${componentPath}, not using offline component`)
      return ComponentLoadingError.DoesntExist
    }

    return error
  }

  public nativeFeatureForIdentifier(identifier: FeatureIdentifier) {
    return GetFeatures().find((feature: FeatureDescription) => feature.identifier === identifier)
  }

  public isComponentThirdParty(identifier: FeatureIdentifier): boolean {
    return !this.nativeFeatureForIdentifier(identifier)
  }

  public async preloadThirdPartyIndexPathFromDisk(identifier: FeatureIdentifier) {
    const packageJson = await this.getDownloadedComponentPackageJsonFile(identifier)
    this.thirdPartyIndexPaths[identifier] = packageJson?.sn?.main || 'index.html'
  }

  private async passesChecksumValidation(filePath: string, featureIdentifier: FeatureIdentifier) {
    this.log('Performing checksum verification on', filePath)
    const zipContents = await RNFS.readFile(filePath, 'base64')
    const checksum = await this.protocolService.crypto.sha256(zipContents)

    const desiredChecksum = FeatureChecksums[featureIdentifier]?.base64
    if (!desiredChecksum) {
      this.log(`Checksum is missing for ${featureIdentifier}; aborting installation`)
      return false
    }

    if (checksum !== desiredChecksum) {
      this.log(`Checksums don't match for ${featureIdentifier}; ${checksum} != ${desiredChecksum}; aborting install`)
      return false
    }

    this.log(`Checksum ${checksum} matches ${desiredChecksum} for ${featureIdentifier}`)

    return true
  }

  private async performDownloadComponent(
    identifier: FeatureIdentifier,
    downloadUrl: string,
  ): Promise<ComponentLoadingError | undefined> {
    const tmpLocation = `${BASE_DOCUMENTS_PATH}/${identifier}.zip`

    if (await RNFS.exists(tmpLocation)) {
      this.log('Deleting file at', tmpLocation)
      await RNFS.unlink(tmpLocation)
    }

    this.log('Downloading component', identifier, 'from url', downloadUrl, 'to location', tmpLocation)

    const result = await RNFS.downloadFile({
      fromUrl: downloadUrl,
      toFile: tmpLocation,
    }).promise

    if (!String(result.statusCode).startsWith('2')) {
      console.error(`Error downloading file ${downloadUrl}`)
      return ComponentLoadingError.FailedDownload
    }

    this.log('Finished download to tmp location', tmpLocation)

    const requireChecksumVerification = !!this.nativeFeatureForIdentifier(identifier)
    if (requireChecksumVerification) {
      const passes = await this.passesChecksumValidation(tmpLocation, identifier)
      if (!passes) {
        return ComponentLoadingError.ChecksumMismatch
      }
    }

    const componentPath = this.pathForComponent(identifier)

    this.log(`Attempting to unzip ${tmpLocation} to ${componentPath}`)
    await unzip(tmpLocation, componentPath)
    this.log('Unzipped component to', componentPath)

    const directoryContents = await RNFS.readDir(componentPath)
    const isNestedArchive = directoryContents.length === 1 && directoryContents[0].isDirectory()
    if (isNestedArchive) {
      this.log('Component download includes base level dir that is not its identifier, fixing...')
      const nestedDir = directoryContents[0]
      const tmpMovePath = `${BASE_DOCUMENTS_PATH}/${identifier}`
      await RNFS.moveFile(nestedDir.path, tmpMovePath)
      await RNFS.unlink(componentPath)
      await RNFS.moveFile(tmpMovePath, componentPath)
      this.log(`Moved directory from ${directoryContents[0].path} to ${componentPath}`)
    }
    await RNFS.unlink(tmpLocation)
    return
  }

  private pathForComponent(identifier: FeatureIdentifier) {
    return `${BASE_DOCUMENTS_PATH}${COMPONENTS_PATH}/${identifier}`
  }

  public async getFile(identifier: FeatureIdentifier, relativePath: string) {
    const componentPath = this.pathForComponent(identifier)
    if (!(await RNFS.exists(componentPath))) {
      return undefined
    }
    const filePath = `${componentPath}/${relativePath}`
    if (!(await RNFS.exists(filePath))) {
      return undefined
    }
    const fileContents = await RNFS.readFile(filePath)
    return fileContents
  }

  public async getIndexFile(identifier: FeatureIdentifier) {
    if (this.isComponentThirdParty(identifier)) {
      await this.preloadThirdPartyIndexPathFromDisk(identifier)
    }
    const relativePath = this.getIndexFileRelativePath(identifier)
    return this.getFile(identifier, relativePath!)
  }

  private async getDownloadedComponentPackageJsonFile(
    identifier: FeatureIdentifier,
  ): Promise<Record<string, any> | undefined> {
    const file = await this.getFile(identifier, 'package.json')
    if (!file) {
      return undefined
    }
    const packageJson = JSON.parse(file)
    return packageJson
  }

  override async presentPermissionsDialog(dialog: PermissionDialog) {
    const text = `${dialog.component.name} would like to interact with your ${dialog.permissionsString}`
    const approved = await this.alertService.confirm(text, 'Grant Permissions', 'Continue', undefined, 'Cancel')
    dialog.callback(approved)
  }

  private getIndexFileRelativePath(identifier: FeatureIdentifier) {
    const nativeFeature = this.nativeFeatureForIdentifier(identifier)
    if (nativeFeature) {
      return nativeFeature.index_path
    } else {
      return this.thirdPartyIndexPaths[identifier]
    }
  }

  override urlForComponent(component: SNComponent) {
    if (component.isTheme() && (component.content as MobileThemeContent).isSystemTheme) {
      const theme = component as MobileTheme
      const cssData = objectToCss(theme.mobileContent.variables)
      const encoded = Base64.encodeURI(cssData)
      return `data:text/css;base64,${encoded}`
    }

    if (!this.isComponentDownloadable(component)) {
      return super.urlForComponent(component)
    }

    const identifier = component.identifier
    const componentPath = this.pathForComponent(identifier)
    const indexFilePath = this.getIndexFileRelativePath(identifier)

    if (!indexFilePath) {
      throw Error('Third party index path was not preloaded')
    }

    const splitPackagePath = componentPath.split(COMPONENTS_PATH)
    const relativePackagePath = splitPackagePath[splitPackagePath.length - 1]
    const relativeMainFilePath = `${relativePackagePath}/${indexFilePath}`
    const url = `${this.staticServerUrl}${relativeMainFilePath}`
    return url
  }

  public setMobileActiveTheme(theme: MobileTheme) {
    this.mobileActiveTheme = theme
    this.postActiveThemesToAllViewers()
  }

  override getActiveThemes() {
    if (this.mobileActiveTheme) {
      return [this.mobileActiveTheme]
    } else {
      return []
    }
  }

  public async preloadThirdPartyThemeIndexPath() {
    const theme = this.mobileActiveTheme
    if (!theme) {
      return
    }

    const { identifier } = theme
    if (this.isComponentThirdParty(identifier)) {
      await this.preloadThirdPartyIndexPathFromDisk(identifier)
    }
  }
}

export async function associateComponentWithNote(application: SNApplication, component: SNComponent, note: SNNote) {
  return application.mutator.changeItem<ComponentMutator>(component, mutator => {
    mutator.removeDisassociatedItemId(note.uuid)
    mutator.associateWithItem(note.uuid)
  })
}
