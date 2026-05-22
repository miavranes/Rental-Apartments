# Rentura — Apartment Rental Platform

A full-stack apartment rental web application built with React, Node.js/Express, and PostgreSQL. Inspired by Airbnb and Booking.com.

---

## Tech Stack

**Backend:** Node.js, Express, PostgreSQL, JWT, Stripe, Nodemailer, Multer  
**Frontend:** React 18, React Router, Axios, Leaflet/React-Leaflet, Lucide React

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Stripe account (for payments)
- Gmail account (for email verification)

### Backend Setup
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=5000
DB_USER=postgres
DB_HOST=localhost
DB_NAME=rental_apartments
DB_PASSWORD=your_password
DB_PORT=5432
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
```

Run database migrations:
```sql
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS lat NUMERIC(10,7);
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS lng NUMERIC(10,7);
```

Start backend:
```bash
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

---

## Project Structure

```
├── backend/
│   ├── config/db.js                  # PostgreSQL connection pool
│   ├── controllers/
│   │   ├── authController.js         # Register, login, verify email, profile
│   │   ├── apartmentsController.js   # Apartment CRUD, search, filtering
│   │   ├── reservationsController.js # Reservation management
│   │   ├── reviewsController.js      # Reviews & ratings
│   │   └── paymentsController.js     # Stripe payment intents & webhooks
│   ├── middleware/auth.js            # JWT authentication & role authorization
│   ├── routes/                       # Express route definitions
│   ├── utils/sendEmail.js            # Nodemailer email utility
│   ├── uploads/                      # Uploaded apartment images
│   └── server.js                     # Express app entry point
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Home.jsx              # Landing page with featured apartments
    │   │   ├── Login.jsx             # Login with password visibility toggle
    │   │   ├── Register.jsx          # Multi-step registration + email verify
    │   │   ├── Apartments.jsx        # Search results page
    │   │   ├── ApartmentDetail.jsx   # Full listing detail + booking panel
    │   │   ├── Owner.jsx             # Host dashboard (CRUD listings)
    │   │   └── Profile.jsx           # User profile + role switching
    │   ├── components/
    │   │   ├── ApartmentCard.jsx     # Listing preview card
    │   │   ├── SearchBar.jsx         # Multi-field search (location, dates, guests)
    │   │   ├── Calendar.jsx          # Custom date picker
    │   │   ├── MapView.jsx           # Leaflet map for apartment location
    │   │   └── PinMap.jsx            # Interactive map for pinning location
    │   ├── context/AuthContext.jsx   # Global auth state
    │   └── services/                 # API service layer (axios)
```

---

## Database Schema

```sql
users           -- id, name, email, password_hash, role, phone, profile_image,
                   verification_code, verification_code_expires, is_verified

apartments      -- id, owner_id, title, description, location, address,
                   max_guests, bedrooms, beds, price_per_night, lat, lng

apartment_images     -- id, apartment_id, image_url, sort_order, is_primary
amenities            -- id, name, icon
apartment_amenities  -- apartment_id, amenity_id (pivot)

reservations    -- id, apartment_id, user_id, check_in, check_out, guests,
                   total_price, status (pending/confirmed/cancelled/completed),
                   stripe_payment_id

blocked_dates   -- apartment_id, date
reviews         -- id, apartment_id, user_id, reservation_id, rating, comment
apartment_ratings    -- (materialized view) apartment_id, avg_rating, review_count
```

---

## API Routes

### Auth `/api/auth`
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/register` | Register new user | — |
| POST | `/login` | Login, returns JWT | — |
| POST | `/verify-email` | Verify email with 6-digit code | — |
| GET | `/me` | Get current user | ✓ |
| PUT | `/profile` | Update profile | ✓ |
| PATCH | `/switch-role` | Toggle tourist ↔ owner | ✓ |
| DELETE | `/account` | Delete account | ✓ |

### Apartments `/api/apartments`
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/` | List all (with filters) | — |
| GET | `/:id` | Single apartment detail | — |
| GET | `/my` | Owner's listings | Owner |
| POST | `/` | Create listing (multipart) | Owner |
| PUT | `/:id` | Update listing (multipart) | Owner |
| DELETE | `/:id` | Delete listing | Owner |

### Reservations `/api/reservations`
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/` | Create reservation | Tourist |
| GET | `/my` | My reservations | Tourist |
| GET | `/owner` | Reservations for my listings | Owner |
| PATCH | `/:id/confirm` | Confirm reservation | Owner |
| PATCH | `/:id/cancel` | Cancel reservation | Both |

### Reviews `/api/reviews`
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/apartment/:id` | Get reviews for apartment | — |
| POST | `/` | Create review (after completed stay) | Tourist |

