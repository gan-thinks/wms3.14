# Workforce Management System

A comprehensive workforce management system built with Node.js, Express, MongoDB, and React. This system provides complete HR management capabilities including employee management, attendance tracking, leave management, payroll processing, and detailed reporting.

## Features

### 🏢 Employee Management
- Complete employee profiles with personal and professional information
- Department and role management
- Employee status tracking (Active, Inactive, On Leave, Terminated)
- Skills and education tracking
- Document management
- Profile picture upload

### ⏰ Attendance Management
- Check-in/check-out functionality
- Break time tracking
- Overtime calculation
- Multiple check-in methods (Manual, QR Code, Biometric, Mobile App)
- Location tracking
- Attendance reports and analytics

### 📅 Leave Management
- Multiple leave types (Annual, Sick, Personal, Maternity, Paternity, etc.)
- Leave request workflow with approval system
- Leave balance tracking
- Half-day leave support
- Emergency contact information

### 💰 Payroll Management
- Automated payroll generation
- Salary components (Basic, Allowances, Deductions, Overtime)
- Tax and insurance calculations
- Bonus and incentive management
- Payment status tracking
- Payroll reports and analytics

### 🏗️ Department Management
- Organizational structure management
- Department hierarchy
- Budget allocation
- Employee count tracking
- Department-wise reporting

### 📊 Reporting & Analytics
- Real-time dashboard with key metrics
- Attendance reports (daily, monthly, employee-wise)
- Leave analytics
- Payroll reports
- Employee statistics
- Department-wise analytics

### 🔐 Security & Authentication
- JWT-based authentication
- Role-based access control (Employee, Manager, HR, Admin)
- Password management
- Session management
- API rate limiting

## Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **multer** - File uploads
- **nodemailer** - Email functionality
- **helmet** - Security middleware
- **cors** - Cross-origin resource sharing

### Frontend
- **React** - UI library
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **React Hook Form** - Form management
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Recharts** - Charts and graphs
- **React Hot Toast** - Notifications
- **Axios** - HTTP client

## Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v14 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn**

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd workforce-management-system
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Environment Setup**
   
   Create a `.env` file in the root directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/workforce-management
   JWT_SECRET=your-super-secret-jwt-key-here
   ```

5. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running on your system
   mongod
   ```

6. **Run the application**

   **Development mode (with hot reload):**
   ```bash
   # Terminal 1 - Start backend
   npm run dev
   
   # Terminal 2 - Start frontend
   cd client
   npm start
   ```

   **Production mode:**
   ```bash
   # Build frontend
   cd client
   npm run build
   cd ..
   
   # Start production server
   npm start
   ```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/change-password` - Change password

### Employee Endpoints
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Create new employee
- `GET /api/employees/:id` - Get employee by ID
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Deactivate employee

### Attendance Endpoints
- `POST /api/attendance/check-in` - Employee check-in
- `POST /api/attendance/check-out` - Employee check-out
- `GET /api/attendance/my-attendance` - Get personal attendance
- `GET /api/attendance/employee/:id` - Get employee attendance

### Leave Endpoints
- `POST /api/leaves` - Request leave
- `GET /api/leaves/my-leaves` - Get personal leaves
- `GET /api/leaves/pending` - Get pending leaves
- `PUT /api/leaves/:id/approve` - Approve/reject leave

### Payroll Endpoints
- `POST /api/payroll/generate` - Generate payroll
- `GET /api/payroll/employee/:id` - Get employee payroll
- `GET /api/payroll/period/:month/:year` - Get period payroll

### Department Endpoints
- `GET /api/departments` - Get all departments
- `POST /api/departments` - Create department
- `PUT /api/departments/:id` - Update department

### Reports Endpoints
- `GET /api/reports/dashboard` - Dashboard overview
- `GET /api/reports/attendance/:type` - Attendance reports
- `GET /api/reports/leaves/:type` - Leave reports
- `GET /api/reports/payroll/:type` - Payroll reports

## Database Schema

### Employee
- Personal information (name, email, phone, address)
- Professional details (position, department, salary)
- Employment details (hire date, status, type)
- Skills, education, work experience
- Emergency contacts

### Attendance
- Check-in/check-out times
- Break tracking
- Work hours calculation
- Overtime tracking
- Location data

### Leave
- Leave type and duration
- Approval workflow
- Emergency contacts
- Document attachments

### Payroll
- Salary components
- Allowances and deductions
- Overtime calculations
- Payment status

### Department
- Department information
- Hierarchy management
- Budget allocation
- Employee count

## User Roles

### Employee
- View personal profile
- Check-in/check-out
- Request leaves
- View attendance history
- View payroll information

### Manager
- All Employee permissions
- View team attendance
- Approve team leaves
- View team reports

### HR
- All Manager permissions
- Manage employees
- Manage departments
- Generate reports
- Process payroll

### Admin
- All HR permissions
- System configuration
- User management
- Advanced analytics

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## Roadmap

- [ ] Mobile application
- [ ] Biometric integration
- [ ] Advanced analytics
- [ ] Email notifications
- [ ] Document management system
- [ ] Performance reviews
- [ ] Training management
- [ ] Recruitment module
- [ ] Time tracking
- [ ] Project management integration 
