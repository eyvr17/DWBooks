// ===============================================
// BUSCADOR MASIVO v4.0 - Optimizado y rápido
// ===============================================

document.addEventListener('DOMContentLoaded', () => {
    // Referencias DOM
    const btn = document.getElementById('btn');
    const status = document.getElementById('status');
    const lista = document.getElementById('lista');
    const fuente = document.getElementById('fuente');
    const urlBase = document.getElementById('urlBase');
    const filetype = document.getElementById('filetype');
    const grupo = document.getElementById('grupo');
    const nombreGrupo = document.getElementById('nombreGrupo');
    const colorGrupo = document.getElementById('colorGrupo');

    // Configuración
    const CFG = { MAX: 50, DELAY: 150, CLOSE: 2000 };

    // Evento principal
    btn.addEventListener('click', async () => {
        // Obtener datos
        const texto = lista.value.trim();
        let url = fuente.value || urlBase.value.trim();
        const ext = filetype.value;
        const crearGrupo = grupo.checked;
        const nombre = nombreGrupo.value.trim() || 'Búsqueda';
        const color = colorGrupo.value;

        // Validar
        if (!texto) return mostrar('❌ Escribe al menos una búsqueda', 'red');
        if (!url) return mostrar('❌ Selecciona una fuente o escribe una URL', 'red');

        try {
            new URL(url + 'test');
        } catch {
            return mostrar('❌ URL inválida', 'red');
        }

        // Procesar lista
        const lineas = texto
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l.length > 1);
        if (!lineas.length) return mostrar('❌ Lista vacía', 'red');
        if (lineas.length > CFG.MAX) return mostrar(`❌ Máximo ${CFG.MAX} búsquedas`, 'red');

        // Deshabilitar botón
        btn.disabled = true;
        mostrar(`⏳ Abriendo ${lineas.length} pestañas...`, 'blue');

        const tabIds = [];
        let groupId = -1;

        // Buscar grupo existente
        if (crearGrupo) {
            try {
                const grupos = await chrome.tabGroups.query({ title: nombre });
                if (grupos.length) groupId = grupos[0].id;
            } catch {}
        }

        // Crear pestañas
        for (let i = 0; i < lineas.length; i++) {
            let query = lineas[i];

            // Añadir filetype si es Google y hay extensión seleccionada
            if (url.includes('google.com') && ext) {
                query += ` filetype:${ext}`;
            }

            const finalUrl = url + encodeURIComponent(query);
            mostrar(
                `⏳ ${i + 1}/${lineas.length} (${Math.round(((i + 1) / lineas.length) * 100)}%)`,
                'blue'
            );

            try {
                const tab = await new Promise((ok, err) => {
                    chrome.tabs.create({ url: finalUrl, active: false }, (tab) =>
                        chrome.runtime.lastError ? err(chrome.runtime.lastError) : ok(tab)
                    );
                });
                tabIds.push(tab.id);
                if (i < lineas.length - 1) await sleep(CFG.DELAY);
            } catch (e) {
                console.error('Error tab:', e);
            }
        }

        // Agrupar
        if (crearGrupo && tabIds.length) {
            try {
                if (groupId === -1) {
                    groupId = await chrome.tabs.group({ tabIds });
                    await chrome.tabGroups.update(groupId, {
                        title: nombre,
                        color,
                        collapsed: false,
                    });
                } else {
                    await chrome.tabs.group({ tabIds, groupId });
                }
            } catch (e) {
                console.error('Error grupo:', e);
            }
        }

        // Finalizar
        const fileMsg = ext ? ` (${ext})` : '';
        const msg = crearGrupo
            ? `✅ ${tabIds.length} pestañas${fileMsg} en "${nombre}"`
            : `✅ ${tabIds.length} pestañas${fileMsg} abiertas`;

        mostrar(msg, 'green');
        setTimeout(() => window.close(), CFG.CLOSE);
    });

    // Utilidades
    function mostrar(msg, tipo) {
        status.textContent = msg;
        const estilos = {
            green: { color: '#155724', bg: '#d4edda', border: '#c3e6cb' },
            red: { color: '#721c24', bg: '#f8d7da', border: '#f5c6cb' },
            blue: { color: '#004085', bg: '#d1ecf1', border: '#bee5eb' },
        };
        const est = estilos[tipo] || estilos.blue;
        status.style.color = est.color;
        status.style.backgroundColor = est.bg;
        status.style.border = `1px solid ${est.border}`;
    }

    function sleep(ms) {
        return new Promise((r) => setTimeout(r, ms));
    }

    console.log('🚀 Buscador Masivo v4.0 iniciado');
});
