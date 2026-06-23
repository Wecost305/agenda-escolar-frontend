const API_URL = "https://agenda-escolar-backend.onrender.com";

document.getElementById('fecha').valueAsDate = new Date();
let alumnosGrupo = [];

async function cargarAlumnosDesdeNotion() {
    const contenedor = document.getElementById('contenedor-alumnos');
    try {
        const respuesta = await fetch(`${API_URL}/obtener-alumnos`);
        const resultado = await respuesta.json();
        
        if (respuesta.ok && resultado.alumnos.length > 0) {
            alumnosGrupo = resultado.alumnos;
            inicializarFormulario();
        } else {
            contenedor.innerHTML = `<div class="bg-amber-50 text-amber-800 p-4 rounded-xl text-center border text-sm">⚠️ No hay alumnos en Notion. Sube tu archivo Excel abajo.</div>`;
        }
    } catch (error) {
        contenedor.innerHTML = `<div class="bg-red-50 text-red-800 p-4 rounded-xl text-center border text-sm">❌ Error al conectar con el servidor.</div>`;
    }
}

function inicializarFormulario() {
    const contenedor = document.getElementById('contenedor-alumnos');
    contenedor.innerHTML = ""; 

    alumnosGrupo.forEach((alumno, index) => {
        const div = document.createElement('div');
        div.className = 'bg-white rounded-xl p-4 shadow-sm border border-slate-100';
        div.innerHTML = `
            <div class="flex items-center justify-between gap-4">
                <span class="font-medium text-slate-800 text-sm sm:text-base">${alumno}</span>
                <select id="estatus-${index}" onchange="alternarMotivo(${index})" class="pl-3 pr-8 py-1.5 text-xs font-semibold rounded-lg border bg-slate-50 text-slate-600 border-slate-200">
                    <option value="Presente">🟢 Presente</option>
                    <option value="Falta">🔴 Falta</option>
                </select>
            </div>
            <div id="motivo-container-${index}" class="hidden mt-4 pt-4 border-t border-dashed border-slate-100">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Motivo de Falta</label>
                        <select id="motivo-${index}" class="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2">
                            <option value="Injustificada">❌ Injustificada</option>
                            <option value="Enfermedad">🏥 Enfermedad / Salud</option>
                            <option value="Permiso">📝 Permiso Familiar</option>
                            <option value="Retardo">⏳ Retardo</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Nota / Observación</label>
                        <input type="text" id="nota-${index}" placeholder="Ej: Trae receta" class="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2">
                    </div>
                </div>
            </div>
        `;
        contenedor.appendChild(div);
    });
}

function alternarMotivo(index) {
    const estatus = document.getElementById(`estatus-${index}`).value;
    const contenedorMotivo = document.getElementById(`motivo-container-${index}`);
    if (estatus === "Falta") {
        contenedorMotivo.classList.remove('hidden');
    } else {
        contenedorMotivo.classList.add('hidden');
    }
}

async function enviarAsistencia() {
    const fecha = document.getElementById('fecha').value;
    const listaParaEnviar = [];
    
    // 1. Conseguimos el botón para cambiarle el estado visual
    // Buscamos el botón por su atributo onclick
    const botonEnviar = document.querySelector("button[onclick='enviarAsistencia()']");

    // 2. Bloqueamos el botón para evitar que le den clic otra vez en lo que carga
    if (botonEnviar) {
        botonEnviar.disabled = true;
        botonEnviar.classList.remove('bg-emerald-600', 'hover:bg-emerald-700');
        botonEnviar.classList.add('bg-slate-400', 'cursor-not-allowed');
        botonEnviar.innerHTML = `⏳ Guardando en Notion y Airtable (Espera)...`;
    }

    alumnosGrupo.forEach((alumno, index) => {
        const estatus = document.getElementById(`estatus-${index}`).value;
        const motivo = document.getElementById(`motivo-${index}`).value;
        const nota = document.getElementById(`nota-${index}`).value;

        listaParaEnviar.push({
            nombre: alumno,
            estatus: estatus,
            motivo: motivo,
            nota: nota
        });
    });

    try {
        const respuesta = await fetch(`${API_URL}/registrar-asistencia`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fecha: fecha, alumnos: listaParaEnviar })
        });

        if (respuesta.ok) {
            alert("🎯 ¡Pase de lista guardado con éxito en Notion y respaldado en Airtable!");
        } else {
            alert("⚠️ Error al guardar el reporte.");
        }
    } catch (error) {
        console.error(error);
        alert("❌ Error de conexión con el servidor.");
    } finally {
        // 3. REINICIAMOS EL BOTÓN (Pase lo que pase, éxito o error, el botón vuelve a la vida)
        if (botonEnviar) {
            botonEnviar.disabled = false;
            botonEnviar.classList.remove('bg-slate-400', 'cursor-not-allowed');
            botonEnviar.classList.add('bg-emerald-600', 'hover:bg-emerald-700');
            botonEnviar.innerHTML = `🚀 Enviar Reporte a Notion`;
        }
    }
}

async function subirExcel() {
    const inputArchivo = document.getElementById('archivo-excel');
    if (inputArchivo.files.length === 0) {
        alert("⚠️ Selecciona un archivo de Excel primero.");
        return;
    }
    const formData = new FormData();
    formData.append('file', inputArchivo.files[0]);

    alert("⏳ Subiendo alumnos... Da clic en Aceptar.");
    try {
        const respuesta = await fetch(`${API_URL}/cargar-alumnos`, { method: 'POST', body: formData });
        if (respuesta.ok) {
            alert("🎯 ¡Éxito! Alumnos cargados.");
            cargarAlumnosDesdeNotion();
        } else {
            alert("⚠️ Error al procesar el Excel.");
        }
    } catch (error) {
        alert("❌ Error de conexión.");
    }
}

cargarAlumnosDesdeNotion();
