export class ConfigLoader {
    static load(): void {
        const path = require('path');
        const dotenv = require('dotenv');

        const devPath = path.join(__dirname, '../../.env');
        const prodPath = path.join(process.resourcesPath, '.env');

        if (require('fs').existsSync(prodPath)) {
            dotenv.config({ path: prodPath });
        } else {
            dotenv.config({ path: devPath });
        }
    }

    static getGroqApiKey(): string | undefined {
        return process.env.GROQ_API_KEY;
    }

    static isConfigured(): boolean {
        return !!this.getGroqApiKey();
    }
}
