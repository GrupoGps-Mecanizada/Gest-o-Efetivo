'use strict';

/**
 * SGE — Dev Mode Toggle
 * Adds a floating button to enable/disable SSO bypass for local development.
 * Only visible when running on file:// or localhost.
 */
(function () {
    const isLocal = location.protocol === 'file:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (!isLocal) return;

    const STORAGE_KEY = 'sge_dev_bypass';
    const SLUG_KEY = 'sge_dev_bypass_gestao_efetivo_mec';
    const isActive = localStorage.getItem(STORAGE_KEY) === '1' || localStorage.getItem(SLUG_KEY) === '1';

    const btn = document.createElement('div');
    btn.id = 'sge-dev-toggle';
    btn.title = isActive ? 'Dev Mode ativo — clique para desativar' : 'Dev Mode inativo — clique para ativar login local';
    btn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
        </svg>
        <span>${isActive ? 'DEV ON' : 'DEV OFF'}</span>
    `;

    Object.assign(btn.style, {
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        zIndex: '99999',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: '700',
        fontFamily: 'Inter, sans-serif',
        letterSpacing: '0.06em',
        cursor: 'pointer',
        border: '1.5px solid',
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
        transition: 'all 0.2s',
        userSelect: 'none',
        background: isActive ? '#0f3868' : '#f1f5f9',
        color: isActive ? '#ffffff' : '#64748b',
        borderColor: isActive ? '#0a2fa8' : '#cbd5e1',
    });

    btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'translateY(-2px)';
        btn.style.boxShadow = '0 4px 14px rgba(0,0,0,0.22)';
    });
    btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
        btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.18)';
    });

    btn.addEventListener('click', () => {
        if (isActive) {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(SLUG_KEY);
            // Also clear any stored SSO tokens so fresh auth starts
            const appSlug = 'gestao_efetivo_mec';
            localStorage.removeItem(`sge_token_${appSlug}`);
            localStorage.removeItem(`sge_ver_${appSlug}`);
            localStorage.removeItem('sge_session_id');
        } else {
            localStorage.setItem(STORAGE_KEY, '1');
            localStorage.setItem(SLUG_KEY, '1');
        }
        location.reload();
    });

    document.body.appendChild(btn);
})();
