# Library Clearance Monitoring System

A modern dual-application system for managing library clearance requests with separate **Admin Dashboard** and **Student Portal** applications.

## 📋 Overview

- **Admin App**: Full-featured dashboard for staff to manage clearance statuses, view student records, and generate reports
- **Student App**: Public form for students to submit clearance requests without authentication
- **Shared Backend**: Both apps connect to the same Supabase database
- **Independent Deployments**: Each app can be deployed separately to different servers/domains

---

## 📁 Project Structure

```
library-clearance-monitoring/
├── admin-app/                  # Admin dashboard (port 5173)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── features/
│   │   │   ├── auth/          # Login, password reset
│   │   │   ├── clearances/    # Clearance management
│   │   │   ├── history/       # Audit logs
│   │   │   ├── home/          # Dashboard
│   │   │   └── users/         # Admin management
│   │   ├── components/        # Shared UI components
│   │   ├── services/          # API & Supabase
│   │   └── styles/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── .env                   # Should be in .gitignore
│   └── README.md
│
├── student-app/                # Public student form (port 5174)
│   ├── src/
│   │   ├── StudentApp.jsx
│   │   ├── main.jsx
│   │   ├── pages/
│   │   │   └── StudentPortalPage.jsx
│   │   ├── components/
│   │   │   └── StudentLoggingForm.jsx
│   │   ├── services/
│   │   │   ├── clearanceService.js    # Form submission
│   │   │   └── supabaseClient.js
│   │   ├── data/
│   │   │   ├── programs.js            # Program list
│   │   │   └── purpose.js             # Purpose options
│   │   └── styles/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── .env                   # Should be in .gitignore
│   └── README.md
│
├── supabase/                   # Shared database config
│   ├── config.toml
│   └── functions/              # Edge functions
│
├── package.json                # Root workspace coordinator
├── .gitignore
├── README.md                   # This file
└── .env                        # Root env (optional, .gitignore'd)
```

---

## 🚀 Quick Start

### 1. Install Root Dependencies
```bash
npm install
```

### 2. Setup Environment Variables

Create `.env.local` files in both app directories with your Supabase credentials:

**admin-app/.env.local:**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

**student-app/.env.local:**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

⚠️ **Important**: Both files use the same credentials. Both apps share the same Supabase project.

### 3. Run the Applications

**Option A: Run both apps together**
```bash
npm run dev:all
```

**Option B: Run individual apps**
```bash
# Terminal 1: Admin app
npm run dev:admin

# Terminal 2: Student app
npm run dev:student
```

**Option C: Navigate into each app**
```bash
cd admin-app && npm install && npm run dev
# In another terminal:
cd student-app && npm install && npm run dev
```

### 4. Access the Apps

- **Admin Dashboard**: http://localhost:5173 (requires login)
- **Student Portal**: http://localhost:5174 (public, no login)

---

## 📦 Applications

### Admin App (`admin-app/`)

**Purpose**: Dashboard for library staff

**Features**:
- ✅ User authentication with role-based access
- ✅ View and manage student clearance status
- ✅ Search and filter student records
- ✅ Export clearance history to PDF/CSV
- ✅ Audit logging for all actions
- ✅ User account management
- ✅ Session timeout with inactivity detection

**Tech Stack**:
- React 19
- React Router 7
- Supabase Auth
- jsPDF for exports
- Custom CSS with design system

**Build & Deploy**:
```bash
npm run build:admin
# Output: admin-app/dist/
```

### Student App (`student-app/`)

**Purpose**: Public form for students to submit clearance requests

**Features**:
- ✅ Simple, user-friendly form
- ✅ No authentication required (public access)
- ✅ Program and purpose selection
- ✅ Real-time form validation
- ✅ Offline support with auto-sync when online
- ✅ Mobile-responsive design
- ✅ LocalStorage queuing for offline submissions

**Tech Stack**:
- React 19
- Vite 7
- Supabase (anonymous access)
- Custom CSS with design system

**Build & Deploy**:
```bash
npm run build:student
# Output: student-app/dist/
```

---

## 📝 Available npm Scripts

### From Root Directory

| Command | Description |
|---------|-------------|
| `npm run dev:all` | Run both apps in parallel |
| `npm run dev:admin` | Run admin app only |
| `npm run dev:student` | Run student app only |
| `npm run build:all` | Build both apps for production |
| `npm run build:admin` | Build admin app only |
| `npm run build:student` | Build student app only |
| `npm run lint` | Lint both apps |
| `npm run preview` | Preview production build |

### Per-App Commands

Each app has its own `package.json` with commands:
```bash
cd admin-app && npm run dev      # Dev server
cd admin-app && npm run build    # Production build
cd admin-app && npm run lint     # Lint code

cd student-app && npm run dev
cd student-app && npm run build
cd student-app && npm run lint
```

