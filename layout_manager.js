/* global THREE, layoutManager, geoEngine */
class InteractiveLayoutManager {
    constructor() {
        this.pieces = []; this.selectedPiece = null; 
        this.isDragging = false; this.isRotating = false;
        this.zoomLevel = 0.4; this.panX = 30; this.panY = 30;
        this.colors = ['#bae6fd', '#bbf7d0', '#fef08a', '#fecaca', '#e9d5ff', '#fed7aa'];
        this.initEvents();
        // Ensure initial sheet is rendered
        setTimeout(() => this.render(), 100);
    }

    initEvents() {
        const zone = document.getElementById('layoutZone');
        if(!zone) return;
        
        // Removed wheel zoom and background panning to keep sheet rigidly sized and positioned

        zone.addEventListener('mousedown', (e) => { 
            const pieceEl = e.target.closest('.layout-piece');
            if(pieceEl) { 
                // Handled implicitly by onmousedown inline handler inside the piece
            } else {
                // Background panning
                this.isPanningBackground = true;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                zone.style.cursor = 'grabbing';
            }
        });
        window.addEventListener('mousemove', (e) => {
            if (this.isRotating && this.selectedPiece) {
                const svg = document.querySelector('#layoutZone svg');
                const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
                const g = svg.querySelector('g');
                const spt = pt.matrixTransform(g.getScreenCTM().inverse());
                
                const cx = this.selectedPiece.x + this.selectedPiece.width / 2;
                const cy = this.selectedPiece.y + this.selectedPiece.height / 2;
                
                const angle = Math.atan2(spt.y - cy, spt.x - cx) * 180 / Math.PI;
                const oldRot = this.selectedPiece.rotation;
                
                let newRot = (angle - this.rotateStartAngle + this.initialPieceRotation) % 360;
                if(newRot < 0) newRot += 360;
                
                // Track if we moved enough to be a drag
                if (Math.abs(newRot - oldRot) > 2) this.rotateMoved = true;

                // Snapping if Shift key is pressed
                if (e.shiftKey) newRot = Math.round(newRot / 15) * 15;

                this.selectedPiece.rotation = newRot;
                this.checkCollisions(this.selectedPiece);
                this.render();
            } else if (this.isDragging && this.selectedPiece) {
                const svg = document.querySelector('#layoutZone svg');
                const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
                const g = svg.querySelector('g');
                const spt = pt.matrixTransform(g.getScreenCTM().inverse());
                
                const oldX = this.selectedPiece.x;
                const oldY = this.selectedPiece.y;
                
                // Check if we are currently in a bad state (Deadlock Recovery)
                const isCurrentlyCollidingX = this.checkCollisions(this.selectedPiece);
                
                const targetX = spt.x - this.dragOffset.x;
                const targetY = spt.y - this.dragOffset.y;

                // Try X movement
                this.selectedPiece.x = targetX;
                // Only block if we WERE safe and now we ATT attempt to enter a collision
                if (!isCurrentlyCollidingX && this.checkCollisions(this.selectedPiece)) {
                    this.selectedPiece.x = oldX;
                }

                const isCurrentlyCollidingY = this.checkCollisions(this.selectedPiece);
                // Try Y movement
                this.selectedPiece.y = targetY;
                if (!isCurrentlyCollidingY && this.checkCollisions(this.selectedPiece)) {
                    this.selectedPiece.y = oldY;
                }

                // Final status check for state persistence
                this.checkCollisions(this.selectedPiece);
                this.render();
            } else if (this.isPanningBackground) {
                const dx = (e.clientX - this.lastMouseX) / this.zoomLevel;
                const dy = (e.clientY - this.lastMouseY) / this.zoomLevel;
                this.panX += dx;
                this.panY += dy;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                this.render();
            }
        });
        window.addEventListener('mouseup', () => { 
            if (this.isRotating && !this.rotateMoved && this.selectedPiece) {
                // Was a quick click, rotate by 90 degrees
                this.selectedPiece.rotation = (Math.round(this.selectedPiece.rotation / 90) * 90 + 90) % 360;
                this.checkCollisions(this.selectedPiece);
            }
            this.isDragging = false; 
            this.isRotating = false;
            this.isPanningBackground = false; 
            const zone = document.getElementById('layoutZone');
            if(zone) zone.style.cursor = 'default';
            this.render();
        });
    }

