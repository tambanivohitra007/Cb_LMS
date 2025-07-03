import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Security middleware
app.use(helmet());
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174'
    ],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(process.cwd(), 'uploads'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Ensure uploads directory exists
if (!fs.existsSync(path.join(process.cwd(), 'uploads'))){
    fs.mkdirSync(path.join(process.cwd(), 'uploads'));
}

// Validation schemas
const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
});

const userSchema = Joi.object({
    name: Joi.string().min(1).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('STUDENT', 'TEACHER', 'ADMIN').required()
});

const userUpdateSchema = Joi.object({
    name: Joi.string().min(1).max(100).required(),
    email: Joi.string().email().required(),
    role: Joi.string().valid('STUDENT', 'TEACHER', 'ADMIN').required(),
    password: Joi.string().min(6).optional() // Optional for updates
});

const classSchema = Joi.object({
    name: Joi.string().min(1).max(200).required(),
    description: Joi.string().max(5000).optional(), // Increased for rich content
    cohortId: Joi.number().integer().positive().optional() // Optional cohort assignment
});

const cohortSchema = Joi.object({
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(1000).optional(),
    level: Joi.number().integer().min(1).max(10).optional()
});

const assignmentSchema = Joi.object({
    title: Joi.string().min(1).max(200).required(),
    description: Joi.string().max(10000).optional(), // Increased for rich content
    classId: Joi.number().integer().positive().required(),
    competencyNames: Joi.array().items(Joi.string().min(1).max(100)).min(1).required(),
    deadline: Joi.date().iso().optional() // New: deadline for assignment
});

const assignmentUpdateSchema = Joi.object({
    title: Joi.string().min(1).max(200).required(),
    description: Joi.string().max(10000).optional(), // Increased for rich content
    classId: Joi.number().integer().positive().optional(), // Optional for updates (ignored)
    competencyNames: Joi.array().items(Joi.string().min(1).max(100)).min(1).required(),
    deadline: Joi.date().iso().optional() // New: deadline for assignment
});

const submissionSchema = Joi.object({
    assignmentId: Joi.number().integer().positive().required(),
    content: Joi.string().max(5000).optional()
});

const submissionFeedbackSchema = Joi.object({
    feedback: Joi.string().max(5000).required()
});

// --- AUTHENTICATION MIDDLEWARE ---
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication token required' 
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Verify user still exists
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, role: true, name: true }
        });
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'User no longer exists' 
            });
        }
        
        req.user = { ...decoded, ...user };
        next();
    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid or expired token' 
        });
    }
};

// --- ROLE-BASED ACCESS MIDDLEWARE ---
const roleMiddleware = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Forbidden: You do not have access to this resource' 
            });
        }
        next();
    };
};

// --- VALIDATION MIDDLEWARE ---
const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map(detail => detail.message)
            });
        }
        next();
    };
};

// --- ERROR HANDLING MIDDLEWARE ---
const errorHandler = (error, req, res, next) => {
    console.error('Error:', error);
    
    // Prisma specific errors
    if (error.code === 'P2002') {
        return res.status(409).json({
            success: false,
            message: 'A record with this data already exists'
        });
    }
    
    if (error.code === 'P2025') {
        return res.status(404).json({
            success: false,
            message: 'Record not found'
        });
    }
    
    // Default error response
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : error.message
    });
};


// --- AUTH ROUTES ---
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs for auth
    message: 'Too many authentication attempts, please try again later.'
});

app.post('/api/auth/login', authLimiter, validateRequest(loginSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body;
        
        const user = await prisma.user.findUnique({ 
            where: { email: email.toLowerCase() },
            select: {
                id: true,
                email: true,
                name: true,
                password: true,
                role: true,
                photo: true,
                deleted_at: true
            }
        });
        
        if (!user || user.deleted_at) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role }, 
            JWT_SECRET, 
            { expiresIn: JWT_EXPIRES_IN }
        );
        
        const { password: _, ...userWithoutPassword } = user;
        
        res.json({ 
            success: true,
            token, 
            user: userWithoutPassword 
        });
    } catch (error) {
        next(error);
    }
});

// --- USER ROUTES (Admin only) ---
app.get('/api/users', authMiddleware, roleMiddleware(['ADMIN']), async (req, res, next) => {
    try {
        const users = await prisma.user.findMany({
            where: { deleted_at: null },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                photo: true,
                created_at: true,
                updated_at: true
            }
        });
        res.json({ success: true, data: users });
    } catch (error) {
        next(error);
    }
});

app.post('/api/users', authMiddleware, roleMiddleware(['ADMIN']), validateRequest(userSchema), async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;
        
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });
        
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }
        
        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = await prisma.user.create({
            data: { 
                name, 
                email: email.toLowerCase(), 
                password: hashedPassword, 
                role 
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                photo: true,
                created_at: true
            }
        });
        
        res.status(201).json({ success: true, data: newUser });
    } catch (error) {
        next(error);
    }
});

// Update a user
app.put('/api/users/:id', authMiddleware, roleMiddleware(['ADMIN']), validateRequest(userUpdateSchema), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email, role, password } = req.body;
        const userId = parseInt(id);
        
        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!existingUser || existingUser.deleted_at) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if email is already taken by another user
        const emailExists = await prisma.user.findFirst({
            where: { 
                email: email.toLowerCase(),
                id: { not: userId },
                deleted_at: null
            }
        });

        if (emailExists) {
            return res.status(409).json({
                success: false,
                message: 'Email is already taken by another user'
            });
        }

        // Prepare update data
        const updateData = {
            name,
            email: email.toLowerCase(),
            role
        };

        // Only update password if provided
        if (password) {
            updateData.password = await bcrypt.hash(password, 12);
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                photo: true,
                created_at: true,
                updated_at: true
            }
        });

        res.json({ success: true, data: updatedUser });
    } catch (error) {
        next(error);
    }
});

// Soft delete a user
app.delete('/api/users/:id', authMiddleware, roleMiddleware(['ADMIN']), async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = parseInt(id);
        
        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        // Prevent self-deletion
        if (userId === req.user.userId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }

        // Check if user exists
        const existingUser = await prisma.user.findFirst({
            where: { 
                id: userId,
                deleted_at: null
            }
        });

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { deleted_at: new Date() }
        });

        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        next(error);
    }
});

// --- CLASS ROUTES ---
app.get('/api/classes', authMiddleware, async (req, res, next) => {
    try {
        let classes;
        if (req.user.role === 'TEACHER') {
            classes = await prisma.class.findMany({
                where: { deleted_at: null },
                include: { 
                    teacher: {
                        select: { id: true, name: true, email: true }
                    },
                    cohort: {
                        select: { id: true, name: true, level: true }
                    },
                    students: {
                        select: { id: true, name: true, email: true }
                    }, 
                    assignments: {
                        include: {
                            competencies: true,
                            _count: {
                                select: { submissions: true }
                            }
                        }
                    }
                }
            });
        } else { // STUDENT
            classes = await prisma.class.findMany({
                where: {
                    students: { some: { id: req.user.userId } },
                    deleted_at: null
                },
                include: {
                    teacher: {
                        select: { id: true, name: true, email: true }
                    },
                    cohort: {
                        select: { id: true, name: true, level: true }
                    },
                    assignments: {
                        include: {
                            competencies: true,
                            submissions: { 
                                where: { studentId: req.user.userId },
                                select: {
                                    id: true,
                                    content: true,
                                    status: true,
                                    submitted_at: true,
                                    reviewed_at: true
                                }
                            }
                        }
                    }
                }
            });
        }
        res.json({ success: true, data: classes });
    } catch (error) {
        next(error);
    }
});

app.post('/api/classes', authMiddleware, roleMiddleware(['TEACHER']), validateRequest(classSchema), async (req, res, next) => {
    try {
        const { name, description, cohortId } = req.body;
        
        // Validate cohort if provided
        if (cohortId) {
            const cohort = await prisma.cohort.findFirst({
                where: {
                    id: cohortId,
                    teacherId: req.user.userId,
                    deleted_at: null
                }
            });
            
            if (!cohort) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid cohort or cohort does not belong to you'
                });
            }
        }
        
        const newClass = await prisma.class.create({
            data: { 
                name, 
                description, 
                teacherId: req.user.userId,
                cohortId: cohortId || null
            },
            include: {
                teacher: {
                    select: { id: true, name: true, email: true }
                },
                cohort: {
                    select: { id: true, name: true, level: true }
                },
                _count: {
                    select: { students: true, assignments: true }
                }
            }
        });
        res.status(201).json({ success: true, data: newClass });
    } catch (error) {
        next(error);
    }
});

// Update a class
app.put('/api/classes/:id', authMiddleware, roleMiddleware(['TEACHER']), validateRequest(classSchema), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, cohortId } = req.body;
        const classId = parseInt(id);
        
        if (isNaN(classId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class ID'
            });
        }
        
        // Validate cohort if provided
        if (cohortId) {
            const cohort = await prisma.cohort.findFirst({
                where: {
                    id: cohortId,
                    teacherId: req.user.userId,
                    deleted_at: null
                }
            });
            
            if (!cohort) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid cohort or cohort does not belong to you'
                });
            }
        }
        
        // Verify the class exists and belongs to the teacher
        const existingClass = await prisma.class.findFirst({
            where: { 
                id: classId, 
                teacherId: req.user.userId,
                deleted_at: null 
            }
        });
        
        if (!existingClass) {
            return res.status(404).json({
                success: false,
                message: 'Class not found or you do not have permission to update it'
            });
        }
        
        const updatedClass = await prisma.class.update({
            where: { id: classId },
            data: { 
                name, 
                description,
                cohortId: cohortId || null
            },
            include: {
                teacher: {
                    select: { id: true, name: true, email: true }
                },
                cohort: {
                    select: { id: true, name: true, level: true }
                },
                teacher: {
                    select: { id: true, name: true, email: true }
                },
                _count: {
                    select: { students: true, assignments: true }
                }
            }
        });
        
        res.json({ success: true, data: updatedClass });
    } catch (error) {
        next(error);
    }
});

