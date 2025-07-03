# CBLMS Backend

A Node.js/Express backend for a Competency-Based Learning Management System.

## Features

- JWT-based authentication
- Role-based access control (Student/Teacher)
- SQLite database with Prisma ORM
- Input validation and sanitization
- Rate limiting and security headers
- Soft delete functionality
- RESTful API design

## Security Enhancements

- Environment variables for sensitive configuration
- Password hashing with bcrypt (12 rounds)
- JWT token validation and user verification
- Rate limiting for API endpoints and authentication
- Helmet.js for security headers
- Input validation using Joi
- Structured error handling
- CORS configuration

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   - Copy `.env.example` to `.env` if provided, or use the existing `.env`
   - Update `JWT_SECRET` with a secure random string
   - Configure other environment variables as needed

3. **Database Setup**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Create database and run migrations
   npm run db:migrate
   
   # Seed database with sample data
   npm run db:seed
   ```

4. **Start the Server**
   ```bash
   # Development mode (with nodemon)
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Users (Admin only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Soft delete user

### Classes
- `GET /api/classes` - Get classes (filtered by role)
- `POST /api/classes` - Create new class (Teacher only)
- `PUT /api/classes/:id` - Update class (Teacher only)
- `DELETE /api/classes/:id` - Soft delete class (Teacher only)

### Assignments
- `GET /api/classes/:classId/assignments` - Get assignments for a specific class
- `POST /api/assignments` - Create assignment (Teacher only)
- `PUT /api/assignments/:id` - Update assignment (Teacher only)
- `DELETE /api/assignments/:id` - Delete assignment (Teacher only)

### Submissions
- `POST /api/submissions` - Create/update submission (Student only)

### Competencies
- `GET /api/competencies/status` - Get competency status (Student only)

### Trash Management
- `GET /api/trash` - Get deleted items (Teacher only)
- `POST /api/trash/restore/class/:id` - Restore deleted class (Teacher only)
- `DELETE /api/trash/permanent/class/:id` - Permanently delete class (Teacher only)

### Health Check
- `GET /api/health` - Server health status

## Demo Accounts

After running the seed script, you can use these accounts:

**Admin Account:**
- Email: `admin@demo.com`
- Password: `password`
- Role: Administrator (can manage all users)

**Teacher Account:**
- Email: `teacher@demo.com`
- Password: `password`

**Student Account:**
- Email: `student@demo.com`
- Password: `password`

## Database Schema

The application uses SQLite with the following main entities:
- **User** - Teachers and students
- **Class** - Learning classes
- **Assignment** - Class assignments
- **Competency** - Skills/competencies tied to assignments
- **Submission** - Student submissions for assignments

## Development Notes

- Uses ES modules (type: "module" in package.json)
- Prisma for database ORM and migrations
- Soft delete implementation for classes
- JWT tokens expire in 24 hours by default
- Rate limiting: 100 requests per 15 minutes (general), 5 requests per 15 minutes (auth)

## Error Handling

The API returns structured error responses:
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed validation errors"]
}
```

## Security Considerations

- Change JWT_SECRET in production
- Use HTTPS in production
- Consider implementing refresh tokens for better security
- Monitor and log failed authentication attempts
- Implement proper backup and recovery procedures
- Consider implementing email verification for new users
