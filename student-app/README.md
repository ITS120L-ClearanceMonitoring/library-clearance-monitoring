# Student Portal App

This is a separate React application for managing student clearance requests. It shares the same Supabase backend as the admin application but operates independently.

## Setup

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Installation

1. Navigate to the student-app directory:
```bash
cd student-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Development

To run the student app in development mode:

```bash
npm run dev
```

The app will be available at `http://localhost:5174`

### Running Both Apps Simultaneously

From the root directory, run both the admin app and student app together:

```bash
npm run dev:all
```

This uses `concurrently` to run both apps side-by-side:
- Admin app: `http://localhost:5173`
- Student app: `http://localhost:5174`

## Build

To build the student app for production:

```bash
npm run build
```

Build artifacts will be in the `dist/` directory.

## Deployment

The student app can be deployed independently to:
- Vercel
- Netlify
- Any static hosting service
- A separate subdomain of your main site

Configure your deployment to:
1. Run `npm install` during the build step
2. Run `npm run build` as the build command
3. Point to the `dist/` directory as the output

## Environment Variables

The student app requires the following environment variables:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

These should be the **same** values used in the admin application to ensure both apps connect to the same database.

## Architecture

The student app:
- **Does NOT** require authentication (public access)
- **Does NOT** use React Router (single page form)
- **DOES** use the same Supabase backend as the admin app
- Includes offline support with localStorage queueing
- Is fully independent and can be deployed separately

## File Structure

```
student-app/
├── src/
│   ├── components/
│   │   ├── StudentLoggingForm.jsx
│   │   └── ui/
│   │       └── Button.jsx
│   ├── pages/
│   │   └── StudentPortalPage.jsx
│   ├── services/
│   │   ├── clearanceService.js
│   │   └── supabaseClient.js
│   ├── data/
│   │   ├── programs.js
│   │   └── purpose.js
│   ├── styles/
│   │   ├── main.css
│   │   └── student-log.css
│   ├── StudentApp.jsx
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
└── .env.example
```

## Features

- Student clearance request form
- Offline form submission with automatic sync
- Program and purpose selection
- Form validation
- Shared Supabase backend
