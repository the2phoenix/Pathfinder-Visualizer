// ============================================================
// renderer.js — Canvas-based City Map Renderer
// ============================================================

// Node type → color mapping
const TYPE_COLORS = {
    home: { fill: '#00ff88', glow: '#00ff88' },
    government: { fill: '#6366f1', glow: '#818cf8' },
    park: { fill: '#22c55e', glow: '#4ade80' },
    landmark: { fill: '#f59e0b', glow: '#fbbf24' },
    station: { fill: '#06b6d4', glow: '#22d3ee' },
    education: { fill: '#8b5cf6', glow: '#a78bfa' },
    business: { fill: '#64748b', glow: '#94a3b8' },
    shopping: { fill: '#ec4899', glow: '#f472b6' },
    hospital: { fill: '#ef4444', glow: '#f87171' },
    entertainment: { fill: '#f97316', glow: '#fb923c' },
    emergency: { fill: '#dc2626', glow: '#f87171' },
    transport: { fill: '#0ea5e9', glow: '#38bdf8' },
    residential: { fill: '#a3a3a3', glow: '#d4d4d4' },
    default: { fill: '#71717a', glow: '#a1a1aa' },
};

// Node type → icon emoji
const TYPE_ICONS = {
    home: '🏠',
    government: '🏛️',
    park: '🌳',
    landmark: '⭐',
    station: '🚉',
    education: '🎓',
    business: '🏭',
    shopping: '🛍️',
    hospital: '🏥',
    entertainment: '🎭',
    emergency: '🚒',
    transport: '✈️',
    residential: '🏘️',
    default: '📍',
};

// Leg colors for multi-stop path segments
const LEG_COLORS = [
    '#00ffc8', '#ff6b9d', '#ffd93d', '#6bcbff',
    '#c084fc', '#fb923c', '#34d399', '#f472b6',
];

export class MapRenderer {
    constructor(canvas, graph) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.graph = graph;

        // Display dimensions (CSS pixels)
        this.displayWidth = 300;
        this.displayHeight = 150;
        this.dpr = window.devicePixelRatio || 1;

        // Transform state
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 1;

        // Interaction state
        this.hoveredNode = null;
        this.startNode = null;
        this.waypointNodes = [];  // array of node IDs

        // Animation state
        this.visitedNodes = new Set();
        this.frontierNodes = new Set();
        this.pathSegments = [];   // array of { path: [...nodeIds], color }
        this.currentVisitNode = null;

        // Callbacks
        this.onNodeClick = null;
        this.onNodeHover = null;

        // Pulse animation
        this._pulsePhase = 0;
        this._animFrame = null;

