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
        const restante = reg.get("restante") || 200;
        const estado = restante <= 0 ? "Pagado" : "Pendiente";
        
        return [
            reg.get("nombre"),
            reg.get("talla"),
            reg.get("genero"),
            `$${totalAbonado.toFixed(2)}`,
            `$${Math.max(0, restante).toFixed(2)}`,
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