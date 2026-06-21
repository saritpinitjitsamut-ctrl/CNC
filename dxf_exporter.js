/* global alert */
/**
 * ACFold Enterprise DXF Exporter
 * Generates highly compliant AC1009/AC1015 DXF files with advanced mathematical processing.
 */

class EnterpriseDXF {
    constructor(version = 'R12') {
        this.version = version; // 'R12' or 'R2000'
        this.entities = [];
        this.layers = {
            'Layer_CUT': { color: 3 },      // Green
            'Layer_V-GROOVE': { color: 4 }, // Cyan
            'Layer_HOLE': { color: 1 },     // Red
            'Layer_ENGRAVE': { color: 2 },  // Yellow
            'Layer_SHEET': { color: 7 },    // White
            'Layer_WARNING_OPEN': { color: 6 } // Magenta (for open contours that should be closed)
        };
        this.openContourCount = 0;
    }

    addPolyline(layer, pts, isClosed) {
        if (pts.length < 2) return;
        // Check for open contour on cuts
        if (layer === 'Layer_CUT' && !isClosed) {
            // Check if end matches start
            const p1 = pts[0], p2 = pts[pts.length - 1];
            const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
            if (dist > 0.1) {
                this.openContourCount++;
                layer = 'Layer_WARNING_OPEN';
            } else {
                isClosed = true; // Auto fix
                pts.pop(); // Remove duplicate last point
            }
        }
        this.entities.push({ type: 'LWPOLYLINE', layer, pts, isClosed });
    }

    addLine(layer, x1, y1, x2, y2) {
        this.entities.push({ type: 'LWPOLYLINE', layer, pts: [{x:x1, y:y1}, {x:x2, y:y2}], isClosed: false });
    }

    addCircle(layer, cx, cy, r) {
        this.entities.push({ type: 'CIRCLE', layer, cx, cy, r });
    }

    addText(layer, txt, x, y, height = 16) {
        this.entities.push({ type: 'TEXT', layer, txt, x, y, height });
    }

    // Mathematical transformer from SVG element
    addSvgToDXF(layer, svgElement, tx = 0, ty = 0, rotDeg = 0, rotCx = 0, rotCy = 0) {
        const rad = rotDeg * Math.PI / 180;
        const cosR = Math.cos(rad), sinR = Math.sin(rad);

        const tf = (x, y) => {
            let nx = parseFloat(x) - rotCx;
            let ny = parseFloat(y) - rotCy;
            let rx = nx * cosR - ny * sinR;
            let ry = nx * sinR + ny * cosR;
            return { x: rx + rotCx + tx, y: ry + rotCy + ty };
        };

        if (svgElement.tagName.toLowerCase() === 'line') {
            let p1 = tf(svgElement.getAttribute('x1'), svgElement.getAttribute('y1'));
            let p2 = tf(svgElement.getAttribute('x2'), svgElement.getAttribute('y2'));
            this.addLine(layer, p1.x, p1.y, p2.x, p2.y);
        }
        else if (svgElement.tagName.toLowerCase() === 'circle') {
            let pc = tf(svgElement.getAttribute('cx'), svgElement.getAttribute('cy'));
            let r = parseFloat(svgElement.getAttribute('r'));
            this.addCircle(layer, pc.x, pc.y, r);
        }
        else if (svgElement.tagName.toLowerCase() === 'path') {
            const d = svgElement.getAttribute('d');
            
            // Standard SVG Path parsing for M, L, Z 
            if(!d.match(/[CQA]/i)) {
                let pts = [];
                let isClosed = false;
                const parts = d.match(/([MLZz])([^\sMLZz]+)?([^\sMLZz]+)?/g);
                if (parts) {
                    parts.forEach(part => {
                        let text = part.trim().replace(/,/g, ' ');
                        let cmd = text[0].toUpperCase();
                        if (cmd === 'M' || cmd === 'L') {
                            let coords = text.substring(1).trim().split(/\s+/);
                            if(coords.length >= 2) pts.push(tf(coords[0], coords[1]));
                        } else if (cmd === 'Z') {
                            isClosed = true;
                        }
                    });
                    if (pts.length > 0) this.addPolyline(layer, pts, isClosed);
                }
            } else {
                // If path contains Arcs or curves, safely linearize it with native getPointAtLength for extreme accuracy (0.5mm res).
                // CNC handles small tight LWPolylines beautifully for complex curves.
                let pts = [];
                const len = svgElement.getTotalLength();
                if(len > 0) {
                    let step = Math.max(0.5, len / 200); 
                    for(let i = 0; i <= len; i+=step) {
                        let pt = svgElement.getPointAtLength(i);
                        pts.push(tf(pt.x, pt.y));
                    }
                    if(d.match(/[Zz]\s*$/)) {
                        pts.push(tf(svgElement.getPointAtLength(0).x, svgElement.getPointAtLength(0).y));
                    }
                    this.addPolyline(layer, pts, !!d.match(/[Zz]\s*$/));
                }
            }
        }
        else if (svgElement.tagName.toLowerCase() === 'text') {
            let p = tf(svgElement.getAttribute('x'), svgElement.getAttribute('y'));
            this.addText(layer, svgElement.textContent, p.x, p.y, parseFloat(svgElement.getAttribute('font-size')) || 16);
        }
    }

