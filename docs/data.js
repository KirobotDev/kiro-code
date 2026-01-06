const PROJECT_DATA = {
    "src/main.ts": {
        "description": "Main entry point for the Electron application.",
        "details": [
            "Manages the application lifecycle (ready, window-all-closed, activate).",
            "Initializes the main BrowserWindow with specific preferences (nodeIntegration: true).",
            "Starts a local HTTP server on port 3000 to handle Google OAuth callbacks.",
            "Handles IPC events for Google Login ('auth:start-google').",
            "Loads environment variables via ConfigLoader."
        ]
    },
    "src/ui/renderer.ts": {
        "description": "Renderer process logic handling the UI and Chat interactions.",
        "classes": {
            "ChatUI": {
                "methods": [
                    "initUI(): Sets up event listeners for buttons and inputs.",
                    "sendMessage(): Handles user input, displays messages, and calls the AI provider.",
                    "processMessageLoop(): Manages the AI response stream and executes tool calls (writeFile, createDirectory).",
                    "selectDirectory(): Opens native dialog to select a project folder.",
                    "refreshHistoryList(): Updates the sidebar with available chat sessions.",
                    "loadSession(filename): Loads a specific chat history file.",
                    "saveSession(): Persists current chat state to JSON."
                ]
            }
        }
    },
    "src/api/GroqAPI.ts": {
        "description": "Implementation of the AIProvider interface for Groq (Llama models).",
        "classes": {
            "GroqAPI": {
                "methods": [
                    "sendMessage(messages): Sends chat history to Groq API and returns the response.",
                    "getProviderName(): Returns the current model name.",
                    "isConfigured(): Checks if API Key is present."
                ]
            }
        },
        "details": [
            "Uses model 'llama-3.1-8b-instant'.",
            "Handles Rate Limiting (429) errors gracefully."
        ]
    },
    "src/services/AuthService.ts": {
        "description": "Service for handling Google OAuth2 flow.",
        "classes": {
            "AuthService": {
                "methods": [
                    "getAuthUrl(): Generates the Google Login URL.",
                    "exchangeCodeForToken(code): Swaps the auth code for an access token.",
                    "getUserInfo(token): Fetches user profile (email, name) using the token."
                ]
            }
        }
    },
    "src/utils/ConfigLoader.ts": {
        "description": "Utility to load .env configuration in both Dev and Production.",
        "classes": {
            "ConfigLoader": {
                "methods": [
                    "load(): Detects environment (Dev/Prod) and loads the correct .env file.",
                    "getGroqApiKey(): Retrieves the Groq API Key.",
                    "isConfigured(): Verifies configuration presence."
                ]
            }
        }
    },
    "src/utils/FileUtils.ts": {
        "description": "Filesystem operations helper.",
        "classes": {
            "FileUtils": {
                "methods": [
                    "readDirectory(path): Scans a directory and returns a formatted string of code contents.",
                    "saveChatHistory(): Saves session to .chat_history/user_email/.",
                    "getChatHistoryFiles(): Lists available history files for the current user.",
                    "detectLanguage(filename): Maps extensions to languages."
                ]
            }
        }
    },
    "src/models/ChatSession.ts": {
        "description": "Data model representing a chat conversation.",
        "classes": {
            "ChatSession": {
                "methods": [
                    "addMessage(msg): Adds a message to the history.",
                    "toJSON()/fromJSON(): Serialization for saving/loading."
                ]
            }
        }
    },
    "forge.config.js": {
        "description": "Configuration for Electron Forge (Build/Package system).",
        "details": [
            "Configures ASAR packaging.",
            "Includes public/icon and .env as extra resources.",
            "Sets up makers for Squirrel (Windows), Zip (Mac), and Deb (Linux)."
        ]
    }
};
