# Plan: Project Setup and Core UI

This document outlines the initial setup of the application and the design of the core user interface.

## 1. Technology Stack

- **Framework:** [Electron](https://www.electronjs.org/) - To build a cross-platform desktop app with web technologies.
- **Backend:** [Node.js](https://nodejs.org/) - For all backend logic, running in Electron's main process.
- **Frontend:** [React](https://reactjs.org/) with [TypeScript](https://www.typescriptlang.org/) - For building a modern, type-safe user interface.
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) - For a utility-first CSS workflow.
- **UI Components:** [Shadcn/UI](https://ui.shadcn.com/) - A set of reusable components that can be customized.

## 2. Initial Scaffolding

The project will be initialized using a standard boilerplate for Electron with React and TypeScript, such as `electron-react-boilerplate` or by setting it up manually with Vite.

```bash
# Example using Vite
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install electron electron-builder --save-dev
# (Further configuration required to link Vite and Electron)
```

Following the setup, we will integrate Tailwind CSS and initialize Shadcn/UI for our component base.

## 3. Core UI Design

The main application window will have a simple, two-column layout:

- **Left Sidebar:** A vertical list of all installed and activated plugins. Each item will display the plugin's icon and name. Clicking an item will open that plugin's main view in the content area.
- **Main Content Area:** This area will display the UI of the currently selected plugin. When no plugin is selected (e.g., on first launch), it will show a welcoming home screen or a grid of available plugins to activate.

This design keeps the focus on the plugins, treating the core app as a simple "shell" or "browser" for the plugin experiences.
