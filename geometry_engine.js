/**
 * ACFold Professional v2 Ultra - Core Application Logic
 */
/* global THREE */

class CleanGeometryEngine {
    constructor() {
        this.selectedShape = 'BOX';
        this.cornerType = 'BUTT';
        this.foldDirection = 'FRONT';
        this.tabMode = 'ALL';
        this.scene = null; this.camera = null; this.renderer = null; this.meshObj = null;
        this.zoomLevel = 1; this.panX = 0; this.panY = 0;
        this.foldProgress = 0; // 0 to 1 (0% to 100%)
        
        // Store hole definitions (x, y, z, radius)
        this.holes = [];
        this.dogBones = [];
        this.tabs = [];
        // Thickness of material (mm) – taken from sheet thickness input later
        this.materialThickness = 4;
        // New CNC feature flags and parameters
        this.enableDogBone = false;
        this.enableBreakawayTabs = false;
        this.enableEngrave = false;
        this.dogBoneRadius = 2; // mm
        this.tabWidth = 10; // mm
        this.tabHeight = 5; // mm
        this.tabSpacing = 30; // mm
        this.labelText = 'Demo';
        this.labelFontSize = 12; // pt
        this.labelX = 0;
        this.labelY = 0;        this.LETTER_PATHS = {
            'A': [
                [[20,100], [50,0], [80,100], [70,100], [55,50], [45,50], [30,100]], // Outer
                [[45,65], [55,65], [50,50]] // Inner Hole
            ],
            'B': [
                [[20,0], [60,0], [80,25], [80,45], [60,50], [80,55], [80,75], [60,100], [20,100]],
                [[30,10], [55,10], [65,25], [65,40], [55,45], [30,45]],
                [[30,55], [55,55], [65,65], [65,90], [55,90], [30,90]]
            ],
            'C': [[[80,20], [50,0], [20,20], [20,80], [50,100], [80,80], [80,65], [70,65], [70,75], [50,90], [30,75], [30,25], [50,10], [70,25], [70,35], [80,35]]],
            'D': [
                [[20,0], [60,0], [80,50], [60,100], [20,100]],
                [[30,10], [55,10], [70,50], [55,90], [30,90]]
            ],
            'E': [[[80,0], [20,0], [20,100], [80,100], [80,85], [35,85], [35,55], [70,55], [70,45], [35,45], [35,15], [80,15]]],
            'F': [[[80,0], [20,0], [20,100], [35,100], [35,55], [70,55], [70,45], [35,45], [35,15], [80,15]]],
            'G': [[[80,20], [50,0], [20,20], [20,80], [50,100], [80,80], [80,50], [50,50], [50,60], [70,60], [70,75], [50,90], [30,75], [30,25], [50,10], [70,25], [70,35], [80,35]]],
            'H': [[[20,0], [35,0], [35,45], [65,45], [65,0], [80,0], [80,100], [65,100], [65,55], [35,55], [35,100], [20,100]]],
            'I': [[[35,0], [65,0], [65,10], [55,10], [55,90], [65,90], [65,100], [35,100], [35,90], [45,90], [45,10], [35,10]]],
            'J': [[[60,0], [75,0], [75,80], [50,100], [25,80], [25,65], [35,65], [35,75], [50,90], [60,80]]],
            'K': [[[20,0], [35,0], [35,45], [65,0], [80,0], [50,50], [80,100], [65,100], [35,55], [35,100], [20,100]]],
            'L': [[[20,0], [35,0], [35,85], [80,85], [80,100], [20,100]]],
            'M': [[[10,0], [25,0], [50,40], [75,0], [90,0], [90,100], [75,100], [75,25], [50,65], [25,25], [25,100], [10,100]]],
            'N': [[[20,0], [35,0], [65,70], [65,0], [80,0], [80,100], [65,100], [35,30], [35,100], [20,100]]],
            'O': [
                [[50,0], [80,20], [80,80], [50,100], [20,80], [20,20]],
                [[50,10], [70,25], [70,75], [50,90], [30,75], [30,25]]
            ],
            'P': [
                [[20,0], [60,0], [80,25], [80,45], [60,50], [20,50], [20,100], [20,0]],
                [[35,10], [55,10], [65,25], [65,40], [55,45], [35,45]]
            ],
            'Q': [
                [[50,0], [80,20], [80,80], [50,100], [20,80], [20,20]],
                [[50,10], [70,25], [70,75], [50,90], [30,75], [30,25]],
                [[60,70], [90,100], [80,100], [50,70]]
            ],
            'R': [
                [[20,0], [60,0], [80,25], [80,45], [60,50], [80,100], [65,100], [50,55], [30,55], [30,100], [20,100]],
                [[30,10], [55,10], [65,25], [65,40], [55,45], [30,45]]
            ],
            'S': [[[80,20], [50,0], [20,20], [20,40], [50,50], [80,60], [80,80], [50,100], [20,80], [20,65], [30,65], [30,75], [50,90], [70,75], [70,65], [40,55], [20,45], [20,25], [50,10], [70,25], [70,35], [80,35]]],
            'T': [[[20,0], [80,0], [80,15], [55,15], [55,100], [45,100], [45,15], [20,15]]],
            'U': [[[20,0], [35,0], [35,75], [50,90], [65,75], [65,0], [80,0], [80,80], [50,100], [20,80]]],
            'V': [[[0,0], [15,0], [50,100], [85,0], [100,0], [55,110], [45,110]]],
            'W': [[[0,0], [15,0], [25,75], [50,25], [75,75], [85,0], [100,0], [80,100], [70,100], [50,50], [30,100], [20,100]]],
            'X': [[[0,0], [15,0], [50,40], [85,0], [100,0], [60,50], [100,100], [85,100], [50,60], [15,100], [0,100], [40,50]]],
            'Y': [[[0,0], [15,0], [50,45], [85,0], [100,0], [60,55], [60,100], [40,100], [40,55]]],
            'Z': [[[20,0], [80,0], [80,15], [35,85], [80,85], [80,100], [20,100], [20,85], [65,15], [20,15]]]
        };
;
        
        this.init3D();
        this.changeGeometry('BOX');
    }

    init3D() {
        const zone = document.getElementById('threeViewport');
        if (!zone) return;
        this.scene = new THREE.Scene(); 
        this.scene.background = new THREE.Color(0x0b0f1a);
        
        this.camera = new THREE.PerspectiveCamera(45, zone.clientWidth / zone.clientHeight, 1, 10000);
        this.camera.position.set(250, 250, 250);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
        this.renderer.setSize(zone.clientWidth, zone.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        zone.appendChild(this.renderer.domElement);
        
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;

        this.scene.add(new THREE.AmbientLight(0xffffff, 1.2));
        const light = new THREE.DirectionalLight(0xffffff, 0.8);
        light.position.set(200, 400, 300);
        this.scene.add(light);

        // Ground Grid & Plane
        const grid = new THREE.GridHelper(2000, 20, 0x334155, 0x1e293b);
        grid.position.y = -100;
        this.scene.add(grid);

        const groundGeo = new THREE.PlaneGeometry(2000, 2000);
        const groundMat = new THREE.MeshPhongMaterial({ color: 0x0f172a, transparent: true, opacity: 0.5 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2; ground.position.y = -101;
        this.scene.add(ground);

        this.meshObj = new THREE.Group();
        this.scene.add(this.meshObj);

        const render = () => { 
            requestAnimationFrame(render); 
            this.controls.update(); 
            this.renderer.render(this.scene, this.camera); 
        };
        render();

        this.init2DZoom();

        window.addEventListener('resize', () => {
            const z = document.getElementById('threeViewport');
            if(z && this.camera && this.renderer) {
                this.camera.aspect = z.clientWidth / z.clientHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(z.clientWidth, z.clientHeight);
            }
        });
    }

    add3DLabel(text, x, y, z, parentGroup) {
        if (!this.meshObj) return;
        const group = parentGroup || this.meshObj;
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)'; // dark blue bg with opacity
        ctx.lineJoin = 'round';
        ctx.lineWidth = 40;
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.7)';
        ctx.strokeRect(80, 80, 352, 96);
        ctx.fillRect(80, 80, 352, 96);

        ctx.font = 'bold 70px "Inter", sans-serif';
        ctx.fillStyle = '#38bdf8'; // cyan text
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 256, 128);

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(100, 50, 1);
        sprite.position.set(x, y, z);
        sprite.renderOrder = 999;
        
        group.add(sprite);
    }

    registerDogBone(x, y) {
        this.dogBones.push({x, y});
    }

    // Store tab information with size for geometry creation
    registerTab(x, y, isVert) {
        // For vertical tabs, width = tabWidth, height = tabHeight
        // For horizontal tabs, width = tabWidth, height = tabHeight (stored as size)
        const size = this.tabHeight; // common tab thickness
        this.tabs.push({x, y, isVert, size});
    }

    // ------------------------------------------------------------
    // Hole handling – creates a cylindrical hole geometry and adds it
    // to the current mesh hierarchy. The hole is visualised as a
    // semi‑transparent black cylinder so the user can see its
    // position and size in the 3D view.
    // ------------------------------------------------------------
    addHole(x, y, z, radius) {
        const depth = this.materialThickness || 4; // fallback thickness
        const geo = new THREE.CylinderGeometry(radius, radius, depth, 16);
        const mat = new THREE.MeshStandardMaterial({
            color: 0x000000,
            opacity: 0.4,
            transparent: true,
            side: THREE.DoubleSide
        });
        const hole = new THREE.Mesh(geo, mat);
        // Align cylinder axis with Z (through the sheet)
        hole.rotation.x = Math.PI / 2;
        hole.position.set(x, y, z);
        this.meshObj.add(hole);
    }

    // ------------------------------------------------------------
    // Dog‑Bone Overcuts – adds small cylindrical reliefs at interior right‑angle corners
    // ------------------------------------------------------------
    addDogBoneCuts() {
        if (!this.enableDogBone) return;
        const radius = this.dogBoneRadius || 2;
        const depth = this.materialThickness || 4;
        const geo = new THREE.CylinderGeometry(radius, radius, depth, 12);
        const mat = new THREE.MeshStandardMaterial({color: 0xf43f5e, opacity: 0.6, transparent: true});
        this.dogBones.forEach(p => {
            const cyl = new THREE.Mesh(geo, mat);
            cyl.rotation.x = Math.PI / 2;
            cyl.position.set(p.x, p.y, -depth / 2);
            this.meshObj.add(cyl);
        });
    }

