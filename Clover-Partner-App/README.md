# Clover 🍀

Clover is a high-performance, mobile-first React Progressive Web Application (PWA) designed for delivery gig workers. It offers a robust, dynamic, and polished application experience akin to platforms like Swiggy or UberEats.

## 🚀 Features

- **Mobile-First PWA:** Built to look and feel like a native mobile application, focusing on responsiveness and offline capabilities.
- **Complex Delivery State Machine:** Powered by `zustand` to manage real-time delivery states seamlessly.
- **Real-Time Geolocation Tracking:** Interactive mapping and live tracking using `Leaflet` and `react-leaflet`.
- **Fluid UI & Micro-interactions:** Smooth transitions and high-performance native-like animations heavily utilizing `framer-motion`.
- **Dynamic Order Dispatch System:** Provides an interactive dashboard layout to manage and accept competitive multi-order situations.
- **Secure Authentication & Protected Routing:** Clean JWT/OTP based login workflows handled dynamically using `react-router-dom`.
- **Earnings & Profile Management:** Built-in views outlining gig performance, current balances, and user statuses.

## 🛠️ Technology Stack

- **Framework:** [React 19](https://react.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Routing:** [React Router v7](https://reactrouter.com/)
- **Maps & Geolocation:** [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Icons:** [Lucide React](https://lucide.dev/)

## 📂 Project Structure

```text
src/
├── components/       # Reusable components (e.g., Layouts, Overlays, Protected Routes)
├── pages/            # View components mapping directly to application routes (Dashboard, Login, Earnings, etc.)
├── store/            # Zustand state architecture models (e.g., useEarningsStore)
├── App.jsx           # Application entry point with routing layouts
└── index.css         # Global stylesheets utilizing Tailwind CSS configurations
```

## 💻 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

Ensure you have Node.js installed on your machine. You can download it from [nodejs.org](https://nodejs.org/).

### Installation

1. **Clone the repository** (if applicable) or navigate to the project directory:
   ```bash
   cd Clover
   ```

2. **Install all dependencies:**
   ```bash
   npm install
   ```

### ⚙️ Available Commands

In the project directory, you can run the following scripts:

- **Start Development Server:**
  Runs the app in development mode.
  ```bash
  npm run dev
  ```
  Open the provided localhost address (typically `http://localhost:5173/`) to view it in your browser. The page will reload when you make changes.

- **Build for Production:**
  Builds the app for production to the `dist` folder.
  ```bash
  npm run build
  ```
  It correctly bundles React in production mode and optimizes the build for the best performance.

- **Preview Production Build:**
  Serves the locally built `dist` folder to test the production build before deployment.
  ```bash
  npm run preview
  ```

- **Run Linter:**
  Checks your code for syntax and style issues using ESLint.
  ```bash
  npm run lint
  ```

## 🤝 Contribution

Feel free to dive in, open an issue, or submit PRs if you find any bugs or have feature enhancements.

## 📜 License

[MIT]
