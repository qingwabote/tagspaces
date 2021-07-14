/**
 * TagSpaces - universal file and folder organizer
 * Copyright (C) 2017-present TagSpaces UG (haftungsbeschraenkt)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License (version 3) as
 * published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 */

import { app, BrowserWindow, ipcMain, globalShortcut, dialog } from 'electron';
import windowStateKeeper from 'electron-window-state';
import path from 'path';
import i18n from '-/services/i18n';
import buildTrayIconMenu from '-/services/electron-tray-menu';
import buildDesktopMenu from '-/services/electron-menus';
// import menuFactoryService from '-/services/menuFactory';

// require('@electron/remote/main').initialize();

// delete process.env.ELECTRON_ENABLE_SECURITY_WARNINGS;
// process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

let mainWindow = null;
let tray = null;
(global as any).splashWorkerWindow = null;

if (process.env.NODE_ENV === 'production') {
  // eslint-disable-next-line
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
  console.log = () => {};
  console.time = () => {};
  console.timeEnd = () => {};
}

// let debugMode;
let startupFilePath;
let portableMode;

const testMode = process.env.NODE_ENV === 'test';
const devMode =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

process.argv.forEach((arg, count) => {
  console.log('Opening file: ' + arg);
  if (
    arg.toLowerCase() === '-d' ||
    arg.toLowerCase() === '--debug' ||
    arg.startsWith('--remote-debugging-port=') ||
    arg.startsWith('--inspect=')
  ) {
    // debugMode = true;
  } else if (arg.toLowerCase() === '-p' || arg.toLowerCase() === '--portable') {
    app.setPath('userData', process.cwd() + '/tsprofile'); // making the app portable
    portableMode = true;
  } else if (testMode || devMode) {
    // ignoring the spectron testing
    arg = '';
  } else if (
    arg.endsWith('main.prod.js') ||
    arg === './app/main.dev.babel.js' ||
    arg === '.' ||
    count === 0
  ) {
    // ignoring the first argument
    // Ignore these argument
  } else if (arg.length > 2) {
    // console.warn('Opening file: ' + arg);
    if (arg !== './app/main.dev.js' && arg !== './app/') {
      startupFilePath = arg;
    }
  }

  if (portableMode) {
    startupFilePath = undefined;
  }
});

if (devMode) {
  // eslint-disable-next-line
  require('electron-debug')({ showDevTools: false, devToolsMode: 'right' });
  const p = path.join(__dirname, '..', 'app', 'node_modules');
  // eslint-disable-next-line
  require('module').globalPaths.push(p);
}

// if (process.platform === 'linux') {
//   app.commandLine.appendSwitch('disable-gpu'); // Fix the freezing the app with a black box on dnd https://github.com/electron/electron/issues/12820
// }

// app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096'); // disabled due crashes on win 7
app.commandLine.appendSwitch('--disable-http-cache');

const installExtensions = async () => {
  const {
    default: installExtension,
    REACT_DEVELOPER_TOOLS,
    REDUX_DEVTOOLS
  } = require('electron-devtools-installer'); // eslint-disable-line

  // const forceDownload = !!process.env.UPGRADE_EXTENSIONS; // temp fix for electron-devtools-installer issue
  const extensions = [REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS];
  const extOptions = {
    loadExtensionOptions: { allowFileAccess: true },
    forceDownload: false
  };

  return Promise.all(
    extensions.map(name => installExtension(name.id, extOptions))
  ).catch(console.log);
};

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required'); // Fix broken autoplay functionality in the av player

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  app.quit();
});