// Soft delete a class
app.delete('/api/classes/:id', authMiddleware, roleMiddleware(['TEACHER']), async (req, res, next) => {
    try {
        const { id } = req.params;
        const classId = parseInt(id);
        
        if (isNaN(classId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class ID'
            });
        }
        
        // Verify the class exists and belongs to the teacher
        const existingClass = await prisma.class.findFirst({
            where: { 
                id: classId, 
                teacherId: req.user.userId,
                deleted_at: null 
            }
        });
        
        if (!existingClass) {
            return res.status(404).json({
                success: false,
                message: 'Class not found or you do not have permission to delete it'
            });
        }
        
        await prisma.class.update({
            where: { id: classId },
            data: { deleted_at: new Date() },
        });
        
        res.json({ success: true, message: 'Class deleted successfully' });
    } catch (error) {
        next(error);
    }
});

// --- COHORT ROUTES ---

// Get all cohorts for a teacher
app.get('/api/cohorts', authMiddleware, roleMiddleware(['TEACHER']), async (req, res, next) => {
    try {
        const cohorts = await prisma.cohort.findMany({
            where: {
                teacherId: req.user.userId,
                deleted_at: null
            },
            include: {
                classes: {
                    where: { deleted_at: null },
                    include: {
                        students: {
                            select: { id: true, name: true, email: true }
                        },
                        _count: {
                            select: { assignments: true }
                        }
                    }
                },
                _count: {
                    select: { classes: true }
                }
            },
            orderBy: [
                { level: 'asc' },
                { name: 'asc' }
            ]
        });

        res.json({ success: true, data: cohorts });
    } catch (error) {
        next(error);
    }
});

// Create a new cohort
app.post('/api/cohorts', authMiddleware, roleMiddleware(['TEACHER']), validateRequest(cohortSchema), async (req, res, next) => {
    try {
        const { name, description, level } = req.body;

        // Check if cohort name already exists for this teacher
        const existingCohort = await prisma.cohort.findFirst({
            where: {
                name,
                teacherId: req.user.userId,
                deleted_at: null
            }
        });

        if (existingCohort) {
            return res.status(409).json({
                success: false,
                message: 'A cohort with this name already exists'
            });
        }

        const newCohort = await prisma.cohort.create({
            data: {
                name,
                description,
                level: level || 1,
                teacherId: req.user.userId
            },
            include: {
                _count: {
                    select: { classes: true }
                }
            }
        });

        res.status(201).json({ success: true, data: newCohort });
    } catch (error) {
        next(error);
    }
});

// Update a cohort
app.put('/api/cohorts/:id', authMiddleware, roleMiddleware(['TEACHER']), validateRequest(cohortSchema), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, level } = req.body;
        const cohortId = parseInt(id);

        if (isNaN(cohortId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid cohort ID'
            });
        }

        // Check if cohort exists and belongs to teacher
        const existingCohort = await prisma.cohort.findFirst({
            where: {
                id: cohortId,
                teacherId: req.user.userId,
                deleted_at: null
            }
        });

        if (!existingCohort) {
            return res.status(404).json({
                success: false,
                message: 'Cohort not found or you do not have permission to update it'
            });
        }

        // Check if new name conflicts with existing cohort (excluding current one)
        if (name !== existingCohort.name) {
            const nameConflict = await prisma.cohort.findFirst({
                where: {
                    name,
                    teacherId: req.user.userId,
                    deleted_at: null,
                    NOT: { id: cohortId }
                }
            });

            if (nameConflict) {
                return res.status(409).json({
                    success: false,
                    message: 'A cohort with this name already exists'
                });
            }
        }

        const updatedCohort = await prisma.cohort.update({
            where: { id: cohortId },
            data: {
                name,
                description,
                level: level || existingCohort.level
            },
            include: {
                _count: {
                    select: { classes: true }
                }
            }
        });

        res.json({ success: true, data: updatedCohort });
    } catch (error) {
        next(error);
    }
});

// Delete a cohort (soft delete)
app.delete('/api/cohorts/:id', authMiddleware, roleMiddleware(['TEACHER']), async (req, res, next) => {
    try {
        const { id } = req.params;
        const cohortId = parseInt(id);

        if (isNaN(cohortId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid cohort ID'
            });
        }

        // Check if cohort exists and belongs to teacher
        const existingCohort = await prisma.cohort.findFirst({
            where: {
                id: cohortId,
                teacherId: req.user.userId,
                deleted_at: null
            },
            include: {
                classes: {
                    where: { deleted_at: null }
                }
            }
        });

        if (!existingCohort) {
            return res.status(404).json({
                success: false,
                message: 'Cohort not found or you do not have permission to delete it'
            });
        }

        // Unassign classes from cohort before deleting
        if (existingCohort.classes.length > 0) {
            await prisma.class.updateMany({
                where: {
                    cohortId: cohortId
                },
                data: {
                    cohortId: null
                }
            });
        }

        // Soft delete the cohort
        await prisma.cohort.update({
            where: { id: cohortId },
            data: { deleted_at: new Date() }
        });

        res.json({ success: true, message: 'Cohort deleted successfully' });
    } catch (error) {
        next(error);
    }
});

// Add class to cohort
app.post('/api/cohorts/:id/classes', authMiddleware, roleMiddleware(['TEACHER']), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { classId } = req.body;
        const cohortId = parseInt(id);

        if (isNaN(cohortId) || !classId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid cohort ID or class ID'
            });
        }

        // Verify cohort belongs to teacher
        const cohort = await prisma.cohort.findFirst({
            where: {
                id: cohortId,
                teacherId: req.user.userId,
                deleted_at: null
            }
        });

        if (!cohort) {
            return res.status(404).json({
                success: false,
                message: 'Cohort not found or you do not have permission'
            });
        }

        // Verify class belongs to teacher
        const classToAdd = await prisma.class.findFirst({
            where: {
                id: classId,
                teacherId: req.user.userId,
                deleted_at: null
            }
        });

        if (!classToAdd) {
            return res.status(404).json({
                success: false,
                message: 'Class not found or you do not have permission'
            });
        }

        // Add class to cohort
        await prisma.class.update({
            where: { id: classId },
            data: { cohortId: cohortId }
        });

        res.json({ success: true, message: 'Class added to cohort successfully' });
    } catch (error) {
        next(error);
    }
});

// Remove class from cohort
app.delete('/api/cohorts/:id/classes/:classId', authMiddleware, roleMiddleware(['TEACHER']), async (req, res, next) => {
    try {
        const { id, classId } = req.params;
        const cohortId = parseInt(id);
        const classIdInt = parseInt(classId);

        if (isNaN(cohortId) || isNaN(classIdInt)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid cohort ID or class ID'
            });
        }

        // Verify cohort belongs to teacher
        const cohort = await prisma.cohort.findFirst({
            where: {
                id: cohortId,
                teacherId: req.user.userId,
                deleted_at: null
            }
        });

        if (!cohort) {
            return res.status(404).json({
                success: false,
                message: 'Cohort not found or you do not have permission'
            });
        }

        // Verify class belongs to teacher and is in this cohort
        const classToRemove = await prisma.class.findFirst({
            where: {
                id: classIdInt,
                teacherId: req.user.userId,
                cohortId: cohortId,
                deleted_at: null
            }
        });

        if (!classToRemove) {
            return res.status(404).json({
                success: false,
                message: 'Class not found in this cohort or you do not have permission'
            });
        }

        // Remove class from cohort
        await prisma.class.update({
            where: { id: classIdInt },
            data: { cohortId: null }
        });

        res.json({ success: true, message: 'Class removed from cohort successfully' });
    } catch (error) {
        next(error);
    }
});

