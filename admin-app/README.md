admin-app/
├── src/
│   ├── App.jsx                    # Main app component
│   ├── main.jsx                   # Entry point
│   ├── assets/                    # Static assets
│   ├── components/
│   │   ├── layouts/               # Dashboard layout
│   │   ├── ProtectedRoute.jsx     # Auth protection
│   │   └── ui/                    # UI components
│   ├── context/
│   │   └── AuthContext.jsx        # Auth context
│   ├── features/
│   │   ├── auth/                  # Login, password reset
│   │   ├── clearances/            # Clearance management
│   │   ├── history/               # Audit log history
│   │   ├── home/                  # Dashboard home
│   │   └── users/                 # Admin user management
│   ├── hooks/
│   │   └── useInactivityTimeout   # Session timeout
│   ├── services/
│   │   ├── auditService.js        # Audit logging
│   │   └── supabaseClient.js      # Supabase config
│   ├── styles/
│   │   └── main.css               # Global styles
│   └── util/
│       └── csvHelpers.js          # Export utilities
├── public/                        # Static files
├── index.html                     # HTML entry point
├── package.json                   # Dependencies
├── vite.config.js                 # Vite configuration
├── eslint.config.js               # ESLint rules
└── .env.local                     # Local environment (create this)

## Setup Instructions

1. **Install Dependencies** (if not auto-installed)
   ```bash
   cd admin-app
   npm install
   ```

2. **Create .env.local**
   Create `admin-app/.env.local` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

3. **Run Development Server**
   From root: `npm run dev:admin`
   Or from admin-app: `npm run dev`
   
   Runs on http://localhost:5173

4. **Build for Production**
   From root: `npm run build:admin`
   Or from admin-app: `npm run build`
   
   Output: `admin-app/dist/`

## Key Features

✅ User authentication with Supabase Auth
✅ Role-based access control (LIBRARY_ADMIN, STAFF)
✅ Clearance status management
✅ Student record search and filtering
✅ History/audit logging
✅ User management
✅ PDF export of clearance records
✅ Session timeout with inactivity detection
✅ Responsive dashboard layout

## Database Tables

- `users` - Admin and staff accounts
- `student` - Student information
- `clearance` - Clearance status records
- `audit_log` - Activity history

## Environment Variables

- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key (same as public/student app)

## Notes

- Requires authentication to access
- LIBRARY_ADMIN role required for admin functions
- Logs all clearance status changes
- Automatically saves draft changes