    // ------------------------------------------------------------
    // Breakaway Tabs – generates rectangular tabs along sheet edges
    // ------------------------------------------------------------
    addBreakawayTabs() {
        if (!this.enableBreakawayTabs) return;
        const depth = this.materialThickness || 4;
        const mat = new THREE.MeshStandardMaterial({color: 0x10b981, opacity: 0.6, transparent: true});
        this.tabs.forEach(p => {
            // Width and height depend on orientation
            const w = p.isVert ? this.tabWidth : this.tabWidth; // tab width for both orientations
            const h = p.isVert ? this.tabHeight : this.tabHeight; // tab height for both orientations
            const geo = new THREE.BoxGeometry(w, h, depth);
            const tab = new THREE.Mesh(geo, mat);
            tab.position.set(p.x, p.y, -depth / 2);
            this.meshObj.add(tab);
        });
    }

    // ------------------------------------------------------------
    // Engrave Labels – renders text as a semi‑transparent sprite (preview)
    // ------------------------------------------------------------
    addEngraveLabel() {
        if (!this.enableEngrave || !this.labelText) return;
        // Render label as a canvas sprite (works with bundled Three.js r128 without addons)
        this.add3DLabel(this.labelText, this.labelX || 0, this.labelY || 0, -(this.materialThickness || 4) / 2);
    }

    resetCamera() {
        if(this.controls) {
            this.camera.position.set(250, 250, 250);
            this.controls.reset();
        }
    }

    init2DZoom() {
        const zone = document.getElementById('rightViewportZone');
        if (!zone) return;
        zone.addEventListener('wheel', (e) => {
            e.preventDefault();
            const scale = e.deltaY > 0 ? 0.9 : 1.1;
            this.zoomLevel *= scale;
            this.apply2DTransform();
        }, { passive: false });

        zone.addEventListener('mousedown', (e) => {
            this.isPanning = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.isPanning) return;
            this.panX += (e.clientX - this.lastMouseX);
            this.panY += (e.clientY - this.lastMouseY);
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            this.apply2DTransform();
        });

