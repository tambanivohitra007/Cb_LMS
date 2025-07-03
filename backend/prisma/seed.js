import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding ...');

    // Clean up existing data
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
    
    console.log('Created users:', { admin, teacher, student });

    // --- Create a Class ---
    const computerScienceClass = await prisma.class.create({
        data: {
            name: 'Introduction to Computer Science',
            description: 'A foundational course on algorithms, data structures, and programming.',
            teacherId: teacher.id,
            students: {
                connect: { id: student.id },
            },
        },
    });

    console.log('Created class:', computerScienceClass);

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
