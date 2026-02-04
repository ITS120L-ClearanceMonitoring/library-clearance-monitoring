<<<<<<< HEAD
# Library Clearance Monitoring System

A modern, responsive web application for managing library clearance, user accounts, and request history. Built with React, Vite, Supabase, and custom Edge Functions.

---

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Development Scripts](#development-scripts)
- [Supabase & Edge Functions](#supabase--edge-functions)
- [Styling & Responsiveness](#styling--responsiveness)
- [Error Handling & Notifications](#error-handling--notifications)
- [Contributing](#contributing)
- [License](#license)

---

## Features
- User authentication (login, password change, account lockout)
- User management (invite, update, delete users via Supabase Auth)
- Clearance request tracking and history
- Responsive, mobile-first UI
- Toast notifications for all actions
- Custom Supabase Edge Functions for staff invitation and user deletion

---

## Tech Stack
- **Frontend:** React 19, Vite 7, React Router 7, React-Toastify
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions)
- **Styling:** CSS Modules, custom breakpoints, utility classes
- **Other:** Deno (for Edge Functions)

---

## Project Structure
```
library-clearance-monitoring/
├── public/
├── src/
│   ├── components/
│   ├── context/
│   ├── features/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── home/
│   │   ├── history/
│   │   └── clearances/
│   ├── styles/
│   └── App.jsx
├── supabase/
│   └── functions/
│       ├── invite-staff/
│       └── delete-user/
├── package.json
├── vite.config.js
└── README.md
```

---

## Setup & Installation

### 1. Clone the repository
```sh
git clone https://github.com/your-org/library-clearance-monitoring.git
cd library-clearance-monitoring
```

### 2. Install dependencies
```sh
npm install
```

### 3. Configure Supabase
- Make sure you have access to the shared Supabase project (ask your team lead for credentials).
- In the Supabase dashboard, get your project URL and anon/public key.

### 4. Set up environment variables
Create a `.env` file in the root directory:
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 5. Run the development server
```sh
npm run dev
```

The app will be available at http://localhost:5173 (or the port shown in your terminal).

---

## Environment Variables
- `VITE_SUPABASE_URL` – Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` – Your Supabase anon/public key

For Edge Functions, set these in the Supabase dashboard:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `REDIRECT_URL`

---

## Development Scripts
- `npm run dev` – Start the Vite development server
- `npm run build` – Build for production
- `npm run preview` – Preview the production build
- `npm run lint` – Run ESLint

---

## Supabase & Edge Functions
- Edge Functions are in `supabase/functions/`:
  - `invite-staff`: Invites a new staff user, adds to Auth and DB, handles duplicate emails.
  - `delete-user`: Deletes a user from both Auth and DB.
- Deploy with:
```sh
npx supabase functions deploy invite-staff
dx supabase functions deploy delete-user
```
- Make sure your Supabase CLI is authenticated and linked to the correct project.

---

## Styling & Responsiveness
- Global styles: `src/styles/main.css` (variables, breakpoints, utility classes)
- Feature styles: Each feature has its own CSS (e.g., `auth.css`, `users.css`)
- Responsive breakpoints: xs (320px), sm (640px), md (768px), lg (1024px), xl (1280px+)
- Accessibility: Touch-friendly buttons, minimum 44px height, proper color contrast

---

## Error Handling & Notifications
- All errors are shown using React-Toastify toasts (no browser alerts).
- Account lockout: After 5 failed login attempts, account is locked for 15 minutes.
- Duplicate email: User is notified if an email is already registered.
- Edge Function errors: Shown as toasts with user-friendly messages.

---

## Contributing
1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push to your fork and submit a pull request

---

## License
[MIT](LICENSE)

---

## Dependencies

The following npm packages are required for this project:

### Main Dependencies
- **@supabase/supabase-js** (^2.94.0)
- **react** (^19.2.0)
- **react-dom** (^19.2.0)
- **react-router-dom** (^7.13.0)
- **react-toastify** (^11.0.5)

### Dev Dependencies
- **@eslint/js** (^9.39.1)
- **@types/react** (^19.2.5)
- **@types/react-dom** (^19.2.3)
- **@vitejs/plugin-react** (^5.1.1)
- **eslint** (^9.39.1)
- **eslint-plugin-react-hooks** (^7.0.1)
- **eslint-plugin-react-refresh** (^0.4.24)
- **globals** (^16.5.0)
- **supabase** (^2.75.3)
- **vite** (^7.2.4)

To install all dependencies, simply run:

```sh
npm install
```

If you add new packages, use:
```sh
npm install package-name
```

---

## Adding Toastify and Supabase

If you are setting up the project from scratch or on a new machine, you need to install the following core libraries:

- **React Toastify** (for notifications):
  ```sh
  npm install react-toastify
  ```

- **Supabase JS Client** (for database, auth, and storage):
  ```sh
  npm install @supabase/supabase-js
  ```

If you are using the Supabase CLI for local development and deploying Edge Functions, also run:
  ```sh
  npm install --save-dev supabase
  ```
  npm install -g supabase (for functions)
  

After installing, you can import and use these libraries in your React components and services.
=======
# library-clearance-monitoring
>>>>>>> 205c7e53c43bb5700b356b1370d1f29c6225937e
