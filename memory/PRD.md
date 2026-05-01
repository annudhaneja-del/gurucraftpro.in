# GurucraftPro — Product Requirements Document

## Original Problem Statement
Build a fully-functional, production-ready hybrid website + web app for **GurucraftPro**, a creative-services & digital-products business owned by **Annu Dhaneja** (Rohini, Delhi, India). It combines a services marketplace, a digital product shop, a learning hub, an admin-controlled CMS, and a Canva-style design editor. Theme: Neon Purple (#7c3aed) + Teal (#14b8a6) on dark background with Playfair Display + Outfit typography.

## Stack
- **Backend**: FastAPI + Motor(MongoDB) + JWT auth + Razorpay SDK
- **Frontend**: React 19 + React Router 7 + Tailwind + Shadcn/UI + html2canvas + jsPDF
- **Fonts**: Playfair Display (headings), Outfit (body)
- **Theme**: Dark (#05050A) + Neon Purple (#7c3aed) + Teal (#14b8a6)

## User Personas
1. **Local customer (Delhi-NCR)** — wants wedding invites, Guruji frames, quick WhatsApp response.
2. **Online buyer** — shops digital products/PDFs/prompts.
3. **Student / Learner** — consumes free + paid learning content.
4. **Creator / Designer** — uses the in-browser Canva-style design editor.
5. **Admin (Annu ji)** — manages everything via admin panel.

## Core Requirements (static)
- Hybrid: services + shop + learning + editor + admin
- WhatsApp-first CTA (wa.me deep links, pre-filled messages)
- Razorpay payments (UPI/Card/Wallet) — falls back to mock + WhatsApp confirmation if keys missing
- JWT auth (email/password) + seeded admin
- Full CRUD admin panel for everything
- Mobile-first, dark, asymmetric, premium local feel

## Implemented (2026-02-01)
### Backend (`/app/backend/server.py`)
- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- Services CRUD: `/api/services` (GET/POST/PUT/DELETE) + `/api/services/{slug}`
- Products CRUD with filters (category, query, price range)
- Testimonials, Gallery, Learning, Templates, Coupons — full CRUD
- Orders: `/api/orders` create, `/api/orders/me`, `/api/orders` (admin), status update
- Payments: `/api/payments/config`, `/api/payments/create-order`, `/api/payments/verify` (Razorpay + mock fallback)
- Contact form submission + admin inbox
- Saved Designs API (user-scoped)
- Admin analytics (`/api/admin/stats`, `/api/admin/users`)
- Auto-seeds admin (`admin@gurucraftpro.in` / `Gurucraftpro`), 6 services, 6 products, 4 testimonials, 7 gallery items, 4 learning items, 4 templates, 2 coupons on startup

### Frontend
- **Home**: 3D neon hero w/ floating tool badges + gradient headline + stats + asymmetric services bento grid + feature strip + gallery preview + testimonials + CTA
- **Services** + **Service Detail**: category filters, add-to-cart, WhatsApp CTA
- **Design Studio**: Canva-style editor — text/shape/image/upload, drag, resize, font/size/color, undo/redo, duplicate, layers, templates panel, canvas sizing, PNG/JPG/PDF export, save to account
- **Shop**: category + price + search filters, cart panel, checkout
- **Learn**: PDFs/courses/prompts, free + paid
- **Contact**: 4-tile contact cards + Google Map embed (Rohini) + form + WhatsApp CTA
- **Login/Signup**
- **Dashboard**: orders + saved designs + profile
- **Admin**: 11-tab panel — overview stats, Services/Products/Learning/Templates/Testimonials/Gallery/Coupons CRUD, Orders (with status updates), Messages, Users
- **Checkout**: coupon apply, Razorpay integration (mock fallback), WhatsApp order confirmation auto-message
- Sticky navbar + floating WhatsApp toggle + mobile menu + Sonner toasts

## Test Credentials
See `/app/memory/test_credentials.md`

## Prioritized Backlog (remaining)
### P1 (quality of life)
- Real Razorpay keys in `.env` (user to provide when going live)
- Email notifications via SendGrid/Resend
- WhatsApp Cloud API (Twilio) for auto notifications vs current deep-link
- Hindi/English i18n toggle
- Image upload to object storage for templates/products (currently URL-based)

### P2 (growth)
- SEO: meta tags per route, sitemap, schema.org markup
- Pagination for orders/users at scale
- Template marketplace + design sharing
- Coupon usage limits / expiry dates
- Order invoice PDF download
- Instagram gallery sync
