import { Message } from '../models/Message';

export interface AIProvider {
    sendMessage(messages: Message[]): Promise<string>;
    getProviderName(): string;
    isConfigured(): boolean;
}
