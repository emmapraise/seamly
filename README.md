# Seamly 🧵
### The Luxury Studio Management System

Seamly is a professional, high-end studio management platform designed for modern luxury production studios. It streamlines the entire workflow from client onboarding and measurement tracking to order management and POS-style checkout settlements.

---

## ✨ Key Features

- **🛍️ Studio Settlement (POS)**: A modernized checkout flow for processing payments, managing deposits, and clearing balances with luxury aesthetics.
- **👥 Client CRM**: Comprehensive client profiles including detailed measurement history and order archives.
- **📦 Inventory Management**: Real-time tracking of studio materials and finished products.
- **📑 Order Lifecycle**: End-to-end management from order creation to final delivery.
- **💳 Financial Ledger**: Transparent payment tracking and reconciliation for audit-ready records.
- **🌓 Premium UI**: A sophisticated design system supporting high-contrast dark mode and smooth micro-interactions.

## 🚀 Tech Stack

- **Frontend**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler**: [Vite](https://vitejs.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Backend/Auth**: [Firebase](https://firebase.google.com/)
- **Routing**: [React Router 7](https://reactrouter.com/)
- **Styling**: Vanilla CSS (Modern Design System)

## 🛠️ Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/emmapraise/seamly.git
   cd seamly
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory and add your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

## 📂 Project Structure

- `src/api`: API integration and services.
- `src/components`: Reusable UI components (Modals, Layouts, etc.).
- `src/context`: Global state management (Auth, Cart, Theme).
- `src/screens`: Main application views (Checkout, Inventory, Orders).
- `src/utils`: Helper functions and formatters.

## 🎨 Design Principles

Seamly is built with a focus on **Visual Excellence**:
- **Aesthetic**: Minimalist, luxury-production aesthetic.
- **Responsive**: Fully optimized for various screen sizes.
- **Interactive**: Subtle animations and transitions for a premium feel.

---

Built with ❤️ by [Emma Praise](https://github.com/emmapraise)
