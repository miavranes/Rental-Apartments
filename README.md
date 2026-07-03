# Rentura — Apartment Rental Platform

A full-stack apartment rental web application built with React, Node.js/Express, and PostgreSQL. Inspired by Airbnb and Booking.com.

---

## Tech Stack

**Backend:** Node.js, Express, PostgreSQL, JWT, Stripe, Nodemailer, Multer  
**Frontend:** React 18, React Router, Axios, Leaflet/React-Leaflet, Lucide React, Stripe Elements

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

Create and seed the database (PostgreSQL must be running):
```bash
createdb rental_apartments
psql -U postgres -d rental_apartments -f backend/db/schema.sql
psql -U postgres -d rental_apartments -f backend/db/seedAmenities.sql
```

Or in **pgAdmin**: create database `rental_apartments`, then run both SQL files in Query Tool.

Start backend:
```bash
cd backend
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

Create `frontend/.env`:
```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## Project Structure

```
├── backend/
│   ├── config/db.js
│   ├── db/
│   │   ├── schema.sql              # Full database schema
│   │   └── seedAmenities.sql       # Default amenities (19 types)
│   ├── controllers/
│   │   ├── authController.js       # Register, login, verify, forgot/reset password
│   │   ├── apartmentsController.js # Apartment CRUD, search, images
│   │   ├── blockedDatesController.js # Date blocking (owner availability)
│   │   ├── reservationsController.js # Reservations + auto-block dates
│   │   ├── reviewsController.js    # Reviews & ratings
│   │   └── paymentsController.js   # Stripe payment intents & webhooks
│   ├── middleware/auth.js
│   ├── routes/
│   ├── utils/sendEmail.js          # Verification, reservation, password reset emails
│   ├── uploads/
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── ForgotPassword.jsx
    │   │   ├── ResetPassword.jsx
    │   │   ├── Apartments.jsx        # Search + filter sidebar
    │   │   ├── ApartmentDetail.jsx   # Gallery, booking, map, reviews
    │   │   ├── MyReservations.jsx    # Tourist: view/cancel/review bookings
    │   │   ├── OwnerReservations.jsx # Host: confirm/decline bookings
    │   │   ├── Owner.jsx             # Host dashboard + availability calendar
    │   │   └── Profile.jsx
    │   ├── components/
    │   │   ├── Navbar.jsx            # Shared navigation bar
    │   │   ├── ApartmentCard.jsx
    │   │   ├── SearchBar.jsx
    │   │   ├── Calendar.jsx          # Date picker + blocked dates display
    │   │   ├── MapView.jsx           # Leaflet map (geocoded or pinned)
    │   │   └── PinMap.jsx
    │   ├── context/AuthContext.jsx
    │   └── services/
    │       ├── api.js
    │       ├── authService.js
    │       ├── apartmentService.js
    │       ├── reservationService.js
    │       ├── reviewService.js
    │       └── paymentService.js
```

---

## Database Schema

```sql
users           -- id, name, email, password_hash, role, phone, profile_image,
                   verification_code, verification_code_expires, is_verified,
                   reset_token, reset_token_expires

apartments      -- id, owner_id, title, description, location, address,
                   municipality, country, max_guests, bedrooms, beds,
                   price_per_night, lat, lng

apartment_images     -- id, apartment_id, image_url, sort_order, is_primary
amenities            -- id, name, icon
apartment_amenities  -- apartment_id, amenity_id (pivot)

reservations    -- id, apartment_id, user_id, check_in, check_out, guests,
                   total_price, payment_method (on_arrival|online), status
                   (pending|confirmed|cancelled|completed), stripe_payment_id

blocked_dates   -- apartment_id, date (PRIMARY KEY — auto-populated on booking)
reviews         -- id, apartment_id, user_id, reservation_id, rating, comment
apartment_ratings    -- (materialized view) apartment_id, avg_rating, review_count
```

---

## API Routes

### Auth `/api/auth`
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/register` | Register + send email verification code | — |
| POST | `/verify-email` | Verify email with 6-digit code | — |
| POST | `/login` | Login, returns JWT | — |
| POST | `/forgot-password` | Send password reset email | — |
| POST | `/reset-password` | Reset password with token | — |
| GET | `/me` | Get current user | ✓ |
| PUT | `/profile` | Update name, email, phone | ✓ |
| PATCH | `/switch-role` | Toggle tourist ↔ owner | ✓ |
| DELETE | `/account` | Delete account | ✓ |

### Apartments `/api/apartments`
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/` | List all (location, price, guests, dates, amenities filters) | — |
| GET | `/:id` | Single apartment with images, amenities | — |
| GET | `/my` | Owner's listings | Owner |
| POST | `/` | Create listing (multipart/form-data) | Owner |
| PUT | `/:id` | Update listing | Owner |
| DELETE | `/:id` | Delete listing | Owner |
| DELETE | `/:id/images/:imageId` | Delete single image | Owner |
| GET | `/:id/blocked-dates` | Get blocked dates for apartment | — |
| POST | `/:id/blocked-dates` | Block dates manually | Owner |
| DELETE | `/:id/blocked-dates` | Unblock dates | Owner |

