# Crowngate Dental Lab Management Portal
**Project Documentation v1.0**

## 1. Executive Overview
The **Crowngate Dental Lab Portal** is a specialized web application designed to streamline operations for Crowngate Dental Laboratory. It serves as a central command center connecting **Admins**, **Technicians**, and **Doctors**, replacing manual tracking with a digital, automated workflow.

The system leverages **Google Sheets** as a flexible, zero-cost backend database, managed via a custom Google Apps Script API, ensuring data ownership and ease of backup.

---

## 2. Key Features by Role

### 🛡️ Admin (Lab Manager)
*   **Master Control Panel**: A high-level dashboard visualizing business health.
*   **Business Intelligence**:
    *   **Live KPIs**: Active Queue, Urgent Cases, Today's Intake.
    *   **Visual Analytics**: Radial charts for pipeline health, Area charts for monthly volume, and Horizontal bars for top products.
*   **Order Management**:
    *   **CRUD Operations**: Create, Read, Update, and Delete orders.
    *   **Technician Assignment**: distinct dropdown to assign specific technicians to cases.
    *   **Status Tracking**: Monitor cases from "Submitted" to "Delivered".
*   **User Management**: Add/Remove Doctors and Technicians; manage role-based access.
*   **Configuration**: dynamic management of "Restoration Types" (Products) via the dashboard.

### 🦷 Doctor (Client)
*   **Order Submission**: Streamlined form to submit new prosthetic orders.
*   **Case Tracking**: View status of their own submitted cases in real-time.
*   **Digital Prescription**: Select parameters (Tooth #, Shade, Type) digitally.

### 🔧 Technician (Lab Staff)
*   **Personalized Workload**: "My Queue" view showing only assigned cases.
*   **Status Updates**: One-click updates to move cases through stages (Milling -> Glazing -> Dispatched).
*   **Efficiency**: Clear indicators for "Urgent" cases and Due Dates.

---

## 3. Technical Architecture

### Frontend Stack
*   **Framework**: [React 19](https://react.dev/) (via Vite) for high-performance UI.
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) for a responsive, modern "Medical Blue" aesthetic.
*   **Icons**: [Lucide React](https://lucide.dev/) for clean, consistent iconography.
*   **Charts**: [Recharts](https://recharts.org/) for data visualization.

### Backend Strategy (Serverless)
*   **Database**: Google Sheets (Acts as the relational database).
*   **API Layer**: Google Apps Script (Web App deployment) acting as a REST API.
    *   `doGet()`: Handles data fetching.
    *   `doPost()`: Handles updates, creation, and deletion.
*   **Authentication**: Simple role-based routing (Frontend-enforced).

---

## 4. Setup & Installation

### Prerequisites
*   Node.js (v18+)
*   npm or yarn

### Local Development
1.  **Clone the repository**:
    ```bash
    git clone https://github.com/crowngatedentallab/portal.git
    cd portal
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment**:
    *   Update `services/sheetService.ts` with your deployed **Google Apps Script Web App URL**.

4.  **Run locally**:
    ```bash
    npm run dev
    ```
    Access the app at `http://localhost:5173`.

### Deployment
*   **Build**: Run `npm run build` to generate the `dist` folder.
*   **Host**: Deploy the `dist` folder to any static host (Vercel, Netlify, GitHub Pages).

---

## 5. Security Note
*   **Current State**: Password validation happens client-side for simplicity.
*   **Recommendation**: For scaling, implement server-side JWT authentication and hashing.

---

**Developed for Crowngate Dental Centre.**
