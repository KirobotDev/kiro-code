import axios from 'axios';
import { AIProvider } from './AIProvider';
import { Message, MessageRole } from '../models/Message';
import { ConfigLoader } from '../utils/ConfigLoader';

export class GroqAPI implements AIProvider {
    private readonly apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
    private readonly model = 'llama-3.1-8b-instant';
    private readonly apiKey: string | undefined;

    constructor() {
        this.apiKey = ConfigLoader.getGroqApiKey();
    }

    async sendMessage(messages: Message[]): Promise<string> {
        if (!this.isConfigured()) {
            throw new Error('Groq API key not configured');
        }

        const formattedMessages = messages.map(msg => ({
            role: msg.role === MessageRole.SYSTEM ? 'system' :
                msg.role === MessageRole.USER ? 'user' : 'assistant',
            content: msg.content
        }));

        try {
            const response = await axios.post(
                this.apiUrl,
                {
                    model: this.model,
                    messages: formattedMessages,
                    temperature: 0.7,
                    max_tokens: 8000,
                    top_p: 1,
                    stream: false
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 60000
                }
            );

            return response.data.choices[0].message.content;
        } catch (error: any) {
            if (error.response) {
                if (error.response.status === 429) {
                    const apiMsg = error.response.data?.error?.message || '';
                    const waitTimeMatch = apiMsg.match(/try again in ([\d\.]+)s/);
                    const waitTime = waitTimeMatch ? waitTimeMatch[1] : 'few seconds';
                    throw new Error(`⚠️ Rate Limit Reached. Please wait ${waitTime}s before retrying. (Model switched to Llama 3 8b for better limits)`);
                }
                throw new Error(`Groq API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            }
            throw new Error(`Groq API error: ${error.message}`);
        }
    }

    getProviderName(): string {
        return 'Groq (Llama 3 8b)';
    }

    isConfigured(): boolean {
        return !!this.apiKey;
    }
}
