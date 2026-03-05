/**
 * SGE SESSION PING — Mantém sessões ativas no Radar Central
 * 
 * Inclua este script em qualquer sistema satélite do ecossistema SGE.
 * Ele lê os dados de sessão gravados no localStorage pelo sso_login.html
 * e envia pings periódicos (a cada 30s) para manter o status "Online"
 * no Radar de Sessões do Painel Central.
 * 
 * Uso: <script src="https://SEU_DOMINIO/SGE-CENTRAL/js/sge-session-ping.js"></script>
 *       (incluir APÓS o supabase-js CDN)
 */
(function () {
    const SUPABASE_URL = "https://mgcjidryrjqiceielmzp.supabase.co";
    const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nY2ppZHJ5cmpxaWNlaWVsbXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMjEwNzEsImV4cCI6MjA4NzY5NzA3MX0.UAKkzy5fMIkrlmnqz9E9KknUw9xhoYpa3f1ptRpOuAA";
    const PING_INTERVAL_MS = 30000; // 30 seconds

    let _pingInterval = null;

    function getSessionData() {
        try {
            const sessionId = localStorage.getItem('sge_session_id');
            const userId = localStorage.getItem('sge_session_user_id');
            const token = localStorage.getItem('sge_session_token');
            if (!sessionId || !userId || !token) return null;
            return { sessionId, userId, token };
        } catch (e) {
            return null;
        }
    }

    async function pingSession() {
        const data = getSessionData();
        if (!data) return;

        let token = data.token;
        // Se houver uma sessão Supabase local ativa, pega o access_token fresco
        // para evitar erro 401 JWT expired.
        try {
            if (window.supabase) {
                const { data: authData } = await window.supabase.auth.getSession();
                if (authData?.session?.access_token) {
                    token = authData.session.access_token;
                    localStorage.setItem('sge_session_token', token);
                }
            }
        } catch (e) { }

        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/sge_central_sessoes?id=eq.${data.sessionId}&usuario_id=eq.${data.userId}`, {
                method: 'PATCH',
                headers: {
                    'apikey': ANON_KEY,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Content-Profile': 'gps_compartilhado',
                    'Accept-Profile': 'gps_compartilhado',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ ultimo_ping_em: new Date().toISOString() })
            });

            if (!response.ok) {
                const errText = await response.text().catch(() => '');
                console.warn('[SGE Ping] Erro no ping:', response.status, errText);
            }
        } catch (err) {
            console.warn('[SGE Ping] Falha no ping:', err.message);
        }
    }

    function start() {
        if (_pingInterval) return;
        const data = getSessionData();
        if (!data) {
            console.log('[SGE Ping] Nenhuma sessão SGE encontrada no localStorage.');
            return;
        }

        console.log(`[SGE Ping] Iniciando ping a cada ${PING_INTERVAL_MS / 1000}s para sessão ${data.sessionId}`);
        pingSession(); // First ping immediately
        _pingInterval = setInterval(pingSession, PING_INTERVAL_MS);
    }

    function stop() {
        if (_pingInterval) {
            clearInterval(_pingInterval);
            _pingInterval = null;
        }
    }

    // Auto-start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }

    // Clean up on page unload
    window.addEventListener('beforeunload', stop);

    // Export for manual control
    window.SGE_SESSION_PING = { start, stop, ping: pingSession };
})();
