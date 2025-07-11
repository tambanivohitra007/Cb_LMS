import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding ...');

    // Clean up existing data in correct order (children first)
    await prisma.competencyProgress.deleteMany();
    await prisma.submission.deleteMany();
    await prisma.competency.deleteMany();
    await prisma.assignment.deleteMany();
    await prisma.class.deleteMany();
    await prisma.user.deleteMany();

    // --- Create Users ---
    const adminPassword = await bcrypt.hash('password', 10);
    const admin = await prisma.user.create({
        data: {
            email: 'admin@demo.com',
            name: 'System Administrator',
            password: adminPassword,
            role: 'ADMIN',
            photo: 'https://i.pravatar.cc/150?u=admin@demo.com'
        },
    });

    const teacherPassword = await bcrypt.hash('password', 10);
    const teacher = await prisma.user.create({
        data: {
            email: 'teacher@demo.com',
            name: 'Dr. Ada Lovelace',
            password: teacherPassword,
            role: 'TEACHER',
            photo: 'https://i.pravatar.cc/150?u=teacher@demo.com'
        },
    });

    const studentPassword = await bcrypt.hash('password', 10);
    const student = await prisma.user.create({
        data: {
            email: 'student@demo.com',
            name: 'Alan Turing',
            password: studentPassword,
            role: 'STUDENT',
            photo: 'https://i.pravatar.cc/150?u=student@demo.com'
        },
    });

    // Create additional students for testing student management
    const student2 = await prisma.user.create({
        data: {
            email: 'student2@demo.com',
            name: 'Grace Hopper',
            password: studentPassword,
            role: 'STUDENT',
            photo: 'https://i.pravatar.cc/150?u=student2@demo.com'
        },
    });

    const student3 = await prisma.user.create({
        data: {
            email: 'student3@demo.com',
            name: 'Katherine Johnson',
            password: studentPassword,
            role: 'STUDENT',
            photo: 'https://i.pravatar.cc/150?u=student3@demo.com'
        },
    });

    const student4 = await prisma.user.create({
        data: {
            email: 'student4@demo.com',
            name: 'Dorothy Vaughan',
            password: studentPassword,
            role: 'STUDENT',
            photo: 'https://i.pravatar.cc/150?u=student4@demo.com'
        },
    });
    
    console.log('Created users:', { admin, teacher, student, student2, student3, student4 });

    // --- Create a Class ---
    const computerScienceClass = await prisma.class.create({
        data: {
            name: 'Introduction to Computer Science',
            description: 'A foundational course on algorithms, data structures, and programming.',
            teacherId: teacher.id,
            students: {
                connect: [
                    { id: student.id },
                    { id: student2.id }
                ]
            },
        },
    });

    // Create a second class with different students
    const mathClass = await prisma.class.create({
        data: {
            name: 'Advanced Mathematics',
            description: 'Advanced mathematical concepts and problem solving.',
            teacherId: teacher.id,
            students: {
                connect: [
                    { id: student3.id }
                ]
            },
        },
    });

    console.log('Created classes:', { computerScienceClass, mathClass });

    // --- Create Assignments with Competencies ---
    const assignment1 = await prisma.assignment.create({
        data: {
            title: 'Project 1: Build a Sorting Algorithm Visualizer',
            description: 'Implement and visualize common sorting algorithms.',
            classId: computerScienceClass.id,
            competencies: {
                create: [
                    { name: 'Algorithmic Thinking' },
                    { name: 'Data Structure Implementation' },
                    { name: 'JavaScript Fundamentals' }
                ],
            },
        },
    });

    const assignment2 = await prisma.assignment.create({
        data: {
            title: 'Project 2: Database Design for a Library',
            description: 'Design a relational database schema for a library system.',
            classId: computerScienceClass.id,
            competencies: {
                create: [
                    { name: 'Relational Database Design' },
                    { name: 'SQL Querying' }
                ],
            },
        },
    });
    
    console.log('Created assignments:', { assignment1, assignment2 });

    // --- Create a Submission (for the student) ---
    const submission = await prisma.submission.create({
        data: {
            studentId: student.id,
            assignmentId: assignment1.id,
            content: 'Here is my submission for the sorting visualizer.',
            status: 'ACHIEVED', // Teacher would set this after review
        }
    });

    console.log('Created submission:', submission);

    // --- Create Competency Progress Records ---
    // Get the competencies that were created
    const algorithmComp = await prisma.competency.findFirst({
        where: { name: 'Algorithm Analysis' }
    });
    
    const visualizationComp = await prisma.competency.findFirst({
        where: { name: 'Data Visualization' }
    });
    
    const dbDesignComp = await prisma.competency.findFirst({
        where: { name: 'Relational Database Design' }
    });
    
    const sqlComp = await prisma.competency.findFirst({
        where: { name: 'SQL Querying' }
    });

    // Create progress records for students
    if (algorithmComp) {
        await prisma.competencyProgress.create({
            data: {
                competencyId: algorithmComp.id,
                studentId: student.id,
                status: 'MASTERED',
                submissionId: submission.id,
                achieved_at: new Date(),
                feedback: 'Excellent work on algorithm analysis!'
            }
        });
    }

    if (visualizationComp) {
        await prisma.competencyProgress.create({
            data: {
                competencyId: visualizationComp.id,
                studentId: student.id,
                status: 'ACHIEVED',
                submissionId: submission.id,
                achieved_at: new Date(),
                feedback: 'Good visualization skills demonstrated.'
            }
        });
    }

    if (dbDesignComp) {
        await prisma.competencyProgress.create({
            data: {
                competencyId: dbDesignComp.id,
                studentId: student.id,
                status: 'IN_PROGRESS',
                feedback: 'Working on database design concepts.'
            }
        });
    }

    // Create progress for student2 as well
    if (algorithmComp) {
        await prisma.competencyProgress.create({
            data: {
                competencyId: algorithmComp.id,
                studentId: student2.id,
                status: 'ACHIEVED',
                achieved_at: new Date(),
                feedback: 'Solid understanding of algorithms.'
            }
        });
    }

    if (sqlComp) {
        await prisma.competencyProgress.create({
            data: {
                competencyId: sqlComp.id,
                studentId: student2.id,
                status: 'MASTERED',
                achieved_at: new Date(),
                feedback: 'Exceptional SQL skills!'
            }
        });
    }

    console.log('Created competency progress records');

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
