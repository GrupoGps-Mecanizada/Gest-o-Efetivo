'use strict';

/**
 * SGE — Push Notifications
 *
 * Mostra notificações nativas do browser quando:
 *   - Um colaborador é movimentado (Supabase Realtime INSERT em gps_movimentacoes)
 *   - A aba está em segundo plano (document.hidden)
 *
 * Permissão é solicitada automaticamente após o login, de forma não invasiva
 * (solicita apenas se o browser já não bloqueou).
 */
(function () {
    'use strict';

    const SGE_NOTIF = window.SGE_NOTIF = {};
    let _enabled = false;

    // ── Solicita permissão de forma suave ──────────────────
    SGE_NOTIF.requestPermission = async function () {
        if (!('Notification' in window)) return false;
        if (Notification.permission === 'granted') { _enabled = true; return true; }
        if (Notification.permission === 'denied') return false;

        // 'default' — ask the user (only on user gesture or after app loads)
        const permission = await Notification.requestPermission();
        _enabled = permission === 'granted';
        return _enabled;
    };

    // ── Mostra uma notificação ─────────────────────────────
    SGE_NOTIF.notify = function (title, body, options = {}) {
        if (!_enabled || Notification.permission !== 'granted') return;
        // Only notify when the tab is hidden (user is elsewhere)
        if (!document.hidden && !options.force) return;

        try {
            const n = new Notification(title, {
                body,
                icon: 'favicon.svg',
                badge: 'favicon.svg',
                tag: options.tag || 'sge-notif',
                renotify: true,
                ...options
            });
            n.onclick = () => { window.focus(); n.close(); };
        } catch (e) {
            console.warn('[SGE Notif]', e);
        }
    };

    // ── Notifica movimentações via Supabase Realtime ───────
    SGE_NOTIF.setupMovimentacaoListener = function () {
        if (!window.supabase || typeof window.supabase.channel !== 'function') {
            setTimeout(SGE_NOTIF.setupMovimentacaoListener, 3000);
            return;
        }

        window.supabase
            .channel('sge-notif-mov')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'gps_compartilhado',
                table: 'gps_movimentacoes'
            }, (payload) => {
                const mov = payload.new;
                if (!mov) return;

                // Don't notify the user who just made the move (optimistic update already visible)
                const myEmail = window.SGE?.auth?.currentUser?.email;
                if (myEmail && mov.usuario_email === myEmail) return;

                const nome = mov.colaborador_nome || 'Colaborador';
                const dest = mov.supervisor_destino || '—';
                const user = mov.usuario || 'Alguém';
                SGE_NOTIF.notify(
                    `Movimentação — ${nome}`,
                    `${user} moveu ${nome} para ${dest}`,
                    { tag: `mov-${mov.colaborador_id}` }
                );
            })
            .subscribe();
    };

    // ── Auto-start after app boots ─────────────────────────
    // Wait for user to be logged in before requesting permission
    function _autoStart() {
        if (window.SGE?.auth?.currentUser) {
            SGE_NOTIF.requestPermission().then(granted => {
                if (granted) {
                    SGE_NOTIF.setupMovimentacaoListener();
                    console.info('[SGE Notif] Notificações ativas.');
                }
            });
        } else {
            setTimeout(_autoStart, 2000);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(_autoStart, 4000));
    } else {
        setTimeout(_autoStart, 4000);
    }
})();