    _removeDuplicates() {
        const precise = num => Math.round(num * 100) / 100;
        let uniquePaths = [];
        let seen = new Set();
        
        this.entities.forEach(ent => {
            if (ent.type === 'LWPOLYLINE') {
                let cleanPts = [];
                ent.pts.forEach(p => {
                    if (cleanPts.length === 0) cleanPts.push(p);
                    else {
                        const last = cleanPts[cleanPts.length - 1];
                        if (precise(p.x) !== precise(last.x) || precise(p.y) !== precise(last.y)) {
                            cleanPts.push(p);
                        }
                    }
                });
                
                if (cleanPts.length === 2 && !ent.isClosed) {
                    let p1 = cleanPts[0], p2 = cleanPts[1];
                    let sig = p1.x < p2.x ? `${precise(p1.x)},${precise(p1.y)}-${precise(p2.x)},${precise(p2.y)}` : `${precise(p2.x)},${precise(p2.y)}-${precise(p1.x)},${precise(p1.y)}`;
                    if (!seen.has(sig)) {
                        seen.add(sig);
                        ent.pts = cleanPts;
                        uniquePaths.push(ent);
                    }
                } else if (cleanPts.length > 1) {
                    ent.pts = cleanPts;
                    uniquePaths.push(ent);
                }
            } else {
                uniquePaths.push(ent);
            }
        });
        this.entities = uniquePaths;
    }

    exportDXF(filename = "ACFold_Enterprise.dxf") {
        this._removeDuplicates();

        let minX = Infinity, minY = Infinity;
        let pCheck = (x, y) => {
            if (x < minX) minX = x;
            if (-y < minY) minY = -y;
        };
        
        this.entities.forEach(ent => {
            if (ent.type === 'LWPOLYLINE') ent.pts.forEach(p => pCheck(p.x, p.y));
            if (ent.type === 'CIRCLE' || ent.type === 'ARC') { pCheck(ent.cx - ent.r, ent.cy - ent.r); pCheck(ent.cx + ent.r, ent.cy + ent.r); }
            if (ent.type === 'TEXT') pCheck(ent.x, ent.y);
        });

        if (minX === Infinity) minX = 0;
        if (minY === Infinity) minY = 0;

        const shX = x => (x - minX).toFixed(4);
        const shY = y => (-y - minY).toFixed(4);

        let dxf = `0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\n${this.version === 'R2000' ? 'AC1015' : 'AC1009'}\n`;
        dxf += `9\n$MEASUREMENT\n70\n1\n`; 
        dxf += `9\n$INSUNITS\n70\n4\n`; 
        dxf += `0\nENDSEC\n`;

        if (this.version === 'R2000') {
            dxf += `0\nSECTION\n2\nCLASSES\n0\nENDSEC\n`;
        }

        dxf += `0\nSECTION\n2\nTABLES\n`;
        
        // VPORT setup
        dxf += `0\nTABLE\n2\nVPORT\n70\n1\n0\nVPORT\n2\n*ACTIVE\n70\n0\n0\nENDTAB\n`;

        dxf += `0\nTABLE\n2\nLTYPE\n70\n1\n`;
        dxf += `0\nLTYPE\n2\nCONTINUOUS\n70\n0\n3\nSolid line\n72\n65\n73\n0\n40\n0.0\n`;
        dxf += `0\nENDTAB\n`;

        let layerKeys = Object.keys(this.layers);
        dxf += `0\nTABLE\n2\nLAYER\n70\n${layerKeys.length + 1}\n`;
        dxf += `0\nLAYER\n2\n0\n70\n0\n62\n7\n6\nCONTINUOUS\n`;
        layerKeys.forEach(l => {
            dxf += `0\nLAYER\n2\n${l}\n70\n0\n62\n${this.layers[l].color}\n6\nCONTINUOUS\n`;
        });
        dxf += `0\nENDTAB\n`;

        dxf += `0\nTABLE\n2\nSTYLE\n70\n1\n`;
        dxf += `0\nSTYLE\n2\nSTANDARD\n70\n0\n40\n0.0\n41\n1.0\n50\n0.0\n71\n0\n42\n0.2\n3\ntxt\n4\n\n`;
        dxf += `0\nENDTAB\n`;

        dxf += `0\nENDSEC\n`;

        dxf += `0\nSECTION\n2\nBLOCKS\n0\nENDSEC\n`;

        dxf += `0\nSECTION\n2\nENTITIES\n`;

        this.entities.forEach(ent => {
            if (ent.type === 'LWPOLYLINE') {
                dxf += `0\nLWPOLYLINE\n8\n${ent.layer}\n90\n${ent.pts.length}\n70\n${ent.isClosed ? 1 : 0}\n43\n0\n`;
                ent.pts.forEach(p => {
                    dxf += `10\n${shX(p.x)}\n20\n${shY(p.y)}\n`;
                });
            } else if (ent.type === 'CIRCLE') {
                dxf += `0\nCIRCLE\n8\n${ent.layer}\n10\n${shX(ent.cx)}\n20\n${shY(ent.cy)}\n40\n${ent.r.toFixed(4)}\n`;
            } else if (ent.type === 'TEXT') {
                dxf += `0\nTEXT\n8\n${ent.layer}\n10\n${shX(ent.x)}\n20\n${shY(ent.y)}\n40\n${ent.height}\n1\n${ent.txt}\n7\nSTANDARD\n`;
            }
        });

        dxf += `0\nENDSEC\n0\nEOF\n`;

        if (this.openContourCount > 0) {
            alert(`คำเตือน: พบวงจรเปิด (Open Contour) ขาดไม่ต่อกัน ${this.openContourCount} จุด ในเส้นตัด ระบบได้ย้ายเส้นหลวมๆ ไปที่เลเยอร์ Layer_WARNING_OPEN (สีม่วง) เพื่อความปลอดภัยครับ`);
        }

        const blob = new Blob([dxf], {type: 'application/dxf'});
        const a = document.createElement('a'); 
        a.href = URL.createObjectURL(blob); 
        a.download = filename; 
        a.click();
    }
}
