import { marked } from 'marked';
import { GroqAPI } from '../api/GroqAPI';
import { AIProvider } from '../api/AIProvider';
import { ChatSession } from '../models/ChatSession';
import { ChatMessage, MessageRole } from '../models/Message';
import { FileUtils } from '../utils/FileUtils';
import { ConfigLoader } from '../utils/ConfigLoader';
import * as chokidar from 'chokidar';

class ChatUI {
    private session: ChatSession;
    private provider: AIProvider;
    private watcher: chokidar.FSWatcher | null = null;
    private isProcessorBusy: boolean = false;
    private currentSessionFilename: string | null = null;
    private currentUser: { email: string, name: string } | null = null;
    private isAgentMode: boolean = true;

    private sessionToRename: string | null = null;

    constructor() {
        ConfigLoader.load();
        this.session = new ChatSession();
        this.provider = new GroqAPI();

        this.initUI();

        if (!this.provider.isConfigured()) {
            this.showError('Groq API Key configuration missing. Please check .env file.');
        }

        this.refreshHistoryList(null);
    }

    private initUI(): void {
        const sendBtn = document.getElementById('sendBtn');
        const messageInput = document.getElementById('messageInput') as HTMLTextAreaElement;
        const clearBtn = document.getElementById('clearBtn');
        const selectDirBtn = document.getElementById('selectDirBtn');
        const loginBtn = document.getElementById('loginBtn');

        const modeSelectorBtn = document.getElementById('modeSelectorBtn');
        const modeDropdownMenu = document.getElementById('modeDropdownMenu');
        const currentModeDisplay = document.getElementById('currentModeDisplay');
        const modeOptions = document.querySelectorAll('.mode-option');

        const renameModal = document.getElementById('renameModal');
        const renameInput = document.getElementById('renameInput') as HTMLInputElement;
        const cancelRenameBtn = document.getElementById('cancelRenameBtn');
        const confirmRenameBtn = document.getElementById('confirmRenameBtn');

        sendBtn?.addEventListener('click', () => this.sendMessage());
        messageInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        clearBtn?.addEventListener('click', () => {
            this.clearChat(true);
            this.showNotification('Nouvelle conversation démarrée', 'info');
        });

        selectDirBtn?.addEventListener('click', () => this.selectDirectory());

        loginBtn?.addEventListener('click', () => {
            if (this.currentUser) return;
            const { ipcRenderer } = require('electron');
            ipcRenderer.send('auth:start-google');
        });

        modeSelectorBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            modeDropdownMenu?.classList.toggle('active');
            const chevron = modeSelectorBtn.querySelector('.chevron-icon') as HTMLElement;
            if (chevron) {
                chevron.style.transform = modeDropdownMenu?.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0)';
            }
        });

        modeOptions.forEach(option => {
            option.addEventListener('click', () => {
                const mode = option.getAttribute('data-mode');
                this.isAgentMode = (mode === 'agent');

                if (currentModeDisplay) {
                    currentModeDisplay.textContent = this.isAgentMode ? 'Agent' : 'Ask';
                }

                modeOptions.forEach(opt => opt.setAttribute('data-selected', 'false'));
                option.setAttribute('data-selected', 'true');

                modeDropdownMenu?.classList.remove('active');
                const chevron = modeSelectorBtn?.querySelector('.chevron-icon') as HTMLElement;
                if (chevron) chevron.style.transform = 'rotate(0)';

                this.showNotification(`Mode : ${this.isAgentMode ? 'Agent 🤖' : 'Ask 💬'}`, 'info');

                this.reloadSystemMessage();
            });
        });

        cancelRenameBtn?.addEventListener('click', () => {
            renameModal?.classList.remove('active');
            this.sessionToRename = null;
        });

        confirmRenameBtn?.addEventListener('click', async () => {
            if (!this.sessionToRename) return;
            const newName = renameInput.value.trim();
            if (newName && newName !== this.sessionToRename.replace('.json', '')) {
                await this.performRename(this.sessionToRename, newName);
            }
            renameModal?.classList.remove('active');
            this.sessionToRename = null;
        });

        renameInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                confirmRenameBtn?.click();
            }
        });

        document.addEventListener('click', () => {
            if (modeDropdownMenu?.classList.contains('active')) {
                modeDropdownMenu.classList.remove('active');
                const chevron = modeSelectorBtn?.querySelector('.chevron-icon') as HTMLElement;
                if (chevron) chevron.style.transform = 'rotate(0)';
            }

            document.querySelectorAll('.history-options-menu').forEach(menu => {
                menu.classList.remove('active');
            });
        });

        const { ipcRenderer } = require('electron');
        ipcRenderer.on('auth:success', (_event: any, userInfo: any) => {
            this.currentUser = { email: userInfo.email, name: userInfo.name };
            this.showNotification(`Connecté en tant que ${userInfo.name} !`, 'success');

            if (loginBtn) {
                loginBtn.textContent = `👤 ${userInfo.name}`;
                loginBtn.style.background = 'rgba(39, 174, 96, 0.2)';
                loginBtn.style.color = '#27ae60';
                loginBtn.style.border = '1px solid #27ae60';
                loginBtn.style.pointerEvents = 'none';
                loginBtn.style.cursor = 'default';
            }

            const dirPath = this.session.getWatchedDirectory();
            this.refreshHistoryList(dirPath);
            this.clearChat(true);
        });

        messageInput?.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
    }

    private async selectDirectory(): Promise<void> {
        const remote = require('@electron/remote');
        const { dialog } = remote;

        const result = await dialog.showOpenDialog({
            properties: ['openDirectory'],
            title: 'Sélectionner le dossier du projet'
        });

        if (!result.canceled && result.filePaths.length > 0) {
            const dirPath = result.filePaths[0];

            this.session.setWatchedDirectory(dirPath);

            const dirDisplay = document.getElementById('currentDir');
            if (dirDisplay) {
                dirDisplay.textContent = dirPath;
                dirDisplay.style.display = 'block';
            }

            await this.refreshHistoryList(dirPath);

            try {
                await this.reloadSystemMessage();
                this.showNotification(`✓ Projet chargé : ${dirPath.split('/').pop()}`, 'success');
                this.startWatching(dirPath);
            } catch (error: any) {
                this.showError(`Erreur lors du chargement: ${error.message}`);
            }
        }
    }

    private async refreshHistoryList(dirPath: string | null): Promise<void> {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;

        historyList.innerHTML = '';
        const userEmail = this.currentUser ? this.currentUser.email : undefined;
        const files = await FileUtils.getChatHistoryFiles(dirPath, userEmail);

        if (files.length === 0) {
            historyList.innerHTML = '<div style="padding:10px; color:var(--text-tertiary); font-size:11px; text-align:center;">Aucun historique</div>';
            return;
        }

        files.forEach(file => {
            const container = document.createElement('div');
            container.className = 'history-item-container';

            const btn = document.createElement('button');
            btn.className = 'history-item-btn';
            if (this.currentSessionFilename === file) btn.classList.add('active');

            const displayName = file.replace('session_', '').replace('.json', '');
            btn.innerHTML = `<span>📄</span> <span style="flex:1; overflow:hidden; text-overflow:ellipsis;">${displayName}</span>`;
            btn.onclick = () => this.loadSession(file);

            const menuBtn = document.createElement('button');
            menuBtn.className = 'history-menu-btn';
            menuBtn.innerHTML = '⋮';

            const menu = document.createElement('div');
            menu.className = 'history-options-menu';

            const renameOption = document.createElement('div');
            renameOption.className = 'history-option';
            renameOption.innerHTML = '<span>✎</span> Renommer';
            renameOption.onclick = (e) => {
                e.stopPropagation();
                menu.classList.remove('active');

                this.sessionToRename = file;
                const renameModal = document.getElementById('renameModal');
                const renameInput = document.getElementById('renameInput') as HTMLInputElement;
                if (renameModal && renameInput) {
                    renameInput.value = file.replace('.json', '');
                    renameModal.classList.add('active');
                    setTimeout(() => renameInput.focus(), 100);
                }
            };

            const deleteOption = document.createElement('div');
            deleteOption.className = 'history-option history-option-delete';
            deleteOption.innerHTML = '<span>🗑</span> Supprimer';
            deleteOption.onclick = async (e) => {
                e.stopPropagation();
                menu.classList.remove('active');
                if (confirm(`Supprimer la conversation "${displayName}" ?`)) {
                    try {
                        await FileUtils.deleteChatHistory(dirPath, file, userEmail);
                        this.showNotification('Supprimé !', 'success');

                        if (this.currentSessionFilename === file) {
                            this.clearChat(true);
                        }

                        await this.refreshHistoryList(dirPath);
                    } catch (err: any) {
                        this.showError(err.message);
                    }
                }
            };

            menu.appendChild(renameOption);
            menu.appendChild(deleteOption);

            menuBtn.onclick = (e) => {
                e.stopPropagation();
                const isActive = menu.classList.contains('active');
                document.querySelectorAll('.history-options-menu').forEach(m => m.classList.remove('active'));
                if (!isActive) menu.classList.add('active');
            };

            container.appendChild(btn);
            container.appendChild(menuBtn);
            container.appendChild(menu);
            historyList.appendChild(container);
        });
    }

    private async performRename(file: string, newName: string): Promise<void> {
        const dirPath = this.session.getWatchedDirectory();
        const userEmail = this.currentUser ? this.currentUser.email : undefined;

        try {
            const path = require('path');
            const fs = require('fs');
            const safeName = newName.trim().replace(/[^a-zA-Z0-9-_ ]/g, '');
            if (!safeName) return;

            let historyDir: string;
            if (dirPath) {
                historyDir = userEmail
                    ? path.join(dirPath, '.chat_history', userEmail)
                    : path.join(dirPath, '.chat_history', 'default');
            } else {
                const remote = require('@electron/remote');
                const userDataPath = remote.app.getPath('userData');
                historyDir = userEmail
                    ? path.join(userDataPath, 'global_chats', userEmail)
                    : path.join(userDataPath, 'global_chats', 'default');
            }

            const oldPath = path.join(historyDir, file);
            const newPath = path.join(historyDir, safeName + '.json');

            if (fs.existsSync(newPath)) {
                this.showError('Ce nom existe déjà');
                return;
            }

            await fs.promises.rename(oldPath, newPath);
            this.showNotification('Renommé !', 'success');
            await this.refreshHistoryList(dirPath);

            if (this.currentSessionFilename === file) {
                this.currentSessionFilename = safeName + '.json';
            }
        } catch (err: any) {
            this.showError(err.message);
        }
    }

    private async loadSession(filename: string): Promise<void> {
        const dirPath = this.session.getWatchedDirectory();

        try {
            const userEmail = this.currentUser ? this.currentUser.email : undefined;
            const data = await FileUtils.loadChatHistory(dirPath, filename, userEmail);
            const newSession = ChatSession.fromJSON(data);

            this.session = newSession;
            this.currentSessionFilename = filename;

            const chatMessages = document.getElementById('chatMessages');
            if (chatMessages) chatMessages.innerHTML = '';

            this.session.getMessages().forEach(msg => {
                if (msg.role !== MessageRole.SYSTEM) {
                    this.displayMessage(msg as ChatMessage);
                }
            });

            this.refreshHistoryList(dirPath);
            this.showNotification('Historique chargé', 'success');

        } catch (error: any) {
            this.showError('Erreur chargement historique');
        }
    }

    private async saveSession(): Promise<void> {
        const dirPath = this.session.getWatchedDirectory();

        try {
            const userEmail = this.currentUser ? this.currentUser.email : undefined;
            const filename = await FileUtils.saveChatHistory(
                dirPath,
                this.session.toJSON(),
                this.currentSessionFilename || undefined,
                userEmail
            );
            this.currentSessionFilename = filename;
            await this.refreshHistoryList(dirPath);
        } catch (e: any) {
            console.error("Save failed", e);
        }
    }

    private startWatching(dirPath: string): void {
        if (this.watcher) {
            this.watcher.close();
        }

        this.watcher = chokidar.watch(dirPath, {
            ignored: /(node_modules|.git|dist|build|.chat_history|docs)/,
            persistent: true,
            ignoreInitial: true
        });

        this.watcher.on('change', (path) => {
            if (!this.isProcessorBusy) {
                this.showNotification(`Fichier modifié : ${path.split('/').pop()}`, 'info');
            }
        });
    }

    private async sendMessage(): Promise<void> {
        if (this.isProcessorBusy) return;

        const input = document.getElementById('messageInput') as HTMLTextAreaElement;
        const content = input.value.trim();

        if (!content) return;

        if (!this.provider.isConfigured()) {
            this.showError('Groq API Key not configured');
            return;
        }

        input.value = '';
        input.style.height = 'auto';

        const userMessage = new ChatMessage(MessageRole.USER, content);
        this.session.addMessage(userMessage);
        this.displayMessage(userMessage);

        this.isProcessorBusy = true;
        this.showTyping();

        try {
            await this.processMessageLoop();
            await this.saveSession();
        } catch (error: any) {
            this.hideTyping();
            this.showError(error.message);
        } finally {
            this.isProcessorBusy = false;
        }
    }

    private async processMessageLoop(): Promise<void> {
        let iterations = 0;
        const maxIterations = (this.isAgentMode && this.session.getWatchedDirectory()) ? 5 : 1;
        let hasShownWorkingMessage = false;

        while (iterations < maxIterations) {
            const response = await this.provider.sendMessage(this.session.getMessages());
            iterations++;

            let toolFound = false;
            const toolsToExecute: { name: string, content: string }[] = [];

            if (this.isAgentMode && this.session.getWatchedDirectory()) {
                const toolRegex = /<tool name="([^"]+)">([\s\S]*?)<\/tool>/g;
                let match;
                while ((match = toolRegex.exec(response)) !== null) {
                    toolFound = true;
                    toolsToExecute.push({ name: match[1], content: match[2] });
                }
            }

            if (!toolFound || !this.isAgentMode || !this.session.getWatchedDirectory()) {
                const assistantMessage = new ChatMessage(
                    MessageRole.ASSISTANT,
                    response,
                    this.provider.getProviderName()
                );
                this.session.addMessage(assistantMessage);
                this.hideTyping();
                this.displayMessage(assistantMessage);
                break;
            }

            if (!hasShownWorkingMessage) {
                const actingMessage = new ChatMessage(
                    MessageRole.ASSISTANT,
                    "Je travaille sur votre demande...",
                    "Groq AI"
                );
                this.displayMessage(actingMessage);
                hasShownWorkingMessage = true;
            }

            for (const tool of toolsToExecute) {
                try {
                    let result = '';
                    if (tool.name === 'writeFile') {
                        const pathMatch = tool.content.match(/<path>(.*?)<\/path>/);
                        const contentMatch = tool.content.match(/<content>([\s\S]*?)<\/content>/);

                        if (pathMatch && contentMatch) {
                            const filePath = pathMatch[1].trim();
                            const fileContent = contentMatch[1].trim();
                            const fullPath = require('path').join(this.session.getWatchedDirectory() || '', filePath);
                            await FileUtils.writeFile(fullPath, fileContent);
                            result = `Successfully wrote to ${filePath}`;
                            this.showNotification(`Fichier créé : ${filePath}`, 'success');
                        } else {
                            result = 'Error: Missing path or content tags';
                        }
                    } else if (tool.name === 'createDirectory') {
                        const pathMatch = tool.content.match(/<path>(.*?)<\/path>/);
                        if (pathMatch) {
                            const dirPath = pathMatch[1].trim();
                            const fullPath = require('path').join(this.session.getWatchedDirectory() || '', dirPath);
                            await FileUtils.createDirectory(fullPath);
                            result = `Successfully created directory ${dirPath}`;
                            this.showNotification(`Dossier créé : ${dirPath}`, 'success');
                        }
                    }

                    this.session.addMessage(new ChatMessage(
                        MessageRole.SYSTEM,
                        `Tool '${tool.name}' execution result: ${result}`
                    ));

                } catch (error: any) {
                    this.session.addMessage(new ChatMessage(
                        MessageRole.SYSTEM,
                        `Tool '${tool.name}' failed: ${error.message}`
                    ));
                }
            }
        }
    }

    private displayMessage(message: ChatMessage): void {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.isUser() ? 'user-message' : 'assistant-message'}`;

        const content = document.createElement('div');
        content.className = 'message-content';
        const parsedContent = marked.parse(message.content);
        content.innerHTML = typeof parsedContent === 'string' ? parsedContent : '';

        if (!message.isUser()) {
            const header = document.createElement('div');
            header.className = 'message-provider';
            header.textContent = 'Groq AI';
            messageDiv.appendChild(header);
        }

        messageDiv.appendChild(content);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    private showTyping(): void {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        const typing = document.createElement('div');
        typing.id = 'typingIndicator';
        typing.className = 'typing-indicator';
        typing.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
        chatMessages.appendChild(typing);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    private hideTyping(): void {
        const typing = document.getElementById('typingIndicator');
        typing?.remove();
    }

    private showError(message: string): void {
        this.showNotification('❌ ' + message, 'error');
    }

    private showNotification(message: string, type: 'success' | 'error' | 'info'): void {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    private clearChat(keepDirectory: boolean = false): void {
        this.session.clear();
        this.currentSessionFilename = null;
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.innerHTML = '';
        }

        if (keepDirectory && this.session.getWatchedDirectory()) {
            this.reloadSystemMessage();
        } else {
            this.reloadSystemMessage();
        }

        this.refreshHistoryList(this.session.getWatchedDirectory());
    }

    private async reloadSystemMessage(): Promise<void> {
        const dirPath = this.session.getWatchedDirectory();

        try {
            let prompt = '';
            const content = dirPath ? await FileUtils.readDirectory(dirPath) : "Aucun projet chargé.";

            if (this.isAgentMode && dirPath) {
                prompt = `Project loaded from: ${dirPath}\n\n${content}\n\nYou are an Agentic AI capable of modifying this codebase.