// Get available classes that can be added to cohort
app.get('/api/cohorts/:id/available-classes', authMiddleware, roleMiddleware(['TEACHER']), async (req, res, next) => {
    try {
        const { id } = req.params;
        const cohortId = parseInt(id);

        if (isNaN(cohortId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid cohort ID'
            });
        }

        // Verify cohort belongs to teacher
        const cohort = await prisma.cohort.findFirst({
            where: {
                id: cohortId,
                teacherId: req.user.userId,
                deleted_at: null
            }
        });

        if (!cohort) {
            return res.status(404).json({
                success: false,
                message: 'Cohort not found or you do not have permission'
            });
        }

        // Get classes that don't belong to any cohort or belong to a different cohort
        const availableClasses = await prisma.class.findMany({
            where: {
                teacherId: req.user.userId,
                deleted_at: null,
                OR: [
                    { cohortId: null },
                    { cohortId: { not: cohortId } }
                ]
            },
            include: {
                cohort: {
                    select: { id: true, name: true }
                },
                _count: {
                    select: { students: true, assignments: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        res.json({ success: true, data: availableClasses });
    } catch (error) {
        next(error);
    }
});

// Get all students for potential cohort assignment
app.get('/api/cohorts/:id/students', authMiddleware, roleMiddleware(['TEACHER']), async (req, res, next) => {
    try {
        const { id } = req.params;
        const cohortId = parseInt(id);

        if (isNaN(cohortId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid cohort ID'
            });
        }

        // Verify cohort belongs to teacher
        const cohort = await prisma.cohort.findFirst({
            where: {
                id: cohortId,
                teacherId: req.user.userId,
                deleted_at: null
            },
            include: {
                classes: {
                    where: { deleted_at: null }
                }
            }
        });

        if (!cohort) {
            return res.status(404).json({
                success: false,
                message: 'Cohort not found or you do not have permission'
            });
        }

        // Get all unique students from classes in this cohort
        const studentsSet = new Set();
        const students = [];

        cohort.classes.forEach(cls => {
            cls.students.forEach(student => {
                if (!studentsSet.has(student.id)) {
                    studentsSet.add(student.id);
                    students.push({
                        ...student,
                        className: cls.name,
                        classId: cls.id
                    });
                }
            });
        });

        res.json({ success: true, data: students });
    } catch (error) {
        next(error);
    }
});

// Get students for a specific class
app.get('/api/classes/:classId/students', authMiddleware, roleMiddleware(['TEACHER']), async (req, res, next) => {
    try {
        const { classId } = req.params;
        const classIdInt = parseInt(classId);
        
        if (isNaN(classIdInt)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class ID'
            });
        }
        
        // Verify the class exists and belongs to the teacher
        const classWithStudents = await prisma.class.findFirst({
            where: { 
                id: classIdInt,
                teacherId: req.user.userId,
                deleted_at: null 
            },
            include: {
                students: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        created_at: true
                    }
                }
            }
        });
        
        if (!classWithStudents) {
            return res.status(404).json({
                success: false,
                message: 'Class not found or you do not have permission to access it'
            });
        }
        
        res.json({ success: true, data: classWithStudents.students });
    } catch (error) {
        next(error);
    }
});

// --- ASSIGNMENT ROUTES ---
app.post('/api/assignments', authMiddleware, roleMiddleware(['TEACHER']), validateRequest(assignmentSchema), async (req, res, next) => {
    try {
        const { title, description, classId, competencyNames, deadline } = req.body;
        
        // Verify the class exists and belongs to the teacher
        const existingClass = await prisma.class.findFirst({
            where: { 
                id: classId, 
                teacherId: req.user.userId,
                deleted_at: null 
            }
        });
        
        if (!existingClass) {
            return res.status(404).json({
                success: false,
                message: 'Class not found or you do not have permission to create assignments for it'
            });
        }
        
        const newAssignment = await prisma.assignment.create({
            data: {
                title,
                description,
                classId,
                deadline: deadline ? new Date(deadline) : null, // Save deadline if provided
                competencies: {
                    create: competencyNames.map(name => ({ name }))
                }
            },
            include: { 
                competencies: true,
                class: {
                    select: { id: true, name: true }
                }
            }
        });
        
        res.status(201).json({ success: true, data: newAssignment });
    } catch (error) {
        next(error);
    }
});

// Get assignments for a specific class
app.get('/api/classes/:classId/assignments', authMiddleware, async (req, res, next) => {
    try {
        const { classId } = req.params;
        const classIdInt = parseInt(classId);
        
        if (isNaN(classIdInt)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class ID'
            });
        }
        
        // Verify the user has access to this class
        let classQuery;
        if (req.user.role === 'TEACHER') {
            classQuery = {
                id: classIdInt,
                teacherId: req.user.userId,
                deleted_at: null
            };
        } else {
            classQuery = {
                id: classIdInt,
                students: { some: { id: req.user.userId } },
                deleted_at: null
            };
        }
        
        const classWithAssignments = await prisma.class.findFirst({
            where: classQuery,
            include: {
                assignments: {
                    where: { deleted_at: null },
                    include: {
                        competencies: true,
                        _count: {
                            select: { submissions: true }
                        }
                    },
                    orderBy: { created_at: 'desc' }
                }
            }
        });
        
        if (!classWithAssignments) {
            return res.status(404).json({
                success: false,
                message: 'Class not found or you do not have access to it'
            });
        }
        
        res.json({ success: true, data: classWithAssignments.assignments });
    } catch (error) {
        next(error);
    }
});

// Update an assignment
app.put('/api/assignments/:id', authMiddleware, roleMiddleware(['TEACHER']), validateRequest(assignmentUpdateSchema), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, description, competencyNames, deadline } = req.body;
        const assignmentId = parseInt(id);
        
        if (isNaN(assignmentId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid assignment ID'
            });
        }
        
        // Verify the assignment exists and belongs to a class owned by the teacher
        const existingAssignment = await prisma.assignment.findFirst({
            where: { 
                id: assignmentId,
                deleted_at: null,
                class: {
                    teacherId: req.user.userId,
                    deleted_at: null
                }
            },
            include: {
                competencies: true
            }
        });
        
        if (!existingAssignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found or you do not have permission to update it'
            });
        }
        
        // Delete existing competencies and create new ones
        await prisma.competency.deleteMany({
            where: { assignmentId: assignmentId }
        });
        
        const updatedAssignment = await prisma.assignment.update({
            where: { id: assignmentId },
            data: {
                title,
                description,
                deadline: deadline ? new Date(deadline) : undefined,
                competencies: {
                    create: competencyNames.map(name => ({ name }))
                }
            },
            include: {
                competencies: true,
                class: {
                    select: { id: true, name: true }
                },
                _count: {
                    select: { submissions: true }
                }
            }
        });
        
        res.json({ success: true, data: updatedAssignment });
    } catch (error) {
        next(error);
    }
});

// Soft delete an assignment
app.delete('/api/assignments/:id', authMiddleware, roleMiddleware(['TEACHER']), async (req, res, next) => {
    try {
        const { id } = req.params;
        const assignmentId = parseInt(id);
        
        if (isNaN(assignmentId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid assignment ID'
            });
        }
        
        // Verify the assignment exists and belongs to a class owned by the teacher
        const existingAssignment = await prisma.assignment.findFirst({
            where: { 
                id: assignmentId,
                deleted_at: null,
                class: {
                    teacherId: req.user.userId,
                    deleted_at: null
                }
            }
        });
        
        if (!existingAssignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found or you do not have permission to delete it'
            });
        }
        
        await prisma.assignment.update({
            where: { id: assignmentId },
            data: { deleted_at: new Date() }
        });
        
        res.json({ success: true, message: 'Assignment deleted successfully' });
    } catch (error) {
        next(error);
    }
});

// --- SUBMISSION ROUTES ---
app.post('/api/submissions', authMiddleware, roleMiddleware(['STUDENT']), upload.single('file'), async (req, res, next) => {
    try {
        const { assignmentId, content } = req.body;
        let submissionContent = content;
        if (req.file) {
            submissionContent = `/uploads/${req.file.filename}`;
        }
        // Verify the assignment exists and the student has access to it
        const assignment = await prisma.assignment.findFirst({
            where: {
                id: Number(assignmentId),
                deleted_at: null,
                class: {
                    students: { some: { id: req.user.userId } },
                    deleted_at: null
                }
            }
        });
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found or you do not have access to it'
            });
        }
        // Check if student already has a submission for this assignment
        const existingSubmission = await prisma.submission.findFirst({
            where: {
                assignmentId: Number(assignmentId),
                studentId: req.user.userId
            }
        });
        let submission;
        if (existingSubmission) {
            // Update existing submission
            submission = await prisma.submission.update({
                where: { id: existingSubmission.id },
                data: {
                    content: submissionContent,
                    status: 'IN_PROGRESS',
                    submitted_at: new Date()
                },
                include: {
                    assignment: {
                        select: { id: true, title: true }
                    }
                }
            });
        } else {
            // Create new submission
            submission = await prisma.submission.create({
                data: {
                    content: submissionContent,
                    assignmentId: Number(assignmentId),
                    studentId: req.user.userId,
                },
                include: {
                    assignment: {
                        select: { id: true, title: true }
                    }
                }
            });
        }
        res.status(201).json({ success: true, data: submission });
    } catch (error) {
        next(error);
    }
});

// --- COMPETENCY ROUTES (for student dashboard) ---
app.get('/api/competencies/status', authMiddleware, roleMiddleware(['STUDENT']), async (req, res, next) => {
    try {
        const submissions = await prisma.submission.findMany({
            where: { studentId: req.user.userId },
            include: {
                assignment: {
                    include: {
                        competencies: true
                    }
                }
            }
        });

        const competencyStatus = {
            'IN_PROGRESS': 0,
            'ACHIEVED': 0,
            'MASTERED': 0
        };

        // Get all competencies the student has access to
        const studentClasses = await prisma.class.findMany({
            where: {
                students: { some: { id: req.user.userId } },
                deleted_at: null
            },
            include: {
                assignments: {
                    where: { deleted_at: null },
                    include: {
                        competencies: true
                    }
                }
            }
        });
        
        const allCompetencies = new Set();
        studentClasses.forEach(cls => {
            cls.assignments.forEach(assignment => {
                assignment.competencies.forEach(comp => {
                    allCompetencies.add(comp.id);
                });
            });
        });
        
        const achievedCompetencies = new Set();
        submissions.forEach(sub => {
            if (sub.status !== 'IN_PROGRESS') {
                sub.assignment.competencies.forEach(comp => {
                    achievedCompetencies.add(comp.id);
                });
                competencyStatus[sub.status] += sub.assignment.competencies.length;
            }
        });
        
        competencyStatus['IN_PROGRESS'] = allCompetencies.size - achievedCompetencies.size;

        res.json({ success: true, data: competencyStatus });
    } catch (error) {
        next(error);
    }
});

// ===== COMPETENCY PROGRESS ENDPOINTS =====

