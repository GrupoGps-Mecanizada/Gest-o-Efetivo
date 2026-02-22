'use strict';

/**
 * SGE — Authentication Module (RBAC)
 * Handles login, session management, and role-based permissions
 */
window.SGE = window.SGE || {};

SGE.auth = {
    // Current logged in user
    currentUser: null,

    /**
     * Initialize Auth - Check if user is logged in
     */
    init() {
        const stored = localStorage.getItem('SGE_USER');
        if (stored) {
            try {
                const user = JSON.parse(stored);
                if (user && user.token) {
                    SGE.auth.currentUser = user;
                    SGE.auth.applyRoleUI(user.perfil);
                    return true;
                }
            } catch (e) {
                console.warn('Failed to parse stored user:', e);
            }
        }
        return false;
    },

    /**
     * Perform login using GAS API
     */
    async login(usuario, senha) {
        try {
            const data = await SGE.api.callGAS('login', { usuario, senha });
            if (data && data.token) {
                SGE.auth.currentUser = data;
                localStorage.setItem('SGE_USER', JSON.stringify(data));
                SGE.auth.applyRoleUI(data.perfil);

                // Update config globally so all writes are attributed to this user
                SGE.CONFIG.usuario = data.usuario;

                return { success: true, user: data };
            }
            return { success: false, error: 'Resposta inválida do servidor' };
        } catch (e) {
            return { success: false, error: e.message || 'Erro ao fazer login' };
        }
    },

    /**
     * Logout and reload page
     */
    logout() {
        localStorage.removeItem('SGE_USER');
        SGE.api.clearCache(); // Also clear offline cache for safety
        window.location.reload();
    },

    /**
     * Check if current user has a specific role or higher
     * Hierarchy: ADM > GESTAO > VISAO
     */
    hasRole(requiredRole) {
        if (!SGE.auth.currentUser) return false;

        const role = SGE.auth.currentUser.perfil;
        if (role === 'ADM') return true; // ADM has all roles
        if (requiredRole === 'GESTAO' && role === 'GESTAO') return true;
        if (requiredRole === 'VISAO') return true; // Everyone has VISAO

        return false;
    },

    /**
     * Apply CSS classes and UI logic based on role
     */
    applyRoleUI(role) {
        // Tag the body so CSS can hide/show elements automatically
        document.body.classList.remove('role-adm', 'role-gestao', 'role-visao');
        document.body.classList.add(`role-${role.toLowerCase()}`);

        const topbarUser = document.getElementById('topbar-user');
        if (topbarUser) {
            topbarUser.innerHTML = `
                <span class="user-badge">${role}</span>
                <span class="user-name" style="font-weight:600; font-size:14px; margin-right:8px;">${SGE.auth.currentUser.usuario}</span>
                <button title="Sair do sistema" onclick="SGE.auth.logout()" style="display:flex; align-items:center; gap:4px; font-weight:600; font-size:13px; background:none; border:none; color:var(--text-3); cursor:pointer; padding:4px 8px; border-radius:4px; transition: background 0.2s">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                    Sair
                </button>
            `;
        }
    }
};
