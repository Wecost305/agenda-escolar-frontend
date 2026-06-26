const API_URL = "https://agenda-escolar-backend.onrender.com";

let alumnosGrupo = [];

// Inicialización automática al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById('fecha')) document.getElementById('fecha').valueAsDate = new Date();
    if (document.getElementById('fecha-evento')) document.getElementById('fecha-evento').valueAsDate = new Date();
    inicializarSelectorGrupos();
});

// Control dinámico de las 3 pestañas principales
function cambiarPestaña(tipo) {
    const sLista = document.getElementById('seccion-lista');
    const sCalif = document.getElementById('seccion-calif');
    const sAgenda = document.getElementById('seccion-agenda');
    
    const tLista = document.getElementById('tab-lista');
    const tCalif = document.getElementById('tab-calif');
    const tAgenda = document.getElementById('tab-agenda');

    // Ocultar todas las secciones primero
    sLista.classList.add('hidden');
    sCalif.classList.add('hidden');
    if (sAgenda) sAgenda.classList.add('hidden');

    // Resetear clases visuales de los botones del menú
    tLista.className = "flex-1 text-sm font-semibold py-2.5 rounded-lg text-slate-600 hover:text-slate-900";
    tCalif.className = "flex-1 text-sm font-semibold py-2.5 rounded-lg text-slate-600 hover:text-slate-900";
    if (tAgenda) tAgenda.className = "flex-1 text-sm font-semibold py-2.5 rounded-lg text-slate-600 hover:text-slate-900";

    // Activar la pestaña solicitada
    if (tipo === 'lista') {
        sLista.classList.remove('hidden');
        tLista.className = "flex-1 text-sm font-semibold py-2.5 rounded-lg bg-white text-slate-900 shadow-sm";
    } else if (tipo === 'calif') {
        sCalif.classList.remove('hidden');
        tCalif.className = "flex-1 text-sm font-semibold py-2.5 rounded-lg bg-white text-slate-900 shadow-sm";
    } else if (tipo === 'agenda') {
        if (sAgenda) sAgenda.classList.remove('hidden');
        if (tAgenda) tAgenda.className = "flex-1 text-sm font-semibold py-2.5 rounded-lg bg-white text-slate-900 shadow-sm";
    }
}

// Cargar las escuelas configuradas desde Notion
async function inicializarSelectorGrupos() {
    const selector = document.getElementById('selector-grupo');
    try {
        const respuesta = await fetch(`${API_URL}/obtener-grupos`);
        const resultado = await respuesta.json();
        
        if (respuesta.ok && resultado.grupos && resultado.grupos.length > 0) {
            selector.innerHTML = '<option value="">-- Elige una Escuela / Grupo --</option>';
            resultado.grupos.forEach(grupo => {
                const option = document.createElement('option');
                option.value = grupo.id;
                option.textContent = grupo.label;
                selector.appendChild(option);
            });
        } else {
            selector.innerHTML = '<option value="">⚠️ No hay grupos configurados en Notion</option>';
        }
    } catch (error) {
        console.error("Error al cargar grupos:", error);
        selector.innerHTML = '<option value="">❌ Error al conectar con el servidor</option>';
    }
}

// Acción al cambiar de escuela en el selector global
function cambiarDeGrupo() {
    const grupoId = document.getElementById('selector-grupo').value;
    if (grupoId) {
        obtenerAlumnos(grupoId);
    } else {
        alumnosGrupo = [];
        document.getElementById('contenedor-alumnos').innerHTML = `
            <div class="bg-slate-50 text-slate-500 p-6 rounded-xl text-center border border-slate-200 text-sm">
                💡 Por favor, selecciona una escuela arriba para desplegar a sus alumnos.
            </div>`;
        document.getElementById('contenedor-calificaciones-masivas').innerHTML = "";
    }
}

