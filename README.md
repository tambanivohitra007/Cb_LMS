# 🎓 CBLMS - Competency-Based Learning Management System

A modern, full-stack web application designed for competency-based education. This system enables teachers to create classes, assignments, and track student progress through mastery-based learning, while providing students with an intuitive interface to submit assignments and monitor their academic growth.

## 📋 Table of Contents

- [🎓 CBLMS - Competency-Based Learning Management System](#-cblms---competency-based-learning-management-system)
  - [📋 Table of Contents](#-table-of-contents)
  - [🌟 Overview](#-overview)
  - [✨ Key Features](#-key-features)
    - [👨‍🏫 For Teachers](#-for-teachers)
    - [👩‍🎓 For Students](#-for-students)
    - [🔧 For Administrators](#-for-administrators)
  - [🏗️ System Architecture](#️-system-architecture)
    - [Frontend Architecture](#frontend-architecture)
    - [Backend Architecture](#backend-architecture)
  - [🔧 Tech Stack](#-tech-stack)
    - [Frontend Technologies](#frontend-technologies)
    - [Backend Technologies](#backend-technologies)
  - [📁 Project Structure](#-project-structure)
  - [⚡ Quick Start](#-quick-start)
    - [Prerequisites](#prerequisites)
    - [1. Clone the Repository](#1-clone-the-repository)
    - [2. Backend Setup](#2-backend-setup)
    - [3. Frontend Setup](#3-frontend-setup)
    - [4. Access the Application](#4-access-the-application)
  - [🔒 User Roles \& Permissions](#-user-roles--permissions)
    - [👨‍💼 Admin](#-admin)
    - [👨‍🏫 Teacher](#-teacher)
    - [👩‍🎓 Student](#-student)
  - [📊 Database Schema](#-database-schema)
    - [Core Models](#core-models)
      - [User Model](#user-model)
      - [Class Model](#class-model)
      - [Assignment Model](#assignment-model)
      - [Competency Model](#competency-model)
      - [Submission Model](#submission-model)
  - [🔌 API Endpoints](#-api-endpoints)
    - [Authentication Endpoints](#authentication-endpoints)
    - [User Management](#user-management)
    - [Class Management](#class-management)
    - [Assignment Management](#assignment-management)
    - [Submission Management](#submission-management)
    - [Progress \& Analytics](#progress--analytics)
    - [System Endpoints](#system-endpoints)
  - [🎨 Frontend Components](#-frontend-components)
    - [Core Pages](#core-pages)
      - [🏠 Dashboard Components](#-dashboard-components)
      - [📚 Management Pages](#-management-pages)
      - [📊 Analytics \& Reporting](#-analytics--reporting)
      - [🛠️ Utility Pages](#️-utility-pages)
    - [Reusable Components](#reusable-components)
      - [📝 RichTextEditor](#-richtexteditor)
      - [🎨 UI Components](#-ui-components)
  - [🛡️ Security Features](#️-security-features)
    - [Authentication \& Authorization](#authentication--authorization)
    - [Input Validation](#input-validation)
    - [Security Middleware](#security-middleware)
    - [Data Protection](#data-protection)
  - [🌙 Dark Mode Support](#-dark-mode-support)
    - [Theme System](#theme-system)
    - [Implementation](#implementation)
    - [Supported Elements](#supported-elements)
  - [📱 Responsive Design](#-responsive-design)
    - [Breakpoint System](#breakpoint-system)
    - [Mobile-First Approach](#mobile-first-approach)
    - [Cross-Browser Support](#cross-browser-support)
  - [🔧 Development Guide](#-development-guide)
    - [Setting Up Development Environment](#setting-up-development-environment)
      - [Code Editor Setup (VS Code)](#code-editor-setup-vs-code)
      - [Environment Variables](#environment-variables)
    - [Development Workflow](#development-workflow)
      - [1. Backend Development](#1-backend-development)
      - [2. Frontend Development](#2-frontend-development)
    - [Code Standards](#code-standards)
      - [JavaScript/React Standards](#javascriptreact-standards)
      - [CSS/Tailwind Standards](#csstailwind-standards)
  - [🧪 Testing](#-testing)
    - [Backend Testing](#backend-testing)
    - [Frontend Testing](#frontend-testing)
    - [Manual Testing Checklist](#manual-testing-checklist)
      - [Authentication Flow](#authentication-flow)
      - [Teacher Workflow](#teacher-workflow)
      - [Student Workflow](#student-workflow)
  - [🚀 Deployment](#-deployment)
    - [Production Checklist](#production-checklist)
      - [Backend Deployment](#backend-deployment)
      - [Frontend Deployment](#frontend-deployment)
      - [Deployment Platforms](#deployment-platforms)
        - [Backend Options](#backend-options)
        - [Frontend Options](#frontend-options)
    - [Environment-Specific Configurations](#environment-specific-configurations)
      - [Production Optimizations](#production-optimizations)
  - [📚 Educational Concepts](#-educational-concepts)
    - [Competency-Based Education (CBE)](#competency-based-education-cbe)
      - [What is CBE?](#what-is-cbe)
      - [Key Principles](#key-principles)
      - [How CBLMS Supports CBE](#how-cblms-supports-cbe)
        - [🎯 Clear Competency Mapping](#-clear-competency-mapping)
        - [📊 Granular Progress Tracking](#-granular-progress-tracking)
        - [🔄 Flexible Assessment](#-flexible-assessment)
        - [📈 Data-Driven Insights](#-data-driven-insights)
    - [Learning Analytics](#learning-analytics)
      - [Progress Visualization](#progress-visualization)
      - [Mastery Levels](#mastery-levels)
  - [🤝 Contributing](#-contributing)
    - [Getting Started](#getting-started)
    - [Development Guidelines](#development-guidelines)
      - [Code Style](#code-style)
      - [Pull Request Requirements](#pull-request-requirements)
    - [Areas for Contribution](#areas-for-contribution)
  - [🐛 Troubleshooting](#-troubleshooting)
    - [Common Issues](#common-issues)
      - [Backend Issues](#backend-issues)
        - [Database Connection Error](#database-connection-error)
        - [JWT Secret Error](#jwt-secret-error)
        - [Port Already in Use](#port-already-in-use)
      - [Frontend Issues](#frontend-issues)
        - [API Connection Error](#api-connection-error)
        - [Build Errors](#build-errors)
        - [Dark Mode Not Working](#dark-mode-not-working)
    - [Performance Issues](#performance-issues)
      - [Slow Page Load](#slow-page-load)
      - [Database Performance](#database-performance)
    - [Getting Help](#getting-help)
  - [📄 License](#-license)
  - [🎉 Conclusion](#-conclusion)

## 🌟 Overview

CBLMS is designed around the principles of **Competency-Based Education (CBE)**, where students advance based on their ability to master a skill or learning outcome rather than seat time. The system provides:

- **Mastery-focused learning**: Students progress when they demonstrate competency
- **Personalized pace**: Each student can learn at their own speed
- **Clear learning objectives**: Transparent competency requirements
- **Comprehensive tracking**: Detailed progress monitoring and analytics
- **Modern interface**: Intuitive, responsive design with dark mode support

## ✨ Key Features

### 👨‍🏫 For Teachers
- **Class Management**: Create, edit, and organize classes with cohort integration
- **Assignment Creation**: Rich text assignments with competency mapping
- **Progress Tracking**: Real-time student progress monitoring with visual analytics
- **Mastery Transcripts**: Generate comprehensive student mastery reports
- **Submission Review**: Streamlined assignment grading and feedback system
- **User Management**: Create and manage student accounts

### 👩‍🎓 For Students
- **Assignment Submissions**: Rich text editor with file attachment support
- **Progress Dashboard**: Visual progress tracking with charts and analytics
- **Mastery Tracking**: Clear view of competency achievement levels
- **Class Overview**: Organized view of all enrolled classes and assignments
- **Profile Management**: Personal account settings and information

### 🔧 For Administrators
- **System Management**: Full user and system administration
- **Role Management**: Assign and modify user roles and permissions
- **Data Analytics**: System-wide progress and usage analytics
- **Trash Management**: Soft delete system with restore functionality

## 🏗️ System Architecture

```
┌─────────────────┐    HTTP/HTTPS    ┌─────────────────┐
│                 │ ◄──────────────► │                 │
│   React Client  │                  │  Express Server │
│   (Frontend)    │                  │   (Backend)     │
│                 │                  │                 │
└─────────────────┘                  └─────────────────┘
         │                                     │
         │                                     │
         ▼                                     ▼
┌─────────────────┐                  ┌─────────────────┐
│                 │                  │                 │
│   Browser       │                  │   SQLite DB     │
│   localStorage  │                  │   (Prisma ORM)  │
│                 │                  │                 │
└─────────────────┘                  └─────────────────┘
```

### Frontend Architecture
- **React 18**: Modern React with hooks and functional components
- **Vite**: Fast development server and build tool
- **React Router**: Client-side routing and navigation
- **Tailwind CSS**: Utility-first CSS framework with dark mode
- **Axios**: HTTP client with interceptors for API communication
- **Context API**: Global state management for authentication and theme

### Backend Architecture
- **Express.js**: Web application framework
- **Prisma ORM**: Type-safe database access layer
- **SQLite**: Lightweight, serverless database
- **JWT**: Stateless authentication tokens
- **Joi**: Schema validation for API inputs
- **Helmet**: Security middleware for HTTP headers

## 🔧 Tech Stack

### Frontend Technologies
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | ^18.2.0 | UI library for building user interfaces |
| **Vite** | ^5.2.0 | Fast build tool and dev server |
| **React Router** | ^6.0.0 | Client-side routing |
| **Tailwind CSS** | ^3.4.3 | Utility-first CSS framework |
| **Lucide React** | ^0.525.0 | Beautiful, customizable icons |
| **Axios** | ^1.7.2 | Promise-based HTTP client |
| **Chart.js** | ^4.5.0 | Data visualization charts |
| **React Quill** | ^2.0.0 | Rich text editor component |

### Backend Technologies
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | Latest LTS | JavaScript runtime |
| **Express.js** | ^4.19.2 | Web application framework |
| **Prisma** | ^5.15.0 | Next-generation ORM |
| **SQLite** | Latest | Embedded database |
| **JWT** | ^9.0.2 | JSON Web Tokens for auth |
| **bcryptjs** | ^2.4.3 | Password hashing |
| **Joi** | ^17.11.0 | Data validation |
| **Helmet** | ^7.1.0 | Security middleware |

## 📁 Project Structure

```
📁 cblms/
├── 📁 backend/                    # Express.js API server
│   ├── 📄 server.js              # Main server file
│   ├── 📄 package.json           # Backend dependencies
│   ├── 📄 .env                   # Environment variables
│   ├── 📁 prisma/               # Database configuration
│   │   ├── 📄 schema.prisma     # Database schema
│   │   ├── 📄 seed.js           # Sample data seeder
│   │   └── 📁 migrations/       # Database migrations
│   └── 📄 test-api.js           # API testing script
├── 📁 frontend/                  # React client application
│   ├── 📄 package.json          # Frontend dependencies
│   ├── 📄 vite.config.js        # Vite configuration
│   ├── 📄 tailwind.config.js    # Tailwind CSS config
│   ├── 📁 src/                  # Source code
│   │   ├── 📄 App.jsx           # Main app component
│   │   ├── 📄 main.jsx          # Entry point
│   │   ├── 📁 pages/            # Page components
│   │   │   ├── 📄 LoginPage.jsx
│   │   │   ├── 📄 TeacherDashboard.jsx
│   │   │   ├── 📄 StudentDashboard.jsx
│   │   │   ├── 📄 ClassManagement.jsx
│   │   │   ├── 📄 AssignmentManagement.jsx
│   │   │   ├── 📄 StudentManagement.jsx
│   │   │   ├── 📄 UserManagement.jsx
│   │   │   ├── 📄 MasteryTranscript.jsx
│   │   │   ├── 📄 Trash.jsx
│   │   │   └── 📄 Profile.jsx
│   │   └── 📁 components/       # Reusable components
│   │       └── 📄 RichTextEditor.jsx
│   └── 📁 public/               # Static assets
└── 📄 README.md                 # This file
```

## ⚡ Quick Start

### Prerequisites
- **Node.js** (version 16 or higher)
- **npm** or **yarn** package manager
- **Git** for cloning the repository

### 1. Clone the Repository
```bash
git clone <repository-url>
cd cblms
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env file with your configuration

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed the database with sample data
npm run db:seed

# Start the development server
npm run dev
```

The backend server will start at `http://localhost:5000`

### 3. Frontend Setup
```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend application will start at `http://localhost:5173`

### 4. Access the Application
1. Open your browser and go to `http://localhost:5173`
2. Use the demo accounts to log in:
   - **Teacher**: `teacher@demo.com` / `password`
   - **Student**: `student@demo.com` / `password`
   - **Admin**: `admin@demo.com` / `password`

## 🔒 User Roles & Permissions

### 👨‍💼 Admin
- **Full system access**: All features and data
- **User management**: Create, edit, delete users
- **System configuration**: Manage system settings
- **Data oversight**: Access to all classes and progress

### 👨‍🏫 Teacher
- **Class management**: Create and manage own classes
- **Assignment creation**: Create assignments with competencies
- **Student progress**: View progress of students in their classes
- **Grading**: Review and grade student submissions
- **Reporting**: Generate mastery transcripts

### 👩‍🎓 Student
- **Class access**: View enrolled classes and assignments
- **Assignment submission**: Submit assignments and track progress
- **Progress viewing**: Monitor personal competency progress
- **Profile management**: Update personal information

## 📊 Database Schema

### Core Models

#### User Model
```sql
User {
  id          Int       @id @default(autoincrement())
  email       String    @unique
  name        String?
  password    String    -- Hashed with bcrypt
  role        String    @default("STUDENT") -- STUDENT|TEACHER|ADMIN
  photo       String?   -- Profile photo URL
  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt
  deleted_at  DateTime? -- Soft delete timestamp
}
```

#### Class Model
```sql
Class {
  id          Int       @id @default(autoincrement())
  name        String
  description String?   -- Rich text description
  teacher_id  Int       -- Foreign key to User
  cohort_id   Int?      -- Optional cohort association
  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt
  deleted_at  DateTime? -- Soft delete
}
```

#### Assignment Model
```sql
Assignment {
  id          Int       @id @default(autoincrement())
  title       String
  description String?   -- Rich text content
  class_id    Int       -- Foreign key to Class
  deadline    DateTime?
  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt
  deleted_at  DateTime? -- Soft delete
}
```

#### Competency Model
```sql
Competency {
  id          Int       @id @default(autoincrement())
  name        String    @unique
  description String?
  category    String?   -- Subject area grouping
  created_at  DateTime  @default(now())
}
```

#### Submission Model
```sql
Submission {
  id            Int       @id @default(autoincrement())
  content       String    -- Rich text submission
  assignment_id Int       -- Foreign key to Assignment
  student_id    Int       -- Foreign key to User
  grade         String?   -- NOT_SUBMITTED|SUBMITTED|GRADED|MASTERED
  feedback      String?   -- Teacher feedback
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt
}
```

## 🔌 API Endpoints

### Authentication Endpoints
```http
POST   /api/auth/login     # User login
POST   /api/auth/logout    # User logout
GET    /api/auth/me        # Get current user info
```

### User Management
```http
GET    /api/users          # Get all users (Admin only)
POST   /api/users          # Create new user (Admin only)
PUT    /api/users/:id      # Update user (Admin/Self)
DELETE /api/users/:id      # Soft delete user (Admin only)
GET    /api/profile        # Get current user profile
PUT    /api/profile        # Update current user profile
```

### Class Management
```http
GET    /api/classes        # Get classes (role-based filtering)
POST   /api/classes        # Create new class (Teacher/Admin)
PUT    /api/classes/:id    # Update class (Owner/Admin)
DELETE /api/classes/:id    # Soft delete class (Owner/Admin)
GET    /api/classes/:id/students        # Get class students
POST   /api/classes/:id/students        # Add student to class
DELETE /api/classes/:id/students/:id    # Remove student from class
```

### Assignment Management
```http
GET    /api/classes/:id/assignments     # Get class assignments
POST   /api/assignments                 # Create assignment (Teacher/Admin)
PUT    /api/assignments/:id             # Update assignment (Owner/Admin)
DELETE /api/assignments/:id             # Soft delete assignment (Owner/Admin)
GET    /api/assignments/:id/submissions # Get assignment submissions (Teacher/Admin)
```

### Submission Management
```http
GET    /api/my-assignments              # Get student's assignments
POST   /api/submissions                 # Submit assignment (Student)
PUT    /api/submissions/:id             # Update submission (Student/Teacher)
GET    /api/submissions/:id             # Get specific submission
```

### Progress & Analytics
```http
GET    /api/progress/:studentId         # Get student progress (Student/Teacher/Admin)
GET    /api/mastery-transcript/:studentId # Generate mastery transcript
```

### System Endpoints
```http
GET    /api/health                      # Health check endpoint
GET    /api/cohorts                     # Get all cohorts
GET    /api/competencies                # Get all competencies
GET    /api/trash                       # Get soft-deleted items (Admin)
POST   /api/restore/:type/:id           # Restore deleted item (Admin)
```

## 🎨 Frontend Components

### Core Pages

#### 🏠 Dashboard Components
- **TeacherDashboard.jsx**: Overview of classes, recent activity, quick actions
- **StudentDashboard.jsx**: Assignment overview, progress charts, due dates

#### 📚 Management Pages
- **ClassManagement.jsx**: CRUD operations for classes with cohort integration
- **AssignmentManagement.jsx**: Assignment creation with rich text editor and competency mapping
- **StudentManagement.jsx**: Add/remove students from classes
- **UserManagement.jsx**: Complete user administration (Admin only)

#### 📊 Analytics & Reporting
- **MasteryTranscript.jsx**: Comprehensive progress reports with charts
- **Progress tracking**: Real-time competency mastery visualization

#### 🛠️ Utility Pages
- **LoginPage.jsx**: Secure authentication with form validation
- **Profile.jsx**: User profile management with photo upload
- **Trash.jsx**: Soft delete management with restore functionality

### Reusable Components

#### 📝 RichTextEditor
```jsx
<RichTextEditor
  value={content}
  onChange={setContent}
  placeholder="Enter content..."
  className="min-h-[300px]"
/>
```
- **Features**: Rich text formatting, image upload, link insertion
- **Library**: React Quill with custom toolbar
- **Styling**: Tailwind CSS integration with dark mode support

#### 🎨 UI Components
- **Navigation**: Collapsible sidebar with role-based menu items
- **Forms**: Consistent form styling with validation feedback
- **Buttons**: Icon-integrated buttons with hover states
- **Cards**: Responsive card layouts for content organization
- **Charts**: Interactive progress visualization with Chart.js

## 🛡️ Security Features

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication with secure token generation
- **Password Hashing**: bcrypt with 12 rounds for secure password storage
- **Role-based Access**: Granular permissions based on user roles
- **Session Management**: Automatic logout on token expiration

### Input Validation
- **Server-side Validation**: Joi schemas for all API endpoints
- **Client-side Validation**: Form validation with real-time feedback
- **Sanitization**: XSS prevention through input sanitization
- **SQL Injection Protection**: Prisma ORM prevents SQL injection

### Security Middleware
- **Helmet.js**: Security headers for protection against common attacks
- **CORS**: Cross-origin resource sharing configuration
- **Rate Limiting**: Protection against brute force and DoS attacks
- **Request Size Limits**: Prevent large payload attacks

### Data Protection
- **Soft Delete**: Preserves data integrity with recovery options
- **Audit Trail**: Track all data modifications with timestamps
- **Access Logging**: Monitor API access patterns
- **Environment Security**: Sensitive data in environment variables

## 🌙 Dark Mode Support

The application features a comprehensive dark mode implementation:

### Theme System
- **Context-based**: React Context API for global theme state
- **Persistent**: Theme preference saved in localStorage
- **Dynamic**: Real-time theme switching without page reload

### Implementation
```jsx
// Theme Context
const ThemeContext = createContext();

// Theme Provider
<ThemeProvider>
  <div className={`${isDark ? 'dark' : ''} min-h-screen`}>
    <App />
  </div>
</ThemeProvider>

// Component Usage
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  Content
</div>
```

### Supported Elements
- ✅ **All page backgrounds**: Seamless dark/light transitions
- ✅ **Forms and inputs**: Proper contrast and readability
- ✅ **Navigation**: Sidebar and menu items
- ✅ **Cards and modals**: Consistent styling
- ✅ **Charts and graphics**: Dark mode compatible visualizations
- ✅ **Icons and buttons**: Proper contrast ratios

## 📱 Responsive Design

### Breakpoint System
```css
/* Tailwind CSS Breakpoints */
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2X Extra large devices */
```

### Mobile-First Approach
- **Responsive Grid**: CSS Grid and Flexbox for layout
- **Touch-Friendly**: Appropriately sized touch targets
- **Navigation**: Collapsible mobile menu
- **Forms**: Optimized form layouts for mobile input
- **Charts**: Responsive data visualizations

### Cross-Browser Support
- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Fallbacks**: Graceful degradation for older browsers
- **Performance**: Optimized for mobile performance

## 🔧 Development Guide

### Setting Up Development Environment

#### Code Editor Setup (VS Code)
```json
// Recommended extensions
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "prisma.prisma"
  ]
}
```

#### Environment Variables
```bash
# Backend (.env)
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secure-jwt-secret-key-here"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV="development"

# Frontend (.env)
VITE_API_URL="http://localhost:5000/api"
```

### Development Workflow

#### 1. Backend Development
```bash
# Start development server with auto-reload
npm run dev

# Reset database (caution: deletes all data)
npm run db:reset

# Generate Prisma client after schema changes
npm run db:generate

# Create new migration
npm run db:migrate

# Test API endpoints
npm run test
```

#### 2. Frontend Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Code Standards

#### JavaScript/React Standards
```jsx
// Use functional components with hooks
const MyComponent = ({ prop1, prop2 }) => {
  const [state, setState] = useState(initialValue);
  
  useEffect(() => {
    // Effect logic
  }, [dependencies]);
  
  return (
    <div className="responsive-class dark:dark-class">
      {/* Component content */}
    </div>
  );
};

export default MyComponent;
```

#### CSS/Tailwind Standards
```jsx
// Use Tailwind utility classes
<div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Title</h1>
  <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors">
    Action
  </button>
</div>
```

## 🧪 Testing

### Backend Testing
```bash
# Run API tests
npm run test

# Example test output:
✅ Health check endpoint working
✅ User authentication working
✅ Class creation working
✅ Assignment submission working
```

### Frontend Testing
```bash
# Start development server and verify:
npm run dev

# Check for:
✅ No compilation errors
✅ All pages load correctly
✅ Authentication flow works
✅ Forms submit properly
✅ API integration working
```

### Manual Testing Checklist

#### Authentication Flow
- [ ] Login with valid credentials
- [ ] Login with invalid credentials shows error
- [ ] Auto-logout on token expiration
- [ ] Registration process (if enabled)

#### Teacher Workflow
- [ ] Create new class
- [ ] Edit existing class
- [ ] Create assignment with competencies
- [ ] View student submissions
- [ ] Grade submissions
- [ ] Generate mastery transcript

#### Student Workflow
- [ ] View enrolled classes
- [ ] Submit assignment
- [ ] Edit submission before grading
- [ ] View progress dashboard
- [ ] Update profile information

## 🚀 Deployment

### Production Checklist

#### Backend Deployment
1. **Environment Setup**
   ```bash
   # Set production environment variables
   NODE_ENV=production
   DATABASE_URL="your-production-database-url"
   JWT_SECRET="your-production-jwt-secret"
   ```

2. **Database Migration**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

3. **Start Production Server**
   ```bash
   npm start
   ```

#### Frontend Deployment
1. **Build for Production**
   ```bash
   npm run build
   ```

2. **Deploy Built Files**
   - Upload `dist/` folder to your web server
   - Configure web server to serve `index.html` for all routes

#### Deployment Platforms

##### Backend Options
- **Heroku**: Easy deployment with PostgreSQL addon
- **Railway**: Modern platform with automatic deployments
- **DigitalOcean**: VPS with full control
- **AWS EC2**: Scalable cloud hosting

##### Frontend Options
- **Vercel**: Optimized for React applications
- **Netlify**: Simple static site hosting
- **GitHub Pages**: Free hosting for public repositories
- **AWS S3 + CloudFront**: Scalable static hosting

### Environment-Specific Configurations

#### Production Optimizations
```javascript
// Backend: Enable compression and security
app.use(compression());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));

// Frontend: Build optimizations in vite.config.js
export default defineConfig({
  build: {
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['lucide-react', 'chart.js']
        }
      }
    }
  }
});
```

## 📚 Educational Concepts

### Competency-Based Education (CBE)

#### What is CBE?
Competency-Based Education is an approach to teaching and learning that focuses on students demonstrating mastery of specific skills and knowledge before advancing to the next level.

#### Key Principles
1. **Mastery-focused**: Students advance based on competency, not time
2. **Personalized**: Each student learns at their own pace
3. **Transparent**: Clear learning objectives and expectations
4. **Flexible**: Multiple ways to demonstrate mastery
5. **Student-centered**: Focus on individual learning needs

#### How CBLMS Supports CBE

##### 🎯 Clear Competency Mapping
- Each assignment is mapped to specific competencies
- Students can see exactly what skills they're developing
- Progress tracking shows mastery levels for each competency

##### 📊 Granular Progress Tracking
- Real-time progress updates as students submit work
- Visual representation of competency mastery
- Historical progress data for trend analysis

##### 🔄 Flexible Assessment
- Multiple submission attempts allowed
- Rich feedback system for continuous improvement
- Mastery-based grading (Not Submitted → Submitted → Graded → Mastered)

##### 📈 Data-Driven Insights
- Analytics dashboard for teachers and students
- Progress reports for stakeholders
- Identification of struggling areas for intervention

### Learning Analytics

#### Progress Visualization
```javascript
// Example: Student progress data structure
const progressData = {
  studentId: 123,
  competencies: [
    {
      id: 1,
      name: "Mathematical Problem Solving",
      category: "Mathematics",
      masteryLevel: 85, // Percentage
      assignments: [
        { id: 1, title: "Algebra Basics", score: 90 },
        { id: 2, title: "Geometry Problems", score: 80 }
      ]
    }
  ],
  overallProgress: 78,
  timeToMastery: "3.2 weeks average"
};
```

#### Mastery Levels
- **0-25%**: Beginning
- **26-50%**: Developing  
- **51-75%**: Proficient
- **76-100%**: Mastered

## 🤝 Contributing

### Getting Started
1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**: Follow the coding standards
4. **Test your changes**: Ensure all tests pass
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**: Describe your changes

### Development Guidelines

#### Code Style
- Use **ESLint** and **Prettier** for consistent formatting
- Follow **React best practices** and hooks guidelines
- Use **TypeScript** for new components (optional but encouraged)
- Write **clear, descriptive commit messages**

#### Pull Request Requirements
- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] New features include tests
- [ ] Documentation updated if needed
- [ ] Screenshots included for UI changes

### Areas for Contribution
- 🐛 **Bug fixes**: Help fix issues and improve stability
- ✨ **New features**: Add functionality to enhance the system
- 📚 **Documentation**: Improve guides and API documentation
- 🎨 **UI/UX**: Enhance the user interface and experience
- 🔧 **Performance**: Optimize application performance
- 🧪 **Testing**: Add test coverage and improve quality

## 🐛 Troubleshooting

### Common Issues

#### Backend Issues

##### Database Connection Error
```bash
Error: Database connection failed
```
**Solution:**
1. Check if `DATABASE_URL` is correctly set in `.env`
2. Ensure database file exists: `ls backend/prisma/dev.db`
3. Regenerate Prisma client: `npm run db:generate`
4. Run migrations: `npm run db:migrate`

##### JWT Secret Error
```bash
Error: JWT secret not configured
```
**Solution:**
1. Check `.env` file exists in backend directory
2. Ensure `JWT_SECRET` is set with a secure value
3. Restart the backend server

##### Port Already in Use
```bash
Error: Port 5000 already in use
```
**Solution:**
1. Kill existing process: `lsof -ti:5000 | xargs kill -9`
2. Or change port in `.env`: `PORT=5001`

#### Frontend Issues

##### API Connection Error
```bash
Network Error: Cannot connect to backend
```
**Solution:**
1. Ensure backend server is running on `http://localhost:5000`
2. Check `VITE_API_URL` in frontend `.env`
3. Verify CORS configuration in backend

##### Build Errors
```bash
Build failed with compilation errors
```
**Solution:**
1. Clear node_modules: `rm -rf node_modules && npm install`
2. Check for TypeScript errors in components
3. Ensure all imports are correct

##### Dark Mode Not Working
```bash
Theme changes not persisting
```
**Solution:**
1. Check localStorage permissions in browser
2. Verify ThemeContext is properly wrapped around App
3. Ensure Tailwind dark mode is configured correctly

### Performance Issues

#### Slow Page Load
- **Enable compression** in production
- **Optimize images** and assets
- **Implement code splitting** for large bundles
- **Use CDN** for static assets

#### Database Performance
- **Add indexes** for frequently queried fields
- **Implement pagination** for large datasets
- **Use connection pooling** in production
- **Monitor query performance** with Prisma logging

### Getting Help
1. **Check existing issues** in the repository
2. **Search documentation** for solutions
3. **Create a new issue** with detailed information:
   - Operating system and versions
   - Steps to reproduce the problem
   - Expected vs actual behavior
   - Error messages and logs

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🎉 Conclusion

CBLMS represents a modern approach to educational technology, combining the best practices of competency-based education with cutting-edge web development technologies. Whether you're an educator looking to implement mastery-based learning or a developer interested in educational technology, this system provides a solid foundation for building powerful learning management solutions.

The system's focus on clear learning objectives, personalized pacing, and comprehensive progress tracking makes it an invaluable tool for educational institutions seeking to improve student outcomes through technology-enhanced learning.

**Happy Learning! 🚀📚**

---

*For additional support or questions, please refer to the troubleshooting section or create an issue in the repository.*
