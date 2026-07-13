# YourTube - Next.js YouTube Clone

A feature-rich, high-performance **YouTube Clone** built using Next.js, Express/Node.js backend, and MongoDB. It mimics core YouTube functionality while introducing advanced, context-aware, and premium features designed for a secure, interactive user experience.

---

## 🚀 Key Features

### 1. 📱 Fully Responsive Design
- Optimized for desktops, tablets, and smartphones (portrait & landscape).
- Mobile-first horizontal scrolling actions bar (similar to the native YouTube app).
- Overlay collapsible sidebar navigation drawer on phone viewports.
- Responsive video grid that scales columns dynamically.

### 2. 🌍 Context-Aware Dynamic Themes (Secure Mode)
- **Time & Location-based Automatic Styling**:
  - If a user accesses the site between **10:00 AM and 12:00 PM IST** from a location within **South India** (Tamil Nadu, Kerala, Karnataka, Andhra Pradesh, or Telangana), a **White (Light) Theme** is automatically applied.
  - For all other time slots or any location outside these states, the site automatically enforces a secure **Dark Theme**.
- **Location Geolocation Detection**:
  - The server handles automated geolocation checking via headers (`x-forwarded-for`) and geolocates using secure fallback reverse geocoding APIs (`freeipapi.com`, `ipwho.is`, `ipapi.co`).

### 3. 📞 Watch Party & VoIP Video Calls
- Real-time video/audio calling with friends right inside the browser.
- **WebRTC peer connections** enabled with STUN/TURN servers to bypass firewalls and establish direct media streams.
- **Interactive features**: Audio level indicators, real webcam or virtual simulator fallback toggles, camera flipping, in-call chat messenger, screen sharing (tab/window), and session recording (.webm local download).

### 4. 🔠 Multilingual Comment Translation
- Instantly translate comments into multiple languages (English, Spanish, French, German, Hindi, Japanese, Chinese, Arabic, Russian) directly from the comments feed via MyMemory API integrations.

### 5. 👑 Premium Membership Tier
- Watch duration limits enforced by tier (Free: 5 mins, Bronze: 7 mins, Silver: 10 mins, Gold: Unlimited).
- Integrates realistic custom Razorpay checkout pop-ups for tier upgrades (₹10 - ₹100 one-time fee) with full step-by-step transaction simulations.

---

## 🛠️ Tech Stack
- **Frontend**: Next.js (Pages Router), TypeScript, Tailwind CSS v4, Lucide Icons, Shadcn components.
- **Backend**: Node.js, Express, Mongoose (MongoDB).
- **Authentication**: Firebase Authentication.
- **RTC**: WebRTC, Web Audio API (volume monitoring, chime synthesizers).

---

## 🧪 Testing the Context-Aware Theme

To test and simulate the context-aware theme switching system without physically being in South India or waiting for the 10:00 AM - 12:00 PM IST window:

### A. Location Overrides
Add the `overrideState` query parameter to the URL to simulate accessing the site from specific states:
- **South India (Light theme trigger)**: `http://localhost:3000/?overrideState=Kerala` (or `Tamil Nadu`, `Karnataka`, `Andhra Pradesh`, `Telangana`).
- **Outside South India (Enforces Dark theme)**: `http://localhost:3000/?overrideState=Maharashtra` (or `Delhi`, `California`, etc.).

> [!NOTE]
> The theme will only switch to light if the current time in IST is also between 10:00 AM and 12:00 PM.

### B. Explicit Theme Overrides
Force the client theme manually regardless of location or time check using the `theme` parameter:
- **Force Light Theme**: `http://localhost:3000/?theme=light`
- **Force Dark Theme**: `http://localhost:3000/?theme=dark`

---

## 💻 Getting Started

### 1. Install Dependencies
```bash
# In the yourtube folder
npm install

# In the server folder
npm install
```

### 2. Configure Environment variables
Configure `.env` files for both frontend and backend using the provided templates.

### 3. Run Development Servers
```bash
# Start backend (from server folder)
npm start

# Start frontend (from yourtube folder)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.