### Reservations `/api/reservations`
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/` | Create reservation (auto-blocks dates) | Tourist |
| GET | `/my` | Tourist's reservations | Tourist |
| GET | `/owner` | Owner's incoming reservations | Owner |
| PATCH | `/:id/confirm` | Confirm reservation | Owner |
| PATCH | `/:id/cancel` | Cancel (auto-unblocks dates) | Both |

### Reviews `/api/reviews`
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/apartment/:id` | Get reviews for apartment | — |
| POST | `/` | Create review (completed stays only, once per stay) | Tourist |

### Payments `/api/payments`
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/create-intent` | Create Stripe PaymentIntent | Tourist |
| POST | `/webhook` | Stripe webhook (auto-confirms on success) | — |

---

## Implemented Features

### Authentication
- [x] Register with email verification (6-digit code, 10 min expiry)
- [x] Login with JWT (7-day expiry)
- [x] Password show/hide toggle
- [x] Country dial code selector on registration
- [x] Forgot password — email with reset link
- [x] Reset password — secure token flow
- [x] Role switching (Tourist ↔ Host)
- [x] Profile update (name, email, phone)
- [x] Account deletion

### Listings (Host)
- [x] Create / edit / delete listings
- [x] Multiple image upload with previews
- [x] Delete individual existing images in edit mode
- [x] 19 amenities (WiFi, Parking, AC, Pool, Kitchen, Washer, TV, Pets, Grill, Balcony, Spa, Gym, Room Service, Sea View, Mountain View, Kettle, Breakfast, Lunch, Dinner)
- [x] "All Meals" shown when all three meal options selected
- [x] Location pinning on interactive map (Leaflet)
- [x] Availability calendar — owner can block/unblock individual dates

### Search & Discovery
- [x] Search by location, check-in/out dates, guests
- [x] Filter sidebar: price range, bedrooms, min rating, pet friendly, amenities
- [x] Apply / Clear filters with "filters active" indicator
- [x] Custom calendar picker (no native browser date input)
- [x] Search results page with result count
- [x] Featured apartments on home page (sorted by rating)

### Apartment Detail
- [x] Photo gallery with thumbnail strip and lightbox
- [x] Lightbox: keyboard navigation (← →, Esc)
- [x] Amenities with Lucide icons, English labels
- [x] Reviews with star ratings and guest avatars
- [x] Interactive map (pinned coordinates or geocoded address)
- [x] Touchpad / scroll zoom on map
- [x] Booking panel pre-filled from search bar (check-in, check-out, guests)
- [x] "Change dates" button to open calendar
- [x] Blocked dates shown in red with strikethrough in calendar
- [x] Payment method selector: Pay on arrival / Pay online (Stripe)
- [x] Price breakdown (nights × rate = total)
- [x] Owner cannot book their own listing
- [x] Stripe card payment with CardElement

### Reservations
- [x] Create reservation (tourist only)
- [x] Dates auto-blocked on booking, auto-unblocked on cancel
- [x] My Reservations page — view all bookings, status badges
- [x] Cancel reservation (pending or confirmed)
- [x] Leave review after completed stay
- [x] Owner Reservations page — confirm or decline bookings
- [x] Filter by status (all / pending / confirmed / cancelled / completed)
- [x] Guest contact details visible to host (email, phone)
- [x] Stats summary (count per status)

### Payments
- [x] Stripe PaymentIntent creation
- [x] Frontend CardElement via @stripe/react-stripe-js
- [x] Webhook auto-confirms reservation on payment success
- [x] Pay on arrival option (no Stripe)

### Reviews
- [x] Leave review after completed stay (one per reservation)
- [x] Star rating (1–5) with visual picker
- [x] Materialized view for avg rating and review count
- [x] Review badge on ApartmentCard

### Navigation
- [x] Shared Navbar component used on all pages
- [x] Active link highlighting
- [x] Role-based links (tourist sees "My Bookings", host sees "My Listings" + "Bookings")

---

## Missing / Roadmap

### Medium Priority
- [ ] **Messaging** — Direct chat between guest and host
- [ ] **Wishlists** — Save apartments to a favourites list
- [ ] **Profile photo upload** — Avatar image upload for users
- [ ] **Weekly / monthly discounts** — Bulk pricing for longer stays
- [ ] **Cleaning fee** — One-time charge per booking
- [ ] **Service fee** — Platform fee added to total

### Lower Priority
- [ ] **Admin dashboard** — User management, listing moderation, analytics
- [ ] **Host analytics** — Earnings, occupancy rate, booking trends
- [ ] **Mobile responsive** — Full mobile layout optimization
- [ ] **Multi-language** — i18n support

### Technical
- [ ] **Rate limiting** — Brute force protection
- [ ] **Server-side input validation** — Joi/Zod schemas
- [ ] **Unit & integration tests** — Jest + Supertest
- [ ] **Docker** — Containerize backend + database
