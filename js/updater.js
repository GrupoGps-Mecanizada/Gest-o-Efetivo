'use strict';

/**
 * SGE — Auto-Update Module
 *
 * Detecta novas versões e força atualização em TODOS os navegadores e abas abertas.
 *
 * Três estratégias combinadas (mais rápida → mais lenta):
 *
 *   1. Supabase Realtime — instantâneo para todos os usuários online
 *      → Quando você atualizar a chave "app_version" na tabela
 *        gps_compartilhado.gps_configuracoes_sistema, todos os clientes
 *        conectados recebem o evento e são notificados imediatamente.
 *
 *   2. Polling do version.json — fallback a cada 5 minutos
 *      → Funciona mesmo sem Realtime. Basta incrementar a versão
 *        no arquivo version.json e fazer o deploy.
 *
 *   3. BroadcastChannel — propaga para todas as abas do mesmo browser
 *      → Se uma aba detecta a atualização, as demais abas abertas
 *        do mesmo usuário são notificadas automaticamente.
 *
 * ─────────────────────────────────────────────────────────────
 * COMO FAZER UM DEPLOY QUE ATUALIZA TODOS OS USUÁRIOS:
 *
 *   Opção A (mais rápida — Supabase, instantâneo):
 *     No Supabase, tabela gps_compartilhado.gps_configuracoes_sistema:
 *     UPDATE gps_configuracoes_sistema
 *       SET valor = '1.0.2', updated_at = now()
 *     WHERE chave = 'app_version';
 *
 *   Opção B (version.json — em até 5 minutos):
 *     1. Edite version.json: mude "version" para um novo valor (ex: "1.0.2")
 *     2. Faça o deploy dos arquivos atualizados
 *     → Todos os usuários serão notificados no próximo ciclo de polling
 *
 *   As duas opções podem ser usadas juntas para cobertura máxima.
 * ─────────────────────────────────────────────────────────────
 */
