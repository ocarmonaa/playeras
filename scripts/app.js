// Configuración de Back4App
Parse.initialize("9wHPW3a7Mh0PM3GkuJRvmiapxXVUuDtKtddXOuZP", "G0DWFnk38owCePCVEINEj3qpJSgvNjnWZccUUQtm");
Parse.serverURL = "https://parseapi.back4app.com/";

// Clase para las playeras
const Playera = Parse.Object.extend("Playera");

document.addEventListener("DOMContentLoaded", function() {
    // Elementos del DOM
    const compraForm = document.getElementById("compraForm");
    const editarForm = document.getElementById("editarForm");
    const generarPDFBtn = document.getElementById("generarPDF");
    const editarModal = document.getElementById("editarModal");
    const closeModal = document.querySelector(".close-modal");
    const filtroGenero = document.getElementById("filtroGenero");
    const filtroTalla = document.getElementById("filtroTalla");
    const summaryTabs = document.querySelectorAll(".summary-tab");
    const currentYear = document.getElementById("currentYear");
    const themeToggle = document.querySelector(".theme-toggle");

    // Variables de estado
    let registros = [];
    let registrosFiltrados = [];
    let currentTheme = localStorage.getItem("theme") || "light";

    // Inicializar la aplicación
    initApp();

    // Funciones de inicialización
    function initApp() {
        // Establecer el año actual
        currentYear.textContent = new Date().getFullYear();
        
        // Aplicar el tema guardado
        applyTheme();
        
        // Cargar registros
        cargarRegistros();
        
        // Configurar event listeners
        setupEventListeners();
    }

    function applyTheme() {
        document.documentElement.setAttribute("data-theme", currentTheme);
        localStorage.setItem("theme", currentTheme);
        
        // Actualizar icono del tema
        const icon = themeToggle.querySelector("i");
        icon.className = currentTheme === "dark" ? "fas fa-sun" : "fas fa-moon";
    }

    function setupEventListeners() {
        // Formulario de compra
        compraForm.addEventListener("submit", handleSubmitCompra);
        
        // Formulario de edición
        editarForm.addEventListener("submit", handleSubmitEdicion);
        
        // Botón de PDF
        generarPDFBtn.addEventListener("click", generarPDF);
        
        // Filtros
        filtroGenero.addEventListener("change", filtrarRegistros);
        filtroTalla.addEventListener("change", filtrarRegistros);
        
        // Modal
        closeModal.addEventListener("click", () => editarModal.style.display = "none");
        
        // Tabs de resumen
        summaryTabs.forEach(tab => {
            tab.addEventListener("click", () => {
                summaryTabs.forEach(t => t.classList.remove("active"));
                tab.classList.add("active");
                
                document.querySelectorAll(".summary-content").forEach(content => {
                    content.classList.remove("active");
                });
                
                document.getElementById(`${tab.dataset.tab}-tab`).classList.add("active");
            });
        });
        
        // Toggle de tema
        themeToggle.addEventListener("click", toggleTheme);
        
        // Clic fuera del modal
        window.addEventListener("click", (event) => {
            if (event.target === editarModal) {
                editarModal.style.display = "none";
            }
        });
        
        // Manejar clics en botones de acción (delegación de eventos)
        document.addEventListener("click", handleActionClicks);
    }

    function toggleTheme() {
        currentTheme = currentTheme === "light" ? "dark" : "light";
        applyTheme();
    }

    function handleActionClicks(e) {
        // Botón de editar
        if (e.target.closest(".action-btn.edit-btn") || e.target.classList.contains("edit-btn")) {
            const id = e.target.closest(".action-btn")?.dataset.id || e.target.dataset.id;
            if (id) cargarDatosParaEditar(id);
        }
        
        // Botón de eliminar
        if (e.target.closest(".action-btn.delete-btn") || e.target.classList.contains("delete-btn")) {
            const id = e.target.closest(".action-btn")?.dataset.id || e.target.dataset.id;
            if (id) confirmarEliminar(id);
        }
    }

    async function handleSubmitCompra(e) {
        e.preventDefault();
        
        const nombre = document.getElementById("nombre").value;
        const talla = document.getElementById("talla").value;
        const genero = document.getElementById("genero").value;
        const abono = parseFloat(document.getElementById("abono").value) || 0;
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
            showNotification("Compra registrada exitosamente", "success");
        } catch (error) {
            console.error("Error al guardar:", error);
            showNotification("Error al registrar la compra", "error");
        }
    }

    async function handleSubmitEdicion(e) {
        e.preventDefault();
        
        const id = document.getElementById("editarId").value;
        const nombre = document.getElementById("editarNombre").value;
        const talla = document.getElementById("editarTalla").value;
        const genero = document.getElementById("editarGenero").value;
        const nuevoAbono = parseFloat(document.getElementById("editarAbono").value) || 0;
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
            showNotification("Registro actualizado exitosamente", "success");
        } catch (error) {
            console.error("Error al actualizar:", error);
            showNotification("Error al actualizar el registro", "error");
        }
    }

    async function cargarRegistros() {
        const query = new Parse.Query(Playera);
        query.descending("createdAt");
        
        try {
            const results = await query.find();
            registros = results;
            filtrarRegistros();
        } catch (error) {
            console.error("Error al cargar registros:", error);
            showNotification("Error al cargar los registros", "error");
        }
    }

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

    function mostrarRegistros(registros) {
        const tbody = document.getElementById("registrosBody");
        tbody.innerHTML = "";
        
        registros.forEach((reg, index) => {
            const totalAbonado = reg.get("totalAbonado") || 0;
            const restante = Math.max(0, 200 - totalAbonado);
            const estado = totalAbonado >= 200 ? "Pagado" : "Pendiente";
            
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${reg.get("nombre")}</td>
                <td class="text-center">${reg.get("talla")}</td>
                <td class="text-center">${reg.get("genero")}</td>
                <td class="text-right">$${totalAbonado.toFixed(2)}</td>
                <td class="text-right">$${restante.toFixed(2)}</td>
                <td class="text-center">
                    <span class="status-badge ${estado === 'Pagado' ? 'status-paid' : 'status-pending'}">
                        ${estado}
                    </span>
                </td>
                <td class="text-center actions-cell">
                    <button class="action-btn edit-btn" data-id="${reg.id}" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${reg.id}" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    async function cargarDatosParaEditar(id) {
        const query = new Parse.Query(Playera);
        
        try {
            const playera = await query.get(id);
            
            document.getElementById("editarId").value = playera.id;
            document.getElementById("editarNombre").value = playera.get("nombre");
            document.getElementById("editarTalla").value = playera.get("talla");
            document.getElementById("editarGenero").value = playera.get("genero");
            document.getElementById("editarAbono").value = playera.get("totalAbonado") || 0;
            
            editarModal.style.display = "block";
        } catch (error) {
            console.error("Error al cargar datos para editar:", error);
            showNotification("Error al cargar datos para editar", "error");
        }
    }

    async function confirmarEliminar(id) {
        if (confirm("¿Está seguro de eliminar este registro?")) {
            const query = new Parse.Query(Playera);
            
            try {
                const playera = await query.get(id);
                await playera.destroy();
                await cargarRegistros();
                showNotification("Registro eliminado", "success");
            } catch (error) {
                console.error("Error al eliminar:", error);
                showNotification("Error al eliminar el registro", "error");
            }
        }
    }

    function actualizarResumen() {
        // Calcular totales
        let totalAbonado = 0;
        let totalPlayeras = registrosFiltrados.length;
        let totalAPagar = totalPlayeras * 200;
        
        registrosFiltrados.forEach(reg => {
            totalAbonado += reg.get("totalAbonado") || 0;
        });
        
        const totalPendiente = Math.max(0, totalAPagar - totalAbonado);
        
        // Actualizar totales
        document.getElementById("totalPlayeras").textContent = totalPlayeras;
        document.getElementById("totalAbonado").textContent = `$${totalAbonado.toFixed(2)}`;
        document.getElementById("totalPendiente").textContent = `$${totalPendiente.toFixed(2)}`;
        document.getElementById("totalAPagar").textContent = `$${totalAPagar.toFixed(2)}`;
        
        // Actualizar resumen de tallas
        actualizarResumenTallas();
    }

    function actualizarResumenTallas() {
        const tallasHombre = {
            "EXTRA CHICA": 0,
            "CHICA": 0,
            "MEDIANA": 0,
            "GRANDE": 0,
            "EXTRA GRANDE": 0,
            "EXTRA EXTRA GRANDE": 0
        };
        
        const tallasMujer = { ...tallasHombre };
        
        registrosFiltrados.forEach(reg => {
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
                <div class="size-item">
                    <span class="size-label">${talla}</span>
                    <span class="size-count">${count}</span>
                </div>
            `).join("");
        
        // Actualizar HTML para Mujer
        const contenedorMujer = document.getElementById("tallasMujer");
        contenedorMujer.innerHTML = Object.entries(tallasMujer)
            .map(([talla, count]) => `
                <div class="size-item">
                    <span class="size-label">${talla}</span>
                    <span class="size-count">${count}</span>
                </div>
            `).join("");
    }

    function showNotification(message, type) {
        const notification = document.getElementById("notification");
        notification.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
        notification.className = `notification ${type} show`;
        
        setTimeout(() => {
            notification.classList.remove("show");
        }, 3000);
    }

    function generarPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Título
        doc.setFontSize(18);
        doc.setTextColor(67, 97, 238);
        doc.text('Reporte de Playeras', 105, 20, { align: 'center' });
        
        // Subtítulo
        doc.setFontSize(14);
        doc.setTextColor(100, 100, 100);
        doc.text('Matrimonios de Nazaret', 105, 28, { align: 'center' });
        
        // Fecha
        doc.setFontSize(10);
        doc.text(`Generado el: ${new Date().toLocaleDateString('es-MX')}`, 105, 35, { align: 'center' });
        
        // Filtros aplicados
        const genero = filtroGenero.value || 'Todos';
        const talla = filtroTalla.value || 'Todas';
        doc.text(`Filtros: Género - ${genero}, Talla - ${talla}`, 105, 42, { align: 'center' });
        
        // Totales
        let totalAbonado = 0;
        let totalPlayeras = registrosFiltrados.length;
        let totalAPagar = totalPlayeras * 200;
        
        registrosFiltrados.forEach(reg => {
            totalAbonado += reg.get("totalAbonado") || 0;
        });
        
        const totalPendiente = Math.max(0, totalAPagar - totalAbonado);
        
        doc.setFontSize(11);
        doc.text(`Total playeras: ${totalPlayeras}`, 20, 50);
        doc.text(`Total a pagar: $${totalAPagar.toFixed(2)}`, 70, 50);
        doc.text(`Total abonado: $${totalAbonado.toFixed(2)}`, 120, 50);
        doc.text(`Total pendiente: $${totalPendiente.toFixed(2)}`, 170, 50);
        
        // Tabla
        const headers = [
            "Nombre", 
            "Talla", 
            "Género", 
            "Abonado", 
            "Restante",
            "Estado"
        ];
        
        const rows = registrosFiltrados.map(reg => {
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
        
        // Agregar tabla
        doc.autoTable({
            head: [headers],
            body: rows,
            startY: 60,
            styles: {
                fontSize: 9,
                cellPadding: 3,
                halign: 'center'
            },
            headStyles: {
                fillColor: [67, 97, 238],
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
                    'Página ' + data.pageCount,
                    data.settings.margin.left,
                    doc.internal.pageSize.height - 10
                );
            }
        });
        
        // Guardar PDF
        const fecha = new Date().toISOString().split('T')[0];
        doc.save(`Reporte_Playeras_${fecha}.pdf`);
    }
});