// Leer alumnos ya registrados en Notion para el grupo seleccionado
async function obtenerAlumnos(grupoId = null) {
    const selector = document.getElementById('selector-grupo');
    const idGrupo = grupoId || (selector ? selector.value : '');
    const cAsistencia = document.getElementById('contenedor-alumnos');
    const cCalificaciones = document.getElementById('contenedor-calificaciones-masivas');

    if (!idGrupo) {
        alumnosGrupo = [];
        if (cAsistencia) {
            cAsistencia.innerHTML = `
                <div class="bg-slate-50 text-slate-500 p-6 rounded-xl text-center border border-slate-200 text-sm">
                    💡 Selecciona una escuela para cargar alumnos.
                </div>`;
        }
        if (cCalificaciones) cCalificaciones.innerHTML = "";
        return;
    }

    if (cAsistencia) {
        cAsistencia.innerHTML = `
            <div class="bg-slate-50 text-slate-500 p-6 rounded-xl text-center border border-slate-200 text-sm">
                ⏳ Cargando alumnos desde Notion...
            </div>`;
    }
    if (cCalificaciones) cCalificaciones.innerHTML = "";

    try {
        const response = await fetch(`${API_URL}/obtener-alumnos?grupo_id=${encodeURIComponent(idGrupo)}`);
        const resultado = await response.json();

        if (!response.ok) {
            throw new Error(resultado.error || 'No se pudieron obtener los alumnos.');
        }

        alumnosGrupo = Array.isArray(resultado.alumnos) ? resultado.alumnos : [];

        if (alumnosGrupo.length === 0) {
            if (cAsistencia) {
                cAsistencia.innerHTML = `
                    <div class="bg-slate-50 text-slate-500 p-6 rounded-xl text-center border border-slate-200 text-sm">
                        ⚠️ Este grupo aún no tiene alumnos registrados en Notion. Carga el padrón en la sección de configuración.
                    </div>`;
            }
            if (cCalificaciones) cCalificaciones.innerHTML = "";
            return;
        }

        inicializarFormularios();
    } catch (error) {
        console.error('Error al obtener alumnos:', error);
        alumnosGrupo = [];
        if (cAsistencia) {
            cAsistencia.innerHTML = `
                <div class="bg-red-50 text-red-700 p-6 rounded-xl text-center border border-red-200 text-sm">
                    ❌ ${error.message || 'Error al cargar alumnos desde Notion.'}
                </div>`;
        }
    }
}

// Cargar padrón de alumnos desde Excel/CSV hacia Notion
async function cargarPadronAlumnosANotion() {
    const archivoInput = document.getElementById('archivo-excel');
    const selectorGrupo = document.getElementById('selector-grupo');
    const grupoId = selectorGrupo ? selectorGrupo.value : '';

    if (!grupoId) {
        alert("⚠️ Primero selecciona la escuela / grupo al que pertenece este padrón.");
        return;
    }

    if (!archivoInput || archivoInput.files.length === 0) {
        alert("⚠️ Por favor, selecciona un archivo Excel (.xlsx) o CSV antes de continuar.");
        return;
    }

    const file = archivoInput.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('grupo_id', grupoId);

    const botonCarga = document.getElementById('btn-cargar-alumnos') || document.querySelector("button[onclick='cargarPadronAlumnosANotion()']");
    if (botonCarga) {
        botonCarga.disabled = true;
        botonCarga.innerHTML = "⏳ Cargando alumnos a Notion...";
    }

    try {
        const response = await fetch(`${API_URL}/cargar-alumnos`, {
            method: 'POST',
            body: formData
        });

        const resultado = await response.json();

        if (response.ok) {
            console.log('Resultado carga alumnos:', resultado);
            const registrados = resultado.registrados || 0;
            const omitidos = resultado.omitidos || 0;
            const errores = Array.isArray(resultado.errores) ? resultado.errores : [];

            let mensaje = `🎯 Proceso terminado. Se registraron ${registrados} alumnos en Notion.`;
            if (omitidos > 0) mensaje += `\n⚠️ Filas omitidas: ${omitidos}.`;
            if (errores.length > 0) {
                mensaje += `\n\nPrimeros errores:\n- ${errores.slice(0, 5).join('\n- ')}`;
            }

            alert(mensaje);
            archivoInput.value = '';
            await obtenerAlumnos(grupoId);
        } else {
            alert(`⚠️ Error: ${resultado.error || 'No se pudo procesar el archivo.'}`);
            if (resultado.detalle) console.error('Detalle backend:', resultado.detalle);
        }

    } catch (error) {
        console.error("Error crítico en la carga masiva:", error);
        alert("❌ Error de conexión con el servidor de Render.");
    } finally {
        if (botonCarga) {
            botonCarga.disabled = false;
            botonCarga.innerHTML = "Cargar Alumnos";
        }
    }
}

