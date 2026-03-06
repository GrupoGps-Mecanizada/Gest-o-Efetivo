'use strict';

/**
 * SGE — Authentication Module (Via Central SGE SSO com fallback local)
 * Handles token recovery, session management, and role-based permissions
 * 
 * ENQUANTO A CENTRAL SGE NÃO ESTIVER COM sso_login.html DEPLOYADO, 
 * usamos SGE_SSO_BYPASS = true para permitir login local via Supabase Auth.
 */
window.SGE = window.SGE || {};

// ========== SSO MODE ==========
// SSO está ativo — a Central SGE agora tem login integrado no index.html
// Se precisar voltar ao login local (fallback), descomente a linha abaixo:
// window.SGE_SSO_BYPASS = true;

// Instancia o SDK passando o slug do sistema
const ssoClient = new window.SgeAuthSDK('gestao_efetivo_mec');

SGE.auth = {
    currentUser: null,

    /**
     * Initialize Auth — tenta SSO, senão fallback para Supabase local
     */
    async init() {
        // Tenta autenticação via SSO Token
        const userData = await ssoClient.checkAuth();

        if (userData) {
            // Autenticado via SSO Token
            console.log('[SGE AUTH] Autenticado via SSO:', userData.nome);
            this.updateCurrentUser(userData);

            // Recuperar o access_token da sessão Supabase (necessário para RLS)
            let token = null;
            try {
                if (window.supabase) {
                    const { data: { session } } = await window.supabase.auth.getSession();
                    token = session?.access_token || null;
                }
            } catch (e) {
                console.warn('[SGE AUTH] Não foi possível recuperar token da sessão Supabase:', e);
            }

            await this.registerSession(userData.id, token);
            return true;
        }

        if (ssoClient.isBypass()) {
            // BYPASS: tenta autenticação via sessão Supabase local
            console.log('[SGE AUTH] BYPASS ativo — verificando sessão Supabase local...');
            try {
                if (window.supabase) {
                    const { data: { session } } = await window.supabase.auth.getSession();
                    if (session && session.user) {
                        console.log('[SGE AUTH] Sessão Supabase local encontrada:', session.user.email);
                        this.updateCurrentUser({
                            id: session.user.id,
                            email: session.user.email,
                            nome: session.user.user_metadata?.nome || session.user.email.split('@')[0],
                            perfil: session.user.user_metadata?.perfil || 'GESTAO'
                        });
                        await this.registerSession(session.user.id, session.access_token);
                        return true;
                    }
                }
            } catch (e) {
                console.warn('[SGE AUTH] Erro ao verificar sessão Supabase:', e);
            }

            // Sem sessão — mostra tela de login local
            console.log('[SGE AUTH] Sem sessão — exibindo login local');
            return false;
        }

        // SSO ativo mas sem token — ssoClient já redirecionou
        return false;
    },

    /**
     * Register session in sge_central_sessoes for the Radar
     * IMPORTANTE: accessToken DEVE ser o JWT autenticado do usuário (não a anon key)
     * para que as políticas RLS permitam o INSERT.
     */
    async registerSession(userId, accessToken) {
        try {
            // Check if session already registered (avoid duplicates on page refresh)
            const existingId = localStorage.getItem('sge_session_id');
            if (existingId) {
                console.log('[SGE AUTH] Sessão já registrada:', existingId);
                return;
            }

            if (!accessToken) {
                try {
                    if (window.supabase) {
                        const { data: { session } } = await window.supabase.auth.getSession();
                        accessToken = session?.access_token || null;
                    }
                } catch (e) { /* ignore */ }
            }

            if (!accessToken) {
                console.warn('[SGE AUTH] Sem token autenticado — sessão não será registrada (RLS bloqueia anon)');
                return;
            }

            const SUPABASE_URL = SGE.SUPABASE_URL || 'https://mgcjidryrjqiceielmzp.supabase.co';
            const ANON_KEY = SGE.SUPABASE_KEY;

            const headers = {
                'apikey': ANON_KEY,
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Content-Profile': 'gps_compartilhado',
                'Accept-Profile': 'gps_compartilhado',
                'Prefer': 'return=representation'
            };

            // Get sistema_id for this app slug
            const sysResp = await fetch(
                `${SUPABASE_URL}/rest/v1/sge_central_sistemas?slug=eq.gestao_efetivo_mec&select=id`,
                { headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${accessToken}`, 'Accept-Profile': 'gps_compartilhado', 'Accept': 'application/vnd.pgrst.object+json' } }
            );

            if (!sysResp.ok) {
                console.warn('[SGE AUTH] Não conseguiu buscar sistema para sessão');
                return;
            }

            const sysData = await sysResp.json();
            if (!sysData?.id) return;

            // Insert session
            const sessResp = await fetch(`${SUPABASE_URL}/rest/v1/sge_central_sessoes`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    usuario_id: userId,
                    sistema_id: sysData.id,
                    ip_address: '0.0.0.0',
                    user_agent: navigator.userAgent.substring(0, 200),
                    expira_em: new Date(Date.now() + (1000 * 60 * 60 * 8)).toISOString()
                })
            });

            if (sessResp.ok) {
                const sessData = await sessResp.json();
                const sessionId = Array.isArray(sessData) ? sessData[0]?.id : sessData?.id;
                if (sessionId) {
                    localStorage.setItem('sge_session_id', sessionId);
                    localStorage.setItem('sge_session_user_id', userId);
                    localStorage.setItem('sge_session_token', accessToken);
                    // Chaves necessárias para o sge-session-ping.js identificar o satélite
                    localStorage.setItem('sge_session_user_name', this.currentUser?.nome || 'Usuário SGE');
                    localStorage.setItem('sge_session_user_email', this.currentUser?.email || '');
                    localStorage.setItem('sge_session_app_slug', 'gestao_efetivo_mec');
                    localStorage.setItem('sge_session_app_name', 'Gestão de Efetivo');
                    console.log('[SGE AUTH] ✓ Sessão registrada para Radar:', sessionId);
                    // Inicia presença no canal (resolve race condition com DOMContentLoaded)
                    if (window.SGE_SESSION_PING) window.SGE_SESSION_PING.start();
                }
            } else {
                const errText = await sessResp.text().catch(() => '');
                console.warn('[SGE AUTH] Falha ao registrar sessão:', sessResp.status, errText);
            }
        } catch (err) {
            console.warn('[SGE AUTH] Erro ao registrar sessão:', err);
        }
    },

    /**
     * Update internal state based on user data (JWT payload ou Supabase session)
     */
    updateCurrentUser(user) {
        this.currentUser = {
            id: user.id || null,
            usuario: user.email ? user.email.split('@')[0] : 'Desconhecido',
            email: user.email || '',
            nome: user.nome || 'Usuário SGE',
            perfil: user.perfil || 'VISAO'
        };

        console.log('[SGE AUTH] Perfil aplicado:', this.currentUser.perfil);
        this.applyRoleUI(this.currentUser.perfil);
    },

    /**
     * Login local via Supabase Auth (usado em BYPASS mode)
     */
    async login(email, password) {
        console.log('[SGE AUTH] Tentando login local via Supabase...');
        if (!window.supabase) throw new Error('Supabase client não inicializado');
        const { data, error } = await window.supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        this.updateCurrentUser({
            id: data.user.id,
            email: data.user.email,
            nome: data.user.user_metadata?.nome || data.user.email.split('@')[0],
            perfil: data.user.user_metadata?.perfil || 'GESTAO'
        });

        await this.registerSession(data.user.id, data.session?.access_token);

        return data;
    },

    /**
     * Register local via Supabase Auth (usado em BYPASS mode)
     */
    async register(email, password, nome) {
        console.log('[SGE AUTH] Registrando via Supabase...');
        if (!window.supabase) throw new Error('Supabase client não inicializado');
        const { data, error } = await window.supabase.auth.signUp({
            email,
            password,
            options: { data: { nome } }
        });
        if (error) throw error;
        return data;
    },

    /**
     * Logout
     */
    async logout() {
        console.log('[SGE AUTH] Logout');
        try { SGE.api.clearCache(); } catch (e) { }

        // Clean up session data
        try {
            localStorage.removeItem('sge_session_id');
            localStorage.removeItem('sge_session_user_id');
            localStorage.removeItem('sge_session_token');
            localStorage.removeItem('sge_session_user_name');
            localStorage.removeItem('sge_session_user_email');
            localStorage.removeItem('sge_session_app_slug');
            localStorage.removeItem('sge_session_app_name');
        } catch (e) { }

        // Stop ping
        if (window.SGE_SESSION_PING) window.SGE_SESSION_PING.stop();

        if (ssoClient.isBypass()) {
            if (window.supabase) await window.supabase.auth.signOut();
            window.location.reload();
            return;
        }

        ssoClient.logout();
    },

    /**
     * Check role hierarchy: SUPER > ADM > GESTAO > VISAO
     */
    hasRole(requiredRole) {
        if (!this.currentUser) return false;
        const role = this.currentUser.perfil;
        if (role === 'SUPER') return true;
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
