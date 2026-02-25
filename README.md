# Pathfinder City — Interactive Pathfinding Visualizer

**Pathfinder City** is a modern, interactive multi-stop pathfinding visualizer that simulates a comprehensive city network. Built entirely with Vanilla JavaScript, HTML5 Canvas, and CSS3, this application lets you build, manage, and visualize complex multi-leg trips using classic routing and searching algorithms.

## 🔗 Live Demo
Check out the live version of Pathfinder City here:
[**[Insert your Vercel URL here]**](https://your-vercel-link.vercel.app/)

## 🗺️ Key Features

- **Interactive 100-Node City Map**: Explore a robust graph mapping application rendered smoothly via the HTML5 Canvas API. Supports interactive panning (Shift + Drag) and zooming (Scroll).
- **Algorithm Visualizations**: Watch algorithms expand naturally across the city.
  - *Dijkstra's Algorithm* (Guarantees shortest path)
  - *A\* Search* (Guarantees shortest path, uses heuristics for speed)
  - *Breadth-First Search (BFS)* (Explores equally in all directions)
  - *Depth-First Search (DFS)* (Explores as deeply as possible before backtracking)
- **Multi-Stop Trip Planner**: Choose a starting location, click nodes to add multiple stops, and watch the platform dynamically stitch the full route together.
- **Drag-and-Drop Reordering**: Easily re-prioritize your trip by dragging and dropping waypoint cards in the sidebar.
- **Real-Time Animation Controls**: Control the animation speed using the playback slider to either learn step-by-step or sprint to the final result.
- **Live Statistics Engine**: View realtime data such as total nodes visited, number of legs completed, calculated total distance, and computation time.
- **Rich City Topography**: Different node types are color-coded (Parks, Hospitals, Education centers, Businesses, etc.) to simulate a diverse metropolitan area.

## 🛠️ Technology Stack

- **Frontend Core**: HTML5, CSS3, Vanilla JavaScript (ES6 Modules)
- **Rendering**: Custom `MapRenderer` leveraging the **HTML5 Canvas API** for high-performance drawing.
- **Algorithm Engine**: Relies on JavaScript **Generator Functions (`function*`)** to yield execution states iteratively, enabling complex step-by-step animations without blocking the main browser UI thread. 

## 📂 Project Structure

- `index.html`: The core entry point, UI structure, and HTML layout.
- `style.css`: The styling engine responsible for the sleek, dark-mode, and responsive design system.
- `app.js`: The central application controller managing user inputs, the waypoint state, multi-leg execution chaining, and connecting UI to logic.
- `graph.js`: The underlying data structure initializing the 100 nodes, defining spatial coordinates, categories, and weighted edges.
- `algorithms.js`: The brains of the program containing generator-function implementations of Dijkstra, A*, BFS, and DFS.
- `renderer.js`: The visual engine handling all canvas painting operations, coordinate tracking, path highlighting, and interactive panning.

## 🚀 How to Run Locally

Because this project utilizes ES6 Modules (`import`/`export`), it must be served over `http://` or `https://` (meaning a local web server is required) rather than opening the file directly via `file://`.

1. Clone or download the repository to your local machine.
2. From the project root, start a local development server of your choice:

   Using **Node.js**:
   ```bash
   npx serve .
   ```
   *or*
   ```bash
   npx http-server
   ```

   Using **Python 3**:
   ```bash
   python -m http.server
   ```

3. Open your browser and navigate to the local address provided by your server (typically `http://localhost:3000` or `http://localhost:8000`).

## 🎮 How to Use
1. **Choose an Algorithm:** Select between Dijkstra, A*, BFS, or DFS from the sidebar dropdown.
2. **Build Your Trip:** Set your starting point using the "Trip Route" dropdown, or by simply clicking a node on the canvas. 
3. **Add Stops:** Continue clicking nodes on the canvas to add sequential stops. 
4. **Reorder Stops:** Click and drag the "⠿" handle on any waypoint card in the sidebar to reorder destinations.
5. **Set Speed:** Adjust the animation execution speed with the speed slider.
6. **Find Path:** Click **"▶ Find Path"** to watch the algorithm sequentially route through all your waypoints!