    getAlphaIndex(n) {
        let alpha = "";
        while (n > 0) {
            let m = (n - 1) % 26;
            alpha = String.fromCharCode(65 + m) + alpha;
            n = Math.floor((n - m) / 26);
        }
        return alpha || "A";
    }

    addPiece(data) {
        if(!this.counters) this.counters = {};
        let prefix = data.label.substring(0,3).toUpperCase();
        this.counters[prefix] = (this.counters[prefix] || 0) + 1;
        let suffix = this.getAlphaIndex(this.counters[prefix]);
        let labelName = `${prefix}-${suffix}`;
        
        const enableEngrave = document.getElementById('enableEngrave')?.checked || false;
        let finalContent = data.content;
        
        if (enableEngrave) {
            let cx = data.width / 2;
            let cy = data.height / 2;
            let textNode = `<text x="${cx}" y="${cy}" text-anchor="middle" fill="none" stroke="#eab308" font-size="24" font-weight="bold" vector-effect="non-scaling-stroke">${labelName}</text>`;
            finalContent = finalContent.replace('</g></svg>', `${textNode}</g></svg>`);
        }

        const p = { 
            id: Date.now() + Math.random().toString().substring(2,6), 
            ...data, 
            content: finalContent, 
            labelName: labelName, 
            x: 50, 
            y: 50, 
            rotation: 0, 
            holes: data.holes || [],
            color: this.colors[this.pieces.length % this.colors.length] 
        };

        const sw = parseFloat(document.getElementById('sheetW').value) || 2440;
        const sh = parseFloat(document.getElementById('sheetH').value) || 1220;

        // If piece is wider than the sheet, clamp to sheet width (can't be placed normally)
        if (p.width > sw) p.width = sw;
        if (p.height > sh) p.height = sh;
        
        let attempts = 0;
        const maxAttempts = 200;
        
        while (this.checkCollisions(p) && attempts < maxAttempts) {
            p.x += p.width + 10;
            if (p.x + p.width > sw) {
                p.x = 10;
                p.y += p.height + 10;
            }
            if (p.y + p.height > sh) {
                // No room on this sheet, start a new one
                const lastSheet = this.sheetDefs[this.sheetDefs.length - 1];
                const newOffX = lastSheet ? (lastSheet.offsetX + lastSheet.w + 150) : 0;
                p.x = newOffX + 10;
                p.y = 10;
                break;
            }
            attempts++;
        }
        // Properly reflect whether the final position still collides
        this.checkCollisions(p);

        this.pieces.push(p); 
        this.selectedPiece = p; 
        this.render();
    }
    
