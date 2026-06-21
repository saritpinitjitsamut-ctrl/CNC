/* global CleanGeometryEngine, InteractiveLayoutManager, XLSX */

const geoEngine = new CleanGeometryEngine();
const layoutManager = new InteractiveLayoutManager();


window.addEventListener('load', () => {
    window.dispatchEvent(new Event('resize'));
    setTimeout(() => layoutManager.resetView(), 100);
});

window.addEventListener('resize', () => {
    if(layoutManager) layoutManager.resetView();
});

document.getElementById('btnExportExcel')?.addEventListener('click', () => {
    const data = layoutManager.pieces.map(p => ({
        Shape: p.label, Width: p.width.toFixed(1), Height: p.height.toFixed(1), Area_m2: (p.width * p.height / 1000000).toFixed(4)
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, "Production");
    XLSX.writeFile(workbook, "ACFold_Production_Report.xlsx");
});

document.getElementById('btnExportPdf')?.addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const shape = geoEngine.selectedShape;
    const date = new Date().toLocaleString('th-TH');

    // Header
    doc.setFillColor(11, 15, 26);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(45, 212, 191);
    doc.setFontSize(24);
    doc.text("ACFold Professional v2", 20, 25);
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(`Job Sheet • ${date}`, 20, 32);

    // 3D Snapshot
    const canvas = document.querySelector('#threeViewport canvas');
    if (canvas) {
        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 20, 50, 80, 60);
        doc.setDrawColor(45, 212, 191);
        doc.rect(20, 50, 80, 60);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text("3D Perspective View", 20, 115);
    }

    // Details Table
    doc.setFontSize(14);
    doc.text("Fabrication Details:", 110, 60);
    doc.setFontSize(10);
    doc.text(`Shape: ${shape}`, 110, 70);
    
    let details = [];
    if(shape === 'BOX' || shape === 'LCORNER' || shape === 'USHAPE') {
        details.push(`Width: ${document.getElementById('valW')?.value} mm`);
        details.push(`Depth/Width 2: ${document.getElementById('valD')?.value} mm`);
        details.push(`Height/Length: ${document.getElementById('valH')?.value} mm`);
    } else {
        details.push(`Size: ${document.getElementById('valL')?.value} mm`);
    }
    
    details.push(`Sheet Thickness: ${document.getElementById('sheetT').value} mm`);
    details.push(`K-Factor: ${document.getElementById('kFactor').value}`);
    details.push(`V-Deduction: ${document.getElementById('materialSummary').innerText.split('D = ')[1]?.split(' mm')[0] || 'N/A'} mm`);

    details.forEach((line, i) => {
        doc.text(`• ${line}`, 110, 80 + i*7);
    });

    // 2D Blueprint Section (Optional or summarized)
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 130, 190, 130);
    doc.text("Production Queue:", 20, 140);
    
    layoutManager.pieces.forEach((p, i) => {
        doc.text(`${i+1}. ${p.labelName}: ${p.width.toFixed(0)}x${p.height.toFixed(0)} mm`, 25, 150 + i*7);
    });

    doc.save(`ACFold_JobSheet_${shape}.pdf`);
});

document.getElementById('themeToggle')?.addEventListener('click', () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
});
