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
                    where: { deleted_at: null },
                    include: {
                        students: {
                            select: { id: true, name: true, email: true }
                        }
                    }
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


// --- TRASH ROUTES (Teacher only) ---
app.get('/api/trash', authMiddleware, roleMiddleware(['TEACHER']), async (req, res, next) => {
    try {
        const deletedClasses = await prisma.class.findMany({
            where: { 
                NOT: { deleted_at: null },
                teacherId: req.user.userId 
            },
            include: {
                teacher: {
                    select: { id: true, name: true, email: true }
                },
                _count: {
                    select: { students: true, assignments: true }
                }
            }
        });
        
        res.json({ success: true, data: { deletedClasses } });
    } catch (error) {
        next(error);
    }
});

app.post('/api/trash/restore/class/:id', authMiddleware, roleMiddleware(['TEACHER']), async (req, res, next) => {
    try {
        const { id } = req.params;
        const classId = parseInt(id);
        
        if (isNaN(classId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class ID'
            });
        }
        
        // Verify the class exists in trash and belongs to the teacher
        const deletedClass = await prisma.class.findFirst({
            where: { 
                id: classId, 
                teacherId: req.user.userId,
                NOT: { deleted_at: null }
            }
        });
        
        if (!deletedClass) {
            return res.status(404).json({
                success: false,
                message: 'Deleted class not found or you do not have permission to restore it'
            });
        }
        
        await prisma.class.update({
            where: { id: classId },
            data: { deleted_at: null },
        });
        
        res.json({ success: true, message: 'Class restored successfully' });
    } catch (error) {
        next(error);
    }
});

app.delete('/api/trash/permanent/class/:id', authMiddleware, roleMiddleware(['TEACHER']), async (req, res, next) => {
    try {
        const { id } = req.params;
        const classId = parseInt(id);
        
        if (isNaN(classId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class ID'
            });
        }
        
        // Verify the class exists in trash and belongs to the teacher
        const deletedClass = await prisma.class.findFirst({
            where: { 
                id: classId, 
                teacherId: req.user.userId,
                NOT: { deleted_at: null }
            }
        });
        
        if (!deletedClass) {
            return res.status(404).json({
                success: false,
                message: 'Deleted class not found or you do not have permission to delete it permanently'
            });
        }
        
        // In a real app, you might want to delete related records first
        // or use CASCADE delete in your database schema
        await prisma.class.delete({
            where: { id: classId },
        });
        
        res.json({ success: true, message: 'Class permanently deleted' });
    } catch (error) {
        next(error);
    }
});

// --- STUDENT MANAGEMENT ROUTES (Teacher only) ---
// Get all students available for enrollment (excluding those already in the class)
app.get('/api/classes/:classId/available-students', authMiddleware, roleMiddleware(['TEACHER']), async (req, res, next) => {
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
        const classExists = await prisma.class.findFirst({
            where: { 
                id: classIdInt, 
                teacherId: req.user.userId,
                deleted_at: null 
            }
        });
        
        if (!classExists) {
            return res.status(404).json({
                success: false,
                message: 'Class not found or you do not have permission to manage it'
            });
        }
        
        // Get all students not already enrolled in this class
        const availableStudents = await prisma.user.findMany({
            where: {
                role: 'STUDENT',
                deleted_at: null,
                NOT: {
                    classes: {
                        some: { id: classIdInt }
                    }
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                photo: true
            },
            orderBy: { name: 'asc' }
        });
        
        res.json({ success: true, data: availableStudents });
    } catch (error) {
        next(error);
    }
});

// Add student to class
app.post('/api/classes/:classId/students', authMiddleware, roleMiddleware(['TEACHER']), async (req, res, next) => {
    try {
        const { classId } = req.params;
        const { studentId } = req.body;
        const classIdInt = parseInt(classId);
        const studentIdInt = parseInt(studentId);
        
        if (isNaN(classIdInt) || isNaN(studentIdInt)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class ID or student ID'
            });
        }
        
        // Verify the class exists and belongs to the teacher
        const classExists = await prisma.class.findFirst({
            where: { 
                id: classIdInt, 
                teacherId: req.user.userId,
                deleted_at: null 
            }
        });
        
        if (!classExists) {
            return res.status(404).json({
                success: false,
                message: 'Class not found or you do not have permission to manage it'
            });
        }
        
        // Verify the student exists and is a student
        const student = await prisma.user.findFirst({
            where: { 
                id: studentIdInt, 
                role: 'STUDENT',
                deleted_at: null 
            }
        });
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        // Check if student is already enrolled
        const enrollment = await prisma.class.findFirst({
            where: {
                id: classIdInt,
                students: {
                    some: { id: studentIdInt }
                }
            }
        });
        
        if (enrollment) {
            return res.status(409).json({
                success: false,
                message: 'Student is already enrolled in this class'
            });
        }
        
        // Add student to class
        await prisma.class.update({
            where: { id: classIdInt },
            data: {
                students: {
                    connect: { id: studentIdInt }
                }
            }
        });
        
        res.json({ 
            success: true, 
            message: `${student.name} has been added to the class successfully` 
        });
    } catch (error) {
        next(error);
    }
});

