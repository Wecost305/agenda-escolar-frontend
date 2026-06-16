const API_URL = "https://agenda-escolar-backend.onrender.com";

document.getElementById('fecha').valueAsDate = new Date();

const alumnosPiloto = [
    "Valdez Salinas Manuel",
    "Rojas Sanchez Carmen",
];

function inicializarFormulario() {
    const contenedor = document.getElementById('contenedor-alumnos');
    contenedor.innerHTML = ""; 

    alumnosPiloto.forEach((alumno, index) => {
        const div = document.createElement('div');
        // Estilizamos cada fila como una tarjeta limpia e independiente
        div.className = 'bg-white rounded-xl p-4 shadow-sm border border-slate-100 transition-all duration-200 hover:border-slate-200';
        div.innerHTML = `
            <div class="flex items-center justify-between gap-4">
                <span class="font-medium text-slate-800 text-sm sm:text-base tracking-tight">${alumno}</span>
                <div class="relative">
                    <select id="estatus-${index}" onchange="alternarMotivo(${index})" 
                        class="appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold rounded-lg border transition-all focus:outline-none cursor-pointer bg-slate-50 text-slate-600 border-slate-200 focus:ring-2 focus:ring-emerald-500/10">
                        <option value="Presente">🟢 Presente</option>
                        <option value="Falta">🔴 Falta</option>
                    </select>
                </div>
            </div>
            
            <div id="motivo-container-${index}" class="hidden mt-4 pt-4 border-t border-dashed border-slate-100 animate-fadeIn">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Motivo de Falta</label>
                        <select id="motivo-${index}" class="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500 text-slate-700 font-medium">
                            <option value="Injustificada">❌ Injustificada</option>
                            <option value="Enfermedad">🏥 Enfermedad / Salud</option>
                            <option value="Permiso">00Permiso Familiar</option>
                            <option value="Retardo">⏳ Se convirtió en Falta</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Nota / Observación</label>
                        <input type="text" id="nota-${index}" placeholder="Ej: Trae receta médica mañana" 
                            class="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500 text-slate-700">
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
    const selectEstatus = document.getElementById(`estatus-${index}`);
    
    if (estatus === "Falta") {
        contenedorMotivo.classList.remove('hidden');
        // Cambiamos el color del select para alertar visualmente la falta
        selectEstatus.classList.replace('bg-slate-50', 'bg-red-50');
        selectEstatus.classList.replace('text-slate-600', 'text-red-600');
        selectEstatus.classList.replace('border-slate-200', 'border-red-200');
    } else {
        contenedorMotivo.classList.add('hidden');
        selectEstatus.classList.replace('bg-red-50', 'bg-slate-50');
        selectEstatus.classList.replace('text-red-600', 'text-slate-600');
        selectEstatus.classList.replace('border-red-200', 'border-slate-200');
    }
}

async function enviarAsistencia() {
    const fecha = document.getElementById('fecha').value;
    const listaParaEnviar = [];

    alumnosPiloto.forEach((alumno, index) => {
        const estatus = document.getElementById(`estatus-${index}`).value;
        const motivo = document.getElementById(`motivo-${index}`).value;
        const nota = document.getElementById(`nota-${index}`).value;

        listaParaEnviar.push({
            nombre: alumno,
            estatus: estatus,
            motivo: estatus === "Falta" ? motivo : "",
            nota: estatus === "Falta" ? nota : ""
        });
    });

    const paqueteDatos = { fecha: fecha, alumnos: listaParaEnviar };

    try {
        const respuesta = await fetch(`${API_URL}/registrar-asistencia`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paqueteDatos)
        });

        const resultado = await respuesta.json();
        
        if (respuesta.ok) {
            alert("✅ ¡Reporte enviado con éxito a Notion!");
        } else {
            alert(`⚠️ Error en el servidor: ${resultado.error}`);
        }
    } catch (error) {
        console.error("Error al conectar:", error);
        alert("❌ No se pudo conectar con el servidor de la agenda.");
    }
}

inicializarFormulario();