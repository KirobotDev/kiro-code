export enum MessageRole {
    USER = 'user',
    ASSISTANT = 'assistant',
    SYSTEM = 'system'
}

export interface Message {
    role: MessageRole;
    content: string;
    timestamp: Date;
    provider?: string;
}

export class ChatMessage implements Message {
    role: MessageRole;
    content: string;
    timestamp: Date;
    provider?: string;

    constructor(role: MessageRole, content: string, provider?: string) {
        this.role = role;
        this.content = content;
        this.timestamp = new Date();
        this.provider = provider;
    }

    isUser(): boolean {
        return this.role === MessageRole.USER;
    }

    isAssistant(): boolean {
        return this.role === MessageRole.ASSISTANT;
    }

    getFormattedTime(): string {
        return this.timestamp.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}
