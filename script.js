const API_URL = "https://agenda-escolar-backend.onrender.com";

let alumnosGrupo = [];

// Inicialización automática cuando la página web termina de cargar
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('fecha').valueAsDate = new Date();
    inicializarSelectorGrupos(); // Trae las escuelas y grupos configurados en Notion
});

// Control del sistema de pestañas del menú superior
function cambiarPestaña(tipo) {
    const sLista = document.getElementById('seccion-lista');
    const sCalif = document.getElementById('seccion-calif');
    const tLista = document.getElementById('tab-lista');
    const tCalif = document.getElementById('tab-calif');

    if (tipo === 'lista') {
        sLista.classList.remove('hidden');
        sCalif.classList.add('hidden');
        tLista.className = "flex-1 text-sm font-semibold py-2.5 rounded-lg bg-white text-slate-900 shadow-sm";
        tCalif.className = "flex-1 text-sm font-semibold py-2.5 rounded-lg text-slate-600 hover:text-slate-900";
    } else {
        sLista.classList.add('hidden');
        sCalif.classList.remove('hidden');
        tCalif.className = "flex-1 text-sm font-semibold py-2.5 rounded-lg bg-white text-slate-900 shadow-sm";
        tLista.className = "flex-1 text-sm font-semibold py-2.5 rounded-lg text-slate-600 hover:text-slate-900";
    }
}

// 🏫 NUEVA: Consulta los planteles y grupos configurados en Notion
async function inicializarSelectorGrupos() {
    const selector = document.getElementById('selector-grupo');
    try {
        const respuesta = await fetch(`${API_URL}/obtener-grupos`);
        const resultado = await respuesta.json();
        
        if (respuesta.ok && resultado.groups && resultado.groups.length > 0) {
            selector.innerHTML = '<option value="">-- Elige una Escuela / Grupo --</option>';
            resultado.groups.forEach(grupo => {
                const option = document.createElement('option');
                option.value = grupo.id; // ID de la página en Notion
                option.textContent = grupo.label; // Muestra "Nombre Escuela - Grado y Grupo"
                selector.appendChild(option);
            });
        } else if (respuesta.ok && resultado.grupos && resultado.grupos.length > 0) {
            // Alternativa por si el backend responde con la llave 'grupos'
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

// 🔄 NUEVA: Se activa cuando la maestra selecciona otra escuela en el menú desplegable
function cambiarDeGrupo() {
    const grupoId = document.getElementById('selector-grupo').value;
    if (grupoId) {
        cargarAlumnosDesdeNotion(grupoId);
    } else {
        alumnosGrupo = [];
        document.getElementById('contenedor-alumnos').innerHTML = `
            <div class="bg-slate-50 text-slate-500 p-6 rounded-xl text-center border border-slate-200 text-sm">
                💡 Por favor, selecciona una escuela arriba para desplegar a sus alumnos.
            </div>`;
        document.getElementById('contenedor-calificaciones-masivas').innerHTML = "";
    }
}

// 📋 MODIFICADA: Descarga los alumnos pertenecientes únicamente al grupo seleccionado
async function cargarAlumnosDesdeNotion(grupoId) {
    const cAsistencia = document.getElementById('contenedor-alumnos');
    const cCalificaciones = document.getElementById('contenedor-calificaciones-masivas');
    
    cAsistencia.innerHTML = `<div class="text-center text-xs text-slate-400 p-6">⏳ Filtrando lista de asistencia de esta escuela...</div>`;
    cCalificaciones.innerHTML = "";
    
    try {
        const respuesta = await fetch(`${API_URL}/obtener-alumnos?grupo_id=${grupoId}`);
        const resultado = await respuesta.json();
        
        if (respuesta.ok && resultado.alumnos.length > 0) {
            alumnosGrupo = resultado.alumnos;
            inicializarFormularios(); // Renderiza las dos interfaces simultáneamente
        } else {
            contenedor.innerHTML = `
                <div class="bg-amber-50 text-amber-800 p-4 rounded-xl text-center border border-amber-200 text-sm">
                    ⚠️ No hay alumnos asignados a este grupo en Notion.
                </div>`;
        }
    } catch (error) {
        console.error("Error al obtener alumnos:", error);
        cAsistencia.innerHTML = `
            <div class="bg-red-50 text-red-800 p-4 rounded-xl text-center border border-red-200 text-sm">
                ❌ Error al conectar con el servidor.
            </div>`;
    }
}

// Inyección dinámica de las tarjetas del grupo en el HTML
function inicializarFormularios() {
    const cAsistencia = document.getElementById('contenedor-alumnos');
    const cCalificaciones = document.getElementById('contenedor-calificaciones-masivas');
    
    cAsistencia.innerHTML = "";
    cCalificaciones.innerHTML = "";

    alumnosGrupo.forEach((alumno, index) => {
        // Formulario Asistencia Diario
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
                    <select id="motivo-${index}" class="text-xs bg-slate-50 border rounded-lg p-2">
                        <option value="Injustificada">❌ Injustificada</option>
                        <option value="Enfermedad">🏥 Enfermedad</option>
                        <option value="Permiso">📝 Permiso</option>
                        <option value="Retardo">⏳ Retardo</option>
                    </select>
                    <input type="text" id="nota-${index}" placeholder="Nota rápida" class="text-xs bg-slate-50 border rounded-lg p-2">
                </div>
            </div>
        `;
        cAsistencia.appendChild(divA);

        // Formulario Calificaciones Masivas (Matriz NEM Horizontal)
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

// Envío seguro de reporte diario (Duplicación en paralelo)
async function enviarAsistencia() {
    const grupoId = document.getElementById('selector-grupo').value;
    if (!grupoId) { alert("⚠️ Selecciona una escuela primero."); return; }

    const fecha = document.getElementById('fecha').value;
    const btn = document.getElementById('btn-asistencia');
    btn.disabled = true; btn.innerHTML = "⏳ Guardando en Notion y Airtable...";
    
    const lista = alumnosGrupo.map((alumno, index) => ({
        nombre: alumno,
        estatus: document.getElementById(`estatus-${index}`).value,
        motivo: document.getElementById(`motivo-${index}`).value,
        nota: document.getElementById(`nota-${index}`).value
    }));

    try {
        const r = await fetch(`${API_URL}/registrar-asistencia`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ fecha, alumnos: lista }) 
        });
        if (r.ok) alert("🎯 ¡Reporte de asistencia guardado y respaldado con éxito!");
    } catch (e) { 
        console.error(e);
        alert("❌ Error al guardar la asistencia."); 
    }
    btn.disabled = false; btn.innerHTML = "🚀 Enviar Reporte a Notion";
}

// Envío masivo horizontal de calificaciones (Matriz de Proyectos NEM)
async function enviarCalificaciones() {
    const grupoId = document.getElementById('selector-grupo').value;
    const proyecto = document.getElementById('nombre-proyecto').value;
    const trimestre = document.getElementById('trimestre-proyecto').value;
    const btn = document.getElementById('btn-calif');

    if (!grupoId) { alert("⚠️ Selecciona una escuela primero."); return; }
    if (!proyecto) { alert("⚠️ Escribe el nombre del proyecto o tarea."); return; }

    btn.disabled = true; btn.innerHTML = "⏳ Guardando calificaciones en paralelo...";

    const listaCalificaciones = alumnosGrupo.map((alumno, index) => ({
        nombre: alumno,
        lenguajes: document.getElementById(`leng-${index}`).value,
        saberes: document.getElementById(`sabe-${index}`).value,
        etica: document.getElementById(`etic-${index}`).value,
        humano: document.getElementById(`huma-${index}`).value,
        nota: document.getElementById(`nota-proy-${index}`).value
    }));

    try {
        const r = await fetch(`${API_URL}/registrar-calificaciones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ proyecto, trimestre, calificaciones: listaCalificaciones })
        });
        if (r.ok) {
            alert("🎯 ¡Calificaciones inyectadas en Notion y respaldadas en Airtable con éxito!");
            document.getElementById('nombre-proyecto').value = "";
            inicializarFormularios();
        } else {
            alert("⚠️ El servidor rechazó los datos. Revisa las columnas de Notion.");
        }
    } catch (e) { 
        console.error(e);
        alert("❌ Error de conexión al guardar calificaciones."); 
    }
    btn.disabled = false; btn.innerHTML = "💾 Guardar Notas del Proyecto";
}

