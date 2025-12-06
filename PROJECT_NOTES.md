# Crowngate Dental Lab Portal - Technical Documentation

## 1. System Architecture
This application follows a **Serverless "Low-Code" Architecture**. 
*   **Frontend:** React (Vite) + Tailwind CSS.
*   **Backend API:** Google Apps Script (GAS) published as a Web App.
*   **Database:** Google Sheets.

### Data Flow Diagram
```
[React App] <--> [Google Apps Script (API)] <--> [Google Sheets (DB)]
```

---

## 2. Core Logic & Algorithms

### A. The "Optimistic UI" Pattern (Lag Elimination)
To prevent the user from waiting 1-2 seconds for Google Sheets to respond, we use **Optimistic Updates**:
1.  **User Action:** User clicks "Authorize Case" or updates a status.
2.  **Instant Local Update:** The app *immediately* updates the browser's local state. The UI changes instantly.
3.  **Background Sync:** The app sends the data to Google Apps Script in the background.
    *   *Success:* Nothing happens (user already sees the result).
    *   *Failure:* We log the error (in a production app, we would rollback the change).

### B. CORS & Google Apps Script
Google Apps Script has strict CORS (Cross-Origin Resource Sharing) policies.
*   **The Hack:** We send all POST requests with `Content-Type: text/plain`.
*   **The Logic:** If we send `application/json`, the browser sends a "Preflight" (OPTIONS) request, which Google blocks. By sending `text/plain`, the browser skips the check, and our Google Script parses the text back into JSON manually.

### C. Role-Based Access Control (RBAC) Logic
Security is handled via filtering on the client side (for the UI) and should be enforced on the backend in a full Enterprise version.
*   **Admin:** `orders` array is passed raw.
*   **Doctor:** `orders.filter(o => o.doctorName === currentUser.fullName)`
*   **Technician:** `orders.filter(o => o.assignedTech === currentUser.fullName)`

---

## 3. Database Structure (Google Sheets)

The system requires exactly **3 Tabs** in the Google Sheet.

### Tab 1: `Orders`
Stores all case data.
*   **Headers:** `id`, `patientName`, `doctorName`, `clinicName`, `toothNumber`, `shade`, `typeOfWork`, `status`, `submissionDate`, `dueDate`, `assignedTech`, `priority`, `notes`
*   **Date Logic:** Dates are stored as `YYYY-MM-DD`. Time components (`T14:00...`) are stripped by the backend service to prevent UI date-picker glitches.

### Tab 2: `Users`
Stores login credentials.
*   **Headers:** `id`, `username`, `password`, `fullName`, `role`, `relatedEntity`
*   **Logic:**
    *   `role`: Must be EXACTLY `ADMIN`, `DOCTOR`, or `TECHNICIAN`.
    *   `relatedEntity`: Stores the Clinic Name (for Doctors) or is empty.

### Tab 3: `Products`
Stores the dynamic list of restoration types.
*   **Headers:** `id`, `name`
*   **Logic:** The Doctor's "Restoration Type" dropdown dynamically fetches rows from this tab. If the tab is missing, it falls back to hardcoded defaults in `mockData.ts`.

---

## 4. Feature Implementation Details

### Admin Dashboard
*   **Advanced Filtering:** Replaced the "Revenue" card. Uses a 3-way filter logic:
    ```javascript
    (type === 'All' || match) && (doctor === 'All' || match) && (status === 'All' || match)
    ```
*   **Inline Editing:** Clicking any cell in the Master Table turns it into an input field (`EditableField.tsx`).
*   **User Management:** Set to **Read-Only** in the app. Admins are instructed to edit the Google Sheet directly for adding users. This serves as a security boundary.

### Doctor Dashboard
*   **Form Logic:**
    *   **Required Fields:** Patient Name and Date are strictly enforced.
    *   **Double-Submit Protection:** The submit button enters a `disabled/processing` state immediately on click to prevent duplicate rows in the Sheet.
    *   **Dynamic Dropdown:** Fetches options from the `Products` sheet.

### Technician View
*   **Workflow:** Optimized for touch. 
*   **One-Tap Advance:** The primary button automatically calculates the *next* status in the `OrderStatus` enum sequence (e.g., `Designing` -> `Milling`) and updates it.

### UI/UX Assets
*   **Logo:** The logo is hosted on Google Drive. 
    *   **Component:** `components/Logo.tsx`
    *   **Technique:** Uses a direct-export URL (`drive.google.com/uc?export=view...`) and CSS `object-fit: contain` to prevent cropping or zooming issues.

---

## 5. Google Apps Script Code (The Backend)

To redeploy the backend, paste this into `Extensions > Apps Script`:

```javascript
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var postData = JSON.parse(e.postData.contents); // Works because we send text/plain
    var action = postData.action;
    var sheetName = postData.sheet; 
    var sheet = ss.getSheetByName(sheetName);

    // ... (CRUD Logic for Create, Update, Delete) ...

    return ContentService.createTextOutput(JSON.stringify({status: "success"}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(e) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: e.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
```

## 6. Deployment Checklist
1.  Verify Google Sheet has `Orders`, `Users`, and `Products` tabs.
2.  Deploy Apps Script as "Web App" -> Access: "Anyone".
3.  Copy URL to `services/sheetService.ts`.
4.  Build React App (`npm run build`).
