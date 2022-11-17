import { IpcRendererEvent } from 'electron/renderer'
import { MessageToWebApp } from '../Shared/IpcMessages'
const { ipcRenderer } = require('electron')
const RemoteBridge = require('@electron/remote').getGlobal('RemoteBridge')
const { contextBridge } = require('electron')

type MainEventCallback = (event: IpcRendererEvent, value: any) => void

process.once('loaded', function () {
  contextBridge.exposeInMainWorld('electronRemoteBridge', RemoteBridge.exposableValue)

  contextBridge.exposeInMainWorld('electronMainEvents', {
    handleUpdateAvailable: (callback: MainEventCallback) => ipcRenderer.on(MessageToWebApp.UpdateAvailable, callback),

    handlePerformAutomatedBackup: (callback: MainEventCallback) =>
      ipcRenderer.on(MessageToWebApp.PerformAutomatedBackup, callback),

    handleFinishedSavingBackup: (callback: MainEventCallback) =>
      ipcRenderer.on(MessageToWebApp.FinishedSavingBackup, callback),

    handleWindowBlurred: (callback: MainEventCallback) => ipcRenderer.on(MessageToWebApp.WindowBlurred, callback),

    handleWindowFocused: (callback: MainEventCallback) => ipcRenderer.on(MessageToWebApp.WindowFocused, callback),

    handleInstallComponentComplete: (callback: MainEventCallback) =>
      ipcRenderer.on(MessageToWebApp.InstallComponentComplete, callback),
  })
})