// Remove student from class
app.delete('/api/classes/:classId/students/:studentId', authMiddleware, roleMiddleware(['TEACHER']), async (req, res, next) => {
    try {
        const { classId, studentId } = req.params;
        const classIdInt = parseInt(classId);
        const studentIdInt = parseInt(studentId);
        
        if (isNaN(classIdInt) || isNaN(studentIdInt)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class ID or student ID'
            });
        }
        
        // Verify the class exists and belongs to the teacher
        const classExists = await prisma.class.findFirst({
            where: { 
                id: classIdInt, 
                teacherId: req.user.userId,
                deleted_at: null 
            }
        });
        
        if (!classExists) {
            return res.status(404).json({
                success: false,
                message: 'Class not found or you do not have permission to manage it'
            });
        }
        
        // Verify the student is enrolled in this class
        const enrollment = await prisma.class.findFirst({
            where: {
                id: classIdInt,
                students: {
                    some: { id: studentIdInt }
                }
            },
            include: {
                students: {
                    where: { id: studentIdInt },
                    select: { name: true }
                }
            }
        });
        
        if (!enrollment || enrollment.students.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student is not enrolled in this class'
            });
        }
        
        // Remove student from class
        await prisma.class.update({
            where: { id: classIdInt },
            data: {
                students: {
                    disconnect: { id: studentIdInt }
                }
            }
        });
        
        res.json({ 
            success: true, 
            message: `${enrollment.students[0].name} has been removed from the class successfully` 
        });
    } catch (error) {
        next(error);
    }
});

// Get students enrolled in a specific class
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
                    where: { deleted_at: null },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        photo: true,
                        created_at: true
                    },
                    orderBy: { name: 'asc' }
                }
            }
        });
        
        if (!classWithStudents) {
            return res.status(404).json({
                success: false,
                message: 'Class not found or you do not have permission to view it'
            });
        }
        
        res.json({ success: true, data: classWithStudents.students });
    } catch (error) {
        next(error);
    }
});

// --- SUBMISSION FEEDBACK ROUTE ---
app.post('/api/submissions/:id/feedback', authMiddleware, roleMiddleware(['TEACHER']), validateRequest(submissionFeedbackSchema), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { feedback } = req.body;
        const submissionId = parseInt(id);
        if (isNaN(submissionId)) {
            return res.status(400).json({ success: false, message: 'Invalid submission ID' });
        }
        // Find submission and ensure teacher owns the assignment
        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
            include: { assignment: { include: { class: true } } }
        });
        if (!submission || !submission.assignment || submission.assignment.class.teacherId !== req.user.userId) {
            return res.status(404).json({ success: false, message: 'Submission not found or you do not have permission' });
        }
        const updatedSubmission = await prisma.submission.update({
            where: { id: submissionId },
            data: {
                feedback,
                feedback_at: new Date()
            }
        });
        res.json({ success: true, data: updatedSubmission });
    } catch (error) {
        next(error);
    }
});

// --- TEACHER SUBMISSION REVIEW ROUTES ---
// Get all submissions for an assignment (teacher only)
app.get('/api/assignments/:assignmentId/submissions', authMiddleware, roleMiddleware(['TEACHER']), async (req, res, next) => {
    try {
        const { assignmentId } = req.params;
        const assignment = await prisma.assignment.findFirst({
            where: {
                id: Number(assignmentId),
                deleted_at: null,
                class: { teacherId: req.user.userId, deleted_at: null }
            },
            include: {
                submissions: {
                    include: {
                        student: { select: { id: true, name: true, email: true, photo: true } }
                    },
                    orderBy: { submitted_at: 'desc' }
                }
            }
        });
        if (!assignment) {
            return res.status(404).json({ success: false, message: 'Assignment not found or you do not have permission' });
        }
        res.json({ success: true, data: assignment.submissions });
    } catch (error) {
        next(error);
    }
});

// Update submission status (accept and set competency level)
app.put('/api/submissions/:id/status', authMiddleware, roleMiddleware(['TEACHER']), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // status: 'ACHIEVED' | 'MASTERED' | 'IN_PROGRESS'
        if (!['ACHIEVED', 'MASTERED', 'IN_PROGRESS'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }
        // Find submission and ensure teacher owns the assignment
        const submission = await prisma.submission.findUnique({
            where: { id: Number(id) },
            include: { assignment: { include: { class: true } } }
        });
        if (!submission || !submission.assignment || submission.assignment.class.teacherId !== req.user.userId) {
            return res.status(404).json({ success: false, message: 'Submission not found or you do not have permission' });
        }
        const updated = await prisma.submission.update({
            where: { id: Number(id) },
            data: { status, reviewed_at: new Date() }
        });
        res.json({ success: true, data: updated });
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

// 404 handler
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
