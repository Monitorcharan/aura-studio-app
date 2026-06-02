# Appointment Booking System

A comprehensive Flask-based appointment booking application with user authentication, service management, and appointment scheduling features. Similar structure to the existing Flask-CRT project.

## 📁 Project Structure

```
appointment-booking/
├── app.py                          # Main Flask application
├── config.py                       # Database configuration
├── requirements.txt                # Python dependencies
├── .env                           # Environment variables
├── controllers/
│   ├── authController.py          # User registration & login
│   ├── appointmentController.py   # Appointment CRUD & slot management
│   └── serviceController.py       # Service management
├── routes/
│   ├── authRoutes.py             # Authentication endpoints
│   ├── appointmentRoutes.py      # Appointment endpoints
│   └── serviceRoutes.py          # Service endpoints
├── middlewares/
│   └── authMiddleware.py         # JWT token verification
├── templates/
│   ├── booking.html              # User booking interface
│   └── admin_dashboard.html      # Admin management panel
└── utils/
    └── jwtHelper.py              # JWT token utilities
```

## 🚀 Features

### User Management
- User registration and login
- Password hashing with bcrypt
- JWT-based authentication
- User profile management

### Service Management
- Create, read, update, delete services
- Service pricing and duration
- Service descriptions

### Appointment Booking
- Book appointments with available time slots
- View all user appointments
- Update appointment details
- Cancel appointments
- Check available time slots
- Conflict prevention (no double booking)

### Admin Dashboard
- Manage services
- View all appointments
- Filter appointments by date
- Responsive design

## 🛠️ Installation

1. **Clone or navigate to the project directory:**
```bash
cd appointment-booking
```

2. **Create a virtual environment:**
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables:**
Edit `.env` file:
```
MONGO_URI=mongodb://localhost:27017/
JWT_SECRET=your_jwt_secret_key_here
```

5. **Ensure MongoDB is running:**
```bash
# Make sure MongoDB service is active
mongod
```

6. **Run the application:**
```bash
python app.py
```

The API will be available at `http://localhost:5000`

## 📡 API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - Login user
- `POST /api/profile` - Get user profile (requires token)

### Services
- `GET /api/services` - Get all services
- `POST /api/services` - Create new service
- `GET /api/services/<service_id>` - Get service details
- `PUT /api/services/<service_id>` - Update service
- `DELETE /api/services/<service_id>` - Delete service

### Appointments
- `POST /api/appointments/book` - Book new appointment (requires token)
- `GET /api/appointments` - Get user appointments (requires token)
- `GET /api/appointments/<appointment_id>` - Get appointment details (requires token)
- `PUT /api/appointments/<appointment_id>` - Update appointment (requires token)
- `POST /api/appointments/<appointment_id>/cancel` - Cancel appointment (requires token)
- `GET /api/appointments/available-slots?date=YYYY-MM-DD` - Get available time slots

## 🔐 Authentication

The system uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## 💾 Database Collections

### users
```json
{
  "_id": ObjectId,
  "name": "string",
  "email": "string",
  "password": "hashed_string",
  "phone": "string"
}
```

### services
```json
{
  "_id": ObjectId,
  "name": "string",
  "description": "string",
  "duration_minutes": number,
  "price": number
}
```

### appointments
```json
{
  "_id": ObjectId,
  "user_id": ObjectId,
  "service_id": ObjectId,
  "appointment_date": "YYYY-MM-DD",
  "appointment_time": "HH:MM",
  "notes": "string",
  "status": "pending|confirmed|cancelled",
  "created_at": ISODate,
  "updated_at": ISODate
}
```

## 🎨 Frontend Pages

### Booking Page (`/booking-page`)
- Service selection dropdown
- Date picker (min date is today)
- Available time slot selection (9 AM to 4:30 PM)
- Notes field
- Real-time availability checking

### Admin Dashboard (`/admin-dashboard`)
- Service management panel
- Add new services
- Edit/delete services
- Appointment viewing
- Date filtering

## ⏰ Available Time Slots

The system provides the following time slots (12-hour format):
- 09:00, 09:30, 10:00, 10:30, 11:00, 11:30
- 14:00 (2 PM), 14:30 (2:30 PM), 15:00 (3 PM), 15:30 (3:30 PM), 16:00 (4 PM), 16:30 (4:30 PM)

## 📝 Example Usage

### 1. Register a User
```bash
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "1234567890"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 3. Create a Service
```bash
curl -X POST http://localhost:5000/api/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Haircut",
    "description": "Professional haircut service",
    "duration_minutes": 30,
    "price": 25.00
  }'
```

### 4. Book an Appointment
```bash
curl -X POST http://localhost:5000/api/appointments/book \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "user_id": "user_id_here",
    "service_id": "service_id_here",
    "appointment_date": "2026-06-15",
    "appointment_time": "10:00",
    "notes": "First time customer"
  }'
```

### 5. Check Available Slots
```bash
curl http://localhost:5000/api/appointments/available-slots?date=2026-06-15
```

## 🔧 Configuration

Edit the following files as needed:

- **config.py** - Database connection
- **.env** - Environment variables
- **requirements.txt** - Python packages
- **app.py** - Flask routes and initialization

## 🐛 Error Handling

The API returns proper HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad request
- `401` - Unauthorized
- `404` - Not found
- `409` - Conflict (e.g., time slot already booked)

## 📦 Dependencies

- Flask - Web framework
- PyMongo - MongoDB driver
- PyJWT - JWT token handling
- bcrypt - Password hashing
- python-dotenv - Environment variables

## 🎯 Future Enhancements

- Email notifications for appointments
- SMS reminders
- Appointment rescheduling
- Customer reviews and ratings
- Staff/employee management
- Calendar view with drag-and-drop
- Payment integration
- Multiple language support

## 📄 License

MIT License - Feel free to use this project for any purpose.

---

**Note:** This system uses the same architectural patterns as the Flask-CRT project, making it easy to integrate or modify.
