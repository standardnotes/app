/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { compareVersions } from 'compare-versions'
import log from 'electron-log'
import fs from 'fs'
import path from 'path'
import { MessageToWebApp } from '../../Shared/IpcMessages'
import { AppName } from '../Strings'
import { Paths } from '../Types/Paths'
import { timeout } from '../Utils/Utils'
import { downloadFile, getJSON } from './Networking'
import { Component, MappingFile, PackageInfo, PackageManagerInterface, SyncTask } from './PackageManagerInterface'
import { FilesManagerInterface } from '../File/FilesManagerInterface'
import { FilesManager } from '../File/FilesManager'
import { FileErrorCodes } from '../File/FileErrorCodes'

function logMessage(...message: any) {
  log.info('PackageManager[Info]:', ...message)
}

function logError(...message: any) {
  console.error('PackageManager[Error]:', ...message)
}

/**
 * Safe component mapping manager that queues its disk writes
 */
class MappingFileHandler {
  static async create() {
    let mapping: MappingFile
    const filesManager = new FilesManager()

    try {
      const result = await filesManager.readJSONFile<MappingFile>(Paths.extensionsMappingJson)
      mapping = result || {}
    } catch (error: any) {
      /**
       * Mapping file might be absent (first start, corrupted data)
       */
      if (error.code === FileErrorCodes.FileDoesNotExist) {
        await filesManager.ensureDirectoryExists(path.dirname(Paths.extensionsMappingJson))
      } else {
        logError(error)
      }
      mapping = {}
    }

    return new MappingFileHandler(mapping, filesManager)
  }

  constructor(
    private mapping: MappingFile,
    private filesManager: FilesManagerInterface,
  ) {}

  get = (componendId: string) => {
    return this.mapping[componendId]
  }

  set = (componentId: string, location: string, version: string) => {
    this.mapping[componentId] = {
      location,
      version,
    }

    this.filesManager.debouncedJSONDiskWriter(100, Paths.extensionsMappingJson, () => this.mapping)
  }

  remove = (componentId: string) => {
    delete this.mapping[componentId]

    this.filesManager.debouncedJSONDiskWriter(100, Paths.extensionsMappingJson, () => this.mapping)
  }

  getInstalledVersionForComponent = async (component: Component): Promise<string> => {
    const version = this.get(component.uuid)?.version
    if (version) {
      return version
    }

    /**
     * If the mapping has no version (pre-3.5 installs) check the component's
     * package.json file
     */
    const paths = pathsForComponent(component)
    const packagePath = path.join(paths.absolutePath, 'package.json')
    const response = await this.filesManager.readJSONFile<{ version: string }>(packagePath)
    if (!response) {
      return ''
    }
    this.set(component.uuid, paths.relativePath, response.version)
    return response.version
  }
}

export async function initializePackageManager(webContents: Electron.WebContents): Promise<PackageManagerInterface> {
  const syncTasks: SyncTask[] = []
  let isRunningTasks = false

  const mapping = await MappingFileHandler.create()

  return {
    syncComponents: async (components: Component[]) => {
      logMessage(
        'received sync event for:',
        components
          .map(
            ({ content, deleted }) =>
              // eslint-disable-next-line camelcase
              `${content?.name} (${content?.package_info?.version}) ` + `(deleted: ${deleted})`,
          )
          .join(', '),
      )
      syncTasks.push({ components })

      if (isRunningTasks) {
        return
      }

      isRunningTasks = true
      await runTasks(webContents, mapping, syncTasks)
      isRunningTasks = false
    },
  }
}

async function runTasks(webContents: Electron.WebContents, mapping: MappingFileHandler, tasks: SyncTask[]) {
  while (tasks.length > 0) {
    try {
      const oppositeTask = await runTask(webContents, mapping, tasks[0], tasks.slice(1))
      if (oppositeTask) {
        tasks.splice(tasks.indexOf(oppositeTask), 1)
      }
    } catch (error) {
      logError(error)
    } finally {
      /** Remove the task from the queue. */
      tasks.splice(0, 1)
    }
  }
}