        this._setupEvents();
        this._startPulse();
    }

    _setupTransform() {
        const nodes = this.graph.getAllNodes();
        if (nodes.length === 0) return;

        const minX = Math.min(...nodes.map(n => n.x));
        const maxX = Math.max(...nodes.map(n => n.x));
        const minY = Math.min(...nodes.map(n => n.y));
        const maxY = Math.max(...nodes.map(n => n.y));

        const graphW = maxX - minX;
        const graphH = maxY - minY;
        const padding = 80;

        const w = this.displayWidth;
        const h = this.displayHeight;

        const scaleX = (w - padding * 2) / graphW;
        const scaleY = (h - padding * 2) / graphH;
        this.scale = Math.min(scaleX, scaleY, 1.0);

        this.offsetX = (w - graphW * this.scale) / 2 - minX * this.scale;
        this.offsetY = (h - graphH * this.scale) / 2 - minY * this.scale;
    }

    _toScreen(x, y) {
        return {
            x: x * this.scale + this.offsetX,
            y: y * this.scale + this.offsetY,
        };
    }

    _toWorld(sx, sy) {
        return {
            x: (sx - this.offsetX) / this.scale,
            y: (sy - this.offsetY) / this.scale,
        };
    }

    _setupEvents() {
        let isPanning = false;
        let lastX, lastY;

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 1 || e.button === 2 || (e.button === 0 && e.shiftKey)) {
                isPanning = true;
                lastX = e.clientX;
                lastY = e.clientY;
                e.preventDefault();
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (isPanning) {
                this.offsetX += e.clientX - lastX;
                this.offsetY += e.clientY - lastY;
                lastX = e.clientX;
                lastY = e.clientY;
                return;
            }

            const rect = this.canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const world = this._toWorld(mx, my);
            const hit = this._hitTest(world.x, world.y);

            if (hit !== this.hoveredNode) {
                this.hoveredNode = hit;
                this.canvas.style.cursor = hit ? 'pointer' : 'default';
                if (this.onNodeHover) this.onNodeHover(hit);
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            isPanning = false;
        });

        this.canvas.addEventListener('click', (e) => {
            if (this.hoveredNode && this.onNodeClick) {
                this.onNodeClick(this.hoveredNode);
            }
        });

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
            const newScale = this.scale * zoomFactor;
            if (newScale < 0.15 || newScale > 3) return;

            this.offsetX = mx - (mx - this.offsetX) * zoomFactor;
            this.offsetY = my - (my - this.offsetY) * zoomFactor;
            this.scale = newScale;
        }, { passive: false });

        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    _hitTest(wx, wy) {
        const hitRadius = 22 / this.scale;
        let closest = null;
        let closestDist = Infinity;
        for (const node of this.graph.getAllNodes()) {
            const d = Math.hypot(node.x - wx, node.y - wy);
            if (d < hitRadius && d < closestDist) {
                closest = node.id;
                closestDist = d;
            }
        }
        return closest;
    }

    _startPulse() {
        const tick = () => {
            this._pulsePhase = (this._pulsePhase + 0.03) % (Math.PI * 2);
            this.draw();
            this._animFrame = requestAnimationFrame(tick);
        };
        tick();
    }

    stopPulse() {
        if (this._animFrame) cancelAnimationFrame(this._animFrame);
    }

    // --- Drawing ---

    draw() {
        const ctx = this.ctx;
        const w = this.displayWidth;
        const h = this.displayHeight;

        ctx.save();
        ctx.scale(this.dpr, this.dpr);

        // Background
        ctx.fillStyle = '#0f1117';
        ctx.fillRect(0, 0, w, h);

        // Grid
        this._drawGrid();

        // Edges
        this._drawEdges();

        // Path segments
        for (const seg of this.pathSegments) {
            this._drawPathSegment(seg.path, seg.color);
        }

        // Nodes
        this._drawNodes();

        // Tooltip
        if (this.hoveredNode) {
            this._drawTooltip(this.hoveredNode);
        }

        ctx.restore();
    }

    _drawGrid() {
        const ctx = this.ctx;
        const gridSize = 50 * this.scale;
        if (gridSize < 10) return;

        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;

        const startX = this.offsetX % gridSize;
        const startY = this.offsetY % gridSize;

        for (let x = startX; x < this.displayWidth; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.displayHeight);
            ctx.stroke();
        }
        for (let y = startY; y < this.displayHeight; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.displayWidth, y);
            ctx.stroke();
        }
    }

    _isEdgeInAnyPath(from, to) {
        for (const seg of this.pathSegments) {
            for (let i = 0; i < seg.path.length - 1; i++) {
                if (
                    (seg.path[i] === from && seg.path[i + 1] === to) ||
                    (seg.path[i] === to && seg.path[i + 1] === from)
                ) return seg.color;
            }
        }
        return null;
    }

    _drawEdges() {
        const ctx = this.ctx;
        const edges = this.graph.getAllEdges();

        for (const { from, to, weight } of edges) {
            const a = this.graph.getNode(from);
            const b = this.graph.getNode(to);
            const sa = this._toScreen(a.x, a.y);
            const sb = this._toScreen(b.x, b.y);

            const pathColor = this._isEdgeInAnyPath(from, to);

            // Edge glow
            ctx.save();
            ctx.strokeStyle = pathColor
                ? pathColor.replace(')', ', 0.4)').replace('rgb', 'rgba')
                : 'rgba(100, 120, 160, 0.12)';
            ctx.lineWidth = pathColor ? 5 : 1.5;
            ctx.shadowColor = pathColor || 'transparent';
            ctx.shadowBlur = pathColor ? 12 : 0;
            ctx.beginPath();
            ctx.moveTo(sa.x, sa.y);
            ctx.lineTo(sb.x, sb.y);
            ctx.stroke();
            ctx.restore();

            // Edge line
            ctx.strokeStyle = pathColor || 'rgba(100, 120, 160, 0.25)';
            ctx.lineWidth = pathColor ? 2.5 : 1;
            ctx.beginPath();
            ctx.moveTo(sa.x, sa.y);
            ctx.lineTo(sb.x, sb.y);
            ctx.stroke();

            // Weight label
            if (this.scale > 0.7) {
                const mx = (sa.x + sb.x) / 2;
                const my = (sa.y + sb.y) / 2;
                ctx.font = `${9 * Math.min(this.scale, 1)}px 'Inter', sans-serif`;
                ctx.fillStyle = pathColor || 'rgba(150,160,180,0.4)';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(weight, mx, my - 7);
            }
        }
    }

    _drawPathSegment(path, color) {
        if (!path || path.length < 2) return;
        const ctx = this.ctx;
        ctx.save();

        ctx.setLineDash([10, 6]);
        ctx.lineDashOffset = -this._pulsePhase * 30;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3.5 * this.scale;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        ctx.beginPath();
        for (let i = 0; i < path.length; i++) {
            const node = this.graph.getNode(path[i]);
            const s = this._toScreen(node.x, node.y);
            if (i === 0) ctx.moveTo(s.x, s.y);
            else ctx.lineTo(s.x, s.y);
        }
        ctx.stroke();
        ctx.restore();
    }

    _drawNodes() {
        const ctx = this.ctx;
        const nodes = this.graph.getAllNodes();
        const pulse = Math.sin(this._pulsePhase) * 0.3 + 0.7;

        // Build a set of all nodes on any path
        const pathNodeSet = new Set();
        for (const seg of this.pathSegments) {
            for (const id of seg.path) pathNodeSet.add(id);
        }

        // Waypoint index map
        const waypointIndexMap = new Map();
        for (let i = 0; i < this.waypointNodes.length; i++) {
            waypointIndexMap.set(this.waypointNodes[i], i + 1);
        }

        for (const node of nodes) {
            const s = this._toScreen(node.x, node.y);
            const colors = TYPE_COLORS[node.type] || TYPE_COLORS.default;
            const isStart = node.id === this.startNode;
            const isWaypoint = waypointIndexMap.has(node.id);
            const waypointNum = waypointIndexMap.get(node.id);
            const isVisited = this.visitedNodes.has(node.id);
            const isOnPath = pathNodeSet.has(node.id);
            const isCurrent = node.id === this.currentVisitNode;
            const isHovered = node.id === this.hoveredNode;

            let radius = 12 * this.scale;
            let fillColor = colors.fill;
            let glowColor = colors.glow;
            let strokeColor = 'rgba(255,255,255,0.12)';
            let strokeWidth = 1.5;

            if (isStart) {
                fillColor = '#00ff88';
                glowColor = '#00ff88';
                strokeColor = '#00ff88';
                strokeWidth = 3;
                radius *= 1.4;
            } else if (isWaypoint) {
                const legColor = LEG_COLORS[(waypointNum - 1) % LEG_COLORS.length];
                fillColor = legColor;
                glowColor = legColor;
                strokeColor = legColor;
                strokeWidth = 3;
                radius *= 1.3;
            } else if (isCurrent) {
                fillColor = '#facc15';
                glowColor = '#facc15';
                radius *= 1.4 * pulse;
            } else if (isOnPath) {
                fillColor = '#00ffc8';
                glowColor = '#00ffc8';
                strokeColor = '#00ffc8';
                strokeWidth = 2;
                radius *= 1.1;
            } else if (isVisited) {
                fillColor = 'rgba(99, 102, 241, 0.6)';
                glowColor = '#6366f1';
            }

            if (isHovered) {
                radius *= 1.15;
                strokeWidth += 1;
            }

            // Glow
            ctx.save();
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = isStart || isWaypoint || isCurrent ? 20 * pulse : 8;
            ctx.beginPath();
            ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = fillColor;
            ctx.fill();
            ctx.restore();

            // Border
            ctx.beginPath();
            ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = strokeWidth;
            ctx.stroke();

            // Inner highlight
            const grad = ctx.createRadialGradient(s.x - radius * 0.3, s.y - radius * 0.3, 0, s.x, s.y, radius);
            grad.addColorStop(0, 'rgba(255,255,255,0.25)');
            grad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.beginPath();
            ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();

            // Icon
            if (this.scale > 0.45) {
                const icon = TYPE_ICONS[node.type] || TYPE_ICONS.default;
                ctx.font = `${11 * this.scale}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(icon, s.x, s.y);
            }

            // Label
            if (this.scale > 0.5) {
                ctx.font = `600 ${10 * Math.min(this.scale, 1)}px 'Inter', sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillStyle = isOnPath ? '#00ffc8' : isVisited ? '#a5b4fc' : 'rgba(230,235,245,0.8)';
                ctx.fillText(node.label, s.x, s.y + radius + 3);
            }

            // Start badge
            if (isStart) {
                ctx.font = `700 ${9 * this.scale}px 'Inter', sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillStyle = '#00ff88';
                ctx.fillText('START', s.x, s.y - radius - 4);
            }

            // Waypoint number badge
            if (isWaypoint) {
                const badgeR = 9 * this.scale;
                const bx = s.x + radius * 0.7;
                const by = s.y - radius * 0.7;
                const legColor = LEG_COLORS[(waypointNum - 1) % LEG_COLORS.length];

                ctx.save();
                ctx.shadowColor = legColor;
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(bx, by, badgeR, 0, Math.PI * 2);
                ctx.fillStyle = '#0f1117';
                ctx.fill();
                ctx.strokeStyle = legColor;
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.restore();

                ctx.font = `800 ${10 * this.scale}px 'Inter', sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = legColor;
                ctx.fillText(waypointNum, bx, by);
            }
        }
    }

    _drawTooltip(nodeId) {
        const node = this.graph.getNode(nodeId);
        const s = this._toScreen(node.x, node.y);
        const ctx = this.ctx;
        const icon = TYPE_ICONS[node.type] || '';
        const text = `${icon} ${node.label}`;
        const subtext = `Type: ${node.type} · Connections: ${this.graph.getNeighbors(nodeId).length}`;

        ctx.font = `600 13px 'Inter', sans-serif`;
        const tw = Math.max(ctx.measureText(text).width, ctx.measureText(subtext).width) + 24;
        const th = 52;
        const tx = s.x - tw / 2;
        const ty = s.y - 14 * this.scale - th - 10;

        ctx.save();
        ctx.fillStyle = 'rgba(20, 22, 35, 0.95)';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 12;
        this._roundRect(tx, ty, tw, th, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(100,120,180,0.3)';
        ctx.lineWidth = 1;
        this._roundRect(tx, ty, tw, th, 8);
        ctx.stroke();
        ctx.restore();

        ctx.font = `600 13px 'Inter', sans-serif`;
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, s.x, ty + 18);

        ctx.font = `400 10px 'Inter', sans-serif`;
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(subtext, s.x, ty + 36);
    }

    _roundRect(x, y, w, h, r) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    // --- Public API ---

    setStart(nodeId) {
        this.startNode = nodeId;
    }

    setWaypoints(waypointIds) {
        this.waypointNodes = waypointIds || [];
    }

    highlightVisited(visited) {
        this.visitedNodes = visited;
    }

    setPathSegments(segments) {
        this.pathSegments = segments || [];
    }

    setCurrentVisit(nodeId) {
        this.currentVisitNode = nodeId;
    }

    resetVisualization() {
        this.visitedNodes = new Set();
        this.frontierNodes = new Set();
        this.pathSegments = [];
        this.currentVisitNode = null;
    }

    resize(w, h) {
        this.dpr = window.devicePixelRatio || 1;
        this.displayWidth = w;
        this.displayHeight = h;

        this.canvas.width = Math.round(w * this.dpr);
        this.canvas.height = Math.round(h * this.dpr);
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';

        this._setupTransform();
    }
}
