const API_URL = "https://agenda-escolar-backend.onrender.com";

document.getElementById('fecha').valueAsDate = new Date();

// Dejamos el arreglo vacío. Ahora Python se encargará de llenarlo con los datos reales de Notion.
let alumnosGrupo = [];

// NUEVA FUNCIÓN: Traer los alumnos desde el servidor de Python (nuestro Backend)
async function cargarAlumnosDesdeNotion() {
    const contenedor = document.getElementById('contenedor-alumnos');
    
    try {
        const respuesta = await fetch(`${API_URL}/obtener-alumnos`);
        const resultado = await respuesta.json();
        
        if (respuesta.ok && resultado.alumnos.length > 0) {
            alumnosGrupo = resultado.alumnos; // Guardamos la lista real de nombres
            inicializarFormulario();         // Pintamos las tarjetas en la pantalla
        } else {
            contenedor.innerHTML = `
                <div class="bg-amber-50 text-amber-800 p-4 rounded-xl text-center border border-amber-200 text-sm">
                    ⚠️ No se encontraron alumnos en Notion. Usa el panel de configuración de abajo para subir tu archivo de Excel.
                </div>`;
        }
    } catch (error) {
        console.error("Error al obtener alumnos:", error);
        contenedor.innerHTML = `
            <div class="bg-red-50 text-red-800 p-4 rounded-xl text-center border border-red-200 text-sm">
                ❌ Error de conexión. Asegúrate de que el servidor en Render esté activo.
            </div>`;
    }
}

function inicializarFormulario() {
    const contenedor = document.getElementById('contenedor-alumnos');
    contenedor.innerHTML = ""; 

    // Ahora iteramos sobre la lista dinámica cambiada de alumnosGrupo
    alumnosGrupo.forEach((alumno, index) => {
        const div = document.createElement('div');
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
                            <option value="Permiso">📝 Permiso Familiar</option>
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
    const listaDivs = document.getElementById('contenedor-alumnos').children;
    const alumnosAsistencia = [];

    // Recorremos los alumnos dibujados en la interfaz
    for (let i = 0; i < listaDivs.length; i++) {
        const nombre = listaDivs[i].querySelector('span').innerText;
        const estatus = document.getElementById(`estatus-${i}`).value;
        const motivoSelect = document.getElementById(`motivo-${i}`);
        const notaInput = document.getElementById(`nota-${i}`);

        const motivo = motivoSelect ? motivoSelect.value : "Injustificada";
        const nota = notaInput ? notaInput.value : "";

        // Empaquetamos los datos respetando la nueva estructura relacional
        alumnosAsistencia.push({
            nombre: nombre,
            estatus: estatus,
            motivo: motivo,
            nota: nota
        });
    }

    const payload = {
        fecha: fecha,
        alumnos: alumnosAsistencia
    };

    try {
        // Enviamos los datos al backend en Render
        const respuesta = await fetch(`${API_URL}/registrar-asistencia`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            alert("🎯 ¡Pase de lista guardado con éxito en Notion!");
        } else {
            alert(`⚠️ El servidor respondió con un error: ${resultado.error}`);
        }

    } catch (error) {
        console.error("Error al enviar la asistencia:", error);
        alert("❌ No se pudo conectar con el servidor. Revisa que el backend en Render esté activo (Live).");
    }
}

async function subirExcel() {
    const inputArchivo = document.getElementById('archivo-excel');
    
    if (inputArchivo.files.length === 0) {
        alert("⚠️ Por favor, selecciona un archivo de Excel (.xlsx) primero.");
        return;
    }

    const archivo = inputArchivo.files[0];
    const formData = new FormData();
    formData.append('file', archivo);

    alert("⏳ Subiendo alumnos a Notion... Da clic en Aceptar para iniciar.");

    try {
        const respuesta = await fetch(`${API_URL}/cargar-alumnos`, {
            method: 'POST',
            body: formData
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            alert("🎯 ¡Éxito! Alumnos creados. Recargando la lista...");
            // Volvemos a llamar a la API para refrescar la pantalla con los nuevos alumnos
            cargarAlumnosDesdeNotion();
            inputArchivo.value = ""; 
        } else {
            alert(`⚠️ Error al procesar el Excel: ${resultado.error}`);
        }
    } catch (error) {
        console.error("Error en la carga masiva:", error);
        alert("❌ No se pudo conectar con el servidor para la carga masiva.");
    }
}

// AL ARRANKAR: En lugar de pintar pilotos directos, disparamos la consulta a Notion
cargarAlumnosDesdeNotion();