You are a French EXPERT Senior Developer. Your code is clean, optimized, and production-ready.
You MUST answer in French.

CRITICAL RULES:
1. **NEVER** create a new project folder (e.g., 'discord-bot', 'website', 'portfolio').
2. **ALWAYS** write files directly to the root of the current directory.
   - CORRECT: Write \`index.js\`, \`public/index.html\`.
   - WRONG: Write \`my-bot/index.js\`, \`portfolio/index.html\`.
3. If the user asks for "a discord bot", assume the CURRENT directory IS the bot directory.
4. You have access to tools. To use a tool, you MUST format your response exactly as shown:

1. Write File:
<tool name="writeFile">
<path>file.ext</path>
<content>
file content here
</content>
</tool>

2. Create Directory:
<tool name="createDirectory">
<path>relative/path/to/directory</path>
</tool>

If you want to create a file, just output the XML tool call. Do not ask for permission if the user asked you to do it.
You can output multiple tool calls in one response.
Always check your previous tool outputs before continuing.`;
            } else {
                prompt = dirPath ? `Project loaded from: ${dirPath}\n\n${content}\n\n` : "";
                prompt += `You are a helpful AI Assistant "Kiro Code Assistant".
You are a French EXPERT Senior Developer.
You MUST answer in French.

You are in "ASK Mode" (ou aucun projet n'est chargé). Vous ne pouvez pas éditer de fichiers directement.
Votre but est d'expliquer du code, d'aider à débugger, et de donner des exemples que l'utilisateur peut copier.
NE PAS utiliser les balises XML de tools. Fournissez simplement des blocs de code markdown standards.`;
            }

            const systemMessage = new ChatMessage(MessageRole.SYSTEM, prompt);
            this.session.addMessage(systemMessage);

        } catch (e) { console.error(e); }
    }
}

new ChatUI();
