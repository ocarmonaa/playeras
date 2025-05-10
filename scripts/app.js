// Configuración de Back4App
Parse.initialize("9wHPW3a7Mh0PM3GkuJRvmiapxXVUuDtKtddXOuZP", "G0DWFnk38owCePCVEINEj3qpJSgvNjnWZccUUQtm");
Parse.serverURL = "https://parseapi.back4app.com/";

// Clase para las playeras
const Playera = Parse.Object.extend("Playera");

document.addEventListener("DOMContentLoaded", function() {
    const compraForm = document.getElementById("compraForm");
    const editarForm = document.getElementById("editarForm");
    const generarPDFBtn = document.getElementById("generarPDF");
    const editarModal = document.getElementById("editarModal");
    const closeModal = document.querySelector(".close-modal");
    const filtroGenero = document.getElementById("filtroGenero");
    const filtroTalla = document.getElementById("filtroTalla");

    // Variables para almacenar los registros
    let registros = [];
    let registrosFiltrados = [];
    let contadorCompradores = 0;

    // Cargar registros al iniciar
    cargarRegistros();

    // Manejar envío del formulario de compra
    compraForm.addEventListener("submit", async function(e) {
        e.preventDefault();

        const nombre = document.getElementById("nombre").value;
        const talla = document.getElementById("talla").value;
        const genero = document.getElementById("genero").value;
        const abono = parseFloat(document.getElementById("abono").value);
        const totalAbonado = abono;
        const restante = Math.max(0, 200 - totalAbonado);

        const playera = new Playera();

        try {
            await playera.save({
                nombre,
                talla,
                genero,
                abonos: [abono],
                totalAbonado,
                restante,
                fecha: new Date()
            });

            compraForm.reset();
            await cargarRegistros();
            mostrarNotificacion("Compra registrada exitosamente", "success");
        } catch (error) {
            console.error("Error al guardar:", error);
            mostrarNotificacion("Error al registrar la compra", "error");
        }
    });

    // Manejar clic en botones de acción
    document.addEventListener("click", function(e) {
        // Botón de editar
        if (e.target.classList.contains("btn-editar") || e.target.parentElement.classList.contains("btn-editar")) {
            const id = e.target.getAttribute("data-id") || e.target.parentElement.getAttribute("data-id");
            cargarDatosParaEditar(id);
            editarModal.style.display = "block";
        }
    });

    // Cerrar modal
    closeModal.addEventListener("click", function() {
        editarModal.style.display = "none";
    });

    // Manejar envío del formulario de edición
    editarForm.addEventListener("submit", async function(e) {
        e.preventDefault();

        const id = document.getElementById("editarId").value;
        const nombre = document.getElementById("editarNombre").value;
        const talla = document.getElementById("editarTalla").value;
        const genero = document.getElementById("editarGenero").value;
        const nuevoAbono = parseFloat(document.getElementById("editarAbono").value);
        const restante = Math.max(0, 200 - nuevoAbono);

        const query = new Parse.Query(Playera);

        try {
            const playera = await query.get(id);

            await playera.save({
                nombre,
                talla,
                genero,
                totalAbonado: nuevoAbono,
                restante,
                abonos: [nuevoAbono]
            });

            editarModal.style.display = "none";
            await cargarRegistros();
            mostrarNotificacion("Registro actualizado exitosamente", "success");
        } catch (error) {
            console.error("Error al actualizar:", error);
            mostrarNotificacion("Error al actualizar el registro", "error");
        }
    });

    // Generar PDF
    generarPDFBtn.addEventListener("click", function() {
        generarPDF(registrosFiltrados, filtroGenero.value, filtroTalla.value);
    });

    // Filtrar registros
    filtroGenero.addEventListener("change", filtrarRegistros);
    filtroTalla.addEventListener("change", filtrarRegistros);

    // Cargar registros desde Back4App
    async function cargarRegistros() {
        const query = new Parse.Query(Playera);
        query.descending("createdAt");

        try {
            const results = await query.find();
            registros = results;
            contadorCompradores = results.length;
            filtrarRegistros();
        } catch (error) {
            console.error("Error al cargar registros:", error);
            mostrarNotificacion("Error al cargar los registros", "error");
        }
    }

    // Cargar datos para editar
    async function cargarDatosParaEditar(id) {
        const query = new Parse.Query(Playera);

        try {
            const playera = await query.get(id);
            document.getElementById("editarId").value = playera.id;
            document.getElementById("editarNombre").value = playera.get("nombre");
            document.getElementById("editarTalla").value = playera.get("talla");
            document.getElementById("editarGenero").value = playera.get("genero");
            document.getElementById("editarAbono").value = playera.get("totalAbonado") || 0;
        } catch (error) {
            console.error("Error al cargar datos para editar:", error);
            mostrarNotificacion("Error al cargar datos para editar", "error");
        }
    }

    // Filtrar registros según los criterios seleccionados
    function filtrarRegistros() {
        const genero = filtroGenero.value;
        const talla = filtroTalla.value;

        registrosFiltrados = registros.filter(reg => {
            const cumpleGenero = !genero || reg.get("genero") === genero;
            const cumpleTalla = !talla || reg.get("talla") === talla;
            return cumpleGenero && cumpleTalla;
        });

        mostrarRegistros(registrosFiltrados);
        actualizarResumen();
    }

    // Mostrar registros en la tabla
    function mostrarRegistros(registros) {
        const tbody = document.getElementById("registrosBody");
        tbody.innerHTML = "";

        registros.forEach((reg, index) => {
            const row = document.createElement("tr");
            const totalAbonado = reg.get("totalAbonado") || 0;
            const restanteCalculado = Math.max(0, 200 - totalAbonado);
            const estado = totalAbonado >= 200 ? "Pagado" : "Pendiente";
            const estadoClass = estado === "Pagado" ? "estado-pagado" : "estado-pendiente";

            row.innerHTML = `
                <td class="text-center">${index + 1}</td>
                <td>${reg.get("nombre")}</td>
                <td class="text-center">${reg.get("talla")}</td>
                <td class="text-center">${reg.get("genero")}</td>
                <td class="text-right">$${totalAbonado.toFixed(2)}</td>
                <td class="text-right ${estado === 'Pagado' ? 'pagado' : 'pendiente'}">
                    $${restanteCalculado.toFixed(2)}
                </td>
                <td class="text-center ${estadoClass}">${estado}</td>
                <td class="text-center acciones-cell">
                    <button class="btn-icon btn-editar" data-id="${reg.id}" title="Editar registro">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-eliminar" data-id="${reg.id}" title="Eliminar registro">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;

            tbody.appendChild(row);
        });

        // Agregar event listeners a los botones de eliminar
        document.querySelectorAll(".btn-eliminar").forEach(btn => {
            btn.addEventListener("click", async function() {
                if (confirm("¿Está seguro de eliminar este registro?")) {
                    const query = new Parse.Query(Playera);

                    try {
                        const playera = await query.get(btn.getAttribute("data-id"));
                        await playera.destroy();
                        await cargarRegistros();
                        mostrarNotificacion("Registro eliminado", "success");
                    } catch (error) {
                        console.error("Error al eliminar:", error);
                        mostrarNotificacion("Error al eliminar el registro", "error");
                    }
                }
            });
        });
    }

    // Actualizar el resumen de tallas
    function actualizarResumenTallas(registros) {
        const tallasHombre = {
            "EXTRA CHICA": 0,
            "CHICA": 0,
            "MEDIANA": 0,
            "GRANDE": 0,
            "EXTRA GRANDE": 0,
            "EXTRA EXTRA GRANDE": 0
        };

        const tallasMujer = { ...tallasHombre };

        registros.forEach(reg => {
            const talla = reg.get("talla");
            const genero = reg.get("genero");
            
            if (genero === "Hombre") {
                tallasHombre[talla]++;
            } else if (genero === "Mujer") {
                tallasMujer[talla]++;
            }
        });

        // Actualizar HTML para Hombre
        const contenedorHombre = document.getElementById("tallasHombre");
        contenedorHombre.innerHTML = Object.entries(tallasHombre)
            .map(([talla, count]) => `
                <div class="talla-item">
                    <span class="talla-label">${talla}</span>
                    <span class="talla-count">${count}</span>
                </div>
            `).join("");

        // Actualizar HTML para Mujer
        const contenedorMujer = document.getElementById("tallasMujer");
        contenedorMujer.innerHTML = Object.entries(tallasMujer)
            .map(([talla, count]) => `
                <div class="talla-item">
                    <span class="talla-label">${talla}</span>
                    <span class="talla-count">${count}</span>
                </div>
            `).join("");
    }

    // Actualizar el resumen total
    function actualizarResumen() {
        let totalAbonado = 0;
        let totalPlayeras = registrosFiltrados.length;
        let totalAPagar = totalPlayeras * 200;

        registrosFiltrados.forEach(reg => {
            const abonado = reg.get("totalAbonado") || 0;
            totalAbonado += abonado;
        });

        const totalPendiente = Math.max(0, totalAPagar - totalAbonado);

        document.getElementById("totalPlayeras").textContent = totalPlayeras;
        document.getElementById("totalAbonado").textContent = `$${totalAbonado.toFixed(2)}`;
        document.getElementById("totalPendiente").textContent = `$${totalPendiente.toFixed(2)}`;
        document.getElementById("totalAPagar").textContent = `$${totalAPagar.toFixed(2)}`;

        // Actualizar resumen de tallas
        actualizarResumenTallas(registrosFiltrados);
    }

    // Mostrar notificación
    function mostrarNotificacion(mensaje, tipo) {
        const notificacion = document.createElement("div");
        notificacion.className = `notificacion ${tipo}`;
        notificacion.textContent = mensaje;

        document.body.appendChild(notificacion);

        setTimeout(() => {
            notificacion.classList.add("mostrar");
        }, 100);

        setTimeout(() => {
            notificacion.classList.remove("mostrar");
            setTimeout(() => {
                document.body.removeChild(notificacion);
            }, 300);
        }, 3000);
    }
});

// Manejar clic fuera del modal para cerrarlo
window.addEventListener("click", function(event) {
    const editarModal = document.getElementById("editarModal");

    if (event.target === editarModal) {
        editarModal.style.display = "none";
    }
});

// Función para generar PDF con filtros aplicados
function generarPDF(registros, filtroGenero, filtroTalla) {
    // Usamos jsPDF con autotable plugin
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Título del documento
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text('Reporte de Compras de Playeras', 105, 15, { align: 'center' });
    doc.setFontSize(14);
    doc.text('"Matrimonios de Nazaret"', 105, 22, { align: 'center' });
    
    // Fecha del reporte
    const fecha = new Date().toLocaleDateString('es-MX');
    doc.setFontSize(10);
    doc.text(`Generado el: ${fecha}`, 105, 30, { align: 'center' });
    
    // Información de filtros aplicados
    let filtrosAplicados = "Filtros aplicados: ";
    if (filtroGenero || filtroTalla) {
        if (filtroGenero) filtrosAplicados += `Género: ${filtroGenero} `;
        if (filtroTalla) filtrosAplicados += `Talla: ${filtroTalla}`;
    } else {
        filtrosAplicados += "Ninguno (mostrando todos)";
    }
    
    doc.setFontSize(10);
    doc.text(filtrosAplicados, 105, 38, { align: 'center' });
    
    // Calcular totales
    let totalAbonado = 0;
    let totalPlayeras = registros.length;
    let totalAPagar = totalPlayeras * 200;
    
    registros.forEach(reg => {
        const abonado = reg.get("totalAbonado") || 0;
        totalAbonado += abonado;
    });
    
    const totalPendiente = totalAPagar - totalAbonado;
    
    // Resumen de totales
    doc.setFontSize(11);
    doc.text(`Total playeras: ${totalPlayeras}`, 14, 45);
    doc.text(`Total a pagar: $${totalAPagar.toFixed(2)}`, 60, 45);
    doc.text(`Total abonado: $${totalAbonado.toFixed(2)}`, 110, 45);
    doc.text(`Total pendiente: $${totalPendiente.toFixed(2)}`, 160, 45);
    
    // Datos para la tabla
    const headers = [
        "Nombre", 
        "Talla", 
        "Género", 
        "Abonado", 
        "Restante",
        "Estado"
    ];
    
    const rows = registros.map(reg => {
        const totalAbonado = reg.get("totalAbonado") || 0;
        const restante = Math.max(0, 200 - totalAbonado);
        const estado = restante <= 0 ? "Pagado" : "Pendiente";
        
        return [
            reg.get("nombre"),
            reg.get("talla"),
            reg.get("genero"),
            `$${totalAbonado.toFixed(2)}`,
            `$${restante.toFixed(2)}`,
            estado
        ];
    });
    
    // Agregar tabla al PDF
    doc.autoTable({
        head: [headers],
        body: rows,
        startY: 55,
        styles: {
            fontSize: 9,
            cellPadding: 3,
            halign: 'center'
        },
        headStyles: {
            fillColor: [74, 111, 165], // Color primario
            textColor: 255,
            fontStyle: 'bold'
        },
        alternateRowStyles: {
            fillColor: [240, 240, 240]
        },
        columnStyles: {
            0: { halign: 'left' },
            3: { halign: 'right' },
            4: { halign: 'right' }
        },
        didDrawPage: function(data) {
            // Footer
            doc.setFontSize(10);
            doc.setTextColor(150);
            doc.text(
                'Sistema de Registro de Playeras - Página ' + (data.pageCount),
                data.settings.margin.left,
                doc.internal.pageSize.height - 10
            );
        }
    });
    
    // Guardar el PDF
    const filtroNombre = (filtroGenero || filtroTalla) ? 
        `_${filtroGenero || ''}_${filtroTalla || ''}` : '_Todos';
    doc.save(`Reporte_Playeras_${fecha.replace(/\//g, '-')}${filtroNombre}.pdf`);
}