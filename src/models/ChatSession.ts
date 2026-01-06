import { Message, ChatMessage } from './Message';

export class ChatSession {
    private messages: Message[] = [];
    private currentProvider: string | null = null;
    private watchedDirectory: string | null = null;

    addMessage(message: Message): void {
        this.messages.push(message);
    }

    getMessages(): Message[] {
        return [...this.messages];
    }

    clear(): void {
        this.messages = [];
    }

    setCurrentProvider(provider: string): void {
        this.currentProvider = provider;
    }

    getCurrentProvider(): string | null {
        return this.currentProvider;
    }

    setWatchedDirectory(dir: string | null): void {
        this.watchedDirectory = dir;
    }

    getWatchedDirectory(): string | null {
        return this.watchedDirectory;
    }

    getMessageCount(): number {
        return this.messages.length;
    }
    toJSON(): any {
        return {
            messages: this.messages,
            currentProvider: this.currentProvider,
            watchedDirectory: this.watchedDirectory
        };
    }

    static fromJSON(json: any): ChatSession {
        const session = new ChatSession();
        if (json.messages) {
            session.messages = json.messages.map((m: any) => {
                const msg = new ChatMessage(m.role, m.content, m.provider);
                if (m.timestamp) msg.timestamp = new Date(m.timestamp);
                return msg;
            });
        }
        if (json.currentProvider) session.currentProvider = json.currentProvider;
        if (json.watchedDirectory) session.watchedDirectory = json.watchedDirectory;
        return session;
    }
}
