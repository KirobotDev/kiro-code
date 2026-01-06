import axios from 'axios';
import { ConfigLoader } from '../utils/ConfigLoader';

export class AuthService {
    private static readonly AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
    private static readonly TOKEN_URL = 'https://oauth2.googleapis.com/token';
    private static readonly REDIRECT_URI = 'http://localhost:3000/auth/google/callback';

    static getAuthUrl(): string {
        const params = new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID || '',
            redirect_uri: this.REDIRECT_URI,
            response_type: 'code',
            scope: 'profile email',
            access_type: 'offline',
            prompt: 'consent'
        });
        return `${this.AUTH_URL}?${params.toString()}`;
    }

    static async exchangeCodeForToken(code: string): Promise<any> {
        try {
            const response = await axios.post(this.TOKEN_URL, {
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: this.REDIRECT_URI,
                grant_type: 'authorization_code'
            });
            return response.data;
        } catch (error: any) {
            console.error('Token exchange error:', error.response?.data || error.message);
            throw new Error('Failed to exchange code for token');
        }
    }

    static async getUserInfo(accessToken: string): Promise<any> {
        try {
            const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            return response.data;
        } catch (error) {
            console.error('Get user info error:', error);
            throw error;
        }
    }
}
