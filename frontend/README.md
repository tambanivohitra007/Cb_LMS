# CBLMS Frontend

A React frontend for the Competency-Based Learning Management System.

## Features

- Modern React application using functional components and hooks
- Responsive design with Tailwind CSS
- Role-based access control (Student/Teacher views)
- Real-time data visualization with Chart.js
- JWT-based authentication
- Assignment submission functionality
- Class management for teachers
- Soft delete (trash) functionality

## Recent Improvements

### 🔧 **API Integration Fixes:**
- **Response Format Handling**: Updated to handle the new backend API response format with `{success: true, data: ...}`
- **Error Handling**: Enhanced error handling to work with structured error responses
- **Token Management**: Improved token validation and automatic logout on token expiration
- **Loading States**: Added proper loading indicators throughout the application

### 🛡️ **Security Enhancements:**
- **Axios Interceptors**: Enhanced request/response interceptors for better error handling
- **Token Expiration**: Automatic redirect to login on token expiration
- **Input Validation**: Client-side validation for forms

### 🚀 **User Experience Improvements:**
- **Assignment Submissions**: Full implementation of assignment submission functionality for students
- **Create Classes**: Complete class creation form for teachers
- **Error Messages**: User-friendly error messages and success notifications
- **Loading Indicators**: Consistent loading states across all components
- **Empty States**: Proper handling of empty data states

### 📱 **UI/UX Enhancements:**
- **Better Navigation**: Fixed navigation links to use React Router properly
- **Form Validation**: Client-side validation with proper feedback
- **Responsive Design**: Improved mobile responsiveness
- **Status Indicators**: Clear status indicators for submissions and competencies

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   - The frontend is configured to connect to the backend at `http://localhost:5000`
   - Make sure the backend server is running before starting the frontend

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── App.jsx                 # Main app component with routing and auth context
├── main.jsx               # Application entry point
├── index.css              # Global styles
└── pages/
    ├── LoginPage.jsx          # User authentication
    ├── StudentDashboard.jsx   # Student dashboard with assignments
    ├── TeacherDashboard.jsx   # Teacher dashboard with statistics
    ├── ClassManagement.jsx    # Class CRUD operations (Teacher)
    ├── StudentManagement.jsx  # Student enrollment management (Teacher)
    ├── AssignmentManagement.jsx # Assignment CRUD operations (Teacher)
    ├── UserManagement.jsx     # User CRUD operations (Admin)
    ├── Trash.jsx             # Soft delete management (Teacher)
    └── Profile.jsx           # User profile management
```

## Key Features by Role

### Student Features:
- **Dashboard**: View enrolled classes and assignments
- **Assignment Submission**: Submit work for assignments
- **Progress Tracking**: Visual competency status with charts
- **Submission Status**: View submission status (In Progress, Achieved, Mastered)

### Teacher Features:
- **Dashboard**: Overview statistics (students, classes, competencies)
- **Class Management**: Create, view, edit, and delete classes
- **Student Management**: Add and remove students from classes with dedicated interface
- **Assignment Management**: Create, view, edit, and delete assignments for each class
- **Assignment Overview**: View all assignments and submission counts
- **Competency Tracking**: Define competencies for each assignment
- **Trash Management**: Restore or permanently delete classes

### Admin Features:
- **User Management**: Full CRUD operations for all users (students, teachers, admins)
- **Role Management**: Assign and modify user roles
- **System Overview**: Access to all system data and user management

## Demo Accounts

After the backend is seeded, you can use these accounts:

**Teacher Account:**
- Email: `teacher@demo.com`
- Password: `password`

**Student Account:**
- Email: `student@demo.com`
- Password: `password`

## Technology Stack

- **React 18** - Frontend framework
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client
- **Chart.js + react-chartjs-2** - Data visualization
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Build tool and development server

## Development Notes

- The application uses React Context for authentication state management
- All API calls are made through a configured Axios instance with interceptors
- The frontend automatically handles token refresh and authentication errors
- Charts are rendered using Chart.js for competency status visualization

## API Endpoints Used

- `POST /api/auth/login` - User authentication
- `GET /api/classes` - Fetch classes (filtered by role)
- `GET /api/users` - Fetch users (admin only)
- `GET /api/competencies/status` - Fetch competency status (student only)
- `POST /api/classes` - Create new class (teacher only)
- `PUT /api/classes/:id` - Update class (teacher only)
- `DELETE /api/classes/:id` - Delete class (teacher only)
- `GET /api/classes/:classId/students` - Get students in class (teacher only)
- `GET /api/classes/:classId/available-students` - Get available students (teacher only)
- `POST /api/classes/:classId/students` - Add student to class (teacher only)
- `DELETE /api/classes/:classId/students/:studentId` - Remove student from class (teacher only)
- `GET /api/classes/:classId/assignments` - Get assignments for a class (teacher only)
- `POST /api/assignments` - Create assignment (teacher only)
- `PUT /api/assignments/:id` - Update assignment (teacher only)
- `DELETE /api/assignments/:id` - Delete assignment (teacher only)
- `POST /api/users` - Create user (admin only)
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)
- `POST /api/submissions` - Submit assignment work (student only)
- `GET /api/trash` - Fetch deleted items (teacher only)
- `POST /api/trash/restore/class/:id` - Restore deleted class (teacher only)
- `DELETE /api/trash/permanent/class/:id` - Permanently delete class (teacher only)

## Browser Compatibility

- Modern browsers supporting ES6+
- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Future Enhancements

- Real-time notifications
- File upload for assignments
- Advanced competency tracking
- Email notifications
- Multi-language support
- Advanced search and filtering