    autoNestPieces() {
        const sw = parseFloat(document.getElementById('sheetW').value) || 2440;
        const sh = parseFloat(document.getElementById('sheetH').value) || 1220;
        const grainLock = document.getElementById('grainLock')?.checked || false;
        const padding = 10; // Spacing between pieces

        if (this.pieces.length === 0) return;

        // Sort by area (descending) for better packing
        let sorted = [...this.pieces].sort((a, b) => (b.width * b.height) - (a.width * a.height));
        let sheets = [];

        sorted.forEach(p => {
            let bestFit = null;
            let possibleRotations = grainLock ? [0, 180] : [0, 90, 180, 270];

            // 1. Try filling HOLES of already placed pieces
            sheets.forEach(sheet => {
                this.pieces.filter(prev => prev.x >= sheet.offsetX && prev.x < sheet.offsetX + sheet.w).forEach(prev => {
                    // Only support hole-nesting for orthogonal parents to keep it stable
                    if (prev.rotation % 90 === 0 && prev.holes && prev.holes.length > 0) {
                        prev.holes.forEach(hole => {
                            // Calculate hole world-space AABB based on parent rotation
                            let hw = hole.w, hh = hole.h, hx = hole.x, hy = hole.y;
                            if (prev.rotation === 90) { hx = prev.height - hole.y - hole.h; hy = hole.x; hw = hole.h; hh = hole.w; }
                            else if (prev.rotation === 180) { hx = prev.width - hole.x - hole.w; hy = prev.height - hole.y - hole.h; }
                            else if (prev.rotation === 270) { hx = hole.y; hy = prev.width - hole.x - hole.w; hw = hole.h; hh = hole.w; }

                            possibleRotations.forEach(rot => {
                                let pw = (rot % 180 !== 0) ? p.height : p.width;
                                let ph = (rot % 180 !== 0) ? p.width : p.height;

                                if ((pw + padding) <= hw && (ph + padding) <= hh) {
                                    let waste = hw - (pw + padding);
                                    if (bestFit === null || waste < bestFit.wastedWidth) {
                                        bestFit = { type: 'HOLE', parent: prev, holeX: hx, holeY: hy, rot, wastedWidth: waste, pw, ph };
                                    }
                                }
                            });
                        });
                    }
                });
            });

            // 2. Try SHELVES and NEW_SHELF (Existing logic)
            if (!bestFit) {
                sheets.forEach((sheet, sIdx) => {
                    sheet.shelves.forEach((shelf, shIdx) => {
                        possibleRotations.forEach(rot => {
                            let pw = (rot % 180 !== 0) ? p.height : p.width;
                            let ph = (rot % 180 !== 0) ? p.width : p.height;
                            if (shelf.availW >= (pw + padding) && shelf.availH >= (ph + padding)) {
                                let waste = shelf.availW - (pw + padding);
                                if (bestFit === null || waste < bestFit.wastedWidth) {
                                    bestFit = { type: 'SHELF', sIdx, shIdx, rot, wastedWidth: waste, pw, ph };
                                }
                            }
                        });
                    });

                    possibleRotations.forEach(rot => {
                        let pw = (rot % 180 !== 0) ? p.height : p.width;
                        let ph = (rot % 180 !== 0) ? p.width : p.height;
                        if ((pw + padding) <= sheet.w && (sheet.currentY + ph + padding) <= sheet.h) {
                            let waste = sheet.w - (pw + padding);
                            if (bestFit === null || (bestFit.type === 'NEW_SHELF' && waste < bestFit.wastedWidth)) {
                                bestFit = { type: 'NEW_SHELF', sIdx, rot, wastedWidth: waste, pw, ph };
                            }
                        }
                    });
                });
            }

            if (bestFit) {
                let targetX = 0;
                let targetY = 0;
                if (bestFit.type === 'HOLE') {
                    targetX = bestFit.parent.x + bestFit.holeX;
                    targetY = bestFit.parent.y + bestFit.holeY;
                } else if (bestFit.type === 'SHELF') {
                    const sheet = sheets[bestFit.sIdx];
                    const shelf = sheet.shelves[bestFit.shIdx];
                    targetX = sheet.offsetX + shelf.x;
                    targetY = shelf.y;
                    shelf.x += bestFit.pw + padding;
                    shelf.availW -= bestFit.pw + padding;
                } else {
                    const sheet = sheets[bestFit.sIdx];
                    const nS = { x: bestFit.pw + padding, y: sheet.currentY, availW: sheet.w - (bestFit.pw + padding), availH: bestFit.ph + padding };
                    targetX = sheet.offsetX + 0;
                    targetY = sheet.currentY;
                    sheet.shelves.push(nS);
                    sheet.currentY += bestFit.ph + padding;
                }
                
                if (bestFit.rot % 180 !== 0) {
                    targetX += (p.height - p.width) / 2;
                    targetY += (p.width - p.height) / 2;
                }
                p.x = targetX;
                p.y = targetY;
                p.rotation = bestFit.rot;
                
            } else {
                let rot = 0; let pw = p.width, ph = p.height;
                if(!grainLock && (pw > sw || ph > sh) && (ph <= sw && pw <= sh)) { rot = 90; pw = p.height; ph = p.width; }
                let isScr = sheets.length === 0 && (document.getElementById('useScrap')?.checked || false);
                let w = isScr ? (parseFloat(document.getElementById('scrapW')?.value) || 1000) : sw;
                let h = isScr ? (parseFloat(document.getElementById('scrapH')?.value) || 1220) : sh;
                let lastX = sheets.length > 0 ? (sheets[sheets.length-1].offsetX + sheets[sheets.length-1].w + 150) : 0;
                let nSheet = { offsetX: lastX, currentY: ph + padding, w: w, h: h, isScrap: isScr, shelves: [ {x: pw + padding, y: 0, availW: w - (pw + padding), availH: ph + padding } ] };
                sheets.push(nSheet);
                
                let targetX = nSheet.offsetX;
                let targetY = 0;
                if (rot % 180 !== 0) {
                    targetX += (p.height - p.width) / 2;
                    targetY += (p.width - p.height) / 2;
                }
                p.x = targetX;
                p.y = targetY;
                p.rotation = rot;
            }
            p.hasCollision = false;
        });
        
        this.sheetCount = sheets.length;
        this.resetView();
    }