// Compatibilidad por si quedó algún onclick viejo apuntando a esta función
async function cargarAlumnosDesdeNotion() {
    return cargarPadronAlumnosANotion();
}
// Renderizar tarjetas de control en pantalla
function inicializarFormularios() {
    const cAsistencia = document.getElementById('contenedor-alumnos');
    const cCalificaciones = document.getElementById('contenedor-calificaciones-masivas');
    
    cAsistencia.innerHTML = "";
    cCalificaciones.innerHTML = "";

    alumnosGrupo.forEach((alumno, index) => {
        // Asistencia
        const divA = document.createElement('div');
        divA.className = 'bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3';
        divA.innerHTML = `
            <div class="flex items-center justify-between gap-4">
                <span class="font-medium text-slate-800 text-sm sm:text-base">${alumno}</span>
                <select id="estatus-${index}" onchange="alternarMotivo(${index})" class="pl-3 pr-8 py-1.5 text-xs font-semibold rounded-lg border bg-slate-50 text-slate-600 border-slate-200">
                    <option value="Presente">🟢 Presente</option>
                    <option value="Falta">🔴 Falta</option>
                </select>
            </div>
            <div id="motivo-container-${index}" class="hidden pt-2 border-t border-dashed border-slate-100">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select id="motivo-${index}" class="text-xs bg-slate-50 border rounded-lg p-2"><option value="Injustificada">❌ Injustificada</option><option value="Enfermedad">🏥 Enfermedad</option><option value="Permiso">📝 Permiso</option><option value="Retardo">⏳ Retardo</option></select>
                    <input type="text" id="nota-${index}" placeholder="Nota rápida" class="text-xs bg-slate-50 border rounded-lg p-2">
                </div>
            </div>
        `;
        cAsistencia.appendChild(divA);

        // Calificaciones
        const divC = document.createElement('div');
        divC.className = 'bg-white rounded-xl p-4 shadow-sm border border-slate-100 space-y-3';
        divC.innerHTML = `
            <div class="font-semibold text-slate-900 text-sm border-b pb-2">${alumno}</div>
            <div class="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div><label class="text-[9px] uppercase font-bold text-slate-400">Lenguajes</label><input type="number" id="leng-${index}" min="5" max="10" step="0.1" placeholder="0.0" class="w-full border rounded-lg p-1.5 text-xs text-center bg-slate-50"></div>
                <div><label class="text-[9px] uppercase font-bold text-slate-400">Saberes</label><input type="number" id="sabe-${index}" min="5" max="10" step="0.1" placeholder="0.0" class="w-full border rounded-lg p-1.5 text-xs text-center bg-slate-50"></div>
                <div><label class="text-[9px] uppercase font-bold text-slate-400">Ética</label><input type="number" id="etic-${index}" min="5" max="10" step="0.1" placeholder="0.0" class="w-full border rounded-lg p-1.5 text-xs text-center bg-slate-50"></div>
                <div><label class="text-[9px] uppercase font-bold text-slate-400">Humano</label><input type="number" id="huma-${index}" min="5" max="10" step="0.1" placeholder="0.0" class="w-full border rounded-lg p-1.5 text-xs text-center bg-slate-50"></div>
                <div class="col-span-2 sm:col-span-1"><label class="text-[9px] uppercase font-bold text-slate-400">Observación</label><input type="text" id="nota-proy-${index}" placeholder="Logros" class="w-full border rounded-lg p-1.5 text-xs bg-slate-50"></div>
            </div>
        `;
        cCalificaciones.appendChild(divC);
    });
}

function alternarMotivo(index) {
    const estatus = document.getElementById(`estatus-${index}`).value;
    document.getElementById(`motivo-container-${index}`).classList.toggle('hidden', estatus !== "Falta");
}

// Despachar Reporte Diario
async function enviarAsistencia() {
    const grupoId = document.getElementById('selector-grupo').value;
    if (!grupoId) { alert("⚠️ Selecciona una escuela primero."); return; }

    const fecha = document.getElementById('fecha').value;
    const btn = document.getElementById('btn-asistencia');
    btn.disabled = true; btn.innerHTML = "⏳ Guardando...";
    
    const lista = alumnosGrupo.map((alumno, index) => ({
        nombre: alumno,
        estatus: document.getElementById(`estatus-${index}`).value,
        motivo: document.getElementById(`motivo-${index}`).value,
        nota: document.getElementById(`nota-${index}`).value
    }));

    try {
        const r = await fetch(`${API_URL}/registrar-asistencia`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fecha, alumnos: lista }) });
        if (r.ok) alert("🎯 ¡Reporte de asistencia guardado con éxito!");
    } catch (e) { alert("❌ Error."); }
    btn.disabled = false; btn.innerHTML = "🚀 Enviar Reporte a Notion";
}

