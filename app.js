// ============================================================
// app.js — Main Application Controller (Multi-Stop)
// ============================================================

import { createCityMap } from './graph.js';
import { ALGORITHMS } from './algorithms.js';
import { MapRenderer } from './renderer.js';

const LEG_COLORS = [
    '#00ffc8', '#ff6b9d', '#ffd93d', '#6bcbff',
    '#c084fc', '#fb923c', '#34d399', '#f472b6',
];

class PathfinderApp {
    constructor() {
        this.graph = createCityMap();
        this.canvas = document.getElementById('map-canvas');
        this.renderer = new MapRenderer(this.canvas, this.graph);

        // UI elements
        this.algorithmSelect = document.getElementById('algorithm-select');
        this.startSelect = document.getElementById('start-select');
        this.speedSlider = document.getElementById('speed-slider');
        this.speedLabel = document.getElementById('speed-label');
        this.runBtn = document.getElementById('run-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.addStopBtn = document.getElementById('add-stop-btn');
        this.waypointListEl = document.getElementById('waypoint-list');
        this.statsPanel = document.getElementById('stats-panel');
        this.statusText = document.getElementById('status-text');

        // State
        this.waypoints = []; // array of { id: uniqueId, nodeId: string }
        this.nextWaypointId = 1;
        this.isRunning = false;
        this.animationTimers = [];

        // Sorted node list for dropdowns
        this.sortedNodes = this.graph.getAllNodes().sort((a, b) => a.label.localeCompare(b.label));

        this._init();
    }

    _init() {
        this._populateStartDropdown();
        this._setupEventListeners();
        this._resizeCanvas();
        window.addEventListener('resize', () => this._resizeCanvas());

        // Default: start at Home, add one empty waypoint
        this.startSelect.value = 'home';
        this.renderer.setStart('home');
        this._addWaypoint();
        this._updateStatus('Build your trip: pick a start, add stops, then click <strong>Find Path</strong>');
    }

    _populateStartDropdown() {
        for (const node of this.sortedNodes) {
            this.startSelect.add(new Option(node.label, node.id));
        }
    }

    _createWaypointSelect() {
        const select = document.createElement('select');
        select.className = 'select waypoint-select';
        select.innerHTML = '<option value="">— Select Stop —</option>';
        for (const node of this.sortedNodes) {
            select.add(new Option(node.label, node.id));
        }
        return select;
    }

    // ========================
    //  WAYPOINT MANAGEMENT
    // ========================

    _addWaypoint(nodeId = '') {
        const wp = { id: this.nextWaypointId++, nodeId };
        this.waypoints.push(wp);
        this._renderWaypointList();
        this._syncRendererWaypoints();
    }

    _removeWaypoint(wpId) {
        this.waypoints = this.waypoints.filter(w => w.id !== wpId);
        this._renderWaypointList();
        this._syncRendererWaypoints();
        this._resetVisualization();
    }

    _swapWaypoints(i, j) {
        if (i < 0 || j < 0 || i >= this.waypoints.length || j >= this.waypoints.length) return;
        [this.waypoints[i], this.waypoints[j]] = [this.waypoints[j], this.waypoints[i]];
        this._renderWaypointList();
        this._syncRendererWaypoints();
        this._resetVisualization();
    }

    _syncRendererWaypoints() {
        const wpNodeIds = this.waypoints.map(w => w.nodeId).filter(Boolean);
        this.renderer.setWaypoints(wpNodeIds);
    }

    _renderWaypointList() {
        this.waypointListEl.innerHTML = '';

        this.waypoints.forEach((wp, index) => {
            const item = document.createElement('div');
            item.className = 'waypoint-item';
            item.dataset.index = index;
            item.draggable = true;

            const color = LEG_COLORS[index % LEG_COLORS.length];

            // Drag handle
            const handle = document.createElement('span');
            handle.className = 'drag-handle';
            handle.textContent = '⠿';
            handle.title = 'Drag to reorder';

            // Number badge
            const badge = document.createElement('span');
            badge.className = 'waypoint-badge';
            badge.style.background = color;
            badge.textContent = index + 1;

            // Select dropdown
            const select = this._createWaypointSelect();
            select.value = wp.nodeId;
            select.addEventListener('change', (e) => {
                wp.nodeId = e.target.value;
                this._syncRendererWaypoints();
                this._resetVisualization();
            });

            // Move up button
            const upBtn = document.createElement('button');
            upBtn.className = 'waypoint-btn';
            upBtn.textContent = '▲';
            upBtn.title = 'Move up';
            upBtn.disabled = index === 0;
            upBtn.addEventListener('click', () => this._swapWaypoints(index, index - 1));

            // Move down button
            const downBtn = document.createElement('button');
            downBtn.className = 'waypoint-btn';
            downBtn.textContent = '▼';
            downBtn.title = 'Move down';
            downBtn.disabled = index === this.waypoints.length - 1;
            downBtn.addEventListener('click', () => this._swapWaypoints(index, index + 1));

            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'waypoint-btn waypoint-delete';
            deleteBtn.textContent = '×';
            deleteBtn.title = 'Remove stop';
            deleteBtn.addEventListener('click', () => this._removeWaypoint(wp.id));

            item.appendChild(handle);
            item.appendChild(badge);
            item.appendChild(select);
            item.appendChild(upBtn);
            item.appendChild(downBtn);
            item.appendChild(deleteBtn);

            // Drag events
            item.addEventListener('dragstart', (e) => {
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', index.toString());
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                this.waypointListEl.querySelectorAll('.waypoint-item').forEach(el => el.classList.remove('drag-over'));
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                item.classList.add('drag-over');
            });

            item.addEventListener('dragleave', () => {
                item.classList.remove('drag-over');
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                item.classList.remove('drag-over');
                const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                const toIndex = index;
                if (fromIndex !== toIndex) {
                    // Move the element
                    const [moved] = this.waypoints.splice(fromIndex, 1);
                    this.waypoints.splice(toIndex, 0, moved);
                    this._renderWaypointList();
                    this._syncRendererWaypoints();
                    this._resetVisualization();
                }
            });

            this.waypointListEl.appendChild(item);
        });
    }

    // ========================
    //  EVENT LISTENERS
    // ========================

    _setupEventListeners() {
        this.runBtn.addEventListener('click', () => this._run());
        this.resetBtn.addEventListener('click', () => this._reset());
        this.addStopBtn.addEventListener('click', () => this._addWaypoint());

        this.startSelect.addEventListener('change', (e) => {
            this.renderer.setStart(e.target.value);
            this._resetVisualization();
        });

        this.speedSlider.addEventListener('input', (e) => {
            this.speedLabel.textContent = `${e.target.value}x`;
        });

        // Click on canvas to add as waypoint
        this.renderer.onNodeClick = (nodeId) => {
            if (this.isRunning) return;

            // If start is not set, set it
            if (!this.startSelect.value) {
                this.startSelect.value = nodeId;
                this.renderer.setStart(nodeId);
                this._updateStatus('Start set! Now click destination nodes to add them as stops');
                return;
            }

            // Don't add same node as start
            if (nodeId === this.startSelect.value) return;

            // Find first empty waypoint, or add a new one
            const emptyWp = this.waypoints.find(w => !w.nodeId);
            if (emptyWp) {
                emptyWp.nodeId = nodeId;
            } else {
                const wp = { id: this.nextWaypointId++, nodeId };
                this.waypoints.push(wp);
            }

            this._renderWaypointList();
            this._syncRendererWaypoints();
            this._resetVisualization();

            const node = this.graph.getNode(nodeId);
            this._updateStatus(`Added <strong>${node.label}</strong> as stop #${this.waypoints.filter(w => w.nodeId).length}`);
        };

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (!this.isRunning) this._run();
            }
            if (e.key === 'Escape' || e.key === 'r') {
                this._reset();
            }
        });
    }

    _resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        this.renderer.resize(rect.width, rect.height);
    }

    // ========================
    //  MULTI-LEG PATHFINDING
    // ========================

    async _run() {
        const startId = this.startSelect.value;
        const stopIds = this.waypoints.map(w => w.nodeId).filter(Boolean);
        const algoKey = this.algorithmSelect.value;

        if (!startId) {
            this._updateStatus('⚠️ Please select a start point');
            return;
        }
        if (stopIds.length === 0) {
            this._updateStatus('⚠️ Please add at least one stop');
            return;
        }

        // Build the full route: start → stop1 → stop2 → ...
        const route = [startId, ...stopIds];

        // Check for duplicates in consecutive stops
        for (let i = 0; i < route.length - 1; i++) {
            if (route[i] === route[i + 1]) {
                const name = this.graph.getNode(route[i]).label;
                this._updateStatus(`⚠️ Consecutive duplicate stop: <strong>${name}</strong>`);
                return;
            }
        }

        this._resetVisualization();
        this.isRunning = true;
        this.runBtn.disabled = true;
        this.runBtn.innerHTML = '<span class="btn-icon">⏳</span> Running...';

        const algo = ALGORITHMS[algoKey];
        const speed = parseFloat(this.speedSlider.value);
        const baseDelay = 350 / speed;
        const startTime = performance.now();

        let totalVisited = 0;
        let totalDistance = 0;
        const allSegments = [];
        const allVisited = new Set();

        this._updateStatus(`Running <strong>${algo.name}</strong> across ${route.length - 1} leg(s)...`);

        // Run each leg sequentially
        for (let leg = 0; leg < route.length - 1; leg++) {
            if (!this.isRunning) break;

            const fromId = route[leg];
            const toId = route[leg + 1];
            const color = LEG_COLORS[leg % LEG_COLORS.length];
            const generator = algo.fn(this.graph, fromId, toId);

            const fromName = this.graph.getNode(fromId).label;
            const toName = this.graph.getNode(toId).label;
            this._updateStatus(`Leg ${leg + 1}: <strong>${fromName}</strong> → <strong>${toName}</strong>`);

            // Animate this leg
            const legResult = await new Promise((resolve) => {
                const step = () => {
                    if (!this.isRunning) { resolve(null); return; }

                    const { value, done } = generator.next();
                    if (done) { resolve(null); return; }

                    if (value.type === 'visit') {
                        totalVisited++;
                        for (const v of value.visited) allVisited.add(v);
                        this.renderer.highlightVisited(new Set(allVisited));
                        this.renderer.setCurrentVisit(value.node);
                        this._updateStats(totalVisited, leg + 1, totalDistance, performance.now() - startTime);
                        const timer = setTimeout(step, baseDelay);
                        this.animationTimers.push(timer);
                    } else if (value.type === 'done') {
                        resolve(value);
                    }
                };
                step();
            });

            if (!legResult || !this.isRunning) break;

            // Record this leg's result
            this.renderer.setCurrentVisit(null);

            if (legResult.path.length > 0) {
                const legDist = legResult.totalDistance || this._calcPathDist(legResult.path);
                totalDistance += legDist;
                allSegments.push({ path: legResult.path, color });
                this.renderer.setPathSegments([...allSegments]);
                this._updateStats(totalVisited, leg + 1, totalDistance, performance.now() - startTime);
            } else {
                const fromName = this.graph.getNode(fromId).label;
                const toName = this.graph.getNode(toId).label;
                this._updateStatus(`❌ No path found: <strong>${fromName}</strong> → <strong>${toName}</strong>`);
                this.isRunning = false;
                this.runBtn.disabled = false;
                this.runBtn.innerHTML = '<span class="btn-icon">▶</span> Find Path';
                return;
            }

            // Brief pause between legs
            if (leg < route.length - 2) {
                await new Promise(r => {
                    const t = setTimeout(r, 300 / speed);
                    this.animationTimers.push(t);
                });
            }
        }

        // Finished all legs
        const elapsed = performance.now() - startTime;
        this._updateStats(totalVisited, route.length - 1, totalDistance, elapsed);
        this._updateStatus(`✅ Trip complete! <strong>${route.length - 1}</strong> legs, total distance <strong>${Math.round(totalDistance)}</strong>`);

        this.isRunning = false;
        this.runBtn.disabled = false;
        this.runBtn.innerHTML = '<span class="btn-icon">▶</span> Find Path';
    }

    _calcPathDist(path) {
        let total = 0;
        for (let i = 0; i < path.length - 1; i++) {
            const neighbors = this.graph.getNeighbors(path[i]);
            const edge = neighbors.find(n => n.node === path[i + 1]);
            if (edge) total += edge.weight;
        }
        return total;
    }

    _resetVisualization() {
        for (const t of this.animationTimers) clearTimeout(t);
        this.animationTimers = [];
        this.renderer.resetVisualization();
        this.statsPanel.classList.remove('active');
    }

    _reset() {
        this.isRunning = false;
        this._resetVisualization();
        this.runBtn.disabled = false;
        this.runBtn.innerHTML = '<span class="btn-icon">▶</span> Find Path';
        this._clearStats();
        this._updateStatus('Build your trip: pick a start, add stops, then click <strong>Find Path</strong>');
    }

    _updateStatus(html) {
        this.statusText.innerHTML = html;
    }

    _updateStats(visited, legs, distance, timeMs) {
        document.getElementById('stat-visited').textContent = visited ?? '-';
        document.getElementById('stat-legs').textContent = legs ?? '-';
        document.getElementById('stat-distance').textContent = distance ? Math.round(distance) : '-';
        document.getElementById('stat-time').textContent = timeMs ? `${timeMs.toFixed(0)}ms` : '-';
        this.statsPanel.classList.add('active');
    }

    _clearStats() {
        document.getElementById('stat-visited').textContent = '-';
        document.getElementById('stat-legs').textContent = '-';
        document.getElementById('stat-distance').textContent = '-';
        document.getElementById('stat-time').textContent = '-';
        this.statsPanel.classList.remove('active');
    }
}

// Boot
window.addEventListener('DOMContentLoaded', () => {
    new PathfinderApp();
});