    removePiece(id) { 
        const pieceId = String(id);
        this.pieces = this.pieces.filter(p => p.id !== pieceId); 
        this.selectedPiece = null; 
        this.render(); 
    }
    
    handleRotateStart(e, id) {
        e.stopPropagation();
        const pieceId = String(id);
        this.selectedPiece = this.pieces.find(p => p.id === pieceId);
        if (!this.selectedPiece) return;
        this.isRotating = true;

        const svg = document.querySelector('#layoutZone svg');
        const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
        const g = svg.querySelector('g');
        const spt = pt.matrixTransform(g.getScreenCTM().inverse());

        const cx = this.selectedPiece.x + this.selectedPiece.width / 2;
        const cy = this.selectedPiece.y + this.selectedPiece.height / 2;
        
        this.rotateStartAngle = Math.atan2(spt.y - cy, spt.x - cx) * 180 / Math.PI;
        this.initialPieceRotation = this.selectedPiece.rotation;
        this.rotateMoved = false;
    }

    handleMouseDown(e, id) {
        e.stopPropagation(); 
        const pieceId = String(id);
        this.selectedPiece = this.pieces.find(p => p.id === pieceId); 
        if (!this.selectedPiece) return;
        this.isDragging = true;
        // Move to top of stack for better UX
        this.pieces = [...this.pieces.filter(p => p.id !== pieceId), this.selectedPiece];
        
        const svg = document.querySelector('#layoutZone svg');
        const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
        
        // Critical: Must use the transformed <g> group's CTM so drag matches scale and pan
        const g = svg.querySelector('g');
        const spt = pt.matrixTransform(g.getScreenCTM().inverse());
        
        this.dragOffset = { x: spt.x - this.selectedPiece.x, y: spt.y - this.selectedPiece.y };
        this.render();
    }

    getPieceBounds(p) {
        const rad = p.rotation * Math.PI / 180;
        const cos = Math.abs(Math.cos(rad));
        const sin = Math.abs(Math.sin(rad));
        
        const pw = p.width * cos + p.height * sin;
        const ph = p.width * sin + p.height * cos;
        
        // Center-based calculation for rotated bounds
        const cx = p.x + p.width / 2;
        const cy = p.y + p.height / 2;
        
        return { 
            x1: cx - pw / 2, 
            y1: cy - ph / 2, 
            x2: cx + pw / 2, 
            y2: cy + ph / 2 
        };
    }

