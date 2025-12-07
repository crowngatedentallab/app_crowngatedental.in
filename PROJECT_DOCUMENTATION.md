# Crowngate Dental Lab Management Portal
**Project Documentation v1.1**

## 1. Executive Overview
The **Crowngate Dental Lab Portal** is a specialized web application designed to streamline operations for Crowngate Dental Laboratory. It serves as a central command center connecting **Admins**, **Technicians**, and **Doctors**, replacing manual tracking with a digital, automated workflow.

The system leverages **Firebase** as a robust, real-time backend database, ensuring scalability, speed, and reliability without the limitations of spreadsheet-based systems.

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

## 3. Database Schema (Firebase Firestore)
The backend uses **Firebase Firestore**, a NoSQL document database.

### 📋 collection: `orders`
Stores the core transactional data of the lab.
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String | Auto-generated Document ID (also used as display ID, e.g., ZC-1001) |
| `patientName` | String | Name of the patient |
| `doctorName` | String | Full name of the prescribing doctor |
| `clinicName` | String | Clinic associated with the doctor |
| `toothNumber` | String | Comma-separated tooth numbers |
| `shade` | String | Visual shade reference |
| `typeOfWork` | String | Product type |
| `status` | String | Enum (Submitted, Milling, etc.) |
| `submissionDate`| String | ISO Date string |
| `dueDate` | String | Target delivery date |
| `priority` | String | "Normal" or "Urgent" |
| `assignedTech` | String | Name of the technician |
| `notes` | String | Instructions |

### 👥 collection: `users`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String | Auto-generated Document ID |
| `username` | String | Login username |
| `password` | String | Login password |
| `fullName` | String | Display name |
| `role` | String | `ADMIN`, `DOCTOR`, `TECHNICIAN` |
| `relatedEntity` | String | Clinic Name (for Doctors) or Specialization (for Techs) |

### 📦 collection: `products`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String | Auto-generated Document ID |
| `name` | String | Product Name |
| `code` | String | 2-4 letter prefix (e.g., ZC) |
| `isActive` | Boolean | Availability status |

### 🔢 collection: `counters`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String | Product Code (e.g., ZC) |
| `lastSequence` | Number | Integer of the last used ID (e.g., 1001) |

---

## 4. System Logics

### Authentication
*   **Login**: Validates against `users` collection in Firestore.
*   **Session**: JSON object stored in `localStorage` ('crowngate_user').

### Data Strategy
*   **Firestore**: Primary source of truth.
*   **Storage**: Firebase Storage used for file uploads.
*   **Direct Access**: Services (firestoreService.ts) communicate directly with Firebase SDK.

---

## 5. Technical Architecture

### Frontend Stack
*   **Framework**: [React 19](https://react.dev/) (via Vite) for high-performance UI.
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) for a responsive, modern "Medical Blue" aesthetic.
*   **Icons**: [Lucide React](https://lucide.dev/) for clean, consistent iconography.
*   **Charts**: [Recharts](https://recharts.org/) for data visualization.

### Backend Strategy (Serverless)
*   **Database**: Firebase Firestore.
*   **Storage**: Firebase Storage.
*   **Hosting**: Firebase Hosting (Recommended) or Vercel.

---

## 6. Setup & Installation

### Prerequisites
*   Node.js (v18+)
*   npm or yarn

### Local Development
1.  **Clone the repository**:
    ```bash
    git clone https://github.com/crowngatedentallab/app_crowngatedental.in.git
    cd app_crowngatedental.in
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment**:
    *   Ensure `firebase.ts` contains your valid Firebase configuration keys.

4.  **Run locally**:
    ```bash
    npm run dev
    ```
    Access the app at `http://localhost:5173`.

### Deployment
*   **Build**: Run `npm run build` to generate the `dist` folder.
*   **Host**: Deploy the `dist` folder to Firebase Hosting, Vercel, or Netlify.

---

## 7. Security Note
*   **Current State**: Password validation happens client-side for simplicity.
*   **Recommendation**: For scaling, implement Firebase Authentication (Identity Platform).

---

**Developed for Crowngate Dental Centre.**
