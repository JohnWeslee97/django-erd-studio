# Django ERD Studio 🎨📊

An interactive, premium web-based Entity-Relationship Diagram (ERD) workbench and database model planner for Django projects. Plan your database schema visually, edit fields, and push code changes directly to your Django application's `models.py` in real-time!

---

## ✨ Key Features (Fully Implemented)

### 1. High-Performance Introspection & Code Generation
*   **Deep Django Introspection**: Automatically scans your installed apps and models, extracting fields, choices, properties, and complex relationships (`ForeignKey`, `OneToOneField`, `ManyToManyField`).
*   **"Write-to-Code" Engine**:
    *   **Add New Models (Drafts)**: Draw custom tables directly in the UI and push them to your code.
    *   **Edit Existing Models**: Modify columns, types, or attributes, and the backend safely writes the updates into your `models.py`.
    *   **LibCST Integration**: Utilizes Concrete Syntax Tree (CST) parsing to safely inject new fields into your Python classes, keeping all developer comments, manual formatting, and custom helper methods 100% intact!

### 2. Premium Vector Visuals & Canvas
*   **Collision-Free Theme Colors**: Mapped distinct aesthetic colors for core Django applications with a deterministic hashing fallback to ensure newly created apps and custom drafts get unique, gorgeous colors.
*   **Natural Full-Height Cards**: Table cards scale dynamically to show their full field list, eliminating annoying vertical scrollbars and ensuring relationship handles line up with micro-pixel accuracy.
*   **Unclipped Handles**: Main containers are set to visible overflow, showing Primary Key (`PK`), Foreign Key (`FK`), Many-to-Many (`M2M`), and One-to-One (`O2O`) connector circles as beautiful, uncropped full circles.
*   **Interactive Relationship Edges**: Hover and click on connection lines to view interactive details such as Type, Source/Target, `on_delete` behaviors, and `related_name` properties.

### 3. Professional HD Export Engine (PNG & PDF)
*   **Retina-Grade Clarity**: Renders the inner React Flow viewport at a native `scale(1)` transform with a `2x` pixel ratio, capturing vector-sharp, clear text and arrowheads under close-up zooming.
*   **Dynamic Orientation Matching**: Automatically detects your diagram's aspect ratio and chooses between Portrait or Landscape PDF page orientation to fit your layout.
*   **Standard A4 Mobile-Ready PDF**: Scales the high-definition canvas to center and fit perfectly inside standard `A4` document bounds. Color-fills the entire standard page with a solid dark-theme color (`#111827`) so aspect-ratio letterboxing blends seamlessly with zero white borders.
*   **PDF Auto-Fit on Open**: Configures opening catalog metadata (`setDisplayMode('fullpage')`) so that modern PDF readers automatically fit the entire diagram to the screen on open—completely avoiding initial scrollbars!
*   **95% File Size Optimization**: Bypasses slow stylesheet font scanning (`skipFonts: true`) and processes images using high-efficiency JPEG compression (`0.95` quality). This slashes exported PDF sizes by over **95%** (typically from **10MB+ down to just 300KB - 500KB**) while maintaining perfect text and path sharpness!

### 4. Smart Local State Persistence
*   **Position Lock**: Drag and arrange tables on your canvas—the coordinates are automatically saved to `localStorage` so your custom layouts are preserved across refreshes.
*   **Draft Persistence**: Planned draft tables remain safely on your browser canvas across browser restarts until you explicitly push them to your code.
*   **Cache-Busting Backend**: Pre-configured Flask servers serve static resources with explicit `Cache-Control: no-store` headers, completely eliminating aggressive browser cache locks during local development.

---

## 🛠️ Technology Stack

### Backend (Python)
*   **Django (>= 3.2)**: For database model introspection and project-wide metadata management.
*   **Flask (>= 2.0)**: Acts as a lightweight API server bridging the Django context and the web browser.
*   **LibCST (>= 1.0)**: Concrete Syntax Tree parser used for safe python code modification and preservation of code formatting.

### Frontend (JavaScript/React)
*   **Vite**: Rapid asset building and development hot-reloading.
*   **React (v19)**: The core UI component library.
*   **ReactFlow (v11)**: The interactive canvas engine handling nodes, handles, connections, zoom, and minimap.
*   **Dagre (v0.8)**: Organizes node coordinates programmatically using Directed Acyclic Graph layouts.
*   **html-to-image & jsPDF**: Replaced obsolete rendering engines to support native SVG `<marker>` definitions (arrowheads) and high-efficiency standard PDF/JPEG rendering.

---

## 🚀 Getting Started

### 1. Installation
Install the package directly into your active Django environment:
```bash
pip install django-erd-studio
```

### 2. Register the App
Add `django_erd_studio` to your project's `INSTALLED_APPS` inside `settings.py`:
```python
INSTALLED_APPS = [
    # ...
    'django_erd_studio',
]
```

### 3. Run the Workbench!
Launch the interactive web portal by running the custom Django management command:
```bash
python manage.py erd_studio
```
The server will start locally at **`http://127.0.0.1:8765`** and automatically open the portal in your browser!

---

## 📦 Deployment & Clean Building

This repository is structured according to python packaging best practices. The backend code (`django_erd_studio/`) and frontend workspace (`frontend/`) are perfectly isolated, and Git is protected via a robust `.gitignore` file.

To compile optimized production assets and package your project for PyPI distribution:

1.  **Rebuild Frontend Static Assets**:
    ```bash
    cd frontend
    npm run build
    ```
2.  **Generate Clean Package Wheels**:
    ```bash
    cd ..
    python -m build
    ```
    *(Generates a highly optimized, lightweight **~390 KB** wheel inside `dist/` containing only the backend server and minified Web UI, completely excluding raw React code and test environments).*