    getWorldVertices(p) {
        if (!p.vertices || p.vertices.length < 3) return null;
        const cx = p.x + p.width / 2;
        const cy = p.y + p.height / 2;
        const rad = (p.rotation * Math.PI) / 180;
        const cos = Math.cos(rad), sin = Math.sin(rad);
        return p.vertices.map(v => {
            const lx = v[0] - p.width/2;
            const ly = v[1] - p.height/2;
            return { x: cx + (lx * cos - ly * sin), y: cy + (lx * sin + ly * cos) };
        });
    }

    lineIntersect(a, b, c, d) {
        const det = (b.x-a.x)*(d.y-c.y) - (b.y-a.y)*(d.x-c.x);
        if (det === 0) return false;
        const lambda = ((d.y-c.y)*(d.x-a.x) + (c.x-d.x)*(d.y-a.y)) / det;
        const gamma = ((a.y-b.y)*(d.x-a.x) + (b.x-a.x)*(d.y-a.y)) / det;
        return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
    }

    pointInPoly(pt, poly) {
        let inside = false;
        for (let i=0, j=poly.length-1; i<poly.length; j=i++) {
            if (((poly[i].y > pt.y) != (poly[j].y > pt.y)) &&
                (pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x)) inside = !inside;
        }
        return inside;
    }

    checkCollisions(p) { // POLYGONAL ENGINE
        const b1 = this.getPieceBounds(p);
        let collision = false;
        const polyP = this.getWorldVertices(p);
        const EPS = 0.5;

        for(let other of this.pieces) {
            if(other.id === p.id) continue;
            const b2 = this.getPieceBounds(other);
            if(b1.x1 < b2.x2 - EPS && b1.x2 > b2.x1 + EPS && b1.y1 < b2.y2 - EPS && b1.y2 > b2.y1 + EPS) {
                const polyO = this.getWorldVertices(other);
                if (polyP && polyO) {
                    let polyIntersect = false;
                    for(let i=0; i<polyP.length; i++) {
                        const p1 = polyP[i], p2 = polyP[(i+1)%polyP.length];
                        for(let j=0; j<polyO.length; j++) {
                            const o1 = polyO[j], o2 = polyO[(j+1)%polyO.length];
                            if (this.lineIntersect(p1, p2, o1, o2)) { polyIntersect = true; break; }
                        }
                        if (polyIntersect) break;
                    }
                    if (!polyIntersect && (this.pointInPoly(polyP[0], polyO) || this.pointInPoly(polyO[0], polyP))) polyIntersect = true;
                    if (polyIntersect) { collision = true; break; }
                } else { collision = true; break; }
            }
        }
        if(!collision) {
            const sw = parseFloat(document.getElementById('sheetW').value) || 2440;
            const sh = parseFloat(document.getElementById('sheetH').value) || 1220;
            if(!this.sheetDefs || this.sheetDefs.length === 0) this.sheetDefs = [{ offsetX: 0, w: sw, h: sh }];
            let inSheet = false;
            for(let s of this.sheetDefs) {
                if(b1.x1 >= s.offsetX - EPS && b1.x2 <= (s.offsetX + s.w) + EPS && b1.y1 >= -EPS && b1.y2 <= s.h + EPS) {
                    inSheet = true; break;
                }
            }
            if(!inSheet) collision = true;
        }

        p.hasCollision = collision;
        return collision;
    }

