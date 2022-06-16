import { MessageToWebApp } from '../Shared/IpcMessages'
const { ipcRenderer } = require('electron')
const path = require('path')
const rendererPath = path.join('file://', __dirname, '/renderer.js')
const RemoteBridge = require('@electron/remote').getGlobal('RemoteBridge')
const { contextBridge } = require('electron')

process.once('loaded', function () {
  contextBridge.exposeInMainWorld('electronRemoteBridge', RemoteBridge.exposableValue)

  listenForIpcEventsFromMainProcess()
})

function listenForIpcEventsFromMainProcess() {
  const sendMessageToRenderProcess = (message: string, payload = {}) => {
    window.postMessage(JSON.stringify({ message, data: payload }), rendererPath)
  }

  ipcRenderer.on(MessageToWebApp.UpdateAvailable, function (_event, data) {
    sendMessageToRenderProcess(MessageToWebApp.UpdateAvailable, data)
  })

  ipcRenderer.on(MessageToWebApp.PerformAutomatedBackup, function (_event, data) {
    sendMessageToRenderProcess(MessageToWebApp.PerformAutomatedBackup, data)
  })

  ipcRenderer.on(MessageToWebApp.FinishedSavingBackup, function (_event, data) {
    sendMessageToRenderProcess(MessageToWebApp.FinishedSavingBackup, data)
  })

  ipcRenderer.on(MessageToWebApp.WindowBlurred, function (_event, data) {
    sendMessageToRenderProcess(MessageToWebApp.WindowBlurred, data)
  })

  ipcRenderer.on(MessageToWebApp.WindowFocused, function (_event, data) {
    sendMessageToRenderProcess(MessageToWebApp.WindowFocused, data)
  })

  ipcRenderer.on(MessageToWebApp.InstallComponentComplete, function (_event, data) {
    sendMessageToRenderProcess(MessageToWebApp.InstallComponentComplete, data)
  })
}
