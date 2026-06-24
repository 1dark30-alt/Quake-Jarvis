'use strict';

const { contextBridge, ipcRenderer } = require('electron');
const { pathToFileURL } = require('url');

contextBridge.exposeInMainWorld('openQuakeConfig', {
  getConfig() { return ipcRenderer.invoke('getConfig'); },
  getApps() { return ipcRenderer.invoke('getApps'); },
  saveConfig(config) { ipcRenderer.send('saveConfigFromEditor', config); },
  pickProgram() { return ipcRenderer.invoke('pickProgram'); },
  pickFile() { return ipcRenderer.invoke('pickFile'); },
  pickFolder() { return ipcRenderer.invoke('pickFolder'); },
  pickImage() { return ipcRenderer.invoke('pickImage'); },
  getAppIcon(value) { return ipcRenderer.invoke('getAppIcon', value); },
  fetchIconUrl(url) { return ipcRenderer.invoke('fetchIconUrl', url); },
  getLighting() { return ipcRenderer.invoke('getLighting'); },
  setLighting(lighting) { ipcRenderer.send('setLighting', lighting); },
  saveLightingToDevice() { return ipcRenderer.invoke('saveLightingToDevice'); },
  pathToFileURL(filePath) {
    try { return pathToFileURL(filePath).href; }
    catch (e) { return ''; }
  },
  // Read a local image into a data: URL — the same thing the panel does (main.js imageFileToDataUrl), so
  // the editor preview matches the panel and doesn't depend on the renderer being allowed to load file://.
  // The read happens in main (this preload is sandboxed: no fs), via a synchronous IPC so the render path
  // that builds the icon HTML stays synchronous.
  imageToDataUrl(filePath) {
    try { return ipcRenderer.sendSync('imageToDataUrl', filePath) || ''; }
    catch (e) { return ''; }
  },
});
