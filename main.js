/**
 * IRON // MECHA VIRTUAL SHOWCASE & HUD CONTROLLER
 * Vanilla ES6 + Three.js + Web Audio API + GSAP
 */

(() => {
  'use strict';

  // =========================================================================
  // 1. STATE & CONSTANTS
  // =========================================================================
  const STATE = {
    mouse: { x: 0, y: 0, targetX: 0, targetY: 0, normalizedX: 0, normalizedY: 0 },
    theme: {
      activeColor: 0x00f3ff,
      colorHex: '#00f3ff',
      mode: 'titan'
    },
    empActive: false,
    audioPlaying: false,
    currentTrackIndex: 0
  };

  const PLAYLIST = [
    { title: "Mr. Robot Main Theme // Mac Quayle", src: "playlist/MR. Robot Main Theme  (What's Your Ask-16374     Mac Quayle )-EN.mp4" },
    { title: "BATMOBILE", src: "playlist/BATMOBILE.mp3" },
    { title: "PHANTOM X PARA YAPMAKTA", src: "playlist/PHANTOM X PARA YAPMAKTA.mp3" },
    { title: "EGE! & Lil Zey - Ketojenik", src: "playlist/EGE! & Lil Zey - ketojenik .mp4" },
    { title: "LVBELC5", src: "playlist/LVBELC5.mp3" },
    { title: "Motive - Yin Yang", src: "playlist/Motive - Topic – YIN YANG.mp3" }
  ];

  // =========================================================================
  // 2. AUDIO SYSTEM & SPECTRUM ANALYZER
  // =========================================================================
  class CyberAudioSystem {
    constructor() {
      this.ctx = null;
      this.analyser = null;
      this.audioEl = document.getElementById('localAudioPlayer');
      this.sourceNode = null;
      this.osc1 = null;
      this.osc2 = null;
      this.gainNode = null;
      this.filterNode = null;
      this.isPlaying = false;
      this.dataArray = null;
      this.bufferLength = 0;
      this.usingLocalAudio = false;
      this.trackIndex = 0;
    }

    init() {
      if (this.ctx) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(this.bufferLength);

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0.35, this.ctx.currentTime);

      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(800, this.ctx.currentTime);

      this.gainNode.connect(this.ctx.destination);

      // Connect HTML5 Audio Element to Analyser
      if (this.audioEl) {
        try {
          this.sourceNode = this.ctx.createMediaElementSource(this.audioEl);
          this.sourceNode.connect(this.analyser);
          this.analyser.connect(this.ctx.destination);
          this.usingLocalAudio = true;
        } catch (e) {
          this.usingLocalAudio = false;
        }
      }
    }

    playUiBeep(freq = 880, type = 'sine', duration = 0.08) {
      if (!this.ctx) this.init();
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    }

    async togglePlay() {
      if (!this.ctx) this.init();
      if (this.ctx.state === 'suspended') await this.ctx.resume();

      if (this.isPlaying) {
        this.pause();
      } else {
        this.playTrack(this.trackIndex);
      }
      return this.isPlaying;
    }

    playTrack(index) {
      this.trackIndex = (index + PLAYLIST.length) % PLAYLIST.length;
      const track = PLAYLIST[this.trackIndex];
      const display = document.getElementById('trackNameDisplay');
      if (display) display.textContent = track.title;

      if (this.audioEl) {
        this.audioEl.src = track.src;
        this.audioEl.play().then(() => {
          this.isPlaying = true;
          this.updatePlayStateUI(true);
        }).catch(() => {
          // Fallback to procedural synth drone
          this.startProceduralDrone();
        });
      } else {
        this.startProceduralDrone();
      }
    }

    pause() {
      this.isPlaying = false;
      if (this.audioEl) this.audioEl.pause();
      this.stopProceduralDrone();
      this.updatePlayStateUI(false);
    }

    next() {
      this.playTrack(this.trackIndex + 1);
    }

    prev() {
      this.playTrack(this.trackIndex - 1);
    }

    updatePlayStateUI(playing) {
      const btn = document.getElementById('playToggleBtn');
      const badge = document.getElementById('audioStateBadge');
      if (btn) btn.innerHTML = playing ? '<i data-lucide="pause"></i>' : '<i data-lucide="play"></i>';
      if (badge) {
        badge.textContent = playing ? 'TRANSMITTING' : 'STANDBY';
        badge.style.color = playing ? 'var(--neon-green)' : 'var(--neon-cyan)';
      }
      if (window.lucide) window.lucide.createIcons();
    }

    startProceduralDrone() {
      this.stopProceduralDrone();
      this.isPlaying = true;
      this.updatePlayStateUI(true);

      this.osc1 = this.ctx.createOscillator();
      this.osc2 = this.ctx.createOscillator();
      this.osc1.type = 'sawtooth';
      this.osc1.frequency.setValueAtTime(55, this.ctx.currentTime); // A1 note
      this.osc2.type = 'sine';
      this.osc2.frequency.setValueAtTime(110.5, this.ctx.currentTime);

      this.osc1.connect(this.filterNode);
      this.osc2.connect(this.filterNode);
      this.filterNode.connect(this.analyser);
      this.analyser.connect(this.gainNode);

      this.osc1.start();
      this.osc2.start();
    }

    stopProceduralDrone() {
      try {
        if (this.osc1) { this.osc1.stop(); this.osc1.disconnect(); }
        if (this.osc2) { this.osc2.stop(); this.osc2.disconnect(); }
      } catch (e) {}
    }

    setVolume(val) {
      if (this.audioEl) this.audioEl.volume = parseFloat(val);
      if (this.gainNode && this.ctx) {
        this.gainNode.gain.setTargetAtTime(parseFloat(val), this.ctx.currentTime, 0.05);
      }
    }

    renderSpectrum(canvas, ctx) {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (this.isPlaying && this.analyser) {
        this.analyser.getByteFrequencyData(this.dataArray);
      }

      const barWidth = (canvas.width / this.bufferLength) * 1.6;
      let x = 0;

      for (let i = 0; i < this.bufferLength; i++) {
        const barHeight = this.isPlaying ? (this.dataArray[i] / 255) * canvas.height : 2;
        ctx.fillStyle = STATE.theme.colorHex;
        ctx.shadowColor = STATE.theme.colorHex;
        ctx.shadowBlur = 4;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
        x += barWidth;
      }
    }
  }

  const audioSystem = new CyberAudioSystem();

  // =========================================================================
  // 3. THREE.JS 3D SCENE (CYBER-MECH CORE & EXPLODED ARMOR VIEW)
  // =========================================================================
  class MechaScene {
    constructor(container) {
      this.container = container;
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.mechGroup = null;
      this.headMesh = null;
      this.armorPlates = [];
      this.particles = null;
      this.hologramRings = [];
      this.pointLight = null;
      this.empShockwave = null;
      this.isExploded = false;
      this.clock = new THREE.Clock();

      this.init();
    }

    init() {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // 1. Scene & Camera
      this.scene = new THREE.Scene();
      this.scene.fog = new THREE.FogExp2(0x030712, 0.035);

      this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      this.camera.position.set(0, 0, 7.5);

      // 2. Renderer
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.container.appendChild(this.renderer.domElement);

      // 3. Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      this.scene.add(ambientLight);

      this.pointLight = new THREE.PointLight(STATE.theme.activeColor, 4, 15);
      this.pointLight.position.set(2, 3, 4);
      this.scene.add(this.pointLight);

      const backLight = new THREE.DirectionalLight(0xbc13fe, 1.5);
      backLight.position.set(-4, -2, -3);
      this.scene.add(backLight);

      // 4. Build Mecha Geometry
      this.buildProceduralMecha();
      this.buildHolographicRings();
      this.buildEmpShockwave();
      this.buildDustParticles();

      // 5. Events
      window.addEventListener('resize', () => this.onResize());
    }

    buildProceduralMecha() {
      this.mechGroup = new THREE.Group();

      // Materials
      const darkMetalMat = new THREE.MeshStandardMaterial({
        color: 0x111827,
        roughness: 0.3,
        metalness: 0.85
      });

      const armorMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.2,
        metalness: 0.9,
        wireframe: false
      });

      const neonMat = new THREE.MeshBasicMaterial({
        color: STATE.theme.activeColor,
        wireframe: true
      });

      // A. Core Power Orb (Inner Engine)
      const coreGeo = new THREE.IcosahedronGeometry(0.65, 3);
      this.coreMesh = new THREE.Mesh(coreGeo, neonMat);
      this.mechGroup.add(this.coreMesh);

      // B. Floating Mecha Head / Sensor Visor
      const headGeo = new THREE.ConeGeometry(0.4, 0.6, 4);
      headGeo.rotateX(Math.PI);
      this.headMesh = new THREE.Mesh(headGeo, darkMetalMat);
      this.headMesh.position.set(0, 1.35, 0);

      const visorGeo = new THREE.BoxGeometry(0.35, 0.08, 0.2);
      const visorMat = new THREE.MeshBasicMaterial({ color: 0x00ff66 });
      const visorMesh = new THREE.Mesh(visorGeo, visorMat);
      visorMesh.position.set(0, 0, 0.2);
      this.headMesh.add(visorMesh);
      this.mechGroup.add(this.headMesh);

      // C. Modular Armor Plates (For Exploded View Detonation)
      const platePositions = [
        { x: 1.0, y: 0.5, z: 0.6, rx: 0.2, ry: -0.4 },
        { x: -1.0, y: 0.5, z: 0.6, rx: 0.2, ry: 0.4 },
        { x: 1.0, y: -0.5, z: 0.6, rx: -0.2, ry: -0.4 },
        { x: -1.0, y: -0.5, z: 0.6, rx: -0.2, ry: 0.4 },
        { x: 0, y: 0.9, z: -0.8, rx: 0.5, ry: 0 },
        { x: 0, y: -0.9, z: -0.8, rx: -0.5, ry: 0 },
        { x: 1.2, y: 0, z: -0.4, rx: 0, ry: 1.2 },
        { x: -1.2, y: 0, z: -0.4, rx: 0, ry: -1.2 }
      ];

      platePositions.forEach((pos) => {
        const plateGeo = new THREE.BoxGeometry(0.55, 0.4, 0.12);
        const plate = new THREE.Mesh(plateGeo, armorMat);
        plate.position.set(pos.x, pos.y, pos.z);
        plate.rotation.set(pos.rx, pos.ry, 0);

        plate.userData = {
          originPos: new THREE.Vector3(pos.x, pos.y, pos.z),
          originRot: new THREE.Vector3(pos.rx, pos.ry, 0),
          explodedOffset: new THREE.Vector3(pos.x * 2.5, pos.y * 2.2, pos.z * 2.8)
        };

        this.armorPlates.push(plate);
        this.mechGroup.add(plate);
      });

      this.scene.add(this.mechGroup);
    }

    buildHolographicRings() {
      const ringMat = new THREE.MeshBasicMaterial({
        color: STATE.theme.activeColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35,
        wireframe: true
      });

      for (let i = 0; i < 3; i++) {
        const ringGeo = new THREE.RingGeometry(1.6 + i * 0.35, 1.63 + i * 0.35, 36);
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2 + (i * 0.3);
        ring.userData = { speed: (i + 1) * 0.008 * (i % 2 === 0 ? 1 : -1) };
        this.hologramRings.push(ring);
        this.scene.add(ring);
      }
    }

    buildEmpShockwave() {
      const geo = new THREE.RingGeometry(0.1, 0.4, 48);
      const mat = new THREE.MeshBasicMaterial({
        color: STATE.theme.activeColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0
      });
      this.empShockwave = new THREE.Mesh(geo, mat);
      this.empShockwave.rotation.x = Math.PI / 2;
      this.scene.add(this.empShockwave);
    }

    buildDustParticles() {
      const pCount = 200;
      const geo = new THREE.BufferGeometry();
      const positions = new Float32Array(pCount * 3);

      for (let i = 0; i < pCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 15;
        positions[i + 1] = (Math.random() - 0.5) * 15;
        positions[i + 2] = (Math.random() - 0.5) * 15;
      }

      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({
        size: 0.035,
        color: 0x00f3ff,
        transparent: true,
        opacity: 0.5
      });
      this.particles = new THREE.Points(geo, mat);
      this.scene.add(this.particles);
    }

    triggerEmpExplosion() {
      audioSystem.playUiBeep(120, 'sawtooth', 0.4);
      audioSystem.playUiBeep(440, 'sine', 0.2);

      this.isExploded = !this.isExploded;

      // Armor plates explosion tween via GSAP
      this.armorPlates.forEach(plate => {
        const target = this.isExploded ? plate.userData.explodedOffset : plate.userData.originPos;
        gsap.to(plate.position, {
          x: target.x,
          y: target.y,
          z: target.z,
          duration: 0.65,
          ease: "back.out(2)"
        });
        gsap.to(plate.rotation, {
          x: this.isExploded ? Math.random() * Math.PI : plate.userData.originRot.x,
          y: this.isExploded ? Math.random() * Math.PI : plate.userData.originRot.y,
          duration: 0.65
        });
      });

      // EMP Shockwave expansion
      this.empShockwave.scale.set(0.1, 0.1, 0.1);
      this.empShockwave.material.opacity = 0.95;
      gsap.to(this.empShockwave.scale, {
        x: 18,
        y: 18,
        z: 18,
        duration: 0.85,
        ease: "power2.out"
      });
      gsap.to(this.empShockwave.material, {
        opacity: 0,
        duration: 0.85,
        ease: "power2.out"
      });

      // Camera recoil shock
      gsap.to(this.camera.position, {
        z: 8.2,
        duration: 0.12,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut"
      });
    }

    updateThemeColor(hexNum, hexStr) {
      STATE.theme.activeColor = hexNum;
      STATE.theme.colorHex = hexStr;
      this.pointLight.color.setHex(hexNum);
      this.coreMesh.material.color.setHex(hexNum);
      this.empShockwave.material.color.setHex(hexNum);
      this.hologramRings.forEach(r => r.material.color.setHex(hexNum));
    }

    onResize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    }

    render() {
      const elapsedTime = this.clock.getElapsedTime();

      // Idle Floating Motion (Breathing effect)
      if (this.mechGroup) {
        this.mechGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.12;

        // Mouse Look-At with smooth Lerp
        const targetRotY = STATE.mouse.normalizedX * 0.7;
        const targetRotX = -STATE.mouse.normalizedY * 0.45;

        this.mechGroup.rotation.y += (targetRotY - this.mechGroup.rotation.y) * 0.05;
        this.mechGroup.rotation.x += (targetRotX - this.mechGroup.rotation.x) * 0.05;

        // Head micro tracking
        if (this.headMesh) {
          this.headMesh.rotation.y = STATE.mouse.normalizedX * 0.4;
          this.headMesh.rotation.x = -STATE.mouse.normalizedY * 0.3;
        }

        // Inner Core Spin
        if (this.coreMesh) {
          this.coreMesh.rotation.y += 0.02;
          this.coreMesh.rotation.x += 0.01;
        }
      }

      // Hologram Rings orbit
      this.hologramRings.forEach(ring => {
        ring.rotation.z += ring.userData.speed;
        ring.position.y = this.mechGroup ? this.mechGroup.position.y : 0;
      });

      // Ambient particle drift
      if (this.particles) {
        this.particles.rotation.y = elapsedTime * 0.03;
      }

      this.renderer.render(this.scene, this.camera);
    }
  }

  // =========================================================================
  // 4. RPG RADAR SPIDER CHART (HEXAGON CANVAS)
  // =========================================================================
  class HexagonRadarChart {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.skills = [
        { label: 'PYTHON', value: 0.85 },
        { label: 'JAVASCRIPT', value: 0.80 },
        { label: 'NET_SEC', value: 0.75 },
        { label: 'PENTEST', value: 0.70 },
        { label: 'VIBE_CODE', value: 0.95 },
        { label: 'AI_AGENT', value: 0.90 }
      ];
      this.animProgress = 0;
      this.init();
    }

    init() {
      gsap.to(this, {
        animProgress: 1,
        duration: 1.8,
        ease: 'power3.out'
      });
    }

    draw() {
      const { ctx, canvas, skills, animProgress } = this;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const radius = 80;
      const total = skills.length;

      ctx.clearRect(0, 0, w, h);

      // Draw Concentric Hexagon Grid
      const levels = 4;
      for (let l = 1; l <= levels; l++) {
        const r = (radius / levels) * l;
        ctx.beginPath();
        for (let i = 0; i < total; i++) {
          const angle = (Math.PI * 2 / total) * i - Math.PI / 2;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw Axis Lines
      for (let i = 0; i < total; i++) {
        const angle = (Math.PI * 2 / total) * i - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.2)';
        ctx.stroke();

        // Skill Labels
        const lx = cx + Math.cos(angle) * (radius + 20);
        const ly = cy + Math.sin(angle) * (radius + 15);
        ctx.font = '8px "JetBrains Mono"';
        ctx.fillStyle = '#8b949e';
        ctx.textAlign = 'center';
        ctx.fillText(skills[i].label, lx, ly);
      }

      // Draw Filled Stat Polygon
      ctx.beginPath();
      for (let i = 0; i < total; i++) {
        const angle = (Math.PI * 2 / total) * i - Math.PI / 2;
        const currentR = radius * (skills[i].value * animProgress);
        const x = cx + Math.cos(angle) * currentR;
        const y = cy + Math.sin(angle) * currentR;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(0, 243, 255, 0.28)';
      ctx.fill();
      ctx.strokeStyle = STATE.theme.colorHex;
      ctx.lineWidth = 2;
      ctx.shadowColor = STATE.theme.colorHex;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  // =========================================================================
  // 5. MATRIX KINETIC STREAM BACKGROUND
  // =========================================================================
  class MatrixRain {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.chars = "01アイウエオカキクケコサシスセソタチツテトIRONCYBERHEX404ROOT";
      this.fontSize = 12;
      this.columns = 0;
      this.drops = [];

      this.resize();
      window.addEventListener('resize', () => this.resize());
    }

    resize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.columns = Math.floor(this.canvas.width / this.fontSize);
      this.drops = Array(this.columns).fill(1);
    }

    draw() {
      this.ctx.fillStyle = 'rgba(3, 7, 18, 0.08)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.ctx.fillStyle = STATE.theme.colorHex;
      this.ctx.font = `${this.fontSize}px monospace`;

      for (let i = 0; i < this.drops.length; i++) {
        const text = this.chars[Math.floor(Math.random() * this.chars.length)];
        this.ctx.fillText(text, i * this.fontSize, this.drops[i] * this.fontSize);

        if (this.drops[i] * this.fontSize > this.canvas.height && Math.random() > 0.975) {
          this.drops[i] = 0;
        }
        this.drops[i]++;
      }
    }
  }

  // =========================================================================
  // 6. GITHUB API & DATA TERMINAL CONTROLLER
  // =========================================================================
  class CyberTerminal {
    constructor() {
      this.modal = document.getElementById('cyberTerminalModal');
      this.openBtn = document.getElementById('openTerminalBtn');
      this.closeBtn = document.getElementById('closeTerminalBtn');
      this.repoGrid = document.getElementById('terminalRepoGrid');
      this.cliInput = document.getElementById('termCliInput');
      this.tabs = document.querySelectorAll('.term-tab');
      this.panes = document.querySelectorAll('.tab-pane');
      this.refreshBtn = document.getElementById('refreshReposBtn');

      this.bindEvents();
      this.fetchRepos();
    }

    bindEvents() {
      this.openBtn?.addEventListener('click', () => this.open());
      this.closeBtn?.addEventListener('click', () => this.close());
      this.refreshBtn?.addEventListener('click', () => this.fetchRepos());

      // ESC to close
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
          this.close();
        }
      });

      // Tabs switcher
      this.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          audioSystem.playUiBeep(600, 'sine', 0.04);
          this.tabs.forEach(t => t.classList.remove('active'));
          this.panes.forEach(p => p.classList.add('hidden'));

          tab.classList.add('active');
          const target = document.getElementById(`pane-${tab.dataset.tab}`);
          if (target) target.classList.remove('hidden');
        });
      });

      // CLI Command Runner
      this.cliInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          audioSystem.playUiBeep(750, 'square', 0.05);
          this.handleCommand(this.cliInput.value.trim().toLowerCase());
          this.cliInput.value = '';
        }
      });
    }

    open() {
      audioSystem.playUiBeep(520, 'sine', 0.08);
      this.modal.classList.remove('hidden');
    }

    close() {
      audioSystem.playUiBeep(320, 'sine', 0.06);
      this.modal.classList.add('hidden');
    }

    handleCommand(cmd) {
      if (cmd === 'help') {
        alert("AVAILABLE COMMANDS: 'help', 'roles', 'emp', 'music', 'cls', 'clear'");
      } else if (cmd === 'emp') {
        window.mechaInstance?.triggerEmpExplosion();
      } else if (cmd === 'music') {
        document.getElementById('playToggleBtn')?.click();
      } else if (cmd === 'cls' || cmd === 'clear') {
        this.cliInput.value = '';
      }
    }

    async fetchRepos() {
      try {
        this.repoGrid.innerHTML = '<div class="repo-loading-skel">DATA TRANSMISSION IN PROGRESS...</div>';
        const res = await fetch('https://api.github.com/users/ironbabatekkral/repos?sort=updated&per_page=6');
        const repos = await res.json();

        this.repoGrid.innerHTML = '';
        repos.slice(0, 6).forEach(repo => {
          const card = document.createElement('div');
          card.className = 'terminal-repo-card';
          card.innerHTML = `
            <div>
              <h4>${repo.name}</h4>
              <p>${repo.description || 'Protokol açıklaması bulunamadı.'}</p>
            </div>
            <div>
              <span style="font-size: 9px; color: var(--neon-cyan); display: block; margin-bottom: 4px;">
                LANG: ${repo.language || 'DATA'} // STARS: ${repo.stargazers_count}
              </span>
              <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">GÖRÜNTÜLE &rarr;</a>
            </div>
          `;
          this.repoGrid.appendChild(card);
        });
      } catch (err) {
        this.repoGrid.innerHTML = `
          <div class="terminal-repo-card">
            <h4>CircuitPython-TR-Keyboard-Fix</h4>
            <p>Raspberry Pi Pico BadUSB Turkish Q keyboard payload fix.</p>
            <a href="https://github.com/ironbabatekkral/CircuitPython-TR-Keyboard-Fix" target="_blank">GÖRÜNTÜLE &rarr;</a>
          </div>
          <div class="terminal-repo-card">
            <h4>ironbabatekkral.github.io</h4>
            <p>Personal Cyber Mecha Virtual Interface.</p>
            <a href="https://github.com/ironbabatekkral/ironbabatekkral.github.io" target="_blank">GÖRÜNTÜLE &rarr;</a>
          </div>
        `;
      }
    }
  }

  // =========================================================================
  // 7. MAIN APPLICATION INIT & HUD WIRING
  // =========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    // 1. Lucide icons init
    if (window.lucide) window.lucide.createIcons();

    // 2. Initialize 3D Canvas
    const webglContainer = document.getElementById('webglContainer');
    const mecha = new MechaScene(webglContainer);
    window.mechaInstance = mecha;

    // 3. Initialize Hexagon Radar & Matrix Rain
    const radarChart = new HexagonRadarChart(document.getElementById('radarCanvas'));
    const matrixRain = new MatrixRain(document.getElementById('matrixStreamCanvas'));

    // 4. Initialize Data Terminal
    new CyberTerminal();

    // 5. Custom Crosshair & Lock-On Handling
    const cursor = document.getElementById('customCursor');
    const coordXEl = document.getElementById('coordX');
    const coordYEl = document.getElementById('coordY');

    window.addEventListener('mousemove', (e) => {
      STATE.mouse.x = e.clientX;
      STATE.mouse.y = e.clientY;
      STATE.mouse.normalizedX = (e.clientX / window.innerWidth) * 2 - 1;
      STATE.mouse.normalizedY = (e.clientY / window.innerHeight) * 2 - 1;

      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;

      if (coordXEl) coordXEl.textContent = (STATE.mouse.normalizedX * 100).toFixed(2);
      if (coordYEl) coordYEl.textContent = (STATE.mouse.normalizedY * 100).toFixed(2);
    });

    // Hover lock-on effect on interactive elements
    const lockTargets = document.querySelectorAll('button, a, .interactive-card, input');
    lockTargets.forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('locked-on');
        audioSystem.playUiBeep(1200, 'sine', 0.02);
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('locked-on');
      });
    });

    // 6. Canvas Click / EMP Trigger
    window.addEventListener('click', (e) => {
      if (!e.target.closest('.hud-panel, .hud-card, .cyber-window')) {
        mecha.triggerEmpExplosion();
      }
    });

    document.getElementById('triggerEmpBtn')?.addEventListener('click', () => {
      mecha.triggerEmpExplosion();
    });

    // 7. Archetype Mode Buttons
    const modeBtns = document.querySelectorAll('.mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        audioSystem.playUiBeep(700, 'triangle', 0.06);
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const mode = btn.dataset.mode;
        if (mode === 'titan') mecha.updateThemeColor(0x00f3ff, '#00f3ff');
        if (mode === 'phantom') mecha.updateThemeColor(0x00ff66, '#00ff66');
        if (mode === 'vibe') mecha.updateThemeColor(0xbc13fe, '#bc13fe');
      });
    });

    // 8. Role Selection Lighting & Theme Swapping
    const roleBtns = document.querySelectorAll('.role-tag');
    roleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        audioSystem.playUiBeep(880, 'sine', 0.05);
        roleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const hexStr = btn.dataset.color;
        const hexNum = parseInt(hexStr.replace('#', '0x'));
        mecha.updateThemeColor(hexNum, hexStr);

        // Update ticker log
        const ticker = document.getElementById('logTickerStream');
        if (ticker) {
          ticker.textContent = `ROLE RE-CALIBRATED // ${btn.textContent.trim()} // AMBIENT RESONANCE APPLIED`;
        }
      });
    });

    // 9. Audio Visualizer & Player
    const spectrumCanvas = document.getElementById('spectrumCanvas');
    const spectrumCtx = spectrumCanvas.getContext('2d');
    const playToggleBtn = document.getElementById('playToggleBtn');
    const prevTrackBtn = document.getElementById('prevTrackBtn');
    const nextTrackBtn = document.getElementById('nextTrackBtn');
    const volControl = document.getElementById('volumeControl');

    playToggleBtn?.addEventListener('click', () => {
      audioSystem.togglePlay();
    });

    prevTrackBtn?.addEventListener('click', () => {
      audioSystem.prev();
    });

    nextTrackBtn?.addEventListener('click', () => {
      audioSystem.next();
    });

    volControl?.addEventListener('input', (e) => {
      audioSystem.setVolume(e.target.value);
    });

    // 10. 3D Tilt Card Effect
    const tiltCards = document.querySelectorAll('[data-tilt]');
    tiltCards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        card.style.transform = `perspective(600px) rotateX(${-y * 0.05}deg) rotateY(${x * 0.05}deg)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg)';
      });
    });

    // 11. Main 60 FPS Render Loop
    function animate() {
      requestAnimationFrame(animate);
      mecha.render();
      matrixRain.draw();
      radarChart.draw();
      audioSystem.renderSpectrum(spectrumCanvas, spectrumCtx);
    }
    animate();
  });
})();