    render() {
        const zone = document.getElementById('layoutZone');
        if(!zone) return;
        const sw = parseFloat(document.getElementById('sheetW').value) || 2440;
        const sh = parseFloat(document.getElementById('sheetH').value) || 1220;
        
        // Determine actual sheets dynamically based on placement
        this.sheetDefs = [];
        let sortedPieces = [...this.pieces].sort((a,b) => a.x - b.x);
        
        let csw = parseFloat(document.getElementById('useScrap')?.checked ? document.getElementById('scrapW').value : sw) || sw;
        let csh = parseFloat(document.getElementById('useScrap')?.checked ? document.getElementById('scrapH').value : sh) || sh;
        
        // Ensure at least 1 sheet exists for rendering
        if(this.pieces.length === 0) {
            this.sheetDefs.push({ offsetX: 0, w: csw, h: csh, isScrap: document.getElementById('useScrap')?.checked });
        } else {
            let lastIdx = -1;
            sortedPieces.forEach(p => {
                let sIdx = 0;
                let tempX = p.x;
                let testOffX = 0;
                
                // Track what sheets we are jumping based on 150 margin increments
                while(tempX > (testOffX + (sIdx===0 && document.getElementById('useScrap')?.checked ? csw : sw))) {
                    testOffX += (sIdx===0 && document.getElementById('useScrap')?.checked ? csw : sw) + 150;
                    sIdx++;
                }

                while(this.sheetDefs.length <= sIdx) {
                    let isScrap = this.sheetDefs.length === 0 && document.getElementById('useScrap')?.checked;
                    let w = isScrap ? parseFloat(document.getElementById('scrapW').value) || 1000 : sw;
                    let h = isScrap ? parseFloat(document.getElementById('scrapH').value) || 1220 : sh;
                    let lastX = this.sheetDefs.length > 0 ? (this.sheetDefs[this.sheetDefs.length-1].offsetX + this.sheetDefs[this.sheetDefs.length-1].w + 150) : 0;
                    this.sheetDefs.push({ offsetX: lastX, w: w, h: h, isScrap: isScrap });
                }
            });
        }
        
        const numSheets = this.sheetDefs.length;

        let totalPieceArea = 0;
        this.pieces.forEach(p => totalPieceArea += (p.width * p.height) / 1000000);
        let totalSheetArea = 0;
        this.sheetDefs.forEach(s => totalSheetArea += (s.w * s.h) / 1000000);
        
        const usage = (totalPieceArea / totalSheetArea) * 100;
        const stats = document.getElementById('nestingStats');
        if(stats) {
            stats.innerText = `Usage: ${usage.toFixed(1)}% (${totalPieceArea.toFixed(2)} / ${totalSheetArea.toFixed(2)} m²) | Sheets: ${numSheets}`;
            stats.className = `badge ${usage > 90 ? 'bg-danger' : usage > 70 ? 'bg-warning text-dark' : 'bg-dark text-cyan'} border border-secondary mx-2`;
        }

        let svg = `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="background:#0f172a; cursor: default">
            <defs>
                <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                    <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#ffffff08" stroke-width="1"/>
                </pattern>
            </defs>
            <g transform="translate(${this.panX * this.zoomLevel}, ${this.panY * this.zoomLevel}) scale(${this.zoomLevel})">
                <!-- Background Grid -->
                <rect x="-5000" y="-5000" width="20000" height="10000" fill="url(#grid)" />
                
                <!-- The Sheets -->
                ${this.sheetDefs.map((s, i) => {
                    return `
                    <rect x="${s.offsetX}" y="0" width="${s.w}" height="${s.h}" fill="${s.isScrap ? '#451a03' : '#1e293b'}" stroke="${s.isScrap ? '#eab308' : '#2dd4bf'}" stroke-width="5" stroke-dasharray="20,10" fill-opacity="0.5"/>
                    <text x="${s.offsetX + s.w/2}" y="${s.h+40}" text-anchor="middle" fill="${s.isScrap ? '#eab308' : '#2dd4bf'}" font-size="30">แผ่นที่ ${i+1}: ${s.w} x ${s.h} mm ${s.isScrap ? '(แผ่นเศษ)' : ''}</text>
                    `;
                }).join('')}`;

        this.pieces.forEach(p => {
            const sel = this.selectedPiece?.id === p.id;
            const cx = p.width / 2;
            const cy = p.height / 2;
            
            // Extract the pure SVG vector paths from the generated blueprint
            const vectors = p.content.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '');

            svg += `<g class="layout-piece" transform="translate(${p.x}, ${p.y}) rotate(${p.rotation}, ${cx}, ${cy})" 
                       onmousedown="layoutManager.handleMouseDown(event, '${p.id}')" style="cursor: move">
                <!-- Bounding Box -->
                <rect width="${p.width}" height="${p.height}" fill="${p.hasCollision ? '#f43f5e' : p.color}" fill-opacity="${p.hasCollision ? 0.3 : 0.1}" 
                      stroke="${p.hasCollision ? '#f43f5e' : (sel ? '#2dd4bf' : '#ffffff33')}" stroke-width="${sel || p.hasCollision ? 4 : 1}" rx="4" stroke-dasharray="${p.hasCollision ? 'none' : '10,5'}"/>
                
                <!-- Actual Piece Geometry -->
                <svg width="${p.width}" height="${p.height}" viewBox="0 0 ${p.width} ${p.height}" style="pointer-events:none">
                    ${vectors}
                </svg>

                <text x="${cx}" y="${cy}" text-anchor="middle" fill="white" font-size="28" font-weight="bold" style="pointer-events:none; text-shadow: 0 2px 4px rgba(0,0,0,0.8);">${p.label}</text>
                <text x="${cx}" y="${cy+35}" text-anchor="middle" fill="#2dd4bf" font-size="20" font-weight="bold" style="pointer-events:none; text-shadow: 0 2px 4px rgba(0,0,0,0.8);">${p.width.toFixed(0)}x${p.height.toFixed(0)}</text>
                
                <!-- Controls (Scaled for visibility) -->
                <g style="display: ${sel ? 'block' : 'none'}">
                    <circle cx="${p.width}" cy="0" r="25" fill="#f43f5e" style="cursor:pointer" onmousedown="event.stopPropagation(); layoutManager.removePiece('${p.id}')"/>
                    <text x="${p.width}" y="10" text-anchor="middle" fill="white" font-size="30" font-weight="bold" style="pointer-events:none">×</text>
                    
                    <circle cx="0" cy="0" r="25" fill="#22d3ee" style="cursor:pointer" onmousedown="layoutManager.handleRotateStart(event, '${p.id}')"/>
                    <path d="M -8 -8 A 12 12 0 1 1 8 8" fill="none" stroke="white" stroke-width="3" transform="translate(0,0)" style="pointer-events:none"/>
                </g>
            </g>`;
        });