app.on('ready', async () => {
  let workerDevMode = false;
  let mainHTML = `file://${__dirname}/app.html`;

  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  if (process.env.NODE_ENV === 'development') {
    // workerDevMode = true; // hide worker window in dev mode
    mainHTML = `file://${__dirname}/appd.html`;
  }

  const mainWindowState = windowStateKeeper({
    defaultWidth: 1280,
    defaultHeight: 800
  });

  function createSplashWorker() {
    // console.log('Dev ' + process.env.NODE_ENV + ' worker ' + showWorkerWindow);
    (global as any).splashWorkerWindow = new BrowserWindow({
      show: workerDevMode,
      x: 0,
      y: 0,
      width: workerDevMode ? 800 : 1,
      height: workerDevMode ? 600 : 1,
      frame: false,
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true,
        contextIsolation: false
      }
    });

    if (!process.env.DISABLE_WORKER) {
      (global as any).splashWorkerWindow.loadURL(
        `file://${__dirname}/splash.html`
      );
    }
  }

  createSplashWorker();

  let startupParameter = '';
  if (startupFilePath) {
    if (startupFilePath.startsWith('./') || startupFilePath.startsWith('.\\')) {
      startupParameter =
        '?cmdopen=' + encodeURIComponent(path.join(__dirname, startupFilePath));
    } else if (startupFilePath !== 'data:,') {
      startupParameter = '?cmdopen=' + encodeURIComponent(startupFilePath);
    }
  }

  // TODO remote module is deprecated https://stackoverflow.com/questions/37884130/electron-remote-is-undefined
  mainWindow = new BrowserWindow({
    show: true,
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    // icon: path.join(__dirname, 'assets/icons/128x128.png'),
    webPreferences: {
      spellcheck: true,
      nodeIntegration: true,
      webviewTag: true,
      enableRemoteModule: true,
      contextIsolation: false
    }
  });

  const winUserAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36';
  const testWinOnUnix = false; // set to true to simulate windows os, useful for testing s3 handling

  mainWindow.loadURL(
    mainHTML + startupParameter,
    testWinOnUnix ? { userAgent: winUserAgent } : {}
  );
  mainWindow.setMenuBarVisibility(false);
  mainWindow.setAutoHideMenuBar(true);

  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    // mainWindow.show();
    (global as any).splashWorkerWindow.hide(); // Comment for easy debugging of the worker (global as any).splashWorkerWindow.show();
    if (portableMode) {
      mainWindow.setTitle(mainWindow.title + ' Portable 🔌');
    }
    mainWindow.focus();
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
    try {
      (global as any).splashWorkerWindow.close();
      (global as any).splashWorkerWindow = null;
    } catch (err) {
      // console.warn('Error closing the splash window. ' + err);
    }
  });

  mainWindow.webContents.on('crashed', () => {
    const options = {
      type: 'info',
      title: 'Renderer Process Crashed',
      message: 'This process has crashed.',
      buttons: ['Reload', 'Close']
    };

    if (!mainWindow) {
      globalShortcut.unregisterAll();
      return;
    }

    dialog.showMessageBox(mainWindow, options).then(dialogResponse => {
      mainWindow.hide();
      if (dialogResponse.response === 0) {
        reloadApp();
      } else {
        mainWindow.close();
        globalShortcut.unregisterAll();
      }
    });
  });

  (global as any).splashWorkerWindow.webContents.on('crashed', () => {
    try {
      (global as any).splashWorkerWindow.close();
      (global as any).splashWorkerWindow = null;
    } catch (err) {
      console.warn('Error closing the splash window. ' + err);
    }
    createSplashWorker();
  });

  ipcMain.on('worker', (event, arg) => {
    // console.log('worker event in main.' + arg.result.length);
    if (mainWindow) {
      mainWindow.webContents.send(arg.id, arg);
    }
  });

  ipcMain.on('setSplashVisibility', (event, arg) => {
    // worker window needed to be visible for the PDF tmb generation
    // console.log('worker event in main: ' + arg.visibility);
    if ((global as any).splashWorkerWindow && arg.visibility) {
      (global as any).splashWorkerWindow.show();
      // arg.visibility ? global.splashWorkerWindow.show() : global.splashWorkerWindow.hide();
    }
  });

  ipcMain.on('app-data-path-request', event => {
    event.returnValue = app.getPath('appData'); // eslint-disable-line
  });

  ipcMain.on('app-version-request', event => {
    event.returnValue = app.getVersion(); // eslint-disable-line
  });

  ipcMain.on('app-dir-path-request', event => {
    event.returnValue = path.join(__dirname, ''); // eslint-disable-line
  });

  ipcMain.on('global-shortcuts-enabled', (e, globalShortcutsEnabled) => {
    if (globalShortcutsEnabled) {
      globalShortcut.register('CommandOrControl+Shift+F', showSearch);
      globalShortcut.register('CommandOrControl+Shift+P', resumePlayback);
      globalShortcut.register('MediaPlayPause', resumePlayback);
      globalShortcut.register('CommandOrControl+Shift+N', newTextFile);
      globalShortcut.register('CommandOrControl+Shift+D', getNextFile);
      globalShortcut.register('MediaNextTrack', getNextFile);
      globalShortcut.register('CommandOrControl+Shift+A', getPreviousFile);
      globalShortcut.register('MediaPreviousTrack', getPreviousFile);
      globalShortcut.register('CommandOrControl+Shift+W', showTagSpaces);
    } else {
      globalShortcut.unregisterAll();
    }
  });

  ipcMain.on('relaunch-app', reloadApp);

  ipcMain.on('quit-application', () => {
    globalShortcut.unregisterAll();
    app.quit();
  });

  process.on('uncaughtException', error => {
    if (error.stack) {
      console.error('error:', error.stack);
      throw new Error(error.stack);
    }
    reloadApp();
  });

  mainWindowState.manage(mainWindow);

  function showTagSpaces() {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.show();
    }
  }

  function openLocationManagerPanel() {
    if (mainWindow) {
      showTagSpaces();
      mainWindow.webContents.send('file', 'open-location-manager-panel');
    }
  }
  function openTagLibraryPanel() {
    if (mainWindow) {
      showTagSpaces();
      mainWindow.webContents.send('file', 'open-tag-library-panel');
    }
  }
  function goBack() {
    if (mainWindow) {
      showTagSpaces();
      mainWindow.webContents.send('file', 'go-back');
    }
  }
  function goForward() {
    if (mainWindow) {
      showTagSpaces();
      mainWindow.webContents.send('file', 'go-forward');
    }
  }
  function setZoomResetApp() {
    if (mainWindow) {
      showTagSpaces();
      mainWindow.webContents.send('file', 'set-zoom-reset-app');
    }
  }
  function setZoomInApp() {
    if (mainWindow) {
      showTagSpaces();
      mainWindow.webContents.send('file', 'set-zoom-in-app');
    }
  }
  function setZoomOutApp() {
    if (mainWindow) {
      showTagSpaces();
      mainWindow.webContents.send('file', 'set-zoom-out-app');
    }
  }
  function exitFullscreen() {
    if (mainWindow) {
      showTagSpaces();
      mainWindow.webContents.send('file', 'exit-fullscreen');
    }
  }
  function toggleSettingsDialog() {
    if (mainWindow) {
      showTagSpaces();
      mainWindow.webContents.send('file', 'toggle-settings-dialog');
    }
  }
  function openHelpFeedbackPanel() {
    if (mainWindow) {
      showTagSpaces();
      mainWindow.webContents.send('file', 'open-help-feedback-panel');
    }
  }
  function toggleKeysDialog() {
    if (mainWindow) {
      showTagSpaces();
      mainWindow.webContents.send('file', 'toggle-keys-dialog');
    }
  }
  function toggleOnboardingDialog() {
    if (mainWindow) {
      showTagSpaces();
      mainWindow.webContents.send('file', 'toggle-onboarding-dialog');
    }
  }
  function openURLExternally(data) {
    if (mainWindow) {
      showTagSpaces();
      mainWindow.webContents.send('open-url-externally', data);
    }
  }
  function toggleLicenseDialog() {
    if (mainWindow) {
      showTagSpaces();
      mainWindow.webContents.send('file', 'toggle-license-dialog');
    }
  }
  function toggleThirdPartyLibsDialog() {
    if (mainWindow) {
      showTagSpaces();
      mainWindow.webContents.send('file', 'toggle-third-party-libs-dialog');
    }
  }
  function toggleAboutDialog() {
    if (mainWindow) {
      showTagSpaces();
      mainWindow.webContents.send('file', 'toggle-about-dialog');
    }
  }
  function showSearch() {
    if (mainWindow) {
      showTagSpaces();
      mainWindow.webContents.send('file', 'open-search');
    }
  }

  function newTextFile() {
    if (mainWindow) {
      showTagSpaces();
      mainWindow.webContents.send('file', 'new-text-file');
    }
  }

  function getNextFile() {
    if (mainWindow) {
      mainWindow.webContents.send('file', 'next-file');
    }
  }

  function getPreviousFile() {
    if (mainWindow) {
      mainWindow.webContents.send('file', 'previous-file');
    }
  }

  function showCreateDirectoryDialog() {
    if (mainWindow) {
      mainWindow.webContents.send('file', 'show-create-directory-dialog');
    }
  }

  function toggleOpenLinkDialog() {
    if (mainWindow) {
      mainWindow.webContents.send('file', 'toggle-open-link-dialog');
    }
  }

  function resumePlayback() {
    if (mainWindow) {
      mainWindow.webContents.send('play-pause', true);
    }
  }

  function reloadApp() {
    if (mainWindow) {
      mainWindow.loadURL(mainHTML);
    }
  }

  i18n.on('loaded', loaded => {
    buildDesktopMenu(
      {
        showTagSpaces,
        openSearchPanel: showSearch,
        toggleCreateFileDialog: newTextFile,
        openNextFile: getNextFile,
        openPrevFile: getPreviousFile,
        quitApp: reloadApp,
        showCreateDirectoryDialog: showCreateDirectoryDialog,
        toggleOpenLinkDialog: toggleOpenLinkDialog,
        openLocationManagerPanel: openLocationManagerPanel,
        openTagLibraryPanel: openTagLibraryPanel,
        goBack: goBack,
        goForward: goForward,
        setZoomResetApp: setZoomResetApp,
        setZoomInApp: setZoomInApp,
        setZoomOutApp: setZoomOutApp,
        exitFullscreen: exitFullscreen,
        toggleSettingsDialog: toggleSettingsDialog,
        openHelpFeedbackPanel: openHelpFeedbackPanel,
        toggleKeysDialog: toggleKeysDialog,
        toggleOnboardingDialog: toggleOnboardingDialog,
        openURLExternally: openURLExternally,
        toggleLicenseDialog: toggleLicenseDialog,
        toggleThirdPartyLibsDialog: toggleThirdPartyLibsDialog,
        toggleAboutDialog: toggleAboutDialog,
        // defaultSettings.keyBindings
        keyBindings: [
          {
            name: 'selectAll',
            command: 'ctrl+a'
          },
          {
            name: 'closeViewer',
            command: 'ctrl+w'
          },
          {
            name: 'saveDocument',
            command: 'ctrl+s'
          },
          {
            name: 'reloadDocument',
            command: 'ctrl+r'
          },
          {
            name: 'editDocument',
            command: 'ctrl+e'
          },
          {
            name: 'deleteDocument',
            command: 'del'
          },
          {
            name: 'showLocationManager',
            command: 'ctrl+1'
          },
          {
            name: 'showTagLibrary',
            command: 'ctrl+2'
          },
          {
            name: 'showSearch',
            command: 'ctrl+3'
          },
          {
            name: 'toggleShowHiddenEntries',
            command: 'ctrl+h'
          },
          {
            name: 'addRemoveTags',
            command: 'ctrl+t'
          },
          /* {
            name: 'propertiesDocument',
            command: 'alt+enter',
          }, */
          {
            name: 'nextDocument',
            command: 'down'
          },
          {
            name: 'prevDocument',
            command: 'up'
          },
          {
            name: 'showHelp',
            command: 'f1'
          },
          {
            name: 'reloadApplication',
            command: 'r a'
          },
          {
            name: 'toggleFullScreen',
            command: 'f11'
          },
          {
            name: 'openDevTools',
            command: 'f10'
          },
          {
            name: 'openSearch',
            command: 'ctrl+f'
          },
          {
            name: 'renameFile',
            command: 'f2'
          },
          {
            name: 'openEntry',
            command: 'enter'
          },
          {
            name: 'openParentDirectory',
            command: 'backspace'
          },
          {
            name: 'openFileExternally',
            command: 'ctrl+enter'
          },
          {
            name: 'zoomIn',
            command: 'ctrl+'
          },
          {
            name: 'zoomOut',
            command: 'ctrl-'
          }
        ]
      },
      i18n
    );
    //i18n.changeLanguage('en');
    i18n.off('loaded');
  });
  //TODO Tray not showing on i18n loaded - not localized yet
  tray = buildTrayIconMenu(
    {
      showTagSpaces,
      openSearchPanel: showSearch,
      toggleCreateFileDialog: newTextFile,
      openNextFile: getNextFile,
      openPrevFile: getPreviousFile,
      quitApp: reloadApp
    },
    i18n
  );
});
