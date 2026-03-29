# FixMyRide Administrative Dashboard

A premium, production-ready administrative panel for managing automotive service bookings, inventory, and business logic.

## 🚀 Senior Architectural Refactor (March 29, 2026)

The application has been overhauled from a 1700+ line monolithic structure to a professional, modular component-based architecture to meet senior code review standards:
- **Modular Core Views**: Decoupled `Dashboard`, `Inventory`, and `RuleManager` into standalone core components.
- **Shared UI Library**: Standardized common elements like `GenericTableView`, `ModalForm`, `Header`, and `Sidebar`.
- **Custom Hooks & Types**: Centralized notification logic with `useToast` and cross-component type definitions in `src/types`.
- **100% Logic Preservation**: Reduced `App.tsx` complexity by 90% while preserving 100% of the UI and functional logic.
- **Production Ready**: Verified zero-error production build (`npm run build`).

## 🛠️ Important Core Fixes & Enhancements
- **Redirect Path Correction**: Resolved the issue where manually entered URLs (e.g., `/parts`) would kick users back to the dashboard after login. The application now uses a Unified Router context to preserve navigation state across authentication.
- **Database Schema Parity**: All UI tables (Inventory, Logic Rules, Bookings) now match the final Supabase schema with 100% field accuracy.

### 📊 Full Database Column Synchronization
Mapped 100% of crucial database columns from Supabase to the UI views:
- **Inventory Management**: Added `SKU`, `Cost Price`, and `Currency` fields.
- **Rule Management (Logic)**: 
    - Implemented a **New Two-Column Layout** for the Overview tab.
    - Added 20+ fields including Geo-Fencing (`allowed_city`, `service_area_required`), Messaging (`acceptance_message`), and Logic Requirements (`require_vehicle_make`, `require_vehicle_year`).
- **Booking Records**: Added `Order Number`, `Invoice Number`, and `Customer Phone` to provide immediate operational context.
- **Invoice Tracking**: Added `Invoice Date`, `Due Date`, `Tax`, `Discount`, and direct **PDF Document Links**.

## 🛠️ Tech Stack
-   **Frontend**: React (with TypeScript)
-   **Styling**: Vanilla CSS (TailwindCSS not used per design standard)
-   **Backend**: Supabase (PostgreSQL + Auth)
-   **Animations**: Framer Motion
-   **Icons**: Lucide React

## 📦 How to Start
1.  **Clone the Repository**: `git clone https://github.com/mahenoorsalat/FMR.git`
2.  **Install Dependencies**: `npm install`
3.  **Set Environment Variables**: Create a `.env` file with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4.  **Run Development Server**: `npm run dev`
5.  **Build for Production**: `npm run build`

## 🎨 Design Philosophy
The dashboard follows the **"Twisty Soft-UI"** design system:
-   Primary Color: `#00A3FF` (FixMyRide Blue)
-   Secondary Color: Sleek White / Soft Gray
-   Interactive Elements: Smooth shadow-based elevation and Framer Motion transitions.

---
*Created for FixMyRide Admin.*
