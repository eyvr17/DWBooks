document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('buscarBtn');
    const status = document.getElementById('status');

    btn.addEventListener('click', async function () {
        const listaTexto = document.getElementById('lista').value.trim();
        let urlBase = document.getElementById('urlBase').value.trim();
        const crearGrupo = document.getElementById('crearGrupo').checked;
        const nombreGrupo =
            document.getElementById('nombreGrupo').value.trim() || 'Búsqueda Libros';
        const color = document.getElementById('colorGrupo').value;

        if (!listaTexto || !urlBase) {
            status.textContent = 'Falta lista o URL';
            status.style.color = 'red';
            return;
        }

        const lineas = listaTexto
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l);
        if (lineas.length === 0) {
            status.textContent = 'Lista vacía';
            status.style.color = 'red';
            return;
        }

        status.textContent = `Abriendo ${lineas.length} pestañas...`;
        status.style.color = 'blue';

        const tabIds = [];
        let groupId = -1;

        // Paso 1: Buscar si ya existe un grupo con ese nombre
        if (crearGrupo) {
            const existingGroups = await chrome.tabGroups.query({ title: nombreGrupo });
            if (existingGroups.length > 0) {
                groupId = existingGroups[0].id;
            }
        }

        // Paso 2: Crear todas las pestañas una por una (con callback real)
        for (let i = 0; i < lineas.length; i++) {
            const query = encodeURIComponent(lineas[i]);
            const url = urlBase + query;

            await new Promise((resolve, reject) => {
                chrome.tabs.create(
                    {
                        url: url,
                        active: false,
                    },
                    (tab) => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            tabIds.push(tab.id);
                            resolve(tab);
                        }
                    }
                );
            });

            // Pequeño delay para no saturar Chrome (importante con muchas pestañas)
            await new Promise((r) => setTimeout(r, 200));
        }

        // Paso 3: Agrupar todas las pestañas creadas
        if (crearGrupo && tabIds.length > 0) {
            try {
                if (groupId === -1) {
                    // Crear grupo nuevo
                    groupId = await chrome.tabs.group({ tabIds });
                    await chrome.tabGroups.update(groupId, {
                        title: nombreGrupo,
                        color: color,
                        collapsed: false,
                    });
                } else {
                    // Añadir al grupo existente
                    await chrome.tabs.group({ tabIds, groupId });
                }
            } catch (err) {
                console.error('Error al agrupar:', err);
            }
        }

        // Final
        status.textContent = `¡Listo! ${tabIds.length} pestañas abiertas${
            crearGrupo ? ` en grupo "${nombreGrupo}"` : ''
        }`;
        status.style.color = 'green';
        setTimeout(() => window.close(), 2000);
    });
});
