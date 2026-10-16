'use strict';

/**
 * SGE — Login (via SGE.acesso do sge-core)
 * Usa a sessão real do login da Central (Supabase Auth). Sem sessão, vai para o login da Central.
 * Na dúvida (erro, rede), não entra. O nível vem da régua única e é traduzido para os nomes antigos
 * (SUPER/ADM/GESTAO/VISAO) que o resto do sistema usa.
 */
window.SGE = window.SGE || {};

const SLUG_SISTEMA = 'gestao_efetivo_mec';

// Régua única → nomes antigos (ver "Régua única de acesso - especificação" no cofre).
const PERFIL_POR_PAPEL = { ADMIN: 'ADM', GESTOR: 'GESTAO' };

SGE.auth = {
    currentUser: null,

    async init() {
        if (!SGE.acesso || !SGE.acesso.entrar) {
            // Sem o sge-core (falha ao baixar) não dá para conferir o login: não entra.
            const status = document.getElementById('loading-status');
            if (status) status.textContent = 'Não consegui carregar o login. Confira a internet e recarregue a página.';
            await new Promise(() => {});
        }

        // Só continua se a pessoa estiver logada e tiver acesso a este sistema.
        const r = await SGE.acesso.entrar(SLUG_SISTEMA);
        // Só quem está na lista de editores mexe no efetivo (o banco também barra os outros).
        // Quem não é editor fica só consultando, mesmo sendo Gestor ou Administrador.
        this.editor = SGE.movimentar ? await SGE.movimentar.souEditor() : false;
        this.updateCurrentUser({
            id: r.usuario.id,
            email: r.usuario.email,
            nome: r.usuario.nome,
            perfil: this.editor ? (PERFIL_POR_PAPEL[r.papel] || 'GESTAO') : 'VISAO'
        });
        if (this.editor) SGE.movimentar.montarBotao(); // botão fixo no topo, só para editores
        return true;
    },

    updateCurrentUser(user) {
        this.currentUser = {
            id: user.id || null,
            usuario: user.email ? user.email.split('@')[0] : 'Desconhecido',
            email: user.email || '',
            nome: user.nome || 'Usuário SGE',
            perfil: user.perfil || 'VISAO'
        };
        this.applyRoleUI(this.currentUser.perfil);
    },

    // O login agora é só pela Central.
    async login() { throw new Error('Entre pela Central do SGE.'); },
    async register() { throw new Error('O cadastro é feito pela Central do SGE.'); },

    async logout() {
        try { SGE.api.clearCache(); } catch (e) { }
        SGE.acesso.sair(SLUG_SISTEMA);
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
            const esc = (str) => String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            menuUser.innerHTML = `
                <span style="color:var(--text-3);">Bem-vindo(a),</span>
                <strong style="color:var(--text-1); font-weight:700;">${esc(this.currentUser.nome)}</strong>
                <button title="Sair do sistema" id="logout-btn" style="margin-left:auto; display:flex; align-items:center; gap:4px; font-weight:600; font-size:12px; background:none; border:none; color:var(--danger); cursor:pointer; padding:4px 8px; border-radius:4px; transition: background 0.2s">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                    Sair
                </button>
            `;
            document.getElementById('logout-btn').onclick = () => this.logout();
        }
    }
};