// Despachar Calificaciones Masivas
async function enviarCalificaciones() {
    const grupoId = document.getElementById('selector-grupo').value;
    const proyecto = document.getElementById('nombre-proyecto').value;
    const trimestre = document.getElementById('trimestre-proyecto').value;
    const btn = document.getElementById('btn-calif');

    if (!grupoId) { alert("⚠️ Selecciona una escuela primero."); return; }
    if (!proyecto) { alert("⚠️ Escribe el nombre del proyecto."); return; }

    btn.disabled = true; btn.innerHTML = "⏳ Guardando...";

    const listaCalificaciones = alumnosGrupo.map((alumno, index) => ({
        nombre: alumno,
        lenguajes: document.getElementById(`leng-${index}`).value,
        saberes: document.getElementById(`sabe-${index}`).value,
        etica: document.getElementById(`etic-${index}`).value,
        humano: document.getElementById(`huma-${index}`).value,
        nota: document.getElementById(`nota-proy-${index}`).value
    }));

    try {
        const r = await fetch(`${API_URL}/registrar-calificaciones`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ proyecto, trimestre, calificaciones: listaCalificaciones }) });
        if (r.ok) {
            alert("🎯 ¡Calificaciones inyectadas con éxito!");
            document.getElementById('nombre-proyecto').value = "";
            inicializarFormularios();
        }
    } catch (e) { alert("❌ Error."); }
    btn.disabled = false; btn.innerHTML = "💾 Guardar Notas del Proyecto";
}

// 📅 NUEVA FUNCIÓN: Envía el evento de la agenda al Servidor
function enviarEvento() {
    const nombreEvento = document.getElementById('nombre-evento').value.trim();
    const fechaEvento = document.getElementById('fecha-evento').value;
    const tipoEvento = document.getElementById('tipo-evento').value;
    const trimestreEvento = document.getElementById('trimestre-evento').value;
    const notasEvento = document.getElementById('notas-evento').value.trim();
    
    const selector = document.getElementById('selector-grupo');
    const grupoId = selector ? selector.value : '';

    if (!grupoId || !nombreEvento || !fechaEvento) {
        alert("⚠️ Por favor, asegúrate de seleccionar una escuela y llenar el nombre y fecha del evento.");
        return;
    }

    const datos = {
        evento: nombreEvento,
        fecha: fechaEvento,
        tipo: tipoEvento,
        trimestre: trimestreEvento,
        notas: notasEvento,
        grupo_id: grupoId
    };

    fetch('https://agenda-escolar-backend.onrender.com/registrar-evento', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(datos)
    })
    .then(response => {
        if (response.ok) {
            alert("🎯 ¡Evento publicado en Notion y sincronizado!");
            document.getElementById('nombre-evento').value = '';
            document.getElementById('notas-evento').value = '';
        } else {
            alert("⚠️ Ocurrió un error al guardar el evento.");
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("❌ Error de conexión con el servidor.");
    });
}

// Descargar PDFs de Boletas completas
async function descargarBoletas() {
    const grupoId = document.getElementById('selector-grupo').value;
    const btn = document.getElementById('btn-boletas');
    
    if (!grupoId) { alert("⚠️ Selecciona una escuela primero."); return; }
    
    btn.disabled = true;
    btn.innerHTML = "⏳ Generando boletas completas...";

    try {
        const r = await fetch(`${API_URL}/generar-reportes?grupo_id=${encodeURIComponent(grupoId)}`);

        if (!r.ok) {
            let detalle = "No se pudieron generar las boletas.";
            try {
                const errorJson = await r.json();
                detalle = errorJson.error || detalle;
            } catch (_) {}
            alert(`⚠️ Error: ${detalle}`);
            return;
        }

        const b = await r.blob();
        const url = window.URL.createObjectURL(b);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Boletas_Completas.zip';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch (e) {
        console.error("Error generando boletas:", e);
        alert("❌ Error de conexión con el servidor.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = "📥 Generar Boletas (.ZIP)";
    }
}
