// ============================================================
// algorithms.js — Pathfinding Algorithms (Generator-based)
// ============================================================

// ---- MinHeap (Priority Queue) ----
class MinHeap {
    constructor() {
        this.data = [];
    }

    push(item) {
        this.data.push(item);
        this._bubbleUp(this.data.length - 1);
    }

    pop() {
        const top = this.data[0];
        const last = this.data.pop();
        if (this.data.length > 0) {
            this.data[0] = last;
            this._sinkDown(0);
        }
        return top;
    }

    get size() {
        return this.data.length;
    }

    _bubbleUp(i) {
        while (i > 0) {
            const parent = (i - 1) >> 1;
            if (this.data[i].priority < this.data[parent].priority) {
                [this.data[i], this.data[parent]] = [this.data[parent], this.data[i]];
                i = parent;
            } else break;
        }
    }

    _sinkDown(i) {
        const n = this.data.length;
        while (true) {
            let smallest = i;
            const l = 2 * i + 1;
            const r = 2 * i + 2;
            if (l < n && this.data[l].priority < this.data[smallest].priority) smallest = l;
            if (r < n && this.data[r].priority < this.data[smallest].priority) smallest = r;
            if (smallest !== i) {
                [this.data[i], this.data[smallest]] = [this.data[smallest], this.data[i]];
                i = smallest;
            } else break;
        }
    }
}

// ---- BFS (Breadth-First Search) ----
export function* bfs(graph, startId, endId) {
    const visited = new Set();
    const parent = new Map();
    const queue = [startId];
    visited.add(startId);
    parent.set(startId, null);

    while (queue.length > 0) {
        const current = queue.shift();

        yield {
            type: 'visit',
            node: current,
            visited: new Set(visited),
            frontier: new Set(queue),
        };

        if (current === endId) {
            yield { type: 'done', path: reconstructPath(parent, endId), visited: new Set(visited) };
            return;
        }

        for (const { node: neighbor } of graph.getNeighbors(current)) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                parent.set(neighbor, current);
                queue.push(neighbor);
            }
        }
    }

    yield { type: 'done', path: [], visited: new Set(visited) };
}

// ---- DFS (Depth-First Search) ----
export function* dfs(graph, startId, endId) {
    const visited = new Set();
    const parent = new Map();
    const stack = [startId];
    parent.set(startId, null);

    while (stack.length > 0) {
        const current = stack.pop();

        if (visited.has(current)) continue;
        visited.add(current);

        yield {
            type: 'visit',
            node: current,
            visited: new Set(visited),
            frontier: new Set(stack),
        };

        if (current === endId) {
            yield { type: 'done', path: reconstructPath(parent, endId), visited: new Set(visited) };
            return;
        }

        const neighbors = graph.getNeighbors(current);
        for (let i = neighbors.length - 1; i >= 0; i--) {
            const neighbor = neighbors[i].node;
            if (!visited.has(neighbor)) {
                parent.set(neighbor, current);
                stack.push(neighbor);
            }
        }
    }

    yield { type: 'done', path: [], visited: new Set(visited) };
}

// ---- Dijkstra's Algorithm ----
export function* dijkstra(graph, startId, endId) {
    const dist = new Map();
    const parent = new Map();
    const visited = new Set();
    const heap = new MinHeap();

    for (const node of graph.getAllNodes()) {
        dist.set(node.id, Infinity);
    }
    dist.set(startId, 0);
    parent.set(startId, null);
    heap.push({ priority: 0, node: startId });

    while (heap.size > 0) {
        const { node: current, priority: currentDist } = heap.pop();

        if (visited.has(current)) continue;
        visited.add(current);

        yield {
            type: 'visit',
            node: current,
            visited: new Set(visited),
            distances: new Map(dist),
        };

        if (current === endId) {
            yield {
                type: 'done',
                path: reconstructPath(parent, endId),
                visited: new Set(visited),
                totalDistance: dist.get(endId),
            };
            return;
        }

        for (const { node: neighbor, weight } of graph.getNeighbors(current)) {
            if (visited.has(neighbor)) continue;
            const newDist = currentDist + weight;
            if (newDist < dist.get(neighbor)) {
                dist.set(neighbor, newDist);
                parent.set(neighbor, current);
                heap.push({ priority: newDist, node: neighbor });
            }
        }
    }

    yield { type: 'done', path: [], visited: new Set(visited), totalDistance: Infinity };
}

// ---- A* Search ----
export function* aStar(graph, startId, endId) {
    const gScore = new Map();
    const fScore = new Map();
    const parent = new Map();
    const visited = new Set();
    const heap = new MinHeap();

    for (const node of graph.getAllNodes()) {
        gScore.set(node.id, Infinity);
        fScore.set(node.id, Infinity);
    }

    gScore.set(startId, 0);
    fScore.set(startId, graph.heuristic(startId, endId));
    parent.set(startId, null);
    heap.push({ priority: fScore.get(startId), node: startId });

    while (heap.size > 0) {
        const { node: current } = heap.pop();

        if (visited.has(current)) continue;
        visited.add(current);

        yield {
            type: 'visit',
            node: current,
            visited: new Set(visited),
            distances: new Map(gScore),
        };

        if (current === endId) {
            yield {
                type: 'done',
                path: reconstructPath(parent, endId),
                visited: new Set(visited),
                totalDistance: gScore.get(endId),
            };
            return;
        }

        for (const { node: neighbor, weight } of graph.getNeighbors(current)) {
            if (visited.has(neighbor)) continue;
            const tentativeG = gScore.get(current) + weight;
            if (tentativeG < gScore.get(neighbor)) {
                parent.set(neighbor, current);
                gScore.set(neighbor, tentativeG);
                fScore.set(neighbor, tentativeG + graph.heuristic(neighbor, endId));
                heap.push({ priority: fScore.get(neighbor), node: neighbor });
            }
        }
    }

    yield { type: 'done', path: [], visited: new Set(visited), totalDistance: Infinity };
}

// ---- Reconstruct path from parent map ----
function reconstructPath(parent, endId) {
    const path = [];
    let current = endId;
    while (current !== null) {
        path.unshift(current);
        current = parent.get(current);
    }
    return path;
}

// ---- Algorithm registry ----
export const ALGORITHMS = {
    bfs: { name: 'Breadth-First Search (BFS)', fn: bfs, weighted: false },
    dfs: { name: 'Depth-First Search (DFS)', fn: dfs, weighted: false },
    dijkstra: { name: "Dijkstra's Algorithm", fn: dijkstra, weighted: true },
    astar: { name: 'A* Search', fn: aStar, weighted: true },
};
