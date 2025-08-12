
const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

function createWindow() {
  // Ana pencereyi oluştur
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, 'assets', 'icon.png'), // İsteğe bağlı ikon
    show: false // Pencereyi önce gizli başlat
  });

  // Menü çubuğunu gizle
  Menu.setApplicationMenu(null);

  // Sunucuyu başlat
  startServer().then(() => {
    // Sunucu hazır olduğunda pencereyi göster
    mainWindow.loadURL('http://127.0.0.1:5000');
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    // Sunucu sürecini sonlandır
    if (serverProcess) {
      serverProcess.kill();
    }
  });
}

function startServer() {
  return new Promise((resolve) => {
    // Express sunucusunu başlat
    serverProcess = spawn('node', ['dist/index.js'], {
      env: { ...process.env, NODE_ENV: 'production' },
      cwd: path.join(__dirname, '..')
    });

    serverProcess.stdout.on('data', (data) => {
      console.log(`Server: ${data}`);
      if (data.toString().includes('serving on port 5000')) {
        // Sunucu hazır olduğunda resolve et
        setTimeout(resolve, 1000);
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`Server Error: ${data}`);
    });
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