        window.addEventListener('mouseup', () => { this.isPanning = false; });
    }

    updateFoldProgress(val) {
        this.foldProgress = parseFloat(val) / 100;
        const display = document.getElementById('foldValue');
        if (display) display.innerText = val + '%';
        this.updateEngine();
    }

    apply2DTransform() {
        const svg = document.querySelector('#rightViewportZone svg g');
        if (svg) {
            svg.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoomLevel})`;
            svg.style.transformOrigin = 'center';
        }
    }

    center2D() {
        const zone = document.getElementById('rightViewportZone');
        const svg = zone.querySelector('svg g');
        if (!svg) return;

        requestAnimationFrame(() => {
            const bbox = svg.getBBox();
            if (bbox.width <= 1) return;
            const scale = Math.min((zone.clientWidth - 40) / bbox.width, (zone.clientHeight - 40) / bbox.height, 1.5);
            this.zoomLevel = scale;
            this.panX = (zone.clientWidth / 2) - (bbox.x + bbox.width / 2) * scale;
            this.panY = (zone.clientHeight / 2) - (bbox.y + bbox.height / 2) * scale;
            this.apply2DTransform();
        });
    }

    updateMaterialSummary(boxW, boxH, vDeduction) {
        const screen = document.getElementById('materialSummary');
        if (!screen) return;
        const sheetW = parseFloat(document.getElementById('sheetW').value) || 1220;
        const sheetH = parseFloat(document.getElementById('sheetH').value) || 2440;
        const pieceArea = (boxW * boxH) / 1000000;
        const sheetArea = (sheetW * sheetH) / 1000000;
        const usage = (pieceArea / sheetArea) * 100;
        
        const T = parseFloat(document.getElementById('sheetT').value) || 4;
        const t = parseFloat(document.getElementById('remT').value) || 0.8;
        const K = parseFloat(document.getElementById('kFactor').value) || 0.44;

        const unitType = document.querySelector('input[name="unitType"]:checked')?.value || 'mm';
        const uMult = unitType === 'cm' ? 10 : 1;
        const uLabel = unitType;
        const fmtSummary = (val) => `${(val / uMult).toFixed(1)} ${uLabel}`;

        screen.innerHTML = `
            <div class="mb-3">
                <div class="d-flex justify-content-between mb-1"><span>ขนาดแผ่นคลี่:</span> <b>${fmtSummary(boxW)} x ${fmtSummary(boxH)}</b></div>
                <div class="d-flex justify-content-between mb-1"><span>พื้นที่:</span> <b>${pieceArea.toFixed(3)}</b> ตร.ม.</div>
                <div class="d-flex justify-content-between mb-1"><span>ใช้วัสดุ:</span> <b class="text-cyan">${usage.toFixed(1)}%</b></div>
            </div>
            <div class="glass-subcard p-2" style="font-size: 0.7rem; border-left: 3px solid var(--orange);">
                <div class="fw-bold text-orange mb-1">สูตรคำนวณระยะชดเชย (V-Deduction):</div>
                <div class="font-monospace">D = 2 × (T - t) - (K × t)</div>
                <div class="font-monospace mt-1">
                    D = 2 × (${T} - ${t}) - (${K} × ${t})<br>
                    D = <b class="text-white">${vDeduction.toFixed(3)} mm</b>
                </div>
            </div>
        `;
    }

    changeGeometry(shape) {
        this.selectedShape = shape;
        const inputs = document.getElementById('dynamicInputs');
        if(!inputs) return;

        const unit = document.querySelector('input[name="unitType"]:checked')?.value || 'mm';
        const lbl = unit === 'cm' ? '(cm)' : '(mm)';
        const f = unit === 'cm' ? 10 : 1;

        let html = '';
        const lblCls = 'small-muted text-nowrap d-block text-truncate';
        if(shape === 'BOX') {
            html = `<div class="col-4"><label class="${lblCls}" style="font-size:0.7rem">กว้าง(W) ${lbl}</label><input type="number" id="valW" class="form-control form-control-sm" value="${300/f}" oninput="geoEngine.updateEngine()"></div>
                    <div class="col-4"><label class="${lblCls}" style="font-size:0.7rem">ลึก(D) ${lbl}</label><input type="number" id="valD" class="form-control form-control-sm" value="${200/f}" oninput="geoEngine.updateEngine()"></div>
                    <div class="col-4"><label class="${lblCls}" style="font-size:0.7rem">สูง(H) ${lbl}</label><input type="number" id="valH" class="form-control form-control-sm" value="${100/f}" oninput="geoEngine.updateEngine()"></div>`;
        } else if(shape === 'CUBE') {
            html = `<div class="col-12"><label class="${lblCls}" style="font-size:0.7rem">ขนาดลูกบาศก์(L) ${lbl}</label><input type="number" id="valL" class="form-control form-control-sm" value="${200/f}" oninput="geoEngine.updateEngine()"></div>`;
        } else if(shape === 'PYRAMID') {
            html = `<div class="col-6"><label class="${lblCls}" style="font-size:0.7rem">กว้างฐาน(W) ${lbl}</label><input type="number" id="valW" class="form-control form-control-sm" value="${200/f}" oninput="geoEngine.updateEngine()"></div>
                    <div class="col-6"><label class="${lblCls}" style="font-size:0.7rem">สูงตรง(H) ${lbl}</label><input type="number" id="valH" class="form-control form-control-sm" value="${150/f}" oninput="geoEngine.updateEngine()"></div>`;
        } else if(shape === 'CYLINDER') {
            html = `<div class="col-6"><label class="${lblCls}" style="font-size:0.7rem">เส้นผ่านศูนย์กลาง ${lbl}</label><input type="number" id="valW" class="form-control form-control-sm" value="${300/f}" oninput="geoEngine.updateEngine()"></div>
                    <div class="col-6"><label class="${lblCls}" style="font-size:0.7rem">ความสูงกระบอก ${lbl}</label><input type="number" id="valH" class="form-control form-control-sm" value="${400/f}" oninput="geoEngine.updateEngine()"></div>`;
        } else if(shape === 'CONE') {
            html = `<div class="col-6"><label class="${lblCls}" style="font-size:0.7rem">เส้นผ่าศูนย์กลางฐาน ${lbl}</label><input type="number" id="valW" class="form-control form-control-sm" value="${300/f}" oninput="geoEngine.updateEngine()"></div>
                    <div class="col-6"><label class="${lblCls}" style="font-size:0.7rem">ความสูงกรวย ${lbl}</label><input type="number" id="valH" class="form-control form-control-sm" value="${400/f}" oninput="geoEngine.updateEngine()"></div>`;
        } else if(shape === 'TRI_PRISM' || shape === 'PRISM') {
            html = `<div class="col-6"><label class="${lblCls}" style="font-size:0.7rem">ด้านฐาน(Side) ${lbl}</label><input type="number" id="valW" class="form-control form-control-sm" value="${200/f}" oninput="geoEngine.updateEngine()"></div>
                    <div class="col-6"><label class="${lblCls}" style="font-size:0.7rem">ความยาว(L) ${lbl}</label><input type="number" id="valL" class="form-control form-control-sm" value="${400/f}" oninput="geoEngine.updateEngine()"></div>`;
        } else if(shape === 'TETRA' || shape === 'OCTAHEDRON') {
            html = `<div class="col-12"><label class="${lblCls}" style="font-size:0.7rem">ความยาวด้าน(Side) ${lbl}</label><input type="number" id="valL" class="form-control form-control-sm" value="${200/f}" oninput="geoEngine.updateEngine()"></div>`;
        } else if(shape === 'LCORNER') {
            html = `<div class="col-6"><label class="${lblCls}" style="font-size:0.7rem">ด้านที่ 1 (W1) ${lbl}</label><input type="number" id="valW" class="form-control form-control-sm" value="${150/f}" oninput="geoEngine.updateEngine()"></div>
                    <div class="col-6"><label class="${lblCls}" style="font-size:0.7rem">ด้านที่ 2 (W2) ${lbl}</label><input type="number" id="valD" class="form-control form-control-sm" value="${150/f}" oninput="geoEngine.updateEngine()"></div>
                    <div class="col-12 mt-2"><label class="${lblCls}" style="font-size:0.7rem">ความยาว (L) ${lbl}</label><input type="number" id="valH" class="form-control form-control-sm" value="${400/f}" oninput="geoEngine.updateEngine()"></div>`;
        } else if(shape === 'USHAPE') {
            html = `<div class="col-4"><label class="${lblCls}" style="font-size:0.7rem">ด้านซ้าย (W1) ${lbl}</label><input type="number" id="valW" class="form-control form-control-sm" value="${100/f}" oninput="geoEngine.updateEngine()"></div>
                    <div class="col-4"><label class="${lblCls}" style="font-size:0.7rem">ฐานกลาง (W2) ${lbl}</label><input type="number" id="valD" class="form-control form-control-sm" value="${200/f}" oninput="geoEngine.updateEngine()"></div>
                    <div class="col-4"><label class="${lblCls}" style="font-size:0.7rem">ด้านขวา (W3) ${lbl}</label><input type="number" id="valL" class="form-control form-control-sm" value="${100/f}" oninput="geoEngine.updateEngine()"></div>
                    <div class="col-12 mt-2"><label class="${lblCls}" style="font-size:0.7rem">ความยาว (L) ${lbl}</label><input type="number" id="valH" class="form-control form-control-sm" value="${400/f}" oninput="geoEngine.updateEngine()"></div>`;
        } else if(shape === 'ALPHABET') {
            html = `<div class="col-6"><label class="${lblCls}" style="font-size:0.7rem">ตัวอักษร A-Z</label><input type="text" id="valChar" class="form-control form-control-sm fw-bold text-center" value="A" maxlength="1" oninput="geoEngine.updateEngine()"></div>
                    <div class="col-6"><label class="${lblCls}" style="font-size:0.7rem">ขนาด ${lbl}</label><input type="number" id="valW" class="form-control form-control-sm" value="${200/f}" oninput="geoEngine.updateEngine()"></div>
                    <div class="col-12 mt-2"><label class="${lblCls}" style="font-size:0.7rem">ความลึก (Depth) ${lbl}</label><input type="number" id="valH" class="form-control form-control-sm" value="${50/f}" oninput="geoEngine.updateEngine()"></div>`;
        } else {
            html = `<div class="col-12"><label class="${lblCls}" style="font-size:0.7rem">ขนาดหลัก ${lbl}</label><input type="number" id="valL" class="form-control form-control-sm" value="${150/f}" oninput="geoEngine.updateEngine()"></div>`;
        }
        inputs.innerHTML = html;
        this.updateEngine();
    }

    updateEngine() {
        if(!this.meshObj) return;
        this.meshObj.clear();
        this.dogBones = [];
        this.tabs = [];
        this.lastLayoutData = null; // Always reset so switching shapes works

        const T = parseFloat(document.getElementById('sheetT').value) || 4;
        const tRem = parseFloat(document.getElementById('remT').value) || 0.8;
        const K = parseFloat(document.getElementById('kFactor').value) || 0.44;
        // Engrave label parameters
        this.labelText = document.getElementById('labelText')?.value || 'Demo';
        this.labelFontSize = parseFloat(document.getElementById('labelFontSize')?.value) || 12;
        this.labelX = parseFloat(document.getElementById('labelX')?.value) || 0;
        this.labelY = parseFloat(document.getElementById('labelY')?.value) || 0;
        this.tabMode = document.getElementById('tabMode').value;
        const sheetW = parseFloat(document.getElementById('sheetW').value) || 1220;
        const sheetH = parseFloat(document.getElementById('sheetH').value) || 2440;

        // Store material thickness for hole depth
        this.materialThickness = T;

        let vDeduction = 2 * (T - tRem) - (K * tRem);
        if (vDeduction < 0) vDeduction = 0;

        const offX = 0, offY = 0;
        const drawing = { cuts: [], folds: [] };
        let finalW = 100, finalH = 100;
        // Store dimensions for CNC helpers
        this.finalW = finalW;
        this.finalH = finalH;

        const enableRivets = document.getElementById('enableRivets')?.checked || false;
        const rivetSize = parseFloat(document.getElementById('rivetSize')?.value) || 3.2;
        const rivetPitch = parseFloat(document.getElementById('rivetPitch')?.value) || 200;
        const wallMountHoles = document.getElementById('wallMountHoles')?.checked || false;
        const rR = rivetSize / 2;

        const genRivets = (x1, y1, x2, y2, offX, offY) => {
            if (!enableRivets) return;
            const dx = x2 - x1, dy = y2 - y1;
            const len = Math.sqrt(dx*dx + dy*dy);
            if (len <= 0) return;
            const count = Math.max(1, Math.round(len / rivetPitch));
            for (let i = 1; i <= count; i++) {
                const frac = (i - 0.5) / count;
                const cx = x1 + dx * frac + offX;
                const cy = y1 + dy * frac + offY;
                drawing.cuts.push(`<circle cx="${cx}" cy="${cy}" r="${rR}" fill="none" stroke="#f43f5e" stroke-width="2"/>`);
            }
        };

        const genWallMount = (x, y, fw, fh) => {
            if (!wallMountHoles) return;
            const insetX = Math.min(20, fw / 4);
            const insetY = Math.min(20, fh / 4);
            const r = 3; // 6mm hole
            drawing.cuts.push(`<circle cx="${x+insetX}" cy="${y+insetY}" r="${r}" fill="none" stroke="#fbbf24" stroke-width="2"/>`);
            drawing.cuts.push(`<circle cx="${x+fw-insetX}" cy="${y+insetY}" r="${r}" fill="none" stroke="#fbbf24" stroke-width="2"/>`);
            drawing.cuts.push(`<circle cx="${x+insetX}" cy="${y+fh-insetY}" r="${r}" fill="none" stroke="#fbbf24" stroke-width="2"/>`);
            drawing.cuts.push(`<circle cx="${x+fw-insetX}" cy="${y+fh-insetY}" r="${r}" fill="none" stroke="#fbbf24" stroke-width="2"/>`);
        };

        const enableDogBone = document.getElementById('enableDogBone')?.checked || false;
        const enableBreakawayTabs = document.getElementById('enableBreakawayTabs')?.checked || false;
        const kerf = parseFloat(document.getElementById('kerfMargin')?.value) || 0;
        
        // Store flags in the engine for helper methods
        this.enableDogBone = enableDogBone;
        this.enableBreakawayTabs = enableBreakawayTabs;
        this.enableEngrave = !!(document.getElementById('enableEngrave')?.checked);

        const genDogBone = (x, y) => {
             if(!enableDogBone || kerf <= 0) return;
             this.registerDogBone(x, y);
             const r = (kerf / 2) + 0.1;
             drawing.cuts.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#f43f5e" stroke-width="1.5" class="dogbone"/>`);
        };

        const genTab = (x, y, isVert) => {
             if (!enableBreakawayTabs) return;
             this.registerTab(x, y, isVert);
             const tSize = Math.max(5, kerf * 2); // 5mm minimum tab
             if(isVert) drawing.cuts.push(`<line x1="${x}" y1="${y-tSize/2}" x2="${x}" y2="${y+tSize/2}" stroke="#10b981" stroke-width="4" class="tab-marker"/>`);
             else drawing.cuts.push(`<line x1="${x-tSize/2}" y1="${y}" x2="${x+tSize/2}" y2="${y}" stroke="#10b981" stroke-width="4" class="tab-marker"/>`);
        };

        const unitType = document.querySelector('input[name="unitType"]:checked')?.value || 'mm';
        const uMult = unitType === 'cm' ? 10 : 1;
        const getVal = (id, def) => {
            const el = document.getElementById(id);
            return (el && el.value !== '' ? parseFloat(el.value) : (def/uMult)) * uMult;
        };
        const uLabel = unitType;
        const fmt = (val) => `${(val / uMult).toFixed(1)} ${uLabel}`;

        if(this.selectedShape === 'BOX' || this.selectedShape === 'CUBE') {
            let rawW, rawD, rawH;
            if (this.selectedShape === 'CUBE') {
                const l = getVal('valL', 200);
                rawW = l; rawD = l; rawH = l;
            } else {
                rawW = getVal('valW', 300);
                rawD = getVal('valD', 200);
                rawH = getVal('valH', 100);
            }
            const w = rawW - vDeduction; const d = rawD - vDeduction; const h = rawH;
            const hasTabs = this.tabMode !== 'NONE';
            const ts = hasTabs ? (parseFloat(document.getElementById('tabSize').value) || 20) : 0;
            const c = Math.min(5, ts * 0.3); // chamfer size
            const enableRivets = document.getElementById('enableRivets')?.checked || false;
            const rivetSz = parseFloat(document.getElementById('rivetSize')?.value) || 3.2;
            const rR = rivetSz / 2;

            const px = Math.max(h, ts) + 10 + offX;
            const py = Math.max(h, ts) + 10 + offY;
            finalW = w + 2 * Math.max(h, ts) + 20 + offX; 
            finalH = d + 2 * Math.max(h, ts) + 20 + offY;

            // 3D HINGED MODEL logic
            const fAngle = (Math.PI / 2) * this.foldProgress; // Angle in radians (0 to 90 degrees)
            
            const createFace = (fw, fh, color, holes = []) => {
                const shape = new THREE.Shape();
                shape.moveTo(-fw/2, -fh/2); shape.lineTo(fw/2, -fh/2); shape.lineTo(fw/2, fh/2); shape.lineTo(-fw/2, fh/2); shape.lineTo(-fw/2, -fh/2);
                holes.forEach(h => {
                    const hp = new THREE.Path();
                    hp.absarc(h.x, h.y, h.r, 0, Math.PI*2, false);
                    shape.holes.push(hp);
                });
                const group = new THREE.Group();
                const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshStandardMaterial({color: color, side: THREE.DoubleSide}));
                group.add(mesh);
                return { group, mesh };
            };

            // Base face (Stationary)
            let baseHoles = [];
            if (document.getElementById('wallMountHoles')?.checked) {
                const rM = 3; const inX = Math.min(20, rawW / 4); const inY = Math.min(20, rawD / 4);
                baseHoles.push({x: -rawW/2+inX, y: -rawD/2+inY, r: rM}); baseHoles.push({x: rawW/2-inX, y: -rawD/2+inY, r: rM});
                baseHoles.push({x: -rawW/2+inX, y: rawD/2-inY, r: rM}); baseHoles.push({x: rawW/2-inX, y: rawD/2-inY, r: rM});
            }
            const base = createFace(rawW, rawD, 0x7c3aed, baseHoles);
            base.mesh.rotation.x = -Math.PI / 2;
            this.meshObj.add(base.group);

            // Left Wall
            const left = createFace(rawH, rawD, 0x8b5cf6);
            left.mesh.position.x = -rawH/2; left.mesh.rotation.y = -Math.PI/2;
            left.group.position.x = -rawW/2; left.group.rotation.z = fAngle;
            base.group.add(left.group);

            // Right Wall
            const right = createFace(rawH, rawD, 0x8b5cf6);
            right.mesh.position.x = rawH/2; right.mesh.rotation.y = Math.PI/2;
            right.group.position.x = rawW/2; right.group.rotation.z = -fAngle;
            base.group.add(right.group);

            // Rear Wall
            const back = createFace(rawW, rawH, 0x6d28d9);
            back.mesh.position.z = -rawH/2; back.mesh.rotation.x = -Math.PI/2;
            back.group.position.z = -rawD/2; back.group.rotation.x = -fAngle;
            base.group.add(back.group);

            // Front Wall
            const front = createFace(rawW, rawH, 0x6d28d9);
            front.mesh.position.z = rawH/2; front.mesh.rotation.x = Math.PI/2;
            front.group.position.z = rawD/2; front.group.rotation.x = fAngle;
            base.group.add(front.group);
            
            // Base folds (2D)
            drawing.folds.push(`<line x1="${px}" y1="${py}" x2="${px+w}" y2="${py}" stroke="#38bdf8" stroke-dasharray="4,2"/>`);
            drawing.folds.push(`<line x1="${px}" y1="${py+d}" x2="${px+w}" y2="${py+d}" stroke="#38bdf8" stroke-dasharray="4,2"/>`);
            drawing.folds.push(`<line x1="${px}" y1="${py}" x2="${px}" y2="${py+d}" stroke="#38bdf8" stroke-dasharray="4,2"/>`);
            drawing.folds.push(`<line x1="${px+w}" y1="${py}" x2="${px+w}" y2="${py+d}" stroke="#38bdf8" stroke-dasharray="4,2"/>`);
            
            if (hasTabs) {
                drawing.folds.push(`<line x1="${px+w}" y1="${py}" x2="${px+w+h}" y2="${py}" stroke="#38bdf8" stroke-dasharray="4,2"/>`);
                drawing.folds.push(`<line x1="${px+w}" y1="${py+d}" x2="${px+w+h}" y2="${py+d}" stroke="#38bdf8" stroke-dasharray="4,2"/>`);
                drawing.folds.push(`<line x1="${px-h}" y1="${py}" x2="${px}" y2="${py}" stroke="#38bdf8" stroke-dasharray="4,2"/>`);
                drawing.folds.push(`<line x1="${px-h}" y1="${py+d}" x2="${px}" y2="${py+d}" stroke="#38bdf8" stroke-dasharray="4,2"/>`);
            }
            
            // Labels for dimensions
            const labelStyle = 'fill="#94a3b8" font-size="12" font-family="sans-serif" text-anchor="middle"';
            drawing.folds.push(`<text x="${px+w/2}" y="${py-10}" ${labelStyle}>${fmt(w)}</text>`);
            drawing.folds.push(`<text x="${px+w/2}" y="${py+d+25}" ${labelStyle}>${fmt(w)}</text>`);
            drawing.folds.push(`<text x="${px-15}" y="${py+d/2}" ${labelStyle} transform="rotate(-90, ${px-15}, ${py+d/2})">${fmt(d)}</text>`);
            drawing.folds.push(`<text x="${px+w+15}" y="${py+d/2}" ${labelStyle} transform="rotate(90, ${px+w+15}, ${py+d/2})">${fmt(d)}</text>`);

            // 3D labels
            this.add3DLabel(`W: ${fmt(rawW)}`, 0, -rawD/2 - 30, 0, base.group);
            this.add3DLabel(`D: ${fmt(rawD)}`, -rawW/2 - 30, 0, 0, base.group);
            this.add3DLabel(`H: ${fmt(rawH)}`, 0, rawH/2 + 20, 0, front.group);

            let path = `M ${px} ${py-h} L ${px+w} ${py-h} L ${px+w} ${py} `;
            if (hasTabs) {
                path += `L ${px+w+c} ${py-ts} L ${px+w+h-c} ${py-ts} L ${px+w+h} ${py} `;
                genRivets(px+w, py, px+w+h, py, 0, -ts/2);
            } else {
                path += `L ${px+w+h} ${py} `;
            }
            path += `L ${px+w+h} ${py+d} `;
            if (hasTabs) {
                path += `L ${px+w+h-c} ${py+d+ts} L ${px+w+c} ${py+d+ts} L ${px+w} ${py+d} `;
                genRivets(px+w, py+d, px+w+h, py+d, 0, ts/2);
            } else {
                path += `L ${px+w} ${py+d} `;
            }
            path += `L ${px+w} ${py+d+h} L ${px} ${py+d+h} L ${px} ${py+d} `;
            if (hasTabs) {
                path += `L ${px-c} ${py+d+ts} L ${px-h+c} ${py+d+ts} L ${px-h} ${py+d} `;
                genRivets(px-h, py+d, px, py+d, 0, ts/2);
            } else {
                path += `L ${px-h} ${py+d} `;
            }
            path += `L ${px-h} ${py} `;
            if (hasTabs) {
                path += `L ${px-h+c} ${py-ts} L ${px-c} ${py-ts} L ${px} ${py} `;
                genRivets(px-h, py, px, py, 0, -ts/2);
            } else {
                path += `L ${px} ${py} `;
            }
            path += `Z`;
            // Tight polygonal boundary for the Box 'Cross' net
            this.lastVertices = [
                [h, 0], [h+w, 0], [h+w, h], [h+w+h, h], [h+w+h, h+d], [h+w, h+d],
                [h+w, h+d+h], [h, h+d+h], [h, h+d], [0, h+d], [0, h], [h, h]
            ];
            // Adjust if tabs are present (simplification for safety)
            if (hasTabs) {
                 this.lastVertices = [[0,0], [finalW-20,0], [finalW-20,finalH-20], [0,finalH-20]]; // Fallback to AABB if complex tabs
            }
            
            drawing.cuts.push(`<path d="${path}" fill="none" stroke="#f43f5e" stroke-width="2"/>`);
            
            genWallMount(px, py, w, d);
            
            genDogBone(px, py);
            genDogBone(px+w, py);
            genDogBone(px+w, py+d);
            genDogBone(px, py+d);
            
            genTab(px+w/2, py-h, false);
            genTab(px+w/2, py+d+h, false);
            genTab(px-h, py+d/2, true);
            genTab(px+w+h, py+d/2, true);
            
        } else if(this.selectedShape === 'CYLINDER') {
            const diam = getVal('valW', 300);
            const h = getVal('valH', 400);
            const r = diam / 2;
            const w = Math.PI * diam;
            
            const N = 48;
            const fW = w / N;
            const fAngle = (2 * Math.PI / N) * this.foldProgress;

            const baseGroup = new THREE.Group();
            baseGroup.rotation.x = -Math.PI / 2;
            this.meshObj.add(baseGroup);

            const wrapGroup = new THREE.Group();
            wrapGroup.position.x = -w / 2;
            baseGroup.add(wrapGroup);

            let cur = wrapGroup;
            for (let i = 0; i < N; i++) {
                const g = new THREE.Group();
                g.position.x = i === 0 ? 0 : fW; 
                g.rotation.y = i === 0 ? 0 : -fAngle; 
                
                const m = new THREE.Mesh(new THREE.PlaneGeometry(fW, h), new THREE.MeshStandardMaterial({color: 0x2dd4bf, side: THREE.DoubleSide}));
                m.position.x = fW / 2;
                g.add(m);
                cur.add(g);
                cur = g;
            }
            const hasTabs = this.tabMode !== 'NONE';
            const ts = hasTabs ? (parseFloat(document.getElementById('tabSize').value) || 20) : 0;
            const c = Math.min(5, ts * 0.3);
            
            const px = ts + 10 + offX;
            const py = 10 + offY;
            finalW = w + 2*ts + 20 + offX;
            finalH = h + 20 + offY;
            
            const labelStyle = 'fill="#94a3b8" font-size="12" font-family="sans-serif" text-anchor="middle"';
            drawing.folds.push(`<text x="${px+w/2}" y="${py+h+15}" ${labelStyle}>${fmt(w)} (เส้นรอบวง)</text>`);
            drawing.folds.push(`<text x="${px-15}" y="${py+h/2}" ${labelStyle} transform="rotate(-90, ${px-15}, ${py+h/2})">${fmt(h)}</text>`);
            
            // 3D Labels
            this.add3DLabel(`Ø ${fmt(diam)}`, 0, h/2 + 20, 0);
            this.add3DLabel(`H: ${fmt(h)}`, diam/2 + 20, 0, 0);
            
            let path = `M ${px} ${py} L ${px+w} ${py} `;
            if(hasTabs) {
                path += `L ${px+w+ts} ${py+c} L ${px+w+ts} ${py+h-c} L ${px+w} ${py+h} `;
                drawing.folds.push(`<line x1="${px+w}" y1="${py}" x2="${px+w}" y2="${py+h}" stroke="#38bdf8" stroke-dasharray="4,2"/>`);
            } else {
                path += `L ${px+w} ${py+h} `;
            }
            path += `L ${px} ${py+h} `;
            if(hasTabs) {
                path += `L ${px-ts} ${py+h-c} L ${px-ts} ${py+c} L ${px} ${py} `;
                drawing.folds.push(`<line x1="${px}" y1="${py}" x2="${px}" y2="${py+h}" stroke="#38bdf8" stroke-dasharray="4,2"/>`);
            } else {
                path += `L ${px} ${py} `;
            }
            path += `Z`;
            drawing.cuts.push(`<path d="${path}" fill="none" stroke="#f43f5e" stroke-width="2"/>`);

        } else if(this.selectedShape === 'CONE') {
            const diam = getVal('valW', 300);
            const h = getVal('valH', 400);
            const r = diam / 2;
            const S = Math.sqrt(r*r + h*h);
            const theta = (2 * Math.PI * r) / S; // radians
            
            const N = 48;
            const dTheta = theta / N;
            
            const baseGroup = new THREE.Group();
            baseGroup.rotation.x = -Math.PI / 2; 
            this.meshObj.add(baseGroup);

            const tShape = new THREE.Shape();
            tShape.moveTo(0, 0);
            tShape.lineTo(S * Math.cos(-dTheta/2), S * Math.sin(-dTheta/2));
            tShape.lineTo(S * Math.cos(dTheta/2), S * Math.sin(dTheta/2));
            tShape.lineTo(0, 0);

            const geo = new THREE.ShapeGeometry(tShape);
            
            for (let i = 0; i < N; i++) {
                const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({color: 0xfb923c, side: THREE.DoubleSide}));
                
                // Flat State
                const flatAngle = (i + 0.5) * dTheta - theta / 2;
                const qFlat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, flatAngle));
                
                // Folded State
                const coneAngle = (i + 0.5) * (2 * Math.PI / N) - Math.PI;
                
                const vx = (r/S) * Math.cos(coneAngle);
                const vy = (r/S) * Math.sin(coneAngle);
                const vz = -h/S;
                
                const vBaseX = -Math.sin(coneAngle);
                const vBaseY = Math.cos(coneAngle);
                const vBaseZ = 0;
                
                const vX = new THREE.Vector3(vx, vy, vz).normalize();
                const vY = new THREE.Vector3(vBaseX, vBaseY, vBaseZ).normalize();
                const vZ = new THREE.Vector3().crossVectors(vX, vY).normalize();
                
                const matrix = new THREE.Matrix4().makeBasis(vX, vY, vZ);
                const qFold = new THREE.Quaternion().setFromRotationMatrix(matrix);
                
                // Interpolate
                mesh.quaternion.copy(qFlat).slerp(qFold, this.foldProgress);
                baseGroup.add(mesh);
            }
            
            const px = S + 20 + offX;
            const py = S + 20 + offY;
            finalW = 2 * S + 40 + offX;
            finalH = 2 * S + 40 + offY;
            
            const dx = S * Math.sin(theta/2);
            const dy = S * Math.cos(theta/2);
            const largeArc = theta > Math.PI ? 1 : 0;
            
            let path = `M ${px} ${py} L ${px-dx} ${py+dy} A ${S} ${S} 0 ${largeArc} 0 ${px+dx} ${py+dy} Z`;
            drawing.cuts.push(`<path d="${path}" fill="none" stroke="#f43f5e" stroke-width="2"/>`);
            
            const labelStyle = 'fill="#94a3b8" font-size="12" font-family="sans-serif" text-anchor="middle"';
            drawing.folds.push(`<text x="${px}" y="${py+S+15}" ${labelStyle}>รัศมีพัด ${fmt(S)} องศามุม ${(theta * 180 / Math.PI).toFixed(1)}°</text>`);
            
            // 3D Labels
            this.add3DLabel(`Base Ø ${fmt(diam)}`, 0, -h/2 - 20, 0);
            this.add3DLabel(`H: ${fmt(h)}`, r + 20, 0, 0);

        } else if(this.selectedShape === 'PYRAMID') {
            const rawW = getVal('valW', 200);
            const h = getVal('valH', 150);
            const w = rawW - vDeduction;
            const hw = w / 2;
            const S = Math.sqrt(hw*hw + h*h);
            
            const fAngle = (Math.PI - Math.atan(h / hw)) * this.foldProgress;
            const createFace = (x, y, rotZ, color) => {
                const shape = new THREE.Shape();
                shape.moveTo(-hw, 0); shape.lineTo(hw, 0); shape.lineTo(0, S); shape.lineTo(-hw, 0);
                const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshStandardMaterial({color: color, side: THREE.DoubleSide}));
                
                const placeGroup = new THREE.Group();
                placeGroup.position.set(x, y, 0);
                placeGroup.rotation.z = rotZ;
                
                const foldGroup = new THREE.Group();
                // Positive fAngle to fold upwards
                foldGroup.rotation.x = fAngle;
                
                foldGroup.add(mesh);
                placeGroup.add(foldGroup);
                return placeGroup;
            };

            const baseMesh = new THREE.Mesh(new THREE.PlaneGeometry(rawW, rawW), new THREE.MeshStandardMaterial({color: 0xdb2777, side: THREE.DoubleSide}));
            baseMesh.rotation.x = -Math.PI / 2;
            this.meshObj.add(baseMesh);

            baseMesh.add(createFace(0, -hw, Math.PI, 0xf472b6)); // Bottom edge, points -Y (Outward)
            baseMesh.add(createFace(0, hw, 0, 0xf472b6)); // Top edge, points +Y (Outward)
            baseMesh.add(createFace(-hw, 0, Math.PI/2, 0xec4899)); // Left edge, points -X (Outward)
            baseMesh.add(createFace(hw, 0, -Math.PI/2, 0xec4899)); // Right edge, points +X (Outward)
            
            const px = S + hw + 20 + offX;
            const py = S + hw + 20 + offY;
            finalW = 2 * (S + hw + 20) + offX;
            finalH = 2 * (S + hw + 20) + offY;
            
            // Base folds
            const p1x = px-hw, p1y = py-hw;
            const p2x = px+hw, p2y = py-hw;
            const p3x = px+hw, p3y = py+hw;
            const p4x = px-hw, p4y = py+hw;
            
            drawing.folds.push(`<line x1="${p1x}" y1="${p1y}" x2="${p2x}" y2="${p2y}" stroke="#38bdf8" stroke-dasharray="4,2"/>`);
            drawing.folds.push(`<line x1="${p2x}" y1="${p2y}" x2="${p3x}" y2="${p3y}" stroke="#38bdf8" stroke-dasharray="4,2"/>`);
            drawing.folds.push(`<line x1="${p3x}" y1="${p3y}" x2="${p4x}" y2="${p4y}" stroke="#38bdf8" stroke-dasharray="4,2"/>`);
            drawing.folds.push(`<line x1="${p4x}" y1="${p4y}" x2="${p1x}" y2="${p1y}" stroke="#38bdf8" stroke-dasharray="4,2"/>`);
            
            const labelStyle = 'fill="#94a3b8" font-size="12" font-family="sans-serif" text-anchor="middle"';
            drawing.folds.push(`<text x="${px}" y="${py}" ${labelStyle}>ฐาน ${fmt(w)} x ${fmt(w)}</text>`);
            
            // 3D Labels
            this.add3DLabel(`W: ${fmt(rawW)}`, 0, -h/2 - 20, rawW/2);
            this.add3DLabel(`H: ${fmt(h)}`, rawW/2 + 20, 0, 0);
            
            let path = `M ${px} ${py-hw-S} L ${p2x} ${p2y} L ${px+hw+S} ${py} L ${p3x} ${p3y} L ${px} ${py+hw+S} L ${p4x} ${p4y} L ${px-hw-S} ${py} L ${p1x} ${p1y} Z`;
            this.lastVertices = [
                [S+hw, 0], [2*hw+S, S], [S*2+hw*2, S+hw], [2*hw+S, 2*S+hw], [S+hw, 2*S+2*hw], [S, 2*S+hw], [0, S+hw], [S, S]
            ];
            drawing.cuts.push(`<path d="${path}" fill="none" stroke="#f43f5e" stroke-width="2"/>`);

            // CNC Helpers for PYRAMID
            genDogBone(p1x, p1y); genDogBone(p2x, p2y); genDogBone(p3x, p3y); genDogBone(p4x, p4y);
            genTab(px, py-hw-S/2, true);  genTab(px, py+hw+S/2, true);
            genTab(px-hw-S/2, py, false);  genTab(px+hw+S/2, py, false);
            genRivets(p1x, p1y, p2x, p2y, 0, -5);
            genRivets(p2x, p2y, p3x, p3y, 5, 0);
            genRivets(p3x, p3y, p4x, p4y, 0, 5);
            genRivets(p4x, p4y, p1x, p1y, -5, 0);

        } else if(this.selectedShape === 'TRI_PRISM') {
            const side = getVal('valW', 200);
            const L = getVal('valL', 400);
            const h = (Math.sqrt(3)/2) * side;
            
            const fAngleSide = (2 * Math.PI / 3) * this.foldProgress;
            const fAngleEnd = (Math.PI / 2) * this.foldProgress;

            const baseGroup = new THREE.Group(); baseGroup.rotation.x = -Math.PI / 2; this.meshObj.add(baseGroup);
            baseGroup.add(new THREE.Mesh(new THREE.PlaneGeometry(side, L), new THREE.MeshStandardMaterial({color: 0x7c3aed, side: THREE.DoubleSide})));

            const rL = new THREE.Group(); rL.position.x = -side/2; rL.rotation.y = fAngleSide;
            const mL = new THREE.Mesh(new THREE.PlaneGeometry(side, L), new THREE.MeshStandardMaterial({color: 0x8b5cf6, side: THREE.DoubleSide}));
            mL.position.x = -side/2; rL.add(mL); baseGroup.add(rL);

            const rR = new THREE.Group(); rR.position.x = side/2; rR.rotation.y = -fAngleSide;
            const mR = new THREE.Mesh(new THREE.PlaneGeometry(side, L), new THREE.MeshStandardMaterial({color: 0x8b5cf6, side: THREE.DoubleSide}));
            mR.position.x = side/2; rR.add(mR); baseGroup.add(rR);

            const shape = new THREE.Shape(); shape.moveTo(-side/2, 0); shape.lineTo(side/2, 0); shape.lineTo(0, h); shape.lineTo(-side/2, 0);
            const tTop = new THREE.Group(); tTop.position.y = -L/2; tTop.rotation.x = -fAngleEnd;
            const mTop = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshStandardMaterial({color: 0x6d28d9, side: THREE.DoubleSide}));
            mTop.rotation.z = Math.PI; tTop.add(mTop); baseGroup.add(tTop);

            const tBot = new THREE.Group(); tBot.position.y = L/2; tBot.rotation.x = fAngleEnd;
            const mBot = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshStandardMaterial({color: 0x6d28d9, side: THREE.DoubleSide}));
            tBot.add(mBot); baseGroup.add(tBot);
            
            const px = side + 20 + offX;
            const py = h + 20 + offY;
            finalW = 3 * side + 40 + offX;
            finalH = L + 2 * h + 40 + offY;
            
            // Folds
            drawing.folds.push(`<line x1="${px}" y1="${py}" x2="${px+side}" y2="${py}" stroke="#38bdf8" stroke-dasharray="4,2"/>`);
            drawing.folds.push(`<line x1="${px}" y1="${py+L}" x2="${px+side}" y2="${py+L}" stroke="#38bdf8" stroke-dasharray="4,2"/>`);
            drawing.folds.push(`<line x1="${px}" y1="${py}" x2="${px}" y2="${py+L}" stroke="#38bdf8" stroke-dasharray="4,2"/>`);
            drawing.folds.push(`<line x1="${px+side}" y1="${py}" x2="${px+side}" y2="${py+L}" stroke="#38bdf8" stroke-dasharray="4,2"/>`);
            // 3D labels
            this.add3DLabel(`Side: ${fmt(side)}`, 0, -L/2 - 20, 0);
            this.add3DLabel(`L: ${fmt(L)}`, side + 20, 0, 0);

            let path = `M ${px-side} ${py} L ${px} ${py} L ${px+side/2} ${py-h} L ${px+side} ${py} L ${px+2*side} ${py} L ${px+2*side} ${py+L} L ${px+side} ${py+L} L ${px+side/2} ${py+L+h} L ${px} ${py+L} L ${px-side} ${py+L} Z`;
            drawing.cuts.push(`<path d="${path}" fill="none" stroke="#f43f5e" stroke-width="2"/>`);

            // CNC Helpers for TRI_PRISM
            genDogBone(px, py); genDogBone(px+side, py); genDogBone(px, py+L); genDogBone(px+side, py+L);
            genTab(px+side/2, py, false); genTab(px+side/2, py+L, false);
            genTab(px+1.5*side, py+L/2, true); genTab(px-side/2, py+L/2, true); 
            genRivets(px, py, px+side, py, 0, -5);
            genRivets(px, py+L, px+side, py+L, 0, 5);

        } else if(this.selectedShape === 'PRISM') {
            const s = getVal('valW', 150);
            const L = getVal('valL', 400);
            const h = s * Math.sqrt(3) / 2;
            
            const fAngleHex = (Math.PI / 3) * this.foldProgress;
            const baseGroup = new THREE.Group(); baseGroup.rotation.x = -Math.PI / 2; this.meshObj.add(baseGroup);
            let cur = baseGroup;
            cur.add(new THREE.Mesh(new THREE.PlaneGeometry(s, L), new THREE.MeshStandardMaterial({color: 0x0ea5e9, side: THREE.DoubleSide})));

            for (let i = 1; i < 6; i++) {
                const g = new THREE.Group(); g.position.x = (i === 1 ? s/2 : s); g.rotation.y = -fAngleHex;
                const m = new THREE.Mesh(new THREE.PlaneGeometry(s, L), new THREE.MeshStandardMaterial({color: 0x0284c7, side: THREE.DoubleSide}));
                m.position.x = s/2; g.add(m); cur.add(g); cur = g;
            }

            const hShape = new THREE.Shape();
            for(let i=0; i<6; i++) {
                const a = i * Math.PI / 3;
                const hx = s * Math.cos(a); const hy = s * Math.sin(a) + h;
                if(i===0) hShape.moveTo(hx, hy); else hShape.lineTo(hx, hy);
            }
            const hTop = new THREE.Group(); hTop.position.y = -L/2; hTop.rotation.x = -(Math.PI/2) * this.foldProgress;
            const mHTop = new THREE.Mesh(new THREE.ShapeGeometry(hShape), new THREE.MeshStandardMaterial({color: 0x0369a1, side: THREE.DoubleSide}));
            mHTop.rotation.z = Math.PI; hTop.add(mHTop); baseGroup.add(hTop);

            const hBot = new THREE.Group(); hBot.position.y = L/2; hBot.rotation.x = (Math.PI/2) * this.foldProgress;
            const mHBot = new THREE.Mesh(new THREE.ShapeGeometry(hShape), new THREE.MeshStandardMaterial({color: 0x0369a1, side: THREE.DoubleSide}));
            hBot.add(mHBot); baseGroup.add(hBot);

            const px = s + 20 + offX;
            const py = 2*h + 20 + offY;
            finalW = 6 * s + 40 + offX;
            finalH = L + 4*h + 40 + offY;
            
            for(let i=1; i<6; i++) {
                drawing.folds.push(`<line x1="${px+i*s}" y1="${py}" x2="${px+i*s}" y2="${py+L}" stroke="#38bdf8" stroke-dasharray="4,2"/>`);
            }
            drawing.folds.push(`<line x1="${px}" y1="${py}" x2="${px+s}" y2="${py}" stroke="#38bdf8" stroke-dasharray="4,2"/>`);
            drawing.folds.push(`<line x1="${px}" y1="${py+L}" x2="${px+s}" y2="${py+L}" stroke="#38bdf8" stroke-dasharray="4,2"/>`);

            this.add3DLabel(`Side: ${fmt(s)}`, 0, -L/2 - 20, 0);
            this.add3DLabel(`L: ${fmt(L)}`, s*1.5 + 20, 0, 0);

            let path = `M ${px} ${py} L ${px+s/2} ${py-h} L ${px+s/2} ${py-2*h} L ${px+s*1.5} ${py-2*h} L ${px+s*1.5} ${py-h} L ${px+s} ${py} L ${px+6*s} ${py} L ${px+6*s} ${py+L} L ${px+s} ${py+L} L ${px+s*1.5} ${py+L+h} L ${px+s*1.5} ${py+L+2*h} L ${px+s/2} ${py+L+2*h} L ${px+s/2} ${py+L+h} L ${px} ${py+L} Z`;
            drawing.cuts.push(`<path d="${path}" fill="none" stroke="#f43f5e" stroke-width="2"/>`);

            // CNC Helpers for PRISM (Hexagon)
            genDogBone(px, py); genDogBone(px+6*s, py); genDogBone(px, py+L); genDogBone(px+6*s, py+L);
            for(let i=1; i<6; i++) {
                genDogBone(px+i*s, py); genDogBone(px+i*s, py+L);
            }
            genTab(px+3*s, py, false); genTab(px+3*s, py+L, false);
            genTab(px+6*s, py+L/2, true); genTab(px, py+L/2, true); 
            genRivets(px, py, px+6*s, py, 0, -5);
            genRivets(px, py+L, px+6*s, py+L, 0, 5);

        } else if(this.selectedShape === 'TETRA') {
            const s = getVal('valL', 200);
            const h = s * Math.sqrt(3) / 2;
            
            const fAngle = (Math.PI - Math.acos(1/3)) * this.foldProgress;
            const shape = new THREE.Shape(); shape.moveTo(-s/2, 0); shape.lineTo(s/2, 0); shape.lineTo(0, h); shape.lineTo(-s/2, 0);
            const baseGroup = new THREE.Group(); baseGroup.rotation.x = -Math.PI / 2; this.meshObj.add(baseGroup);
            baseGroup.add(new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshStandardMaterial({color: 0xec4899, side: THREE.DoubleSide})));

            const createFold = (x, y, rotZ) => {
                const place = new THREE.Group();
                place.position.set(x, y, 0);
                place.rotation.z = rotZ;
                
                const fold = new THREE.Group();
                fold.rotation.x = -fAngle; // fold up
                
                const m = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshStandardMaterial({color: 0xdb2777, side: THREE.DoubleSide}));
                m.rotation.z = Math.PI; // point outward
                fold.add(m);
                place.add(fold);
                return place;
            };

            baseGroup.add(createFold(0, 0, 0));
            baseGroup.add(createFold(s/4, h/2, 2*Math.PI/3));
            baseGroup.add(createFold(-s/4, h/2, -2*Math.PI/3));
            
            const px = s + 20 + offX;
            const py = h + 20 + offY;
            finalW = 2 * s + 40 + offX;
            finalH = 2 * h + 40 + offY;

            drawing.folds.push(`<line x1="${px}" y1="${py}" x2="${px+s}" y2="${py}" stroke="#38bdf8" stroke-dasharray="4,2"/>`);
            drawing.folds.push(`<line x1="${px}" y1="${py}" x2="${px+s/2}" y2="${py+h}" stroke="#38bdf8" stroke-dasharray="4,2"/>`);
            drawing.folds.push(`<line x1="${px+s}" y1="${py}" x2="${px+s/2}" y2="${py+h}" stroke="#38bdf8" stroke-dasharray="4,2"/>`);

            this.add3DLabel(`Side: ${fmt(s)}`, 0, -h/2 - 20, 0);

            let path = `M ${px} ${py} L ${px+s/2} ${py-h} L ${px+s} ${py} L ${px+1.5*s} ${py+h} L ${px+s/2} ${py+h} L ${px-s/2} ${py+h} Z`;
            drawing.cuts.push(`<path d="${path}" fill="none" stroke="#f43f5e" stroke-width="2"/>`);

            // CNC Helpers for TETRA
            genDogBone(px, py); genDogBone(px+s, py); genDogBone(px+s/2, py+h);
            genTab(px+s/4, py-h/2, true); genTab(px+3*s/4, py-h/2, true);
            genTab(px+s/2, py+h, false);
            genRivets(px, py, px+s, py, 0, -5);

        } else if(this.selectedShape === 'OCTAHEDRON') {
            const s = getVal('valL', 200);
            const h = s * Math.sqrt(3) / 2;
            
            // True Folding 3D Octahedron via deltahedron kinematic snake
            const dihedral = Math.acos(-1/3); // 109.47 degrees
            const fAngle = (Math.PI - dihedral) * this.foldProgress;
            
            const shape = new THREE.Shape();
            shape.moveTo(-s/2, 0); shape.lineTo(s/2, 0); shape.lineTo(0, h); shape.lineTo(-s/2, 0);

            const baseGroup = new THREE.Group();
            baseGroup.rotation.x = -Math.PI / 2; // Lie flat
            // Shift group so that the entire shape centers reasonably
            baseGroup.position.x = -s * 1.5;
            this.meshObj.add(baseGroup);

            const colors = [0xef4444, 0xf97316, 0xf59e0b, 0x84cc16, 0x10b981, 0x06b6d4, 0x3b82f6, 0x8b5cf6];
            let currentParent = baseGroup;
            
            for (let i = 0; i < 8; i++) {
                const foldGroup = new THREE.Group();
                foldGroup.rotation.x = fAngle; // Fold inwards
                
                const m = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshStandardMaterial({color: colors[i], side: THREE.DoubleSide}));
                foldGroup.add(m);
                currentParent.add(foldGroup);
                
                if (i < 7) {
                    const nextPlace = new THREE.Group();
                    nextPlace.position.set(s/4, h/2, 0);
                    nextPlace.rotation.z = -Math.PI/3; // -60 deg properly aligns it pointing outwards on right edge
                    foldGroup.add(nextPlace);
                    currentParent = nextPlace;
                }
            }

            const px = 20 + offX;
            const py = h + 20 + offY;
            finalW = 4.5 * s + 40 + offX;
            finalH = 2 * h + 40 + offY;

            let pTop = [];
            let pBot = [];
            for(let i=0; i<5; i++) {
                pTop.push({x: px + i*s + s/2, y: py - h});
                pBot.push({x: px + i*s, y: py});
            }
            
            const line = (p1, p2) => `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="#38bdf8" stroke-dasharray="4,2"/>`;

            for(let i=0; i<4; i++) {
                drawing.folds.push(line(pBot[i+1], pTop[i]));
                if(i < 3) drawing.folds.push(line(pTop[i+1], pBot[i+1]));
            }

            let path = `M ${pBot[0].x} ${pBot[0].y} L ${pBot[4].x} ${pBot[4].y} L ${pTop[4].x} ${pTop[4].y} L ${pTop[0].x} ${pTop[0].y} Z`;
            drawing.cuts.push(`<path d="${path}" fill="none" stroke="#f43f5e" stroke-width="2"/>`);

            this.lastVertices = [
                [0, h], [4*s, h], [4.5*s, 0], [0.5*s, 0]
            ];

            this.add3DLabel(`Side: ${fmt(s)}`, 0, -h/2 - 20, 0);

        } else if(this.selectedShape === 'LCORNER') {
            const w1 = getVal('valW', 150) - vDeduction;
            const w2 = getVal('valD', 150);
            const L = getVal('valH', 400);
            
            const createFace = (fw, fh, color) => {
                const group = new THREE.Group();
                const mesh = new THREE.Mesh(new THREE.PlaneGeometry(fw, fh), new THREE.MeshStandardMaterial({color: color, side: THREE.DoubleSide}));
                group.add(mesh);
                return { group, mesh };
            };

            const fAngle = (Math.PI / 2) * this.foldProgress;
            const rM = 3;
            let holes1 = []; let holes2 = [];
            if (document.getElementById('wallMountHoles')?.checked) {
                holes1.push({x: 0, y: -L/2+20, r: rM}); holes1.push({x: 0, y: L/2-20, r: rM});
                holes2.push({x: 0, y: -L/2+20, r: rM}); holes2.push({x: 0, y: L/2-20, r: rM});
            }
            const face1 = createFace(w1, L, 0x38bdf8, holes1);
            face1.mesh.position.x = -w1/2;
            this.meshObj.add(face1.group);

            const face2 = createFace(w2, L, 0x0ea5e9, holes2);
            face2.mesh.position.x = w2/2; face2.mesh.rotation.y = Math.PI/2;
            face2.group.position.x = 0; face2.group.rotation.y = -fAngle;
            face1.group.add(face2.group);

            const px = 20 + offX, py = 20 + offY;
            finalW = w1 + w2 + 40 + offX; finalH = L + 40 + offY;

            drawing.folds.push(`<line x1="${px+w1}" y1="${py}" x2="${px+w1}" y2="${py+L}" stroke="#38bdf8" stroke-dasharray="4,2"/>`);
            drawing.cuts.push(`<rect x="${px}" y="${py}" width="${w1+w2}" height="${L}" fill="none" stroke="#f43f5e" stroke-width="2"/>`);
            this.lastVertices = [[0, 0], [w1+w2, 0], [w1+w2, L], [0, L]];
            
            this.add3DLabel(`W1: ${fmt(w1)}`, -w1/2 - 20, 0, 0, face1.group);
            this.add3DLabel(`W2: ${fmt(w2)}`, w2/2 + 20, 0, 0, face2.group);
            this.add3DLabel(`L: ${fmt(L)}`, 0, L/2 + 20, 0, face1.group);
            
            genRivets(px, py, px, py+L, 10, 0);
            genRivets(px+w1+w2, py, px+w1+w2, py+L, -10, 0);
            genWallMount(px, py, w1, L);
            genWallMount(px+w1, py, w2, L);
            
            genDogBone(px+w1, py);
            genDogBone(px+w1, py+L);
            
            genTab(px+w1/2, py, false);
            genTab(px+w1+w2/2, py+L, false);

        } else if(this.selectedShape === 'USHAPE') {
            const w1 = getVal('valW', 100);
            const w2 = getVal('valD', 200) - vDeduction;
            const w3 = getVal('valL', 100);
            const L = getVal('valH', 400);

            const createFace = (fw, fh, color) => {
                const group = new THREE.Group();
                const mesh = new THREE.Mesh(new THREE.PlaneGeometry(fw, fh), new THREE.MeshStandardMaterial({color: color, side: THREE.DoubleSide}));
                group.add(mesh);
                return { group, mesh };
            };

            const fAngle = (Math.PI / 2) * this.foldProgress;
            let baseHoles = [];
            if (document.getElementById('wallMountHoles')?.checked) {
                baseHoles.push({x: 0, y: -L/2+20, r: 3}); baseHoles.push({x: 0, y: L/2-20, r: 3});
            }
            const base = createFace(w2, L, 0x10b981, baseHoles);
            this.meshObj.add(base.group);

            const left = createFace(w1, L, 0x059669);
            left.mesh.position.x = -w1/2; left.mesh.rotation.y = -Math.PI/2;
            left.group.position.x = -w2/2; left.group.rotation.y = fAngle;
            base.group.add(left.group);

            const right = createFace(w3, L, 0x059669);
            right.mesh.position.x = w3/2; right.mesh.rotation.y = Math.PI/2;
            right.group.position.x = w2/2; right.group.rotation.y = -fAngle;
            base.group.add(right.group);

            const px = 20 + offX, py = 20 + offY;
            finalW = w1 + w2 + w3 + 40 + offX; finalH = L + 40 + offY;

            drawing.folds.push(`<line x1="${px+w1}" y1="${py}" x2="${px+w1}" y2="${py+L}" stroke="#38bdf8" stroke-dasharray="4,2"/>`);
            drawing.folds.push(`<line x1="${px+w1+w2}" y1="${py}" x2="${px+w1+w2}" y2="${py+L}" stroke="#38bdf8" stroke-dasharray="4,2"/>`);
            drawing.cuts.push(`<rect x="${px}" y="${py}" width="${w1+w2+w3}" height="${L}" fill="none" stroke="#f43f5e" stroke-width="2"/>`);
            
            this.lastVertices = [
                [0, 0], [w1+w2+w3, 0], [w1+w2+w3, L], [0, L]
            ];
            
            this.add3DLabel(`W1: ${fmt(w1)}`, -w1/2 - 20, 0, 0, left.group);
            this.add3DLabel(`W2: ${fmt(w2)}`, 0, -L/2 - 20, 0, base.group);
            this.add3DLabel(`W3: ${fmt(w3)}`, w3/2 + 20, 0, 0, right.group);
            this.add3DLabel(`L: ${fmt(L)}`, 0, L/2 + 20, 0, base.group);
            
            genRivets(px, py, px, py+L, 10, 0);
            genRivets(px+w1+w2+w3, py, px+w1+w2+w3, py+L, -10, 0);
            genWallMount(px+w1, py, w2, L);
            
            genDogBone(px+w1, py);
            genDogBone(px+w1, py+L);
            genDogBone(px+w1+w2, py);
            genDogBone(px+w1+w2, py+L);
            
            genTab(px+w1/2, py, false);
            genTab(px+w1+w2+w3/2, py+L, false);

        } else if(this.selectedShape === 'ALPHABET') {
            const char = (document.getElementById('valChar')?.value || 'A').toUpperCase();
            const size = getVal('valW', 200);
            const depth = getVal('valH', 50);
            
            const rawPaths = this.LETTER_PATHS[char] || this.LETTER_PATHS['A'];
            // Normalize: If it's a single loop, wrap it in an array
            const loops = Array.isArray(rawPaths[0][0]) ? rawPaths : [rawPaths];
            
            const scale = size / 100;
            const scaledLoops = loops.map(loop => loop.map(p => [p[0] * scale, p[1] * scale]));
            
            // 3D Model with Folding Simulation
            // Y is inverted here so that THREE.Shape renders alphabet right-side up
            const faceShape = new THREE.Shape();
            const outer = scaledLoops[0];
            this.lastVertices = outer.map(p => [p[0], p[1]]);
            
            // Outer loop: Invert Y and reverse iteration for proper CCW mapping
            faceShape.moveTo(outer[0][0], -outer[0][1]);
            for(let i=outer.length-1; i>=1; i--) faceShape.lineTo(outer[i][0], -outer[i][1]);
            
            // Holes
            const holeRects = [];
            for(let h=1; h<scaledLoops.length; h++) {
                const hole = scaledLoops[h];
                const holePath = new THREE.Path();
                holePath.moveTo(hole[0][0], -hole[0][1]);
                for(let i=hole.length-1; i>=1; i--) holePath.lineTo(hole[i][0], -hole[i][1]);
                
                let minHX = Infinity, minHY = Infinity, maxHX = -Infinity, maxHY = -Infinity;
                hole.forEach(p => {
                    minHX = Math.min(minHX, p[0]); maxHX = Math.max(maxHX, p[0]);
                    minHY = Math.min(minHY, p[1]); maxHY = Math.max(maxHY, p[1]);
                });
                faceShape.holes.push(holePath);
                
                holeRects.push({
                    x: minHX, y: minHY,
                    w: maxHX - minHX, h: maxHY - minHY
                });
            }
            
            const faceGroup = new THREE.Group();
            faceGroup.rotation.x = -Math.PI / 2; // Lie flat on ground
            this.meshObj.add(faceGroup);

            const faceMesh = new THREE.Mesh(new THREE.ShapeGeometry(faceShape), new THREE.MeshStandardMaterial({ color: 0x3b82f6, side: THREE.DoubleSide }));
            faceGroup.add(faceMesh);
            
            // Walls for ALL loops
            scaledLoops.forEach((loop, lIdx) => {
                for(let i=0; i<loop.length; i++) {
                    const p1 = loop[i];
                    const p2 = loop[(i+1)%loop.length];
                    const dx = p2[0] - p1[0], dy = p2[1] - p1[1];
                    const len = Math.sqrt(dx*dx + dy*dy);
                    // Match inverted Y and reversed orientation
                    const angle = Math.atan2(-dy, dx); 
                    
                    const wallGroup = new THREE.Group();
                    wallGroup.position.set(p1[0], -p1[1], 0);
                    wallGroup.rotation.z = angle;
                    
                    const hinge = new THREE.Group();
                    // Fold from flat (0) to standing erect (-90 deg rotation around X)
                    hinge.rotation.x = -Math.PI/2 * this.foldProgress;
                    
                    const wallMesh = new THREE.Mesh(
                        new THREE.PlaneGeometry(len, depth),
                        new THREE.MeshStandardMaterial({ color: lIdx === 0 ? 0x60a5fa : 0x93c5fd, side: THREE.DoubleSide })
                    );
                    // Initially lie flat extending outward
                    wallMesh.position.set(len/2, depth/2, 0); 
                    wallMesh.rotation.x = 0; 
                    
                    hinge.add(wallMesh);
                    wallGroup.add(hinge);
                    faceMesh.add(wallGroup);
                }
            });

            this.add3DLabel(`Size: ${fmt(size)}`, size/2, -size/2, depth+10);
            
            // ATOMIZE: Create individual layout data
            this.lastLayoutData = [];
            const kerfMargin = parseFloat(document.getElementById('kerfMargin')?.value) || 0;

            // 1. Face (Single piece combining outer loop and holes)
            const minX = Math.min(...outer.map(p => p[0]));
            const maxX = Math.max(...outer.map(p => p[0]));
            const minY = Math.min(...outer.map(p => p[1]));
            const maxY = Math.max(...outer.map(p => p[1]));
            const lw = maxX - minX, lh = maxY - minY;

            let faceCmd = "";
            scaledLoops.forEach(loop => {
                faceCmd += `M ${loop.map(p => (p[0] - minX).toFixed(1) + ',' + (p[1] - minY).toFixed(1)).join(' L ')} Z `;
            });

            const faceSvg = `<svg viewBox="-1 -1 ${lw+2} ${lh+2}" xmlns="http://www.w3.org/2000/svg">
                <path d="${faceCmd}" fill="none" stroke="#f43f5e" stroke-width="2"/>
            </svg>`;

            this.lastLayoutData.push({
                content: faceSvg, width: lw + kerfMargin, height: lh + kerfMargin,
                label: `Face ${char}`, labelName: char, kerf: kerfMargin,
                vertices: outer.map(p => [p[0] - minX, p[1] - minY]),
                holes: holeRects.length > 0 ? holeRects.map(h => ({ x: h.x - minX, y: h.y - minY, w: h.w, h: h.h })) : []
            });

            // 2D Preview Drawing Logic
            let pathCmd = "";
            scaledLoops.forEach(loop => {
                pathCmd += `M ${loop[0][0]} ${loop[0][1]} `;
                for(let i=1; i<loop.length; i++) pathCmd += `L ${loop[i][0]} ${loop[i][1]} `;
                pathCmd += 'Z ';
            });
            drawing.cuts.push(`<path d="${pathCmd}" fill="none" stroke="#38bdf8" stroke-width="2"/>`);

            let curReturnY = size + 40;
            // 2. Returns
            scaledLoops.forEach((loop, lIdx) => {
                let totalLen = 0;
                let foldLines = "";
                for(let i=0; i<loop.length; i++) {
                    const p1 = loop[i]; const p2 = loop[(i+1)%loop.length];
                    const d = Math.sqrt(Math.pow(p2[0]-p1[0],2) + Math.pow(p2[1]-p1[1],2));
                    if (i < loop.length - 1) {
                         foldLines += `<line x1="${(totalLen + d).toFixed(1)}" y1="0" x2="${(totalLen + d).toFixed(1)}" y2="${depth.toFixed(1)}" stroke="#38bdf8" stroke-dasharray="4,2"/>`;
                    }
                    totalLen += d; 
                }

                drawing.cuts.push(`<rect x="0" y="${curReturnY}" width="${totalLen}" height="${depth}" fill="none" stroke="#f43f5e" stroke-width="2"/>`);
                drawing.folds.push(`<g transform="translate(0, ${curReturnY})">${foldLines}</g>`);
                drawing.folds.push(`<text x="${totalLen/2}" y="${curReturnY - 5}" fill="#94a3b8" font-size="12" font-family="sans-serif" text-anchor="middle">Return ${lIdx===0?'Out':'In'} (${fmt(totalLen)} x ${fmt(depth)})</text>`);

                const returnSvg = `<svg viewBox="-1 -1 ${totalLen+2} ${depth+2}" xmlns="http://www.w3.org/2000/svg">
                    <rect x="0" y="0" width="${totalLen.toFixed(1)}" height="${depth.toFixed(1)}" fill="none" stroke="#f43f5e" stroke-width="2"/>
                    ${foldLines}
                </svg>`;

                this.lastLayoutData.push({
                    content: returnSvg, width: totalLen + kerfMargin, height: depth + kerfMargin,
                    label: `Return ${lIdx==0?'Out':'In'}`, labelName: 'RET', kerf: kerfMargin,
                    vertices: [[0,0], [totalLen,0], [totalLen,depth], [0,depth]]
                });
                
                curReturnY += depth + 40;
            });

            finalW = size * 2; 
            finalH = curReturnY;

        } else {
            const L = getVal('valL', 150);
            this.meshObj.add(new THREE.Mesh(new THREE.IcosahedronGeometry(L/2, 0), new THREE.MeshStandardMaterial({color: 0x94a3b8})));
            drawing.cuts.push(`<rect x="${10+offX}" y="${10+offY}" width="${L}" height="${L}" fill="none" stroke="#f43f5e" stroke-dasharray="5,5" stroke-width="2"/>`);
            finalW = L + 20 + offX; finalH = L + 20 + offY;
            this.add3DLabel(`Size: ${fmt(L)}`, 0, -L/2 - 20, 0);
        }

        // Auto-center and ground the 3D model
        this.meshObj.position.set(0, 0, 0);
        this.meshObj.updateMatrixWorld(true);
        const box = new THREE.Box3();
        this.meshObj.traverse((child) => {
            if (child.isMesh && child.geometry) {
                child.geometry.computeBoundingBox();
                const childBox = new THREE.Box3().copy(child.geometry.boundingBox).applyMatrix4(child.matrixWorld);
                box.union(childBox);
            }
        });
        
        if (box.max.y > -Infinity) {
            this.meshObj.position.y = -100 - box.min.y; // Ground at Y = -100
            this.meshObj.position.x = -(box.min.x + box.max.x) / 2;
            this.meshObj.position.z = -(box.min.z + box.max.z) / 2;
        }


        let svg = `<svg viewBox="${-kerf/2} ${-kerf/2} ${finalW+kerf} ${finalH+kerf}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><g>${drawing.folds.join('')}${drawing.cuts.join('')}</g></svg>`;
        document.getElementById('svgOutputDisplay').innerText = svg;
        document.getElementById('rightViewportZone').innerHTML = svg;
        this.center2D();
        this.updateMaterialSummary(finalW, finalH, vDeduction);
        
        // Bounding Box layout for non-ALPHABET shapes
        if (!Array.isArray(this.lastLayoutData)) {
            this.lastLayoutData = { 
                content: svg, 
                width: finalW + kerf, 
                height: finalH + kerf, 
                label: this.selectedShape, 
                labelName: this.selectedShape,
                kerf: kerf,
                holes: [],
                vertices: this.lastVertices || []
            };
        }
    }

    sendToLayout() {
        if (this.lastLayoutData) {
            const qty = parseInt(document.getElementById('genQty')?.value) || 1;
            const dataToProcess = Array.isArray(this.lastLayoutData) ? this.lastLayoutData : [this.lastLayoutData];
            for(let i=0; i<qty; i++) {
                dataToProcess.forEach(item => {
                    layoutManager.addPiece(JSON.parse(JSON.stringify(item)));
                });
            }
        }
    }

    downloadSVG() {
        const svg = document.getElementById('svgOutputDisplay').innerText;
        const blob = new Blob([svg], {type: 'image/svg+xml'});
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `ACFold_${this.selectedShape}_Blueprint.svg`; a.click();
    }

    downloadDXF() {
        const dVersion = document.getElementById('dxfVersion') ? document.getElementById('dxfVersion').value : 'R12';
        const dEx = new EnterpriseDXF(dVersion);
        
        const svg = document.getElementById('svgOutputDisplay').innerHTML;
        const parser = new DOMParser();
        const doc = parser.parseFromString(svg, 'image/svg+xml');

        ['line', 'path', 'circle'].forEach(tag => {
            doc.querySelectorAll(tag).forEach(el => {
                let layer = '';
                const stroke = el.getAttribute('stroke');
                if (stroke === '#10b981') layer = 'Layer_CUT';
                else if (stroke === '#38bdf8') layer = 'Layer_V-GROOVE';
                else if (stroke === '#fbbf24') layer = 'Layer_HOLE';
                else if (tag === 'circle') layer = 'Layer_HOLE';
                else if (tag === 'path') layer = 'Layer_CUT';
                else if (tag === 'line' && stroke !== '#38bdf8') layer = 'Layer_CUT';
                if(layer !== '') dEx.addSvgToDXF(layer, el);
            });
        });
        
        dEx.exportDXF(`ACFold_${this.selectedShape}_${dVersion}.dxf`);
    }
}

