# Aapki Rasoi - Restaurant Management SaaS

## Project Overview
- **Project Name**: Aapki Rasoi (Your Kitchen)
- **Type**: Multi-tenant Restaurant Management SaaS Platform
- **Core Functionality**: Complete restaurant management system with order tracking, billing, inventory, menu management, and comprehensive analytics
- **Target Users**: Restaurant Owners (Admins), Super Admin (Platform Owner)

---

## Technology Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Charts**: Recharts for analytics

---

## User Roles
1. **Super Admin** - Manages the SaaS platform, can add/view all restaurants
2. **Restaurant Owner (Admin)** - Manages their restaurant's operations

---

## UI/UX Specification

### Color Palette
- **Primary**: `#FF6B35` (Warm Orange - appetite stimulating)
- **Secondary**: `#1A1A2E` (Deep Navy)
- **Accent**: `#16C79A` (Fresh Green - for success states)
- **Background**: `#F8F9FA` (Light Gray)
- **Card Background**: `#FFFFFF`
- **Text Primary**: `#1A1A2E`
- **Text Secondary**: `#6B7280`
- **Danger**: `#EF4444`
- **Warning**: `#F59E0B`
- **Success**: `#10B981`

### Typography
- **Font Family**: 'Inter', 'Poppins', sans-serif
- **Headings**: Bold, 24px-32px
- **Body**: Regular, 14px-16px
- **Small Text**: 12px

### Layout Structure
- **Sidebar**: 250px fixed left sidebar with navigation
- **Header**: 60px top bar with user info and notifications
- **Content Area**: Fluid width, responsive grid
- **Cards**: White background, 8px border-radius, subtle shadow

### Responsive Breakpoints
- **Mobile**: < 768px (collapsed sidebar)
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

---

## Core Features

### 1. Authentication & Authorization
- Login page for Super Admin and Restaurant Owner
- JWT-based authentication
- Role-based access control
- Session management

