'use strict';

/**
 * SGE — Authentication Module (Via Central SGE SSO)
 * Handles token recovery, session management, and role-based permissions
 */
window.SGE = window.SGE || {};

// Instancia o SDK passando o slug do sistema
const ssoClient = new window.SgeAuthSDK('gestao_efetivo_mec');

SGE.auth = {
    currentUser: null,

    /**
     * Initialize Auth - Check for existing session via SSO Token
     */
    async init() {
        const userData = ssoClient.checkAuth();

        if (userData) {
            this.updateCurrentUser(userData);
            return true;
        }

        return false;
    },

    /**
     * Update internal state based on JWT Payload
     */
    updateCurrentUser(user) {
        // user object is derived directly from Central SGE Token payload
        // it should have { id, email, nome, perfil }

        this.currentUser = {
            id: user.id || null,
            usuario: user.email ? user.email.split('@')[0] : 'Desconhecido',
            email: user.email || '',
            nome: user.nome || 'Usuário SGE',
            perfil: user.perfil || 'VISAO'
        };

        this.applyRoleUI(this.currentUser.perfil);
    },

    /**
     * Login & Register are now delegated to Central SGE.
     * We just call redirectToLogin to send them to the SSO Portal.
     */
    async login() {
        ssoClient.redirectToLogin();
    },

    async register() {
        ssoClient.redirectToLogin();
    },

    /**
     * Logout and destroy token
     */
    async logout() {
        SGE.api.clearCache();
        ssoClient.logout();
    },

    /**
     * Check if current user has a specific role or higher
     * Hierarchy: ADM > GESTAO > VISAO
     */
    hasRole(requiredRole) {
        if (!this.currentUser) return false;

        const role = this.currentUser.perfil;
        if (role === 'SUPER') return true; // Adicionado perfil do Hub
        if (role === 'ADM') return true;
        if (requiredRole === 'GESTAO' && role === 'GESTAO') return true;
        if (requiredRole === 'VISAO') return true;

        return false;
    },

    /**
     * Apply CSS classes and UI logic based on role
     */
    applyRoleUI(role) {
        document.body.classList.remove('role-super', 'role-adm', 'role-gestao', 'role-visao');
        document.body.classList.add(`role-${role.toLowerCase()}`);

        const topbarUser = document.getElementById('topbar-user');
        if (topbarUser && this.currentUser) {
            topbarUser.innerHTML = '';
        }

        // Populate menu user info
        const menuUser = document.getElementById('nav-menu-user');
        if (menuUser && this.currentUser) {
            menuUser.innerHTML = `
                <span style="color:var(--text-3);">Bem-vindo(a),</span>
                <strong style="color:var(--text-1); font-weight:700;">${this.currentUser.nome}</strong>
                <button title="Sair do sistema" id="logout-btn" style="margin-left:auto; display:flex; align-items:center; gap:4px; font-weight:600; font-size:12px; background:none; border:none; color:var(--danger); cursor:pointer; padding:4px 8px; border-radius:4px; transition: background 0.2s">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                    Sair
                </button>
            `;
            document.getElementById('logout-btn').onclick = () => this.logout();
        }
    }
};
