const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let nodes = [];
let edges = [];
let draggingNode = null;
let isDragging = false;

const graph = {};

function updateGraph() {
    Object.keys(graph).forEach(key => delete graph[key]);
    edges.forEach(({ from, to, weight }) => {
        if (!graph[from]) graph[from] = [];
        if (!graph[to]) graph[to] = [];
        graph[from].push({ node: to, weight });
        graph[to].push({ node: from, weight });
    });
}

function dijkstra(start, end) {
    const distances = {}, visited = {}, previous = {};
    const queue = [{ node: start, distance: 0 }];

    nodes.forEach(node => { distances[node.id] = Infinity; previous[node.id] = null; });
    distances[start] = 0;

    while (queue.length) {
        queue.sort((a, b) => a.distance - b.distance);
        const { node } = queue.shift();
        if (node === end) break;
        if (visited[node]) continue;
        visited[node] = true;

        (graph[node] || []).forEach(({ node: neighbor, weight }) => {
            const newDistance = distances[node] + weight;
            if (newDistance < distances[neighbor]) {
                distances[neighbor] = newDistance;
                previous[neighbor] = node;
                queue.push({ node: neighbor, distance: newDistance });
            }
        });
    }

    const path = [];
    let current = end;
    while (current !== null) {
        path.unshift(current);
        current = previous[current];
    }
    return { path, distance: distances[end] };
}

function drawGraph(path = []) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    edges.forEach(edge => {
        const fromNode = nodes.find(node => node.id === edge.from);
        const toNode = nodes.find(node => node.id === edge.to);

        const isPathEdge = path.some((node, index) => 
            (node === edge.from && path[index + 1] === edge.to) || 
            (node === edge.to && path[index + 1] === edge.from)
        );

        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.strokeStyle = isPathEdge ? '#FF4500' : '#4682B4';
        ctx.lineWidth = isPathEdge ? 6 : 4;
        ctx.stroke();

        const midX = (fromNode.x + toNode.x) / 2;
        const midY = (fromNode.y + toNode.y) / 2;
        ctx.fillStyle = '#FFD700';
        ctx.font = '18px Arial';
        ctx.fillText(edge.weight, midX, midY);
    });

    nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 30, 0, 2 * Math.PI);
        ctx.fillStyle = path.includes(node.id) ? '#FF4500' : '#00FA9A';
        ctx.fill();
        ctx.strokeStyle = '#006400';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.fillStyle = '#000';
        ctx.font = '20px Arial';
        ctx.fillText(node.id, node.x - 8, node.y + 8);
    });
}

canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    draggingNode = nodes.find(node => 
        Math.hypot(node.x - x, node.y - y) < 30
    );

    if (draggingNode) {
        isDragging = true;
    } else {
        const newId = nodes.length > 0 ? Math.max(...nodes.map(node => node.id)) + 1 : 1;
        nodes.push({ id: newId, x, y });
        drawGraph();
    }
});

canvas.addEventListener('mousemove', (event) => {
    if (!isDragging || !draggingNode) return;

    const rect = canvas.getBoundingClientRect();
    draggingNode.x = event.clientX - rect.left;
    draggingNode.y = event.clientY - rect.top;

    drawGraph();
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
    draggingNode = null;
});

document.getElementById('findPath').addEventListener('click', () => {
    const start = parseInt(document.getElementById('source').value);
    const end = parseInt(document.getElementById('destination').value);
    const { path, distance } = dijkstra(start, end);

    drawGraph(path);

    document.getElementById('output').innerHTML = `Shortest Path: ${path.join(' -> ')}<br>Total Distance: ${distance}`;
});

document.getElementById('addEdge').addEventListener('click', () => {
    const from = parseInt(document.getElementById('fromNode').value);
    const to = parseInt(document.getElementById('toNode').value);
    const weight = parseInt(document.getElementById('edgeWeight').value);

    if (from && to && weight) {
        edges.push({ from, to, weight });
        updateGraph();
        drawGraph();
    }
});

function deleteNode(nodeId) {
    nodes = nodes.filter(node => node.id !== nodeId);
    edges = edges.filter(edge => edge.from !== nodeId && edge.to !== nodeId);
    
    // Reassign IDs sequentially
    nodes.forEach((node, index) => {
        node.id = index + 1;
    });

    // Update edges
    edges.forEach(edge => {
        edge.from = nodes.find(node => node.id === edge.from)?.id || edge.from;
        edge.to = nodes.find(node => node.id === edge.to)?.id || edge.to;
    });

    updateGraph();
    drawGraph();
}

document.getElementById('deleteNode').addEventListener('click', () => {
    const nodeId = parseInt(document.getElementById('deleteNodeInput').value);
    if (nodeId) {
        deleteNode(nodeId);
    }
});

drawGraph()