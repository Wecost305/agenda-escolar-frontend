const API_URL = "https://agenda-escolar-backend.onrender.com";

document.getElementById('fecha').valueAsDate = new Date();
let alumnosGrupo = [];

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

async function cargarAlumnosDesdeNotion() {
    try {
        const respuesta = await fetch(`${API_URL}/obtener-alumnos`);
        const resultado = await respuesta.json();
        if (respuesta.ok && resultado.alumnos.length > 0) {
            alumnosGrupo = resultado.alumnos;
            inicializarFormularios();
        }
    } catch (error) { console.error(error); }
}

function inicializarFormularios() {
    const cAsistencia = document.getElementById('contenedor-alumnos');
    const cCalificaciones = document.getElementById('contenedor-calificaciones-masivas');
    
    cAsistencia.innerHTML = "";
    cCalificaciones.innerHTML = "";

    alumnosGrupo.forEach((alumno, index) => {
        // Formulario Asistencia
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

        // Formulario Calificaciones Masivas (Matriz NEM)
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

async function enviarAsistencia() {
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
        if (r.ok) alert("🎯 Asistencia guardada con éxito.");
    } catch (e) { alert("Error."); }
    btn.disabled = false; btn.innerHTML = "🚀 Enviar Reporte a Notion";
}

async function enviarCalificaciones() {
    const proyecto = document.getElementById('nombre-proyecto').value;
    const trimestre = document.getElementById('trimestre-proyecto').value;
    const btn = document.getElementById('btn-calif');

    if (!proyecto) { alert("⚠️ Escribe el nombre del proyecto."); return; }

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
        }
    } catch (e) { alert("❌ Error al guardar."); }
    btn.disabled = false; btn.innerHTML = "💾 Guardar Notas del Proyecto";
}

async function descargarBoletas() {
    const trimestre = document.getElementById('select-trimestre').value;
    const btn = document.getElementById('btn-boletas');
    btn.disabled = true; btn.innerHTML = "⏳ Generando PDFs...";
    try {
        const r = await fetch(`${API_URL}/generar-reportes?trimestre=${encodeURIComponent(trimestre)}`);
        if (r.ok) {
            const b = await r.blob();
            const url = window.URL.createObjectURL(b);
            const a = document.createElement('a'); a.href = url; a.download = `Boletas_${trimestre.replace(" ", "_")}.zip`;
            document.body.appendChild(a); a.click(); a.remove();
        }
    } catch (e) { alert("Error."); }
    btn.disabled = false; btn.innerHTML = "📥 Generar Boletas (.ZIP)";
}

cargarAlumnosDesdeNotion();