---

## 🗄️ Database & Backend

### Shared Supabase Project

Both apps connect to the **same Supabase project** using:
- `VITE_SUPABASE_URL` - Your project URL
- `VITE_SUPABASE_ANON_KEY` - Anonymous/public key

### Database Tables

- **users** - Admin and staff accounts (requires auth)
- **student** - Student information (public read, anonymous write)
- **clearance** - Clearance status records (public read, authenticated update)
- **audit_log** - Activity history (admin only)

### Edge Functions

Located in `supabase/functions/`:
- `complete-first-login/` - Handle password change on first login
- `delete-user/` - Safe user deletion
- `invite-staff/` - Send staff invitations

---

## 🌐 Deployment

### Deploy Admin App
```bash
npm run build:admin
# Deploy admin-app/dist/ to your server
# e.g., Vercel, Netlify, AWS, Azure, etc.
```

### Deploy Student App
```bash
npm run build:student
# Deploy student-app/dist/ to your server
# Can be same or different server than admin
```

### Deployment Options

| Platform | Admin | Student | Notes |
|----------|-------|---------|-------|
| Vercel | ✅ | ✅ | Easiest, auto-deploy from git |
| Netlify | ✅ | ✅ | Good for static sites |
| AWS Amplify | ✅ | ✅ | Full AWS integration |
| Azure Static Apps | ✅ | ✅ | Good for enterprise |
| Self-hosted | ✅ | ✅ | Any Node.js server |

### Environment Variables in Production

Set the same variables in your deployment platform:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## 🔒 Security

- **Admin App**: Requires authentication via Supabase Auth
- **Student App**: Allows anonymous submissions (public access)
- **Database Policies**: RLS (Row Level Security) restricts data access appropriately
- **Sensitive Operations**: Require LIBRARY_ADMIN role
- **Environment Variables**: `.env` files are in `.gitignore`

---

## 🛠️ Development Workflow

### Working on Admin Features Only
```bash
cd admin-app
npm install
npm run dev
```

### Working on Student Feature Only
```bash
cd student-app
npm install
npm run dev
```

### Working on Both (Recommended)
```bash
# From root
npm run dev:all
```

### Making Changes

Both apps use **hot module replacement (HMR)** - changes save automatically without manual restart.

---

## 📚 Additional Documentation

- **Admin App Details**: [admin-app/README.md](./admin-app/README.md)
- **Student App Details**: [student-app/README.md](./student-app/README.md)
- **Supabase Setup**: [supabase/README.md](./supabase/README.md) (if exists)

---

## 🔄 Git & Version Control

Both apps are in a **single Git repository**. You can:

```bash
git add admin-app/        # Stage only admin changes
git add student-app/      # Stage only student changes
git add .                 # Stage all changes
git commit -m "message"
git push
```

### Important Files (Not Tracked)
- `.env` files (use `.env.example` for templates)
- `node_modules/` (auto-installed with `npm install`)
- `dist/` folders (build artifacts)

---

## ⚠️ Troubleshooting

### Port Already In Use
If ports 5173/5174 are busy, update `vite.config.js` in each app:
```javascript
server: {
  port: 3000  // Change to available port
}
```

### Dependencies Not Installing
```bash
# Clear and reinstall
rm -r admin-app/node_modules student-app/node_modules
npm install
npm run dev:all
```

### Supabase Connection Failed
- ✅ Check `.env.local` has correct credentials
- ✅ Verify `VITE_SUPABASE_URL` is your actual project URL
- ✅ Confirm `VITE_SUPABASE_ANON_KEY` matches your project
- ✅ Check database policies allow public read/write where needed

### Build Errors
```bash
# Clear caches and rebuild
cd admin-app && rm -rf node_modules dist && npm install && npm run build
cd student-app && rm -rf node_modules dist && npm install && npm run build
```

---

## 📞 Support & Questions

For issues related to:
- **Admin App**: See [admin-app/README.md](./admin-app/README.md)
- **Student App**: See [student-app/README.md](./student-app/README.md)
- **Database**: Check Supabase dashboard

---

## 📄 License

Mapuan De La Salle University - Library Management System

---

## ✅ Checklist for New Developers

- [ ] Clone the repository
- [ ] Run `npm install` at root
- [ ] Create `admin-app/.env.local` with Supabase credentials
- [ ] Create `student-app/.env.local` with same credentials
- [ ] Run `npm run dev:all`
- [ ] Access admin at http://localhost:5173
- [ ] Access student at http://localhost:5174
- [ ] Test admin login
- [ ] Test student form submission

Happy coding! 🎉
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