(function () {
    const POLL_INTERVAL  = 5 * 60 * 1000; // Polling a cada 5 minutos
    const RELOAD_DELAY   = 30 * 1000;     // Countdown de 30s antes do reload forçado
    const VERSION_FILE   = 'version.json';
    const SUPABASE_TABLE = 'gps_configuracoes_sistema';
    const SUPABASE_SCHEMA = 'gps_compartilhado';
    const VERSION_KEY    = 'app_version';

    let _currentVersion = null;
    let _pollTimer      = null;
    let _reloadTimer    = null;
    let _updateShown    = false;
    let _rtChannel      = null;

    // ── BroadcastChannel — propaga update entre abas ─────────
    const _bc = ('BroadcastChannel' in window) ? new BroadcastChannel('sge_auto_update') : null;
    if (_bc) {
        _bc.onmessage = (e) => {
            if (e.data?.type === 'SGE_UPDATE' && !_updateShown) {
                _handleUpdate(e.data.version, 'broadcast');
            }
        };
    }

    // ── Busca version.json sem cache ─────────────────────────
    async function _fetchVersionFile() {
        try {
            const res = await fetch(`${VERSION_FILE}?_=${Date.now()}`, {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache, no-store' }
            });
            if (!res.ok) return null;
            const data = await res.json();
            return data.version ? String(data.version) : null;
        } catch {
            return null;
        }
    }

    // ── Inicialização ─────────────────────────────────────────
    async function init() {
        _currentVersion = await _fetchVersionFile();
        if (_currentVersion) {
            console.info(`[SGE Updater] v${_currentVersion} — monitorando atualizações...`);
        }

        // Polling periódico do version.json
        _pollTimer = setInterval(_checkVersionFile, POLL_INTERVAL);

        // Listener Supabase Realtime (estratégia instantânea)
        _setupRealtimeListener();
    }

    // ── Polling do version.json ───────────────────────────────
    async function _checkVersionFile() {
        if (_updateShown) return;
        const latest = await _fetchVersionFile();
        if (latest && _currentVersion && latest !== _currentVersion) {
            _handleUpdate(latest, 'version.json');
        }
    }

    // ── Supabase Realtime listener ────────────────────────────
    function _setupRealtimeListener() {
        // Aguarda o supabase client estar pronto (inicializado por supabase-config.js)
        if (!window.supabase || typeof window.supabase.channel !== 'function') {
            // Retry em 3s caso o client ainda não esteja pronto
            setTimeout(_setupRealtimeListener, 3000);
            return;
        }

        try {
            _rtChannel = window.supabase
                .channel('sge-app-version-watch')
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: SUPABASE_SCHEMA,
                    table: SUPABASE_TABLE,
                    filter: `chave=eq.${VERSION_KEY}`
                }, (payload) => {
                    const newVersion = payload.new?.valor;
                    if (newVersion && String(newVersion) !== _currentVersion) {
                        _handleUpdate(String(newVersion), 'Supabase Realtime');
                    }
                })
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        console.info('[SGE Updater] Realtime update-watch ativo.');
                    }
                });
        } catch (e) {
            console.warn('[SGE Updater] Não foi possível ativar Realtime listener:', e);
        }
    }

    // ── Trata detecção de nova versão ─────────────────────────
    function _handleUpdate(newVersion, source) {
        if (_updateShown) return;
        _updateShown = true;

        // Para o polling — não precisamos mais checar
        if (_pollTimer) clearInterval(_pollTimer);

        console.info(`[SGE Updater] Nova versão detectada: ${newVersion} (via ${source})`);

        // Propaga para outras abas do mesmo browser
        if (_bc) {
            try { _bc.postMessage({ type: 'SGE_UPDATE', version: newVersion, source }); } catch {}
        }

        _showUpdateBanner(newVersion);

        // Reload forçado após RELOAD_DELAY
        _reloadTimer = setTimeout(_doReload, RELOAD_DELAY);
    }

    // ── Banner de atualização ─────────────────────────────────
    function _showUpdateBanner(version) {
        const existing = document.getElementById('sge-update-banner');
        if (existing) existing.remove();

        // Injeta estilos do banner uma única vez
        if (!document.getElementById('sge-updater-styles')) {
            const style = document.createElement('style');
            style.id = 'sge-updater-styles';
            style.textContent = `
                @keyframes sge-slide-up {
                    from { opacity: 0; transform: translateX(-50%) translateY(24px); }
                    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
                #sge-update-banner {
                    position: fixed;
                    bottom: 24px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: linear-gradient(135deg, #0f3868 0%, #1a56a0 100%);
                    color: #fff;
                    padding: 16px 20px;
                    border-radius: 14px;
                    box-shadow: 0 8px 40px rgba(15, 56, 104, 0.45), 0 2px 8px rgba(0,0,0,0.15);
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    font-size: 14px;
                    font-weight: 500;
                    font-family: 'Inter', sans-serif;
                    z-index: 999999;
                    min-width: 340px;
                    max-width: 540px;
                    animation: sge-slide-up 0.4s cubic-bezier(.34,1.56,.64,1) forwards;
                    border: 1px solid rgba(255,255,255,0.15);
                }
                #sge-update-banner .sge-update-icon { flex-shrink: 0; opacity: 0.95; }
                #sge-update-banner .sge-update-text { flex: 1; min-width: 0; }
                #sge-update-banner .sge-update-title { font-weight: 700; font-size: 14px; margin-bottom: 3px; }
                #sge-update-banner .sge-update-sub { font-size: 12px; opacity: 0.82; }
                #sge-update-banner .sge-update-countdown { font-weight: 700; }
                #sge-update-btn {
                    background: rgba(255,255,255,0.18);
                    border: 1px solid rgba(255,255,255,0.35);
                    color: #fff;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 700;
                    cursor: pointer;
                    white-space: nowrap;
                    transition: background 0.2s;
                    font-family: 'Inter', sans-serif;
                }
                #sge-update-btn:hover { background: rgba(255,255,255,0.28); }
                #sge-update-progress {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    height: 3px;
                    background: rgba(255,255,255,0.5);
                    border-radius: 0 0 14px 14px;
                    width: 100%;
                    transform-origin: left;
                    animation: sge-progress linear ${RELOAD_DELAY}ms forwards;
                }
                @keyframes sge-progress {
                    from { transform: scaleX(1); }
                    to   { transform: scaleX(0); }
                }
            `;
            document.head.appendChild(style);
        }

        let secondsLeft = Math.floor(RELOAD_DELAY / 1000);

        const banner = document.createElement('div');
        banner.id = 'sge-update-banner';
        banner.setAttribute('role', 'alert');
        banner.setAttribute('aria-live', 'assertive');
        banner.innerHTML = `
            <svg class="sge-update-icon" width="22" height="22" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
                <path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
            </svg>
            <div class="sge-update-text">
                <div class="sge-update-title">Nova versão disponível — v${_escapeText(version)}</div>
                <div class="sge-update-sub">
                    Atualizando automaticamente em
                    <span class="sge-update-countdown" id="sge-update-countdown">${secondsLeft}s</span>
                </div>
            </div>
            <button id="sge-update-btn" aria-label="Atualizar sistema agora">Atualizar agora</button>
            <div id="sge-update-progress"></div>
        `;

        document.body.appendChild(banner);

        // Countdown
        const countdownEl = document.getElementById('sge-update-countdown');
        const countdownTimer = setInterval(() => {
            secondsLeft--;
            if (countdownEl) countdownEl.textContent = `${secondsLeft}s`;
            if (secondsLeft <= 0) clearInterval(countdownTimer);
        }, 1000);

        // Botão "Atualizar agora"
        document.getElementById('sge-update-btn').addEventListener('click', () => {
            clearTimeout(_reloadTimer);
            clearInterval(countdownTimer);
            _doReload();
        });
    }

    // ── Reload limpo: apaga cache antes de recarregar ─────────
    function _doReload() {
        try {
            localStorage.removeItem('SGE_CACHE');
            sessionStorage.removeItem('SGE_SCROLL');
            sessionStorage.removeItem('SGE_FILTROS');
        } catch {}

        try {
            // Força bypass de cache do browser com timestamp na URL
            const url = new URL(window.location.href);
            url.searchParams.set('_v', Date.now());
            window.location.replace(url.toString());
        } catch {
            window.location.reload(true);
        }
    }

    // Pequeno helper para escapar texto no banner
    function _escapeText(str) {
        return String(str ?? '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // ── Bootstrap ─────────────────────────────────────────────
    // Aguarda o app terminar de carregar para não competir com o boot
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(init, 3000));
    } else {
        setTimeout(init, 3000);
    }

    // ── API pública (uso manual / debug) ──────────────────────
    window.SGE_UPDATER = {
        /** Verifica agora se há atualização disponível */
        checkNow: _checkVersionFile,
        /** Força a exibição do banner e o reload (uso em debug ou deploy manual) */
        forceUpdate: (v) => _handleUpdate(v || 'manual', 'manual'),
        /** Retorna a versão atual detectada */
        getVersion: () => _currentVersion,
    };
})();