// Descarga masiva del archivo comprimido (.ZIP) con los reportes oficiales estilo SEP
async function descargarBoletas() {
    const grupoId = document.getElementById('selector-grupo').value;
    const trimestre = document.getElementById('select-trimestre').value;
    const btn = document.getElementById('btn-boletas');
    
    if (!grupoId) { 
        alert("⚠️ Selecciona una escuela / grupo primero para poder generar sus boletas."); 
        return; 
    }
    
    btn.disabled = true; btn.innerHTML = "⏳ Cocinando PDFs oficiales SEP...";
    try {
        const r = await fetch(`${API_URL}/generar-reportes?trimestre=${encodeURIComponent(trimestre)}&grupo_id=${grupoId}`);
        if (r.ok) {
            const b = await r.blob();
            const url = window.URL.createObjectURL(b);
            const a = document.createElement('a'); 
            a.href = url; 
            a.download = `Boletas_${trimestre.replace(" ", "_")}.zip`;
            document.body.appendChild(a); 
            a.click(); 
            a.remove();
            alert("🎯 ¡Tus boletas institucionales han sido descargadas con éxito!");
        } else {
            alert("⚠️ Error al generar reportes. Asegúrate de tener proyectos calificados para este grupo.");
        }
    } catch (e) { 
        console.error(e);
        alert("❌ Error de conexión al descargar boletas."); 
    }
    btn.disabled = false; btn.innerHTML = "📥 Generar Boletas (.ZIP)";
}
