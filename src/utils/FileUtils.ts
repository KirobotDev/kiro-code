import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export class FileUtils {
    private static getGlobalHistoryDir(userEmail?: string): string {
        const remote = require('@electron/remote');
        const userDataPath = remote.app.getPath('userData');
        return userEmail
            ? path.join(userDataPath, 'global_chats', userEmail)
            : path.join(userDataPath, 'global_chats', 'default');
    }

    static async readFile(filePath: string): Promise<string> {
        return fs.promises.readFile(filePath, 'utf-8');
    }

    static async readDirectory(dirPath: string): Promise<string> {
        let content = `# Project Structure\n\n`;
        content += `Analyzing directory: ${dirPath}\n\n`;

        const files = await this.getAllFiles(dirPath);
        const relevantFiles = files.filter(f => this.isRelevantFile(f));

        content += `Found ${relevantFiles.length} files\n\n`;
        content += `---\n\n`;

        for (const file of relevantFiles) {
            const relativePath = path.relative(dirPath, file);
            const fileContent = await fs.promises.readFile(file, 'utf-8');
            const language = this.detectLanguage(file);

            content += `## ${relativePath}\n\n`;
            content += `\`\`\`${language}\n`;
            content += fileContent;
            content += `\n\`\`\`\n\n`;
        }

        return content;
    }

    private static isRelevantFile(filePath: string): boolean {
        const ignoredDirs = ['node_modules', '.git', 'dist', 'build', '.vscode', 'coverage', '.chat_history'];
        const ignoredExts = ['.log', '.lock', '.map', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf'];

        const pathParts = filePath.split(path.sep);
        if (pathParts.some(part => ignoredDirs.includes(part))) return false;

        const ext = path.extname(filePath);
        if (ignoredExts.includes(ext)) return false;

        return true;
    }

    private static async getAllFiles(dirPath: string): Promise<string[]> {
        const files: string[] = [];
        const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            if (entry.name.startsWith('.')) continue;

            if (entry.isDirectory()) {
                if (!['node_modules', '.git', 'dist', 'build', '.chat_history'].includes(entry.name)) {
                    files.push(...await this.getAllFiles(fullPath));
                }
            } else {
                files.push(fullPath);
            }
        }

        return files;
    }

    static detectLanguage(filename: string): string {
        const ext = path.extname(filename).toLowerCase();
        const langMap: { [key: string]: string } = {
            '.js': 'javascript', '.ts': 'typescript', '.tsx': 'tsx', '.jsx': 'jsx',
            '.py': 'python', '.java': 'java', '.cpp': 'cpp', '.c': 'c',
            '.cs': 'csharp', '.go': 'go', '.rs': 'rust', '.rb': 'ruby',
            '.php': 'php', '.html': 'html', '.css': 'css', '.scss': 'scss',
            '.json': 'json', '.xml': 'xml', '.yml': 'yaml', '.yaml': 'yaml',
            '.md': 'markdown', '.sh': 'bash', '.sql': 'sql'
        };
        return langMap[ext] || 'plaintext';
    }

    static async writeFile(filePath: string, content: string): Promise<void> {
        await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
        await fs.promises.writeFile(filePath, content, 'utf-8');
    }

    static async createDirectory(dirPath: string): Promise<void> {
        await fs.promises.mkdir(dirPath, { recursive: true });
    }

    static async saveChatHistory(projectPath: string | null, sessionData: any, customFilename?: string, userEmail?: string): Promise<string> {
        const historyDir = projectPath
            ? (userEmail ? path.join(projectPath, '.chat_history', userEmail) : path.join(projectPath, '.chat_history', 'default'))
            : this.getGlobalHistoryDir(userEmail);

        await this.createDirectory(historyDir);

        const filename = customFilename || `session_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        const filePath = path.join(historyDir, filename);

        await fs.promises.writeFile(filePath, JSON.stringify(sessionData, null, 2), 'utf-8');
        return filename;
    }

    static async getChatHistoryFiles(projectPath: string | null, userEmail?: string): Promise<string[]> {
        const historyDir = projectPath
            ? (userEmail ? path.join(projectPath, '.chat_history', userEmail) : path.join(projectPath, '.chat_history', 'default'))
            : this.getGlobalHistoryDir(userEmail);

        if (!fs.existsSync(historyDir)) return [];

        const files = await fs.promises.readdir(historyDir);
        return files.filter(f => f.endsWith('.json')).sort().reverse();
    }

    static async loadChatHistory(projectPath: string | null, filename: string, userEmail?: string): Promise<any> {
        const historyDir = projectPath
            ? (userEmail ? path.join(projectPath, '.chat_history', userEmail) : path.join(projectPath, '.chat_history', 'default'))
            : this.getGlobalHistoryDir(userEmail);

        const filePath = path.join(historyDir, filename);
        if (!fs.existsSync(filePath)) {
            throw new Error('File not found');
        }

        const content = await fs.promises.readFile(filePath, 'utf-8');
        return JSON.parse(content);
    }

    static async deleteChatHistory(projectPath: string | null, filename: string, userEmail?: string): Promise<void> {
        const historyDir = projectPath
            ? (userEmail ? path.join(projectPath, '.chat_history', userEmail) : path.join(projectPath, '.chat_history', 'default'))
            : this.getGlobalHistoryDir(userEmail);

        const filePath = path.join(historyDir, filename);
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
        }
    }
}