// Get student's competency progress overview
app.get('/api/competencies/progress', authMiddleware, roleMiddleware(['STUDENT']), async (req, res, next) => {
    try {
        const studentId = req.user.id;

        // Get all classes the student is enrolled in
        const studentClasses = await prisma.class.findMany({
            where: {
                students: {
                    some: {
                        id: studentId
                    }
                }
            },
            include: {
                assignments: {
                    include: {
                        competencies: {
                            include: {
                                progress: {
                                    where: {
                                        studentId: studentId
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        const progressSummary = {
            totalCompetencies: 0,
            notStarted: 0,
            inProgress: 0,
            achieved: 0,
            mastered: 0,
            classesSummary: []
        };

        for (const classItem of studentClasses) {
            const classProgress = {
                classId: classItem.id,
                className: classItem.name,
                assignments: []
            };

            for (const assignment of classItem.assignments) {
                const assignmentProgress = {
                    assignmentId: assignment.id,
                    assignmentTitle: assignment.title,
                    competencies: []
                };

                for (const competency of assignment.competencies) {
                    progressSummary.totalCompetencies++;
                    
                    const progress = competency.progress[0]; // Should be unique per student
                    const status = progress?.status || 'NOT_STARTED';
                    
                    // Count statuses
                    if (status === 'NOT_STARTED') progressSummary.notStarted++;
                    else if (status === 'IN_PROGRESS') progressSummary.inProgress++;
                    else if (status === 'ACHIEVED') progressSummary.achieved++;
                    else if (status === 'MASTERED') progressSummary.mastered++;

                    assignmentProgress.competencies.push({
                        competencyId: competency.id,
                        name: competency.name,
                        description: competency.description,
                        status: status,
                        achievedAt: progress?.achieved_at,
                        feedback: progress?.feedback
                    });
                }

                classProgress.assignments.push(assignmentProgress);
            }

            progressSummary.classesSummary.push(classProgress);
        }

        res.json(progressSummary);
    } catch (error) {
        next(error);
    }
});

// Get detailed progress for a specific class
app.get('/api/classes/:classId/competencies/progress', authMiddleware, roleMiddleware(['STUDENT']), async (req, res, next) => {
    try {
        const { classId } = req.params;
        const studentId = req.user.id;

        // Verify student is enrolled in this class
        const classEnrollment = await prisma.class.findFirst({
            where: {
                id: parseInt(classId),
                students: {
                    some: {
                        id: studentId
                    }
                }
            }
        });

        if (!classEnrollment) {
            return res.status(403).json({
                success: false,
                message: 'You are not enrolled in this class'
            });
        }

        const classData = await prisma.class.findUnique({
            where: { id: parseInt(classId) },
            include: {
                assignments: {
                    include: {
                        competencies: {
                            include: {
                                progress: {
                                    where: {
                                        studentId: studentId
                                    }
                                }
                            }
                        },
                        submissions: {
                            where: {
                                studentId: studentId
                            }
                        }
                    }
                }
            }
        });

        // Calculate progress statistics
        let totalCompetencies = 0;
        let achievedCompetencies = 0;
        let masteredCompetencies = 0;

        classData.assignments.forEach(assignment => {
            assignment.competencies.forEach(competency => {
                totalCompetencies++;
                const progress = competency.progress[0];
                if (progress?.status === 'ACHIEVED') achievedCompetencies++;
                if (progress?.status === 'MASTERED') masteredCompetencies++;
            });
        });

        const progressPercentage = totalCompetencies > 0 ? 
            Math.round(((achievedCompetencies + masteredCompetencies) / totalCompetencies) * 100) : 0;

        const response = {
            classId: classData.id,
            className: classData.name,
            description: classData.description,
            totalCompetencies,
            achievedCompetencies,
            masteredCompetencies,
            progressPercentage,
            assignments: classData.assignments.map(assignment => ({
                id: assignment.id,
                title: assignment.title,
                description: assignment.description,
                deadline: assignment.deadline,
                submission: assignment.submissions[0] || null,
                competencies: assignment.competencies.map(competency => {
                    const progress = competency.progress[0];
                    return {
                        id: competency.id,
                        name: competency.name,
                        description: competency.description,
                        status: progress?.status || 'NOT_STARTED',
                        achievedAt: progress?.achieved_at,
                        feedback: progress?.feedback,
                        createdAt: competency.created_at
                    };
                })
            }))
        };

        res.json(response);
    } catch (error) {
        next(error);
    }
});

// Update competency progress (for teachers)
app.put('/api/competencies/:competencyId/progress/:studentId', authMiddleware, roleMiddleware(['TEACHER']), async (req, res, next) => {
    try {
        const { competencyId, studentId } = req.params;
        const { status, feedback } = req.body;

        const validStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'ACHIEVED', 'MASTERED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
            });
        }

        // Verify the teacher has access to this competency
        const competency = await prisma.competency.findUnique({
            where: { id: parseInt(competencyId) },
            include: {
                assignment: {
                    include: {
                        class: true
                    }
                }
            }
        });

        if (!competency || competency.assignment.class.teacherId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this competency'
            });
        }

        // Upsert competency progress
        const progressData = {
            status,
            feedback: feedback || null,
            achieved_at: (status === 'ACHIEVED' || status === 'MASTERED') ? new Date() : null,
            updated_at: new Date()
        };

        const progress = await prisma.competencyProgress.upsert({
            where: {
                competencyId_studentId: {
                    competencyId: parseInt(competencyId),
                    studentId: parseInt(studentId)
                }
            },
            update: progressData,
            create: {
                competencyId: parseInt(competencyId),
                studentId: parseInt(studentId),
                ...progressData
            }
        });

        res.json({
            success: true,
            message: 'Competency progress updated successfully',
            progress
        });
    } catch (error) {
        next(error);
    }
});

// Get competency progress for a specific assignment (for teachers reviewing submissions)
app.get('/api/assignments/:assignmentId/competencies/progress', authMiddleware, roleMiddleware(['TEACHER']), async (req, res, next) => {
    try {
        const { assignmentId } = req.params;

        // Verify teacher owns this assignment
        const assignment = await prisma.assignment.findFirst({
            where: {
                id: parseInt(assignmentId),
                class: {
                    teacherId: req.user.id
                }
            },
            include: {
                class: {
                    include: {
                        students: true
                    }
                },
                competencies: {
                    include: {
                        progress: {
                            include: {
                                student: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found or you do not have access'
            });
        }

        const response = {
            assignmentId: assignment.id,
            assignmentTitle: assignment.title,
            className: assignment.class.name,
            students: assignment.class.students.map(student => {
                const studentProgress = {};
                assignment.competencies.forEach(competency => {
                    const progress = competency.progress.find(p => p.studentId === student.id);
                    studentProgress[competency.id] = {
                        status: progress?.status || 'NOT_STARTED',
                        achievedAt: progress?.achieved_at,
                        feedback: progress?.feedback
                    };
                });

                return {
                    studentId: student.id,
                    studentName: student.name,
                    studentEmail: student.email,
                    competencyProgress: studentProgress
                };
            }),
            competencies: assignment.competencies.map(competency => ({
                id: competency.id,
                name: competency.name,
                description: competency.description
            }))
        };

        res.json(response);
    } catch (error) {
        next(error);
    }
});

// --- PROFILE ROUTES (Self-management) ---
app.get('/api/profile', authMiddleware, async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                photo: true,
                created_at: true,
                updated_at: true
            }
        });
        if (!user || user.deleted_at) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
});

app.put('/api/profile', authMiddleware, async (req, res, next) => {
    try {
        const { name, email, photo } = req.body;
        if (!name || !email) {
            return res.status(400).json({ success: false, message: 'Name and email are required' });
        }
        // Check if email is already taken by another user
        const emailExists = await prisma.user.findFirst({
            where: {
                email: email.toLowerCase(),
                id: { not: req.user.id },
                deleted_at: null
            }
        });
        if (emailExists) {
            return res.status(409).json({ success: false, message: 'Email is already taken by another user' });
        }
        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                name,
                email: email.toLowerCase(),
                photo: photo || undefined
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                photo: true,
                created_at: true,
                updated_at: true
            }
        });
        res.json({ success: true, data: updatedUser });
    } catch (error) {
        next(error);
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// ===== REPORTING ENDPOINTS =====

// Get comprehensive student progress report
app.get('/api/reports/student/:studentId/progress', authMiddleware, roleMiddleware(['TEACHER']), async (req, res, next) => {
    try {
        const { studentId } = req.params;
        const { startDate, endDate, classId } = req.query;

        // Verify teacher has access to this student
        const studentAccess = await prisma.user.findFirst({
            where: {
                id: parseInt(studentId),
                classes: {
                    some: {
                        teacherId: req.user.userId
                    }
                }
            }
        });

        if (!studentAccess) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this student'
            });
        }

        // Build where clause for filtering
        let whereClause = {
            studentId: parseInt(studentId)
        };

        if (classId) {
            whereClause.competency = {
                assignment: {
                    classId: parseInt(classId)
                }
            };
        } else {
            whereClause.competency = {
                assignment: {
                    class: {
                        teacherId: req.user.userId
                    }
                }
            };
        }

        if (startDate || endDate) {
            whereClause.created_at = {};
            if (startDate) whereClause.created_at.gte = new Date(startDate);
            if (endDate) whereClause.created_at.lte = new Date(endDate);
        }

        // Get all competency progress for the student
        const progressHistory = await prisma.competencyProgress.findMany({
            where: whereClause,
            include: {
                competency: {
                    include: {
                        assignment: {
                            include: {
                                class: true
                            }
                        }
                    }
                },
                student: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                created_at: 'asc'
            }
        });

        // Get student's submissions for context
        const submissions = await prisma.submission.findMany({
            where: {
                studentId: parseInt(studentId),
                assignment: {
                    class: classId ? {
                        id: parseInt(classId)
                    } : {
                        teacherId: req.user.userId
                    }
                }
            },
            include: {
                assignment: {
                    include: {
                        class: true,
                        competencies: true
                    }
                }
            },
            orderBy: {
                submitted_at: 'asc'
            }
        });

        // Calculate progress statistics over time
        const progressOverTime = [];
        const competencyMap = new Map();
        
        progressHistory.forEach(progress => {
            const date = progress.created_at.toISOString().split('T')[0];
            const competencyKey = `${progress.competency.assignment.class.name} - ${progress.competency.assignment.title} - ${progress.competency.name}`;
            
            if (!competencyMap.has(competencyKey)) {
                competencyMap.set(competencyKey, []);
            }
            
            competencyMap.get(competencyKey).push({
                date,
                status: progress.status,
                feedback: progress.feedback,
                achievedAt: progress.achieved_at,
                className: progress.competency.assignment.class.name,
                assignmentTitle: progress.competency.assignment.title,
                competencyName: progress.competency.name,
                competencyDescription: progress.competency.description
            });
        });

        // Calculate summary statistics
        const totalCompetencies = competencyMap.size;
        let achievedCount = 0;
        let masteredCount = 0;
        let inProgressCount = 0;
        let notStartedCount = 0;

        competencyMap.forEach(progressArray => {
            const latestProgress = progressArray[progressArray.length - 1];
            switch (latestProgress.status) {
                case 'ACHIEVED': achievedCount++; break;
                case 'MASTERED': masteredCount++; break;
                case 'IN_PROGRESS': inProgressCount++; break;
                default: notStartedCount++; break;
            }
        });

        // Generate timeline data for charts
        const timelineData = [];
        const dates = [...new Set(progressHistory.map(p => p.created_at.toISOString().split('T')[0]))].sort();
        
        dates.forEach(date => {
            const dayProgress = progressHistory.filter(p => p.created_at.toISOString().split('T')[0] === date);
            const statusCounts = {
                date,
                achieved: dayProgress.filter(p => p.status === 'ACHIEVED').length,
                mastered: dayProgress.filter(p => p.status === 'MASTERED').length,
                inProgress: dayProgress.filter(p => p.status === 'IN_PROGRESS').length,
                total: dayProgress.length
            };
            timelineData.push(statusCounts);
        });

        // Class breakdown
        const classSummary = {};
        progressHistory.forEach(progress => {
            const className = progress.competency.assignment.class.name;
            if (!classSummary[className]) {
                classSummary[className] = {
                    className,
                    classId: progress.competency.assignment.class.id,
                    totalCompetencies: 0,
                    achieved: 0,
                    mastered: 0,
                    inProgress: 0,
                    notStarted: 0
                };
            }
            classSummary[className].totalCompetencies++;
            
            switch (progress.status) {
                case 'ACHIEVED': classSummary[className].achieved++; break;
                case 'MASTERED': classSummary[className].mastered++; break;
                case 'IN_PROGRESS': classSummary[className].inProgress++; break;
                default: classSummary[className].notStarted++; break;
            }
        });

        const response = {
            student: progressHistory[0]?.student || { id: parseInt(studentId), name: 'Unknown', email: 'Unknown' },
            reportPeriod: {
                startDate: startDate || progressHistory[0]?.created_at,
                endDate: endDate || progressHistory[progressHistory.length - 1]?.created_at,
                classFilter: classId || null
            },
            summary: {
                totalCompetencies,
                achieved: achievedCount,
                mastered: masteredCount,
                in_progress: inProgressCount,
                not_started: notStartedCount,
                completionRate: totalCompetencies > 0 ? Math.round(((achievedCount + masteredCount) / totalCompetencies) * 100) : 0
            },
            timeline: Array.from(competencyMap.entries()).map(([competencyKey, progressArray]) => {
                const parts = competencyKey.split(' - ');
                const latestProgress = progressArray[progressArray.length - 1];
                return {
                    className: latestProgress.className,
                    assignmentTitle: latestProgress.assignmentTitle,
                    competencyName: latestProgress.competencyName,
                    status: latestProgress.status,
                    updated_at: latestProgress.achievedAt || latestProgress.date,
                    feedback: latestProgress.feedback
                };
            }),
            classesSummary: Object.values(classSummary).map(cls => ({
                className: cls.className,
                classId: cls.classId,
                totalCompetencies: cls.totalCompetencies,
                not_started: cls.notStarted,
                in_progress: cls.inProgress,
                achieved: cls.achieved,
                mastered: cls.mastered,
                progressPercentage: cls.totalCompetencies > 0 ? Math.round(((cls.achieved + cls.mastered) / cls.totalCompetencies) * 100) : 0
            })),
            competencyDetails: Array.from(competencyMap.entries()).map(([competencyKey, progressArray]) => ({
                competencyKey,
                progressHistory: progressArray,
                currentStatus: progressArray[progressArray.length - 1].status,
                firstRecorded: progressArray[0].date,
                lastUpdated: progressArray[progressArray.length - 1].date
            })),
            submissions: submissions.map(sub => ({
                id: sub.id,
                assignmentTitle: sub.assignment.title,
                className: sub.assignment.class.name,
                status: sub.status,
                submittedAt: sub.submitted_at,
                reviewedAt: sub.reviewed_at,
                feedback: sub.feedback,
                competencyCount: sub.assignment.competencies.length
            }))
        };

        res.json({ success: true, data: response });
    } catch (error) {
        next(error);
    }
});

// Get class-wide competency progress report
app.get('/api/reports/class/:classId/progress', authMiddleware, roleMiddleware(['TEACHER']), async (req, res, next) => {
    try {
        const { classId } = req.params;
        const { startDate, endDate } = req.query;

        // Verify teacher owns this class
        const classData = await prisma.class.findFirst({
            where: {
                id: parseInt(classId),
                teacherId: req.user.userId
            },
            include: {
                students: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                assignments: {
                    include: {
                        competencies: {
                            include: {
                                progress: {
                                    where: startDate || endDate ? {
                                        created_at: {
                                            ...(startDate && { gte: new Date(startDate) }),
                                            ...(endDate && { lte: new Date(endDate) })
                                        }
                                    } : undefined,
                                    include: {
                                        student: {
                                            select: {
                                                id: true,
                                                name: true,
                                                email: true
                                            }
                                        }
                                    },
                                    orderBy: {
                                        created_at: 'desc'
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!classData) {
            return res.status(404).json({
                success: false,
                message: 'Class not found or you do not have access'
            });
        }

        // Calculate class-wide statistics
        const studentProgress = {};
        let totalCompetencies = 0;
        const competencyStats = {
            achieved: 0,
            mastered: 0,
            inProgress: 0,
            notStarted: 0
        };

        // Initialize student progress tracking
        classData.students.forEach(student => {
            studentProgress[student.id] = {
                student,
                competencies: {},
                summary: { achieved: 0, mastered: 0, inProgress: 0, notStarted: 0, total: 0 }
            };
        });

        // Process each assignment and its competencies
        classData.assignments.forEach(assignment => {
            assignment.competencies.forEach(competency => {
                totalCompetencies++;
                
                // Initialize competency status for all students
                classData.students.forEach(student => {
                    studentProgress[student.id].competencies[competency.id] = {
                        competencyId: competency.id,
                        competencyName: competency.name,
                        status: 'NOT_STARTED',
                        lastUpdated: null,
                        feedback: null
                    };
                    studentProgress[student.id].summary.total++;
                    studentProgress[student.id].summary.notStarted++;
                    competencyStats.notStarted++;
                });

                // Update with actual progress data
                competency.progress.forEach(progress => {
                    const studentId = progress.studentId;
                    const currentStatus = studentProgress[studentId].competencies[competency.id].status;
                    
                    // Remove from old status count
                    studentProgress[studentId].summary[currentStatus.toLowerCase().replace('_', '')]--;
                    competencyStats[currentStatus.toLowerCase().replace('_', '')]--;
                    
                    // Update to new status
                    studentProgress[studentId].competencies[competency.id] = {
                        competencyId: competency.id,
                        competencyName: competency.name,
                        status: progress.status,
                        lastUpdated: progress.created_at,
                        feedback: progress.feedback
                    };
                    
                    // Add to new status count
                    studentProgress[studentId].summary[progress.status.toLowerCase().replace('_', '')]++;
                    competencyStats[progress.status.toLowerCase().replace('_', '')]++;
                });
            });
        });

        // Generate progress trends
        const progressTrends = [];
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const days = [];
            
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                days.push(new Date(d).toISOString().split('T')[0]);
            }
            
            days.forEach(day => {
                const dayStats = { date: day, achieved: 0, mastered: 0, inProgress: 0, total: 0 };
                
                classData.assignments.forEach(assignment => {
                    assignment.competencies.forEach(competency => {
                        competency.progress.forEach(progress => {
                            if (progress.created_at.toISOString().split('T')[0] === day) {
                                dayStats.total++;
                                if (progress.status === 'ACHIEVED') dayStats.achieved++;
                                if (progress.status === 'MASTERED') dayStats.mastered++;
                                if (progress.status === 'IN_PROGRESS') dayStats.inProgress++;
                            }
                        });
                    });
                });
                
                if (dayStats.total > 0) {
                    progressTrends.push(dayStats);
                }
            });
        }

        const response = {
            class: {
                id: classData.id,
                name: classData.name,
                description: classData.description,
                studentCount: classData.students.length,
                assignmentCount: classData.assignments.length,
                totalCompetencies
            },
            reportPeriod: {
                startDate: startDate || null,
                endDate: endDate || null
            },
            summary: {
                totalStudents: classData.students.length,
                totalCompetencies: totalCompetencies,
                totalAssignments: classData.assignments.length,
                averageProgress: totalCompetencies > 0 ? 
                    Math.round(((competencyStats.achieved + competencyStats.mastered) / (totalCompetencies * classData.students.length)) * 100) : 0
            },
            competencyBreakdown: classData.assignments.map(assignment => ({
                competencyName: assignment.competencies.map(c => c.name).join(', '),
                assignmentTitle: assignment.title,
                not_started: assignment.competencies.reduce((sum, comp) => 
                    sum + comp.progress.filter(p => p.status === 'NOT_STARTED').length, 0),
                in_progress: assignment.competencies.reduce((sum, comp) => 
                    sum + comp.progress.filter(p => p.status === 'IN_PROGRESS').length, 0),
                achieved: assignment.competencies.reduce((sum, comp) => 
                    sum + comp.progress.filter(p => p.status === 'ACHIEVED').length, 0),
                mastered: assignment.competencies.reduce((sum, comp) => 
                    sum + comp.progress.filter(p => p.status === 'MASTERED').length, 0)
            })),
            studentsSummary: Object.values(studentProgress).map(sp => ({
                studentName: sp.student.name,
                studentId: sp.student.id,
                totalCompetencies: sp.summary.total,
                not_started: sp.summary.notStarted,
                in_progress: sp.summary.inProgress,
                achieved: sp.summary.achieved,
                mastered: sp.summary.mastered,
                progressPercentage: sp.summary.total > 0 ? 
                    Math.round(((sp.summary.achieved + sp.summary.mastered) / sp.summary.total) * 100) : 0
            })),
            progressTrends,
            assignments: classData.assignments.map(assignment => ({
                id: assignment.id,
                title: assignment.title,
                competencyCount: assignment.competencies.length,
                completionStats: assignment.competencies.reduce((stats, comp) => {
                    comp.progress.forEach(prog => {
                        stats[prog.status.toLowerCase().replace('_', '')]++;
                        stats.total++;
                    });
                    return stats;
                }, { achieved: 0, mastered: 0, inProgress: 0, notStarted: 0, total: 0 })
            }))
        };

        res.json({ success: true, data: response });
    } catch (error) {
        next(error);
    }
});

// Get competency-specific progress report across all students
app.get('/api/reports/competency/:competencyId/progress', authMiddleware, roleMiddleware(['TEACHER']), async (req, res, next) => {
    try {
        const { competencyId } = req.params;

        // Verify teacher has access to this competency
        const competency = await prisma.competency.findFirst({
            where: {
                id: parseInt(competencyId),
                assignment: {
                    class: {
                        teacherId: req.user.userId
                    }
                }
            },
            include: {
                assignment: {
                    include: {
                        class: {
                            include: {
                                students: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true
                                    }
                                }
                            }
                        }
                    }
                },
                progress: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    },
                    orderBy: {
                        created_at: 'asc'
                    }
                }
            }
        });

        if (!competency) {
            return res.status(404).json({
                success: false,
                message: 'Competency not found or you do not have access'
            });
        }

        // Calculate statistics
        const stats = {
            totalStudents: competency.assignment.class.students.length,
            achieved: 0,
            mastered: 0,
            inProgress: 0,
            notStarted: 0
        };

        const studentProgress = {};
        
        // Initialize all students
        competency.assignment.class.students.forEach(student => {
            studentProgress[student.id] = {
                student,
                status: 'NOT_STARTED',
                progressHistory: [],
                firstAttempt: null,
                lastUpdated: null,
                feedback: null
            };
            stats.notStarted++;
        });

        // Process progress records
        competency.progress.forEach(progress => {
            const studentId = progress.studentId;
            
            // Update latest status
            if (!studentProgress[studentId].lastUpdated || progress.created_at > studentProgress[studentId].lastUpdated) {
                // Remove from old status count
                stats[studentProgress[studentId].status.toLowerCase().replace('_', '')]--;
                
                // Update to new status
                studentProgress[studentId].status = progress.status;
                studentProgress[studentId].lastUpdated = progress.created_at;
                studentProgress[studentId].feedback = progress.feedback;
                
                // Add to new status count
                stats[progress.status.toLowerCase().replace('_', '')]++;
            }

            // Track first attempt
            if (!studentProgress[studentId].firstAttempt || progress.created_at < studentProgress[studentId].firstAttempt) {
                studentProgress[studentId].firstAttempt = progress.created_at;
            }

            // Add to history
            studentProgress[studentId].progressHistory.push({
                status: progress.status,
                date: progress.created_at,
                feedback: progress.feedback,
                achievedAt: progress.achieved_at
            });
        });

        const response = {
            competency: {
                id: competency.id,
                name: competency.name,
                description: competency.description,
                assignment: {
                    id: competency.assignment.id,
                    title: competency.assignment.title,
                    class: {
                        id: competency.assignment.class.id,
                        name: competency.assignment.class.name
                    }
                }
            },
            summary: {
                totalStudents: stats.totalStudents,
                not_started: stats.notStarted,
                in_progress: stats.inProgress,
                achieved: stats.achieved,
                mastered: stats.mastered,
                completionRate: stats.totalStudents > 0 ? 
                    Math.round(((stats.achieved + stats.mastered) / stats.totalStudents) * 100) : 0
            },
            studentBreakdown: Object.values(studentProgress).map(sp => ({
                studentName: sp.student.name,
                studentId: sp.student.id,
                status: sp.status,
                updated_at: sp.lastUpdated,
                assignmentTitle: competency.assignment.title,
                className: competency.assignment.class.name,
                feedback: sp.feedback,
                firstAttempt: sp.firstAttempt
            })),
            assignmentBreakdown: [{
                assignmentTitle: competency.assignment.title,
                className: competency.assignment.class.name,
                totalStudents: stats.totalStudents,
                not_started: stats.notStarted,
                in_progress: stats.inProgress,
                achieved: stats.achieved,
                mastered: stats.mastered
            }],
            progressHistory: Object.values(studentProgress).map(sp => ({
                studentName: sp.student.name,
                progressHistory: sp.progressHistory
            }))
        };

        res.json({ success: true, data: response });
    } catch (error) {
        next(error);
    }
});

// 404 handler
// ===== MASTERY TRANSCRIPT ENDPOINT =====

// Get mastery transcript for a student
app.get('/api/reports/student/:studentId/mastery-transcript', authMiddleware, roleMiddleware(['TEACHER', 'ADMIN']), async (req, res, next) => {
    try {
        const { studentId } = req.params;

        // Get student information
        const student = await prisma.user.findUnique({
            where: { 
                id: parseInt(studentId),
                role: 'STUDENT'
            },
            select: {
                id: true,
                name: true,
                email: true
            }
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Get all competency progress for the student
        const competencyProgress = await prisma.competencyProgress.findMany({
            where: {
                studentId: parseInt(studentId)
            },
            include: {
                competency: {
                    include: {
                        assignment: {
                            include: {
                                class: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                achieved_at: 'desc'
            }
        });

        // Group competencies by class and assignment
        const transcript = {
            student,
            classes: {}
        };

        competencyProgress.forEach(progress => {
            const className = progress.competency.assignment.class.name;
            const assignmentTitle = progress.competency.assignment.title;
            const competencyName = progress.competency.name;

            if (!transcript.classes[className]) {
                transcript.classes[className] = {
                    name: className,
                    assignments: {}
                };
            }

            if (!transcript.classes[className].assignments[assignmentTitle]) {
                transcript.classes[className].assignments[assignmentTitle] = {
                    title: assignmentTitle,
                    competencies: []
                };
            }

            transcript.classes[className].assignments[assignmentTitle].competencies.push({
                name: competencyName,
                status: progress.status,
                achievedAt: progress.achieved_at,
                feedback: progress.feedback,
                masteryLevel: progress.mastery_level || 'Developing'
            });
        });

        // Calculate statistics
        const totalCompetencies = competencyProgress.length;
        const masteredCount = competencyProgress.filter(p => p.status === 'MASTERED').length;
        const inProgressCount = competencyProgress.filter(p => p.status === 'IN_PROGRESS').length;
        const notStartedCount = competencyProgress.filter(p => p.status === 'NOT_STARTED').length;

        const statistics = {
            total: totalCompetencies,
            mastered: masteredCount,
            inProgress: inProgressCount,
            notStarted: notStartedCount,
            masteryPercentage: totalCompetencies > 0 ? Math.round((masteredCount / totalCompetencies) * 100) : 0
        };

        res.json({
            success: true,
            data: {
                ...transcript,
                statistics,
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        next(error);
    }
});

// --- END MASTERY TRANSCRIPT ENDPOINT ---

app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found'
    });
});

// Apply error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// ===== REPORTING ENDPOINTS =====

// Get comprehensive student progress report
app.get('/api/reports/student/:studentId/progress', authMiddleware, roleMiddleware(['TEACHER']), async (req, res, next) => {
    try {
        const { studentId } = req.params;
        const { startDate, endDate, classId } = req.query;

        // Verify teacher has access to this student
        const studentAccess = await prisma.user.findFirst({
            where: {
                id: parseInt(studentId),
                classes: {
                    some: {
                        teacherId: req.user.userId
                    }
                }
            }
        });

        if (!studentAccess) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this student'
            });
        }

        // Build where clause for filtering
        let whereClause = {
            studentId: parseInt(studentId)
        };

        if (classId) {
            whereClause.competency = {
                assignment: {
                    classId: parseInt(classId)
                }
            };
        } else {
            whereClause.competency = {
                assignment: {
                    class: {
                        teacherId: req.user.userId
                    }
                }
            };
        }

        if (startDate || endDate) {
            whereClause.created_at = {};
            if (startDate) whereClause.created_at.gte = new Date(startDate);
            if (endDate) whereClause.created_at.lte = new Date(endDate);
        }

        // Get all competency progress for the student
        const progressHistory = await prisma.competencyProgress.findMany({
            where: whereClause,
            include: {
                competency: {
                    include: {
                        assignment: {
                            include: {
                                class: true
                            }
                        }
                    }
                },
                student: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                created_at: 'asc'
            }
        });

        // Get student's submissions for context
        const submissions = await prisma.submission.findMany({
            where: {
                studentId: parseInt(studentId),
                assignment: {
                    class: classId ? {
                        id: parseInt(classId)
                    } : {
                        teacherId: req.user.userId
                    }
                }
            },
            include: {
                assignment: {
                    include: {
                        class: true,
                        competencies: true
                    }
                }
            },
            orderBy: {
                submitted_at: 'asc'
            }
        });

        // Calculate progress statistics over time
        const progressOverTime = [];
        const competencyMap = new Map();
        
        progressHistory.forEach(progress => {
            const date = progress.created_at.toISOString().split('T')[0];
            const competencyKey = `${progress.competency.assignment.class.name} - ${progress.competency.assignment.title} - ${progress.competency.name}`;
            
            if (!competencyMap.has(competencyKey)) {
                competencyMap.set(competencyKey, []);
            }
            
            competencyMap.get(competencyKey).push({
                date,
                status: progress.status,
                feedback: progress.feedback,
                achievedAt: progress.achieved_at,
                className: progress.competency.assignment.class.name,
                assignmentTitle: progress.competency.assignment.title,
                competencyName: progress.competency.name,
                competencyDescription: progress.competency.description
            });
        });

        // Calculate summary statistics
        const totalCompetencies = competencyMap.size;
        let achievedCount = 0;
        let masteredCount = 0;
        let inProgressCount = 0;
        let notStartedCount = 0;

        competencyMap.forEach(progressArray => {
            const latestProgress = progressArray[progressArray.length - 1];
            switch (latestProgress.status) {
                case 'ACHIEVED': achievedCount++; break;
                case 'MASTERED': masteredCount++; break;
                case 'IN_PROGRESS': inProgressCount++; break;
                default: notStartedCount++; break;
            }
        });

        // Generate timeline data for charts
        const timelineData = [];
        const dates = [...new Set(progressHistory.map(p => p.created_at.toISOString().split('T')[0]))].sort();
        
        dates.forEach(date => {
            const dayProgress = progressHistory.filter(p => p.created_at.toISOString().split('T')[0] === date);
            const statusCounts = {
                date,
                achieved: dayProgress.filter(p => p.status === 'ACHIEVED').length,
                mastered: dayProgress.filter(p => p.status === 'MASTERED').length,
                inProgress: dayProgress.filter(p => p.status === 'IN_PROGRESS').length,
                total: dayProgress.length
            };
            timelineData.push(statusCounts);
        });

        // Class breakdown
        const classSummary = {};
        progressHistory.forEach(progress => {
            const className = progress.competency.assignment.class.name;
            if (!classSummary[className]) {
                classSummary[className] = {
                    className,
                    classId: progress.competency.assignment.class.id,
                    totalCompetencies: 0,
                    achieved: 0,
                    mastered: 0,
                    inProgress: 0,
                    notStarted: 0
                };
            }
            classSummary[className].totalCompetencies++;
            
            switch (progress.status) {
                case 'ACHIEVED': classSummary[className].achieved++; break;
                case 'MASTERED': classSummary[className].mastered++; break;
                case 'IN_PROGRESS': classSummary[className].inProgress++; break;
                default: classSummary[className].notStarted++; break;
            }
        });

        const response = {
            student: progressHistory[0]?.student || { id: parseInt(studentId), name: 'Unknown', email: 'Unknown' },
            reportPeriod: {
                startDate: startDate || progressHistory[0]?.created_at,
                endDate: endDate || progressHistory[progressHistory.length - 1]?.created_at,
                classFilter: classId || null
            },
            summary: {
                totalCompetencies,
                achieved: achievedCount,
                mastered: masteredCount,
                in_progress: inProgressCount,
                not_started: notStartedCount,
                completionRate: totalCompetencies > 0 ? Math.round(((achievedCount + masteredCount) / totalCompetencies) * 100) : 0
            },
            timeline: Array.from(competencyMap.entries()).map(([competencyKey, progressArray]) => {
                const parts = competencyKey.split(' - ');
                const latestProgress = progressArray[progressArray.length - 1];
                return {
                    className: latestProgress.className,
                    assignmentTitle: latestProgress.assignmentTitle,
                    competencyName: latestProgress.competencyName,
                    status: latestProgress.status,
                    updated_at: latestProgress.achievedAt || latestProgress.date,
                    feedback: latestProgress.feedback
                };
            }),
            classesSummary: Object.values(classSummary).map(cls => ({
                className: cls.className,
                classId: cls.classId,
                totalCompetencies: cls.totalCompetencies,
                not_started: cls.notStarted,
                in_progress: cls.inProgress,
                achieved: cls.achieved,
                mastered: cls.mastered,
                progressPercentage: cls.totalCompetencies > 0 ? Math.round(((cls.achieved + cls.mastered) / cls.totalCompetencies) * 100) : 0
            })),
            competencyDetails: Array.from(competencyMap.entries()).map(([competencyKey, progressArray]) => ({
                competencyKey,
                progressHistory: progressArray,
                currentStatus: progressArray[progressArray.length - 1].status,
                firstRecorded: progressArray[0].date,
                lastUpdated: progressArray[progressArray.length - 1].date
            })),
            submissions: submissions.map(sub => ({
                id: sub.id,
                assignmentTitle: sub.assignment.title,
                className: sub.assignment.class.name,
                status: sub.status,
                submittedAt: sub.submitted_at,
                reviewedAt: sub.reviewed_at,
                feedback: sub.feedback,
                competencyCount: sub.assignment.competencies.length
            }))
        };

        res.json({ success: true, data: response });
    } catch (error) {
        next(error);
    }
});

// Get class-wide competency progress report
app.get('/api/reports/class/:classId/progress', authMiddleware, roleMiddleware(['TEACHER']), async (req, res, next) => {
    try {
        const { classId } = req.params;
        const { startDate, endDate } = req.query;

        // Verify teacher owns this class
        const classData = await prisma.class.findFirst({
            where: {
                id: parseInt(classId),
                teacherId: req.user.userId
            },
            include: {
                students: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                assignments: {
                    include: {
                        competencies: {
                            include: {
                                progress: {
                                    where: startDate || endDate ? {
                                        created_at: {
                                            ...(startDate && { gte: new Date(startDate) }),
                                            ...(endDate && { lte: new Date(endDate) })
                                        }
                                    } : undefined,
                                    include: {
                                        student: {
                                            select: {
                                                id: true,
                                                name: true,
                                                email: true
                                            }
                                        }
                                    },
                                    orderBy: {
                                        created_at: 'desc'
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!classData) {
            return res.status(404).json({
                success: false,
                message: 'Class not found or you do not have access'
            });
        }

        // Calculate class-wide statistics
        const studentProgress = {};
        let totalCompetencies = 0;
        const competencyStats = {
            achieved: 0,
            mastered: 0,
            inProgress: 0,
            notStarted: 0
        };

        // Initialize student progress tracking
        classData.students.forEach(student => {
            studentProgress[student.id] = {
                student,
                competencies: {},
                summary: { achieved: 0, mastered: 0, inProgress: 0, notStarted: 0, total: 0 }
            };
        });

        // Process each assignment and its competencies
        classData.assignments.forEach(assignment => {
            assignment.competencies.forEach(competency => {
                totalCompetencies++;
                
                // Initialize competency status for all students
                classData.students.forEach(student => {
                    studentProgress[student.id].competencies[competency.id] = {
                        competencyId: competency.id,
                        competencyName: competency.name,
                        status: 'NOT_STARTED',
                        lastUpdated: null,
                        feedback: null
                    };
                    studentProgress[student.id].summary.total++;
                    studentProgress[student.id].summary.notStarted++;
                    competencyStats.notStarted++;
                });

                // Update with actual progress data
                competency.progress.forEach(progress => {
                    const studentId = progress.studentId;
                    const currentStatus = studentProgress[studentId].competencies[competency.id].status;
                    
                    // Remove from old status count
                    studentProgress[studentId].summary[currentStatus.toLowerCase().replace('_', '')]--;
                    competencyStats[currentStatus.toLowerCase().replace('_', '')]--;
                    
                    // Update to new status
                    studentProgress[studentId].competencies[competency.id] = {
                        competencyId: competency.id,
                        competencyName: competency.name,
                        status: progress.status,
                        lastUpdated: progress.created_at,
                        feedback: progress.feedback
                    };
                    
                    // Add to new status count
                    studentProgress[studentId].summary[progress.status.toLowerCase().replace('_', '')]++;
                    competencyStats[progress.status.toLowerCase().replace('_', '')]++;
                });
            });
        });

        // Generate progress trends
        const progressTrends = [];
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const days = [];
            
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                days.push(new Date(d).toISOString().split('T')[0]);
            }
            
            days.forEach(day => {
                const dayStats = { date: day, achieved: 0, mastered: 0, inProgress: 0, total: 0 };
                
                classData.assignments.forEach(assignment => {
                    assignment.competencies.forEach(competency => {
                        competency.progress.forEach(progress => {
                            if (progress.created_at.toISOString().split('T')[0] === day) {
                                dayStats.total++;
                                if (progress.status === 'ACHIEVED') dayStats.achieved++;
                                if (progress.status === 'MASTERED') dayStats.mastered++;
                                if (progress.status === 'IN_PROGRESS') dayStats.inProgress++;
                            }
                        });
                    });
                });
                
                if (dayStats.total > 0) {
                    progressTrends.push(dayStats);
                }
            });
        }

        const response = {
            class: {
                id: classData.id,
                name: classData.name,
                description: classData.description,
                studentCount: classData.students.length,
                assignmentCount: classData.assignments.length,
                totalCompetencies
            },
            reportPeriod: {
                startDate: startDate || null,
                endDate: endDate || null
            },
            summary: {
                totalStudents: classData.students.length,
                totalCompetencies: totalCompetencies,
                totalAssignments: classData.assignments.length,
                averageProgress: totalCompetencies > 0 ? 
                    Math.round(((competencyStats.achieved + competencyStats.mastered) / (totalCompetencies * classData.students.length)) * 100) : 0
            },
            competencyBreakdown: classData.assignments.map(assignment => ({
                competencyName: assignment.competencies.map(c => c.name).join(', '),
                assignmentTitle: assignment.title,
                not_started: assignment.competencies.reduce((sum, comp) => 
                    sum + comp.progress.filter(p => p.status === 'NOT_STARTED').length, 0),
                in_progress: assignment.competencies.reduce((sum, comp) => 
                    sum + comp.progress.filter(p => p.status === 'IN_PROGRESS').length, 0),
                achieved: assignment.competencies.reduce((sum, comp) => 
                    sum + comp.progress.filter(p => p.status === 'ACHIEVED').length, 0),
                mastered: assignment.competencies.reduce((sum, comp) => 
                    sum + comp.progress.filter(p => p.status === 'MASTERED').length, 0)
            })),
            studentsSummary: Object.values(studentProgress).map(sp => ({
                studentName: sp.student.name,
                studentId: sp.student.id,
                totalCompetencies: sp.summary.total,
                not_started: sp.summary.notStarted,
                in_progress: sp.summary.inProgress,
                achieved: sp.summary.achieved,
                mastered: sp.summary.mastered,
                progressPercentage: sp.summary.total > 0 ? 
                    Math.round(((sp.summary.achieved + sp.summary.mastered) / sp.summary.total) * 100) : 0
            })),
            progressTrends,
            assignments: classData.assignments.map(assignment => ({
                id: assignment.id,
                title: assignment.title,
                competencyCount: assignment.competencies.length,
                completionStats: assignment.competencies.reduce((stats, comp) => {
                    comp.progress.forEach(prog => {
                        stats[prog.status.toLowerCase().replace('_', '')]++;
                        stats.total++;
                    });
                    return stats;
                }, { achieved: 0, mastered: 0, inProgress: 0, notStarted: 0, total: 0 })
            }))
        };

        res.json({ success: true, data: response });
    } catch (error) {
        next(error);
    }
});

// --- END REPORTING ENDPOINTS ---

// --- TRASH ENDPOINTS ---

// Get all deleted items for the teacher
app.get('/api/trash', authMiddleware, roleMiddleware(['TEACHER']), async (req, res, next) => {
    try {
        // Get deleted classes for this teacher
        const deletedClasses = await prisma.class.findMany({
            where: {
                teacherId: req.user.userId,
                deleted_at: { not: null }
            },
            include: {
                teacher: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                students: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                assignments: {
                    where: {
                        deleted_at: null // Only include non-deleted assignments
                    },
                    select: {
                        id: true,
                        title: true
                    }
                }
            },
            orderBy: {
                deleted_at: 'desc'
            }
        });

        // Get deleted assignments for this teacher
        const deletedAssignments = await prisma.assignment.findMany({
            where: {
                class: {
                    teacherId: req.user.userId
                },
                deleted_at: { not: null }
            },
            include: {
                class: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                competencies: true,
                submissions: {
                    select: {
                        id: true,
                        studentId: true
                    }
                }
            },
            orderBy: {
                deleted_at: 'desc'
            }
        });

        res.json({
            success: true,
            data: {
                deletedClasses,
                deletedAssignments
            }
        });
    } catch (error) {
        next(error);
    }
});

// Restore a deleted class
app.post('/api/trash/restore/class/:classId', authMiddleware, roleMiddleware(['TEACHER']), async (req, res, next) => {
    try {
        const { classId } = req.params;

        // Verify the class belongs to this teacher and is deleted
        const deletedClass = await prisma.class.findFirst({
            where: {
                id: parseInt(classId),
                teacherId: req.user.userId,
                deleted_at: { not: null }
            }
        });

        if (!deletedClass) {
            return res.status(404).json({
                success: false,
                message: 'Deleted class not found or you do not have permission to restore it'
            });
        }

        // Restore the class by setting deleted_at to null
        const restoredClass = await prisma.class.update({
            where: { id: parseInt(classId) },
            data: { deleted_at: null },
            include: {
                teacher: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                students: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        res.json({
            success: true,
            message: 'Class restored successfully',
            data: restoredClass
        });
    } catch (error) {
        next(error);
    }
});

// Permanently delete a class
app.delete('/api/trash/permanent/class/:classId', authMiddleware, roleMiddleware(['TEACHER']), async (req, res, next) => {
    try {
        const { classId } = req.params;

        // Verify the class belongs to this teacher and is deleted
        const deletedClass = await prisma.class.findFirst({
            where: {
                id: parseInt(classId),
                teacherId: req.user.userId,
                deleted_at: { not: null }
            }
        });

        if (!deletedClass) {
            return res.status(404).json({
                success: false,
                message: 'Deleted class not found or you do not have permission to delete it'
            });
        }

        // Delete all related data in the correct order
        await prisma.$transaction(async (tx) => {
            // Delete competency progress
            await tx.competencyProgress.deleteMany({
                where: {
                    competency: {
                        assignment: {
                            classId: parseInt(classId)
                        }
                    }
                }
            });

            // Delete submissions
            await tx.submission.deleteMany({
                where: {
                    assignment: {
                        classId: parseInt(classId)
                    }
                }
            });

            // Delete competencies
            await tx.competency.deleteMany({
                where: {
                    assignment: {
                        classId: parseInt(classId)
                    }
                }
            });

            // Delete assignments
            await tx.assignment.deleteMany({
                where: {
                    classId: parseInt(classId)
                }
            });

            // Finally delete the class
            await tx.class.delete({
                where: { id: parseInt(classId) }
            });
        });

        res.json({
            success: true,
            message: 'Class permanently deleted'
        });
    } catch (error) {
        next(error);
    }
});

// Restore a deleted assignment
app.post('/api/trash/restore/assignment/:assignmentId', authMiddleware, roleMiddleware(['TEACHER']), async (req, res, next) => {
    try {
        const { assignmentId } = req.params;

        // Verify the assignment belongs to this teacher and is deleted
        const deletedAssignment = await prisma.assignment.findFirst({
            where: {
                id: parseInt(assignmentId),
                class: {
                    teacherId: req.user.userId
                },
                deleted_at: { not: null }
            }
        });

        if (!deletedAssignment) {
            return res.status(404).json({
                success: false,
                message: 'Deleted assignment not found or you do not have permission to restore it'
            });
        }

        // Restore the assignment by setting deleted_at to null
        const restoredAssignment = await prisma.assignment.update({
            where: { id: parseInt(assignmentId) },
            data: { deleted_at: null },
            include: {
                class: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                competencies: true
            }
        });

        res.json({
            success: true,
            message: 'Assignment restored successfully',
            data: restoredAssignment
        });
    } catch (error) {
        next(error);
    }
});

// Permanently delete an assignment
app.delete('/api/trash/permanent/assignment/:assignmentId', authMiddleware, roleMiddleware(['TEACHER']), async (req, res, next) => {
    try {
        const { assignmentId } = req.params;

        // Verify the assignment belongs to this teacher and is deleted
        const deletedAssignment = await prisma.assignment.findFirst({
            where: {
                id: parseInt(assignmentId),
                class: {
                    teacherId: req.user.userId
                },
                deleted_at: { not: null }
            }
        });

        if (!deletedAssignment) {
            return res.status(404).json({
                success: false,
                message: 'Deleted assignment not found or you do not have permission to delete it'
            });
        }

        // Delete all related data in the correct order
        await prisma.$transaction(async (tx) => {
            // Delete competency progress
            await tx.competencyProgress.deleteMany({
                where: {
                    competency: {
                        assignmentId: parseInt(assignmentId)
                    }
                }
            });

            // Delete submissions
            await tx.submission.deleteMany({
                where: {
                    assignmentId: parseInt(assignmentId)
                }
            });

            // Delete competencies
            await tx.competency.deleteMany({
                where: {
                    assignmentId: parseInt(assignmentId)
                }
            });

            // Finally delete the assignment
            await tx.assignment.delete({
                where: { id: parseInt(assignmentId) }
            });
        });

        res.json({
            success: true,
            message: 'Assignment permanently deleted'
        });
    } catch (error) {
        next(error);
    }
});

// --- END TRASH ENDPOINTS ---