/**
 * @param nextTasks the tasks that follow this one. Useful to see if we
 * need to run it at all (for example in the case of a succession of
 * install/uninstall)
 * @returns If a task opposite to this one was found, returns that tas without
 * doing anything. Otherwise undefined.
 */
async function runTask(
  webContents: Electron.WebContents,
  mapping: MappingFileHandler,
  task: SyncTask,
  nextTasks: SyncTask[],
): Promise<SyncTask | undefined> {
  const maxTries = 3
  /** Try to execute the task with up to three tries. */
  for (let tries = 1; tries <= maxTries; tries++) {
    try {
      if (task.components.length === 1 && nextTasks.length > 0) {
        /**
         * This is a single-component task, AKA an installation or
         * deletion
         */
        const component = task.components[0]
        /**
         * See if there is a task opposite to this one, to avoid doing
         * unnecessary processing
         */
        const oppositeTask = nextTasks.find((otherTask) => {
          if (otherTask.components.length > 1) {
            /** Only check single-component tasks. */
            return false
          }
          const otherComponent = otherTask.components[0]
          return component.uuid === otherComponent.uuid && component.deleted !== otherComponent.deleted
        })
        if (oppositeTask) {
          /** Found an opposite task. return it to the caller and do nothing */
          return oppositeTask
        }
      }
      await syncComponents(webContents, mapping, task.components)
      /** Everything went well, leave the loop */
      return
    } catch (error) {
      if (tries < maxTries) {
        continue
      } else {
        throw error
      }
    }
  }
}

async function syncComponents(webContents: Electron.WebContents, mapping: MappingFileHandler, components: Component[]) {
  /**
   * Incoming `components` are what should be installed. For every component,
   * check the filesystem and see if that component is installed. If not,
   * install it.
   */
  await Promise.all(
    components.map(async (component) => {
      if (component.deleted) {
        /** Uninstall */
        logMessage(`Uninstalling ${component.content?.name}`)
        await uninstallComponent(mapping, component.uuid)
        return
      }

      // eslint-disable-next-line camelcase
      if (!component.content?.package_info) {
        logMessage('Package info is null, skipping')
        return
      }

      const paths = pathsForComponent(component)
      const version = component.content.package_info.version
      if (!component.content.local_url) {
        /**
         * We have a component but it is not mapped to anything on the file system
         */
        await installComponent(webContents, mapping, component, component.content.package_info, version)
      } else {
        try {
          /** Will trigger an error if the directory does not exist. */
          await fs.promises.lstat(paths.absolutePath)
          if (!component.content.autoupdateDisabled) {
            await checkForUpdate(webContents, mapping, component)
          }
        } catch (error: any) {
          if (error.code === FileErrorCodes.FileDoesNotExist) {
            /** We have a component but no content. Install the component */
            await installComponent(webContents, mapping, component, component.content.package_info, version)
          } else {
            throw error
          }
        }
      }
    }),
  )
}

async function checkForUpdate(webContents: Electron.WebContents, mapping: MappingFileHandler, component: Component) {
  const installedVersion = await mapping.getInstalledVersionForComponent(component)

  const latestUrl = component.content?.package_info?.latest_url
  if (!latestUrl) {
    return
  }

  const latestJson = await getJSON<PackageInfo>(latestUrl)
  if (!latestJson) {
    return
  }

  const latestVersion = latestJson.version
  logMessage(
    `Checking for update for ${component.content?.name}\n` +
      `Latest: ${latestVersion} | Installed: ${installedVersion}`,
  )

  if (compareVersions(latestVersion, installedVersion) === 1) {
    /** Latest version is greater than installed version */
    logMessage('Downloading new version', latestVersion)
    await installComponent(webContents, mapping, component, latestJson, latestVersion)
  }
}

/**
 * Some plugin zips may be served directly from GitHub's Releases feature, which automatically generates a zip file.
 * However, the actual assets end up being nested inside a root level folder within that zip.
 * We can detect if we have a legacy nested structure if after unzipping the zip we end up with
 * only 1 entry and that entry is a folder.
 */
