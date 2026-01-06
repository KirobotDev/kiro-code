document.addEventListener('DOMContentLoaded', () => {
    loadPage('intro');
});

function loadPage(pageId) {
    const contentArea = document.getElementById('contentArea');
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => item.classList.remove('active'));
    const activeNav = Array.from(navItems).find(i => i.getAttribute('onclick').includes(pageId));
    if (activeNav) activeNav.classList.add('active');

    const pages = {
        'intro': `
            <h1 class="page-title fade-in">Documentation Kiro Code</h1>
            <p class="page-description fade-in">Une solution d'IA Agentique intégrée pour le développement local.</p>
            
            <div class="card fade-in" style="animation-delay: 0.1s">
                <h3>🚀 Qu'est-ce que Kiro Code ?</h3>
                <p>Kiro Code est un assistant de codage alimenté par l'IA qui vit directement sur votre bureau. Contrairement à ChatGPT, il possède un véritable contexte de vos fichiers locaux et peut modifier votre code en temps réel.</p>
            </div>

            <div class="card fade-in" style="animation-delay: 0.2s">
                <h3>✨ Fonctionnalités Clés</h3>
                <ul>
                    <li><strong>Mode Agent :</strong> L'IA prend le contrôle et écrit du code pour vous.</li>
                    <li><strong>Mode Ask :</strong> Posez des questions sans risque de modification.</li>
                    <li><strong>Google Auth :</strong> Synchronisation de l'historique sécurisée.</li>
                    <li><strong>Local File System :</strong> Lecture et écriture directes.</li>
                </ul>
            </div>
        `,
        'authentication': `
            <h1 class="page-title fade-in">Authentification</h1>
            <p class="page-description fade-in">Sécurisé par Google OAuth2.</p>
            <div class="card fade-in">
                <h3>Configuration</h3>
                <p>Le système utilise le port local 3000 pour les callbacks OAuth.</p>
                <div class="code-block">
                    <div class="code-header">AuthService.ts</div>
                    <code>ipcRenderer.send('auth:start-google');</code>
                </div>
            </div>
        `,
        'modes': `
            <h1 class="page-title fade-in">Modes Agent & Ask</h1>
            <p class="page-description fade-in">Deux façons d'interagir avec votre assistant.</p>
            
            <div class="card fade-in">
                <h3 style="color: var(--accent);">🤖 Mode Agent</h3>
                <p>En mode Agent, l'IA a accès à des outils puissants :</p>
                <div class="code-block">
                    <code>&lt;tool name="writeFile"&gt;...&lt;/tool&gt;</code>
                    <br>
                    <code>&lt;tool name="createDirectory"&gt;...&lt;/tool&gt;</code>
                </div>
            </div>

            <div class="card fade-in" style="animation-delay: 0.1s">
                <h3>💬 Mode Ask</h3>
                <p>Le mode Ask est sécurisé. L'IA peut lire votre code pour vous expliquer des concepts, mais ne peut effectuer aucune modification.</p>
            </div>
        `,
        'install': `
             <h1 class="page-title fade-in">Installation</h1>
             <div class="card fade-in">
                <h3>Prérequis</h3>
                <p>Node.js 18+</p>
                <div class="code-block">
                    <div class="code-header">Terminal</div>
                    <code>npm install</code><br>
                    <code>npm start</code>
                </div>
             </div>
        `
    };

    const content = pages[pageId] || pages['intro'];
    contentArea.innerHTML = content;
}

const searchInput = document.querySelector('.search-input');
searchInput.addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase();
});
