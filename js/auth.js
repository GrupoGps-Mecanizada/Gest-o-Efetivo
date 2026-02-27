'use strict';

/**
 * SGE — Authentication Module (Supabase Auth)
 * Handles login, session management, and role-based permissions
 */
window.SGE = window.SGE || {};

SGE.auth = {
    currentUser: null,

    /**
     * Initialize Auth - Check for existing session
     */
    async init() {
        if (!window.supabase) return false;

        const { data: { session } } = await supabase.auth.getSession();

        // Listen for auth changes (login/logout)
        supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                this.updateCurrentUser(session.user);
            } else {
                this.currentUser = null;
            }
        });

        if (session) {
            this.updateCurrentUser(session.user);
            return true;
        }
        return false;
    },

    /**
     * Update internal state based on Supabase user
     */
    updateCurrentUser(user) {
        const email = user.email || '';
        let perfil = user.user_metadata.perfil || 'VISAO';

        // Mapeamento automático por domínio do e-mail (prioridade sobre metadata)
        if (email.endsWith('@sge') || email.endsWith('@sge.com')) {
            perfil = 'ADM';
        } else if (email.endsWith('@gestaomecanizada.com')) {
            perfil = 'GESTAO';
        } else if (email.endsWith('@mecanizada.com')) {
            perfil = 'VISAO';
        }

        this.currentUser = {
            id: user.id,
            usuario: email.split('@')[0],
            email: email,
            nome: user.user_metadata.full_name || email.split('@')[0],
            perfil: perfil
        };

        this.applyRoleUI(this.currentUser.perfil);
    },

    /**
     * Perform login using Supabase Bio
     */
    async login(email, password) {
        if (!window.supabase) return { success: false, error: 'Supabase não configurado' };

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;

            this.updateCurrentUser(data.user);
            return { success: true, user: this.currentUser };
        } catch (e) {
            return { success: false, error: e.message || 'Erro ao fazer login' };
        }
    },

    /**
     * Perform Registration natively through Supabase Auth
     */
    async register(email, password, name) {
        if (!window.supabase) return { success: false, error: 'Supabase não configurado' };

        try {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        perfil: 'VISAO', // Default permission
                        full_name: name
                    }
                }
            });

            if (error) throw error;

            return { success: true };
        } catch (e) {
            return { success: false, error: e.message || 'Erro ao criar conta' };
        }
    },

    /**
     * Logout and reload page
     */
    async logout() {
        if (window.supabase) await supabase.auth.signOut();
        SGE.api.clearCache();
        window.location.reload();
    },

    /**
     * Check if current user has a specific role or higher
     * Hierarchy: ADM > GESTAO > VISAO
     */
    hasRole(requiredRole) {
        if (!this.currentUser) return false;

        const role = this.currentUser.perfil;
        if (role === 'ADM') return true;
        if (requiredRole === 'GESTAO' && role === 'GESTAO') return true;
        if (requiredRole === 'VISAO') return true;

        return false;
    },

    /**
     * Apply CSS classes and UI logic based on role
     */
    applyRoleUI(role) {
        document.body.classList.remove('role-adm', 'role-gestao', 'role-visao');
        document.body.classList.add(`role-${role.toLowerCase()}`);

        const topbarUser = document.getElementById('topbar-user');
        if (topbarUser && this.currentUser) {
            topbarUser.innerHTML = `
                <div style="display:flex; align-items:center; gap:4px; margin-right:12px; font-size:13px;">
                    <span style="color:var(--text-3);">Bem-vindo(a),</span>
                    <strong style="color:var(--text-1); font-weight:700;">${this.currentUser.usuario}</strong>
                </div>
                <button title="Sair do sistema" id="logout-btn" style="display:flex; align-items:center; gap:4px; font-weight:600; font-size:13px; background:none; border:none; color:var(--text-3); cursor:pointer; padding:4px 8px; border-radius:4px; transition: background 0.2s">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                    Sair
                </button>
            `;
            document.getElementById('logout-btn').onclick = () => this.logout();
        }
    }
};