async function usesLegacyNestedFolderStructure(dir: string) {
  const fileNames = await fs.promises.readdir(dir)
  if (fileNames.length > 1) {
    return false
  }

  const stat = fs.lstatSync(path.join(dir, fileNames[0]))
  return stat.isDirectory()
}

async function unnestLegacyStructure(dir: string) {
  const fileNames = await fs.promises.readdir(dir)
  const sourceDir = path.join(dir, fileNames[0])
  const destDir = dir

  await new FilesManager().moveDirContents(sourceDir, destDir)
}

async function installComponent(
  webContents: Electron.WebContents,
  mapping: MappingFileHandler,
  component: Component,
  packageInfo: PackageInfo,
  version: string,
) {
  if (!component.content) {
    return
  }
  const downloadUrl = packageInfo.download_url
  if (!downloadUrl) {
    return
  }
  const name = component.content.name

  logMessage('Installing ', name, downloadUrl)

  const sendInstalledMessage = (component: Component, error?: { message: string; tag: string }) => {
    if (error) {
      logError(`Error when installing component ${name}: ` + error.message)
      return
    }

    logMessage(`Installed component ${name} (${version})`)

    webContents.send(MessageToWebApp.InstallComponentComplete, {
      component,
    })
  }

  const paths = pathsForComponent(component)
  try {
    logMessage(`Downloading from ${downloadUrl}`)
    /** Download the zip and clear the component's directory in parallel */
    await Promise.all([
      downloadFile(downloadUrl, paths.downloadPath),
      (async () => {
        /** Clear the component's directory before extracting the zip. */
        const filesManager = new FilesManager()
        await filesManager.ensureDirectoryExists(paths.absolutePath)
        await filesManager.deleteDirContents(paths.absolutePath)
      })(),
    ])

    logMessage('Extracting', paths.downloadPath, 'to', paths.absolutePath)
    const filesManager = new FilesManager()
    await filesManager.extractZip(paths.downloadPath, paths.absolutePath)

    const legacyStructure = await usesLegacyNestedFolderStructure(paths.absolutePath)
    if (legacyStructure) {
      await unnestLegacyStructure(paths.absolutePath)
    }

    let main = 'index.html'
    try {
      /** Try to read 'sn.main' field from 'package.json' file */
      const packageJsonPath = path.join(paths.absolutePath, 'package.json')
      const packageJson = await filesManager.readJSONFile<{
        sn?: { main?: string }
        version?: string
      }>(packageJsonPath)

      if (packageJson?.sn?.main) {
        main = packageJson.sn.main
      }
    } catch (error) {
      logError(error)
    }

    component.content.local_url = 'sn://' + paths.relativePath + '/' + main
    component.content.package_info.download_url = packageInfo.download_url
    component.content.package_info.latest_url = packageInfo.latest_url
    component.content.package_info.url = packageInfo.url
    component.content.package_info.version = packageInfo.version
    mapping.set(component.uuid, paths.relativePath, version)

    sendInstalledMessage(component)
  } catch (error: any) {
    logMessage(`Error while installing ${component.content.name}`, error.message)

    /**
     * Waiting five seconds prevents clients from spamming install requests
     * of faulty components
     */
    const fiveSeconds = 5000
    await timeout(fiveSeconds)

    sendInstalledMessage(component, {
      message: error.message,
      tag: 'error-downloading',
    })
  }
}

function pathsForComponent(component: Pick<Component, 'content'>) {
  const relativePath = path.join(Paths.extensionsDirRelative, component.content!.package_info.identifier)
  const absolutePath = path.join(Paths.userDataDir, relativePath)
  const downloadPath = path.join(Paths.tempDir, AppName, 'downloads', component.content!.name + '.zip')

  return {
    relativePath,
    absolutePath,
    downloadPath,
  }
}

async function uninstallComponent(mapping: MappingFileHandler, uuid: string) {
  const componentMapping = mapping.get(uuid)
  if (!componentMapping || !componentMapping.location) {
    /** No mapping for component */
    return
  }
  const result = await new FilesManager().deleteDir(path.join(Paths.userDataDir, componentMapping.location))
  if (!result.isFailed()) {
    mapping.remove(uuid)
  }
}