        svg += `</g></svg>`;
        zone.innerHTML = svg;
    }

    downloadLayout() {
        if (this.pieces.length === 0 && (!this.sheetDefs || this.sheetDefs.length === 0)) return;
        
        // Calculate true bounds of ALL content (Pieces + Sheets)
        let minX = 0, minY = 0, maxX = 0, maxY = 0;
        
        this.sheetDefs.forEach(s => {
            maxX = Math.max(maxX, s.offsetX + s.w);
            maxY = Math.max(maxY, s.h);
        });
        
        this.pieces.forEach(p => {
            const b = this.getPieceBounds(p);
            minX = Math.min(minX, b.x1);
            minY = Math.min(minY, b.y1);
            maxX = Math.max(maxX, b.x2);
            maxY = Math.max(maxY, b.y2);
        });

        const totalW = maxX - minX;
        const totalH = maxY - minY;
        const pad = 10; // 10mm padding
        
        // Generate a pristine CNC-ready vector file
        let cleanSVG = `<svg viewBox="${minX-pad} ${minY-pad} ${totalW+pad*2} ${totalH+pad*2}" width="${totalW+pad*2}mm" height="${totalH+pad*2}mm" xmlns="http://www.w3.org/2000/svg">\n`;
        
        this.sheetDefs.forEach(s => {
            cleanSVG += `    <rect x="${s.offsetX}" y="0" width="${s.w}" height="${s.h}" fill="none" stroke="${s.isScrap ? '#eab308' : '#2dd4bf'}" stroke-width="2" stroke-dasharray="20,10"/>\n`;
        });
        
        this.pieces.forEach(p => {
            const cx = p.width / 2;
            const cy = p.height / 2;
            const vectors = p.content.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '');
            
            cleanSVG += `    <g id="Piece_${p.id}_${p.labelName.replace(/\s+/g,'_')}" transform="translate(${p.x}, ${p.y}) rotate(${p.rotation}, ${cx}, ${cy})">\n`;
            cleanSVG += `        ${vectors}\n`;
            cleanSVG += `    </g>\n`;
        });
        cleanSVG += `</svg>`;

        const blob = new Blob([cleanSVG], {type: 'image/svg+xml'});
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ACFold_Nesting_CNC_Output.svg'; a.click();
    }

    downloadNestingDXF() {
        if (this.pieces.length === 0 && (!this.sheetDefs || this.sheetDefs.length === 0)) return;
        const dVersion = document.getElementById('dxfVersion') ? document.getElementById('dxfVersion').value : 'R12';
        const dEx = new EnterpriseDXF(dVersion);

        this.sheetDefs.forEach(s => {
            let pts = [
                {x: s.offsetX, y: 0}, {x: s.offsetX+s.w, y: 0},
                {x: s.offsetX+s.w, y: s.h}, {x: s.offsetX, y: s.h}
            ];
            dEx.addPolyline('Layer_SHEET', pts, true);
        });

        this.pieces.forEach(p => {
            const cx = p.width / 2;
            const cy = p.height / 2;
            const parser = new DOMParser();
            const doc = parser.parseFromString(p.content, 'image/svg+xml');
            
            ['line', 'path', 'circle', 'text'].forEach(tag => {
                doc.querySelectorAll(tag).forEach(el => {
                    let layer = '';
                    const stroke = el.getAttribute('stroke');
                    if (stroke === '#10b981') layer = 'Layer_CUT'; 
                    else if (stroke === '#38bdf8') layer = 'Layer_V-GROOVE';
                    else if (stroke === '#fbbf24') layer = 'Layer_HOLE'; 
                    else if (tag === 'circle') layer = 'Layer_HOLE';
                    else if (tag === 'path') layer = 'Layer_CUT';
                    else if (tag === 'text') layer = 'Layer_ENGRAVE';
                    
                    if(layer !== '') {
                        dEx.addSvgToDXF(layer, el, p.x, p.y, p.rotation, cx, cy);
                    }
                });
            });
        });

        dEx.exportDXF(`ACFold_Nesting_CNC_${dVersion}.dxf`);
    }

    resetView() {
        const zone = document.getElementById('layoutZone');
        if(!zone || !this.sheetDefs || this.sheetDefs.length === 0) return;
        
        const numSheets = this.sheetDefs.length;
        const totalW = this.sheetDefs[numSheets-1].offsetX + this.sheetDefs[numSheets-1].w;
        const maxH = Math.max(...this.sheetDefs.map(s => s.h));
        
        const pad = Math.min(zone.clientWidth, zone.clientHeight) * 0.05; // 5% padding
        const scaleX = (zone.clientWidth - pad * 2) / totalW;
        const scaleY = (zone.clientHeight - pad * 2) / maxH;
        
        this.zoomLevel = Math.max(0.01, Math.min(scaleX, scaleY, 1.5));
        
        this.panX = ((zone.clientWidth / this.zoomLevel) - totalW) / 2;
        this.panY = ((zone.clientHeight / this.zoomLevel) - maxH) / 2;
        
        this.render(); 
    }
    clearAll() { if(confirm('ต้องการล้างข้อมูลทั้งหมด?')) { this.pieces = []; this.selectedPiece = null; this.sheetCount = 1; this.render(); } }
}

