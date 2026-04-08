import { app, BrowserWindow, desktopCapturer, screen, ipcMain } from 'electron';
import * as path from 'path';

let mainWindow: BrowserWindow | null = null;
let isCapturing = false;
let captureStream: MediaStream | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, 'assets/icon.png'),
  });

  mainWindow.loadFile(path.join(__dirname, '../src/index.html'));
  
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers for window capture
ipcMain.handle('get-sources', async (event, options) => {
  const sources = await desktopCapturer.getSources({
    types: ['window', 'screen'],
    thumbnailSize: { width: 320, height: 240 },
  });
  
  // Filter to only meeting-related windows
  const meetingKeywords = ['zoom', 'meet', 'teams', 'webex', 'skype', 'meeting'];
  const filteredSources = sources.filter(source => {
    const name = source.name.toLowerCase();
    return meetingKeywords.some(keyword => name.includes(keyword));
  });

  return filteredSources.map(source => ({
    id: source.id,
    name: source.name,
    thumbnail: source.thumbnail.toDataURL(),
  }));
});

ipcMain.handle('start-capture', async (event, sourceId: string) => {
  if (isCapturing) {
    return { success: false, error: 'Already capturing' };
  }

  try {
    const display = screen.getPrimaryDisplay();
    
    // Create a hidden window for capture
    const captureWindow = new BrowserWindow({
      show: false,
      width: display.workAreaSize.width,
      height: display.workAreaSize.height,
    });

    const stream = await desktopCapturer.getSources({
      types: ['window'],
      fetchWindowIcons: true,
    });

    const source = stream.find(s => s.id === sourceId);
    if (!source) {
      throw new Error('Source not found');
    }

    isCapturing = true;
    
    return { 
      success: true, 
      sourceName: source.name,
      bounds: { x: 0, y: 0, width: 1920, height: 1080 }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stop-capture', async () => {
  isCapturing = false;
  if (captureStream) {
    captureStream.getTracks().forEach(track => track.stop());
    captureStream = null;
  }
  return { success: true };
});

ipcMain.handle('capture-frame', async (event, options?: { quality?: number }) => {
  if (!isCapturing) {
    return { success: false, error: 'Not capturing' };
  }

  try {
    const sources = await desktopCapturer.getSources({
      types: ['window'],
      thumbnailSize: { width: 1920, height: 1080 },
    });

    // Return the first available source frame
    const source = sources[0];
    if (!source) {
      return { success: false, error: 'No source available' };
    }

    return {
      success: true,
      image: source.thumbnail.toDataURL('image/png', options?.quality || 0.8),
      timestamp: Date.now(),
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Meeting detection helpers
ipcMain.handle('detect-meeting-windows', async () => {
  const sources = await desktopCapturer.getSources({
    types: ['window'],
    fetchWindowIcons: true,
  });

  const meetingPatterns = [
    /zoom/i,
    /google meet/i,
    /microsoft teams/i,
    /webex/i,
    /skype/i,
    /meeting/i,
    /conference/i,
  ];

  const meetingWindows = sources.filter(source => {
    return meetingPatterns.some(pattern => 
      pattern.test(source.name) || pattern.test(source.id)
    );
  });

  return meetingWindows.map(w => ({
    id: w.id,
    name: w.name,
    appId: w.appId,
  }));
});