### Payments `/api/payments`
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/create-intent` | Create Stripe payment intent | Tourist |
| POST | `/webhook` | Stripe webhook handler | — |

---

## Implemented Features

### Authentication
- [x] Register with email verification (6-digit code)
- [x] Login with JWT (7-day expiry)
- [x] Password show/hide toggle
- [x] Country dial code selector on registration
- [x] Role switching (Tourist ↔ Host)
- [x] Profile update (name, email, phone)
- [x] Account deletion

### Listings (Host)
- [x] Create / edit / delete listings
- [x] Multiple image upload
- [x] 10 amenities (WiFi, Parking, AC, Pool, Kitchen, Washer, TV, Pets, Grill, Balcony)
- [x] Location pinning on interactive map
- [x] Address with geocoded map display on detail page

### Search & Discovery
- [x] Search by location, check-in/out dates, guests
- [ ] Price range filter
- [ ] Date availability filter (blocked_dates)
- [x] Custom calendar picker (no native date input)
- [x] Search results page (`/apartments`)
- [x] Featured apartments on home page

### Apartment Detail
- [x] Photo gallery with lightbox (keyboard navigation ← →, Esc)
- [x] Amenities with Lucide icons
- [ ] Reviews with star ratings
- [x] Interactive map (Leaflet + OpenStreetMap)
- [ ] Booking panel (pre-filled from search, or manual calendar)
- [x] Price breakdown (nights × rate = total)

### Reservations
- [ ] Create reservation (tourist)
- [ ] View my reservations (tourist)
- [ ] View reservations for my listings (owner)
- [ ] Confirm / cancel reservation
- [ ] Status tracking (pending → confirmed → completed / cancelled)

### Payments
- [ ] Stripe payment intent creation
- [ ] Webhook handling (auto-confirm on payment success)

### Reviews
- [ ] Leave review after completed stay (one per reservation)
- [ ] Star rating (1–5)
- [ ] Materialized view for avg rating / review count

---

## Missing Features (Roadmap)

### High Priority
- [ ] **My Reservations page** — Tourist needs a dedicated `/reservations` page to view, track, and cancel bookings
- [ ] **Owner Reservations page** — Dedicated page for hosts to manage incoming bookings (confirm/cancel)
- [ ] **Booking confirmation email** — Send email to guest and host on reservation creation
- [ ] **Instant booking option** — Allow hosts to enable auto-confirm without manual approval
- [ ] **Availability calendar** — Visual calendar on listing detail showing blocked/available dates
- [ ] **Stripe payment UI** — Frontend payment form using Stripe Elements (currently only intent is created)
- [ ] **Cancellation policy** — Flexible / moderate / strict with refund rules

### Medium Priority
- [ ] **Messaging system** — Direct chat between guest and host
- [ ] **Wishlists / Favorites** — Save apartments to a list
- [ ] **Advanced filters** — Filter by amenities, property type, min rating, bedrooms
- [ ] **Host reviews guests** — Two-way review system
- [ ] **Weekly / monthly discounts** — Bulk pricing for longer stays
- [ ] **Cleaning fee** — Additional one-time charge per booking
- [ ] **Service fee** — Platform fee calculation (e.g. 10–15%)
- [ ] **Notifications** — In-app or email alerts (new booking, message, review)
- [ ] **Profile photo upload** — Avatar image for users
- [ ] **Password reset** — Forgot password flow via email

### Lower Priority
- [ ] **Admin dashboard** — User management, listing moderation, analytics
- [ ] **Host analytics** — Earnings, occupancy rate, booking trends
- [ ] **Superhost badge** — Recognition for top-rated hosts
- [ ] **Verified host badge** — ID verification indicator
- [ ] **Co-hosting** — Multiple hosts per property
- [ ] **Multi-language support** — i18n for international users
- [ ] **Accessibility** — WCAG compliance, screen reader support
- [ ] **Mobile responsive** — Full mobile layout optimization

### Technical Improvements
- [ ] **Rate limiting** — Prevent brute force and API abuse
- [ ] **Input validation** — Comprehensive server-side validation (Joi/Zod)
- [ ] **Error handling** — Consistent error response format
- [ ] **Logging** — Request/error logging (Winston/Morgan)
- [ ] **API documentation** — Swagger/OpenAPI spec
- [ ] **Unit & integration tests** — Jest + Supertest
- [ ] **Image optimization** — Resize/compress on upload, CDN delivery
- [ ] **Database indexes** — Performance optimization for search queries
- [ ] **Redis caching** — Cache apartment listings and search results
- [ ] **Environment config** — Separate dev/staging/prod configs
- [ ] **Docker** — Containerize backend + database
