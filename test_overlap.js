const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Create mock data so SGE renders correctly
    await page.addInitScript(() => {
        window.SGE = {
            CONFIG: {
                equipTipos: {
                    'AP': { nome: 'Alta Pressão', cor: '#10b981' },
                    'ASP': { nome: 'Aspirador Industrial', cor: '#f59e0b' },
                    'AV': { nome: 'Auto Vácuo', cor: '#3b82f6' }
                },
                turnoMap: { '24HS-A': 'A', '24HS-B': 'B' }
            },
            state: {
                equip: { filtroTipo: 'TODOS', filtroTurno: 'TODOS' },
                equipamentos: [
                    { sigla: 'AP', numero: '01' }
                ],
                colaboradores: [
                    { id: '1', nome: 'JOAO S', equipamento: 'AP-01', funcao: 'OP', regime: '24HS-A' },
                    { id: '2', nome: 'MARIA', equipamento: 'AP-01', funcao: 'MOT', regime: '24HS-B' }
                ]
            }
        };
    });

    const uri = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');
    await page.goto(uri);

    await page.evaluate(() => {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('loading-screen').classList.add('hide');
        const ev = document.getElementById('equip-view');
        ev.classList.add('active');

        // Add grid items manually
        ev.innerHTML = `
      <div class="equip-grid">
         <div class="equip-card">
           <div class="equip-card-header">Header 1</div>
           <div class="equip-card-body">
              <div class="equip-turno-row">
                 <div class="equip-turno-label">A</div>
                 <div class="equip-turno-members">
                   <div class="equip-member">Member 1</div>
                   <div class="equip-member">Member 2</div>
                 </div>
              </div>
           </div>
         </div>
         <div class="equip-card">
           <div class="equip-card-header">Header 2</div>
         </div>
      </div>
    `;
    });

    await page.waitForTimeout(500);

    const rects = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.equip-card'));
        return cards.map(c => {
            const r = c.getBoundingClientRect();
            return { width: r.width, height: r.height, top: r.top, left: r.left };
        });
    });

    console.log("Card rects:", rects);

    await browser.close();
})();