### 2. Dashboard
- Quick stats cards (Today's Orders, Revenue, Pending Orders)
- Recent orders list
- Low stock alerts
- Quick action buttons

### 3. Order Management
- **Order Types**:
  - Dine In
  - Take Away
  - Delivery
- **Order Status**:
  - Pending
  - Preparing
  - Ready
  - Delivered
  - Cancelled
- Order creation with menu item selection
- Real-time order status updates
- Order history with filters

### 4. Billing System
- Generate bills from orders
- Edit bills (add/remove items)
- Tax calculation (GST support)
- Discount application (percentage/fixed)
- Split bills functionality
- Multiple payment methods (Cash, Card, UPI, Wallet)
- Bill preview and print
- Bill history

### 5. Menu Management
- Add/Edit/Delete menu categories
- Add/Edit/Delete menu items
- Item details: name, description, price, image, availability
- Category management
- Variant support (sizes, etc.)

### 6. Inventory Management
- Track ingredient quantities
- Low stock alerts
- Add/Edit inventory items
- Stock adjustment
- Alert threshold settings

### 7. Sales Reports
- **Daily Report**: Today's sales summary
- **Weekly Report**: Last 7 days analysis
- **Monthly Report**: Current month overview
- **Annual Report**: Yearly comprehensive report
- Charts and graphs visualization
- Filter by order type
- Top selling items
- Revenue breakdown by category

---

## Database Schema

### Users Collection
```
{
  _id: ObjectId,
  email: String,
  password: String (hashed),
  role: String (superadmin | admin),
  restaurantId: ObjectId (ref: restaurants),
  name: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Restaurants Collection
```
{
  _id: ObjectId,
  name: String,
  address: String,
  phone: String,
  logo: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Menu Categories Collection
```
{
  _id: ObjectId,
  restaurantId: ObjectId,
  name: String,
  description: String,
  isActive: Boolean,
  order: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Menu Items Collection
```
{
  _id: ObjectId,
  restaurantId: ObjectId,
  categoryId: ObjectId,
  name: String,
  description: String,
  price: Number,
  image: String,
  isAvailable: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Orders Collection
```
{
  _id: ObjectId,
  restaurantId: ObjectId,
  orderType: String (dine_in | take_away | delivery),
  status: String (pending | preparing | ready | delivered | cancelled),
  items: [{
    menuItemId: ObjectId,
    name: String,
    quantity: Number,
    price: Number,
    total: Number
  }],
  subtotal: Number,
  tax: Number,
  discount: Number,
  total: Number,
  customerName: String,
  tableNumber: String,
  paymentMethod: String,
  paymentStatus: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Bills Collection
```
{
  _id: ObjectId,
  restaurantId: ObjectId,
  orderId: ObjectId,
  billNumber: String,
  items: Array,
  subtotal: Number,
  tax: Number,
  discount: Number,
  total: Number,
  paymentMethod: String,
  createdAt: Date
}
```

### Inventory Collection
```
{
  _id: ObjectId,
  restaurantId: ObjectId,
  name: String,
  quantity: Number,
  unit: String,
  alertThreshold: Number,
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Endpoints

### Auth Routes
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register restaurant (superadmin)
- `GET /api/auth/me` - Get current user

### Restaurant Routes
- `GET /api/restaurants` - List all restaurants (superadmin)
- `POST /api/restaurants` - Create restaurant
- `GET /api/restaurants/:id` - Get restaurant details

### Menu Routes
- `GET /api/menu/categories` - Get categories
- `POST /api/menu/categories` - Create category
- `PUT /api/menu/categories/:id` - Update category
- `DELETE /api/menu/categories/:id` - Delete category
- `GET /api/menu/items` - Get menu items
- `POST /api/menu/items` - Create menu item
- `PUT /api/menu/items/:id` - Update menu item
- `DELETE /api/menu/items/:id` - Delete menu item

### Order Routes
- `GET /api/orders` - Get orders (with filters)
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order
- `PUT /api/orders/:id/status` - Update order status
- `DELETE /api/orders/:id` - Cancel order

### Bill Routes
- `GET /api/bills` - Get bills
- `POST /api/bills` - Create bill
- `GET /api/bills/:id` - Get bill details
- `PUT /api/bills/:id` - Edit bill

### Inventory Routes
- `GET /api/inventory` - Get inventory
- `POST /api/inventory` - Add item
- `PUT /api/inventory/:id` - Update item
- `DELETE /api/inventory/:id` - Delete item

### Reports Routes
- `GET /api/reports/daily` - Daily report
- `GET /api/reports/weekly` - Weekly report
- `GET /api/reports/monthly` - Monthly report
- `GET /api/reports/annual` - Annual report
- `GET /api/reports/top-items` - Top selling items
- `GET /api/reports/low-stock` - Low stock items

---

## Pages Structure

### Public Pages
1. **Login Page** - `/login`

### Protected Pages (Super Admin)
2. **Super Admin Dashboard** - `/superadmin`
3. **Manage Restaurants** - `/superadmin/restaurants`

### Protected Pages (Restaurant Admin)
4. **Dashboard** - `/admin`
5. **Orders** - `/admin/orders`
6. **New Order** - `/admin/orders/new`
7. **Billing** - `/admin/bills`
8. **Menu Management** - `/admin/menu`
9. **Inventory** - `/admin/inventory`
10. **Reports** - `/admin/reports`
11. **Settings** - `/admin/settings`

---

## Acceptance Criteria

### Authentication
- [ ] Users can log in with email and password
- [ ] JWT tokens are properly validated
- [ ] Role-based access is enforced

### Order Management
- [ ] Can create orders with menu items
- [ ] Can filter by order type (Dine In, Take Away, Delivery)
- [ ] Can update order status
- [ ] Order history is visible

### Billing
- [ ] Can generate bill from order
- [ ] Can edit bill (add/remove items)
- [ ] Tax is calculated correctly
- [ ] Discounts are applied properly
- [ ] Split bills work correctly

### Menu Management
- [ ] Can create/edit/delete categories
- [ ] Can create/edit/delete menu items
- [ ] Items can be marked as available/unavailable

### Inventory
- [ ] Can add inventory items
- [ ] Low stock alerts are shown
- [ ] Can update quantities

### Reports
- [ ] Daily report shows today's sales
- [ ] Weekly report shows last 7 days
- [ ] Monthly report shows current month
- [ ] Annual report shows yearly data
- [ ] Charts are displayed correctly

---

## Project Structure
```
aapki-rasoi/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Restaurant.js
│   │   ├── MenuCategory.js
│   │   ├── MenuItem.js
│   │   ├── Order.js
│   │   ├── Bill.js
│   │   └── Inventory.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── restaurants.js
│   │   ├── menu.js
│   │   ├── orders.js
│   │   ├── bills.js
│   │   ├── inventory.js
│   │   └── reports.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```
