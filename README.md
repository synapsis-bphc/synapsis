# Synapsis — Official Website

Website for **Synapsis**, the Biology & Technology club of BITS Pilani, Hyderabad Campus.  
Live at: **[https://synapsis-site.vercel.app/]**,**[https://synapsis-bphc.vercel.app]**

> 🚀 **Deployed on Vercel** — the Vercel project is managed under the club email **bios@hyderabad.bits-pilani.ac.in**. Contact any senior member or log in with that account to access deployment settings, environment variables, and domain configuration.

---

## Deployment

The site is deployed on **Vercel** and is live at **[synapsis-bphc.vercel.app](https://synapsis-bphc.vercel.app)**.

- Every push to `main` triggers a new deployment automatically.
- A `vercel.json` file handles SPA routing (all routes rewrite to `index.html`).
- The Vercel project is owned and accessible via the club email **bios@hyderabad.bits-pilani.ac.in**.
- To manage deployments, environment variables, or domain settings — log in to [vercel.com](https://vercel.com) with the club email.

---

## Authentication Notes

### Google OAuth
Google Sign-In for the admin portal is configured via **Google Cloud Console** using the club email:

> **bios@hyderabad.bits-pilani.ac.in**

If you need to update OAuth redirect URIs, authorised domains, or client credentials, log in to [console.cloud.google.com](https://console.cloud.google.com) with that account.

### Supabase Auth
Email/password login is managed through the Supabase dashboard. Role assignments are stored in the `user_roles` table and checked server-side via RLS policies.

---

## What's Inside

### Public Pages
| Page | Route | Description |
|------|-------|-------------|
| **Home** | `/` | Hero slideshow, upcoming seminars & events, current members, gallery preview, Instagram section |
| **Gallery** | `/gallery` | Full photo gallery with lazy loading — click any photo to view it with description |
| **All Members** | `/all-members` | All members grouped by year with position filter and lazy loading |
| **All Events** | `/events` | Upcoming and past events archive with lazy loading |
| **Seminars** | `/seminars` | Upcoming and archived seminars with search and lazy loading |
| **Projects** | `/projects` | Club projects listing |
| **Resources** | `/resources` | Resources for members |

### Admin Portal (`/admin`)
Role-based admin dashboard. Login with Google or email/password.

| Section | What you can do |
|---------|-----------------|
| **Members** | Add / edit / delete members, upload photos |
| **Seminars** | Add / edit / delete seminars, mark upcoming |
| **Events** | Add / edit / delete events, mark upcoming |
| **Gallery** | Bulk upload images with optional descriptions, edit descriptions on existing images, delete |
| **Projects** | Manage club projects |
| **Users** | Assign roles to admin users |
| **Profile** | Edit your own admin profile |

### Key Features
- 🖼️ **Photo lightbox** — click any gallery image to see it full-size with description; close with ✕, Escape, or clicking outside
- 📜 **Lazy loading** — members, events, seminars, and gallery all load progressively as you scroll
- 🔍 **Instant search** — seminars page search works across all data instantly (data fetched upfront)
- 🌙 **Dark mode** supported
- 📱 **Fully responsive** (mobile hamburger menu)
- ⚡ **Smooth scroll** navigation — navbar items scroll to home page sections directly

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui (Radix UI) |
| Backend / Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage (`member-photos` bucket) |
| Auth | Supabase Auth (email + Google OAuth) |
| Routing | React Router v6 |
| Data Fetching | TanStack Query + Supabase JS client |
| Icons | Lucide React |
| Deployment | Vercel |

---

## Running Locally

### Prerequisites
- Node.js ≥ 18
- npm

### 1. Clone the repo
```bash
git clone https://github.com/synapsis-bphc/synapsis.git
cd synapsis
```

### 2. Get Supabase credentials
The project uses a live Supabase backend.  
**Ask any senior member for the `.env` file** — they'll have it ready to share.

### 3. Create a `.env` file in the project root
```env
VITE_SUPABASE_URL="https://<your-project-ref>.supabase.co"
VITE_SUPABASE_ANON_KEY="<your-anon-key>"
```

### 4. Install dependencies
```bash
npm install
```

### 5. Start the dev server
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Other commands
```bash
npm run build      # Production build
npm run preview    # Preview the production build locally
npm run lint       # Run ESLint
```

---


## Database (Supabase)

Main tables:

| Table | Purpose |
|-------|---------|
| `members` | Club members (name, position, year, photo, socials) |
| `lectures` | Seminars / talks |
| `events` | Club events |
| `gallery` | Gallery images (url + optional description) |
| `projects` | Club projects |
| `user_roles` | Admin role assignments |

Row Level Security (RLS) is enabled. Admin actions require authenticated users with appropriate roles (`admin`, `gallery_editor`, `members_editor`, etc.).

---

## Project Structure

```
src/
├── components/
│   ├── admin/          # Admin dashboard sections
│   └── ui/             # shadcn/ui primitives
├── integrations/
│   └── supabase/       # Supabase client & types
├── pages/              # Route-level page components
├── hooks/              # Custom React hooks
└── lib/                # Utility functions
```

---

## Made By

**Ranjit Choudhary**  
📧 [ranjit.choudhary0123@gmail.com](mailto:ranjit.choudhary0123@gmail.com)  
🌐 [ranjit.cc](https://ranjit.cc)
