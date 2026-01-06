import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as http from 'http';
import * as url from 'url';
import { AuthService } from './services/AuthService';
import { ConfigLoader } from './utils/ConfigLoader';

if (process.platform === 'linux') {
    app.commandLine.appendSwitch('no-sandbox');
}

ConfigLoader.load();

require('@electron/remote/main').initialize();

let mainWindow: BrowserWindow | null = null;
let authServer: http.Server | null = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1600,
        height: 1000,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        backgroundColor: '#0a0a0a',
        title: 'AI Code Assistant',
        icon: path.join(__dirname, '../public/icon.png')
    });

    require('@electron/remote/main').enable(mainWindow.webContents);
    mainWindow.loadFile(path.join(__dirname, '../public/index.html'));

    mainWindow.on('closed', () => {
        mainWindow = null;
        if (authServer) authServer.close();
    });
}

function startAuthServer() {
    if (authServer) return;

    authServer = http.createServer(async (req, res) => {
        const parsedUrl = url.parse(req.url || '', true);

        if (parsedUrl.pathname === '/auth/google/callback') {
            const code = parsedUrl.query.code as string;

            if (code) {
                try {
                    const tokens = await AuthService.exchangeCodeForToken(code);
                    const userInfo = await AuthService.getUserInfo(tokens.access_token);

                    if (mainWindow) {
                        mainWindow.webContents.send('auth:success', userInfo);
                    }

                    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>Connexion Réussie</title>
                            <style>
                                body {
                                    background-color: #0a0a0a;
                                    color: #ffffff;
                                    font-family: 'Segoe UI', sans-serif;
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    justify-content: center;
                                    height: 100vh;
                                    margin: 0;
                                }
                                .card {
                                    background: rgba(20, 20, 20, 0.95);
                                    padding: 40px;
                                    border-radius: 16px;
                                    border: 1px solid #333;
                                    text-align: center;
                                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                                }
                                h1 { color: #27ae60; margin-bottom: 10px; }
                                p { color: #888; margin-bottom: 20px; }
                                .icon { font-size: 48px; margin-bottom: 20px; }
                            </style>
                        </head>
                        <body>
                            <div class="card">
                                <div class="icon">✅</div>
                                <h1>Authentification Réussie</h1>
                                <p>Vous pouvez fermer cette fenêtre et retourner sur l'application.</p>
                            </div>
                            <script>setTimeout(() => window.close(), 3000);</script>
                        </body>
                        </html>
                    `);
                } catch (error) {
                    res.writeHead(500);
                    res.end('Erreur authentification');
                    if (mainWindow) mainWindow.webContents.send('auth:error', 'Échec connexion Google');
                }
            }
        }
    });

    authServer.listen(3000, () => {
        console.log('Auth server listening on port 3000');
    });
}

app.whenReady().then(() => {
    createWindow();
    startAuthServer();
});

ipcMain.on('auth:start-google', () => {
    const authUrl = AuthService.getAuthUrl();
    shell.openExternal(authUrl);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
