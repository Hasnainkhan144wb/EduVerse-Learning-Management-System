const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');

// Load All Models
const User = require('../models/User');
const Category = require('../models/Category');
const Course = require('../models/Course');
const Section = require('../models/Section');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const QuizQuestion = require('../models/QuizQuestion');
const Question = require('../models/Question');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Enrolment = require('../models/Enrolment');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const Certificate = require('../models/Certificate');

const seedMasterData = async () => {
  try {
    await connectDB();
    console.log('🌱 Connected to MongoDB for Master Seeding...');

    // 1. Clean existing records
    console.log('🧹 Purging old data...');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Course.deleteMany({}),
      Section.deleteMany({}),
      Lesson.deleteMany({}),
      Quiz.deleteMany({}),
      QuizQuestion.deleteMany({}),
      Question.deleteMany({}),
      Assignment.deleteMany({}),
      Submission.deleteMany({}),
      Enrolment.deleteMany({}),
      Payment.deleteMany({}),
      Review.deleteMany({}),
      Certificate.deleteMany({}),
    ]);

    // 2. Create Users
    console.log('👤 Seeding Users (Admin, Instructors, Students)...');
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@eduverse.com',
      password: 'Admin@123',
      role: 'Admin',
      isApproved: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    });

    const instructor1 = await User.create({
      name: 'John Instructor',
      email: 'john.instructor@eduverse.com',
      password: 'Instructor@123',
      role: 'Instructor',
      isApproved: true,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    });

    const instructor2 = await User.create({
      name: 'Sarah Web',
      email: 'sarah.web@eduverse.com',
      password: 'Instructor@123',
      role: 'Instructor',
      isApproved: true,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    });

    const student1 = await User.create({
      name: 'Alex Johnson',
      email: 'alex.student@gmail.com',
      password: 'Student@123',
      role: 'Student',
      isApproved: true,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    });

    const student2 = await User.create({
      name: 'Maria Dev',
      email: 'maria.dev@gmail.com',
      password: 'Student@123',
      role: 'Student',
      isApproved: true,
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    });

    const student3 = await User.create({
      name: 'Dev User',
      email: 'dev.user@gmail.com',
      password: 'Student@123',
      role: 'Student',
      isApproved: true,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    });

    // 3. Create Categories
    console.log('📂 Seeding Categories...');
    const catWeb = await Category.create({
      name: 'Web Development',
      slug: 'web-development',
      icon: 'FiCode',
      description: 'Master HTML, CSS, JavaScript, React, Node.js, and Full-Stack frameworks.',
    });

    const catData = await Category.create({
      name: 'Data Science & AI',
      slug: 'data-science-ai',
      icon: 'FiDatabase',
      description: 'Python, Machine Learning, Deep Learning, Pandas, and Data Analytics.',
    });

    const catMobile = await Category.create({
      name: 'Mobile App Development',
      slug: 'mobile-app-development',
      icon: 'FiSmartphone',
      description: 'Build iOS and Android applications with React Native, Flutter, and Swift.',
    });

    const catUX = await Category.create({
      name: 'UI/UX Design',
      slug: 'ui-ux-design',
      icon: 'FiFigma',
      description: 'Design user-centric interfaces, prototypes, and design systems in Figma.',
    });

    await Category.create({
      name: 'Cloud & DevOps',
      slug: 'cloud-devops',
      icon: 'FiServer',
      description: 'AWS, Docker, Kubernetes, CI/CD pipelines, and Cloud Infrastructure.',
    });

    await Category.create({
      name: 'Cybersecurity',
      slug: 'cybersecurity',
      icon: 'FiShield',
      description: 'Ethical Hacking, Network Security, Pen Testing, and Defense Systems.',
    });

    // 4. Create Courses
    console.log('📚 Seeding Courses...');
    const course1 = await Course.create({
      title: 'Full-Stack MERN Mastery 2026',
      description: 'Build real-world production web applications with MongoDB, Express, React, Node.js, and Tailwind CSS.',
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=80',
      instructorRef: instructor1._id,
      categoryRef: catWeb._id,
      price: 49.99,
      level: 'Advanced',
      language: 'English',
      status: 'Published',
      requirements: ['Basic JavaScript knowledge', 'HTML/CSS fundamentals'],
      objectives: ['Master Node.js and Express REST APIs', 'Build React SPA with modern hooks', 'Deploy to Production Cloud'],
    });

    const course2 = await Course.create({
      title: 'Python for Data Science & Machine Learning',
      description: 'Comprehensive guide to Python, NumPy, Pandas, Scikit-Learn, and TensorFlow algorithms.',
      thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
      instructorRef: instructor2._id,
      categoryRef: catData._id,
      price: 59.99,
      level: 'Intermediate',
      language: 'English',
      status: 'Published',
      requirements: ['Basic computer literacy'],
      objectives: ['Analyze large datasets', 'Build Machine Learning models', 'Visualize data with Matplotlib'],
    });

    const course3 = await Course.create({
      title: 'UI/UX Design Systems with Figma',
      description: 'Learn modern UI design, wireframing, interactive prototyping, and component libraries.',
      thumbnail: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&auto=format&fit=crop&q=80',
      instructorRef: instructor2._id,
      categoryRef: catUX._id,
      price: 29.99,
      level: 'Beginner',
      language: 'English',
      status: 'Published',
      requirements: ['No prior design experience required'],
      objectives: ['Master Figma auto-layout and components', 'Create responsive design systems'],
    });

    const course4 = await Course.create({
      title: 'React Native Mobile App Development',
      description: 'Build native iOS and Android apps using React Native, Expo, and Redux Toolkit.',
      thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop&q=80',
      instructorRef: instructor1._id,
      categoryRef: catMobile._id,
      price: 39.99,
      level: 'Intermediate',
      language: 'English',
      status: 'Draft',
      requirements: ['React basics'],
      objectives: ['Build cross-platform mobile apps', 'Publish to App Store and Google Play'],
    });

    // Link created courses to instructors
    instructor1.createdCourses = [course1._id, course4._id];
    await instructor1.save();
    instructor2.createdCourses = [course2._id, course3._id];
    await instructor2.save();

    // 5. Create Sections & Lessons for Courses
    console.log('📖 Seeding Sections, Lessons, Quizzes & Assignments...');
    // Course 1 Sections
    const sec1 = await Section.create({
      courseId: course1._id,
      title: 'Module 1: MERN Architecture & REST Setup',
      order: 1,
    });
    const sec2 = await Section.create({
      courseId: course1._id,
      title: 'Module 2: React Frontend & State Management',
      order: 2,
    });

    // Lessons for Sec 1
    const les1_1 = await Lesson.create({
      sectionId: sec1._id,
      courseId: course1._id,
      title: 'Introduction to Full-Stack MERN Architecture',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      notes: 'In this lesson we cover MongoDB models, Express controllers, React hooks, and Node API structure.',
      type: 'video',
      duration: 15,
      order: 1,
    });

    const les1_2 = await Lesson.create({
      sectionId: sec1._id,
      courseId: course1._id,
      title: 'Building Express Server & MongoDB Schema',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      notes: 'Detailed setup of Mongoose models and JSON Web Token authentication middleware.',
      type: 'video',
      duration: 25,
      order: 2,
    });

    const les1_3 = await Lesson.create({
      sectionId: sec1._id,
      courseId: course1._id,
      title: 'Module 1 Quiz: MERN Backend Fundamentals',
      type: 'quiz',
      duration: 10,
      order: 3,
    });

    // Lessons for Sec 2
    const les2_1 = await Lesson.create({
      sectionId: sec2._id,
      courseId: course1._id,
      title: 'React Context API & State Flow',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      notes: 'Global state management in React apps.',
      type: 'video',
      duration: 20,
      order: 1,
    });

    const les2_2 = await Lesson.create({
      sectionId: sec2._id,
      courseId: course1._id,
      title: 'Assignment: Build a REST API Server',
      type: 'assignment',
      duration: 60,
      order: 2,
    });

    // Course 2 Sections & Lessons
    const secC2 = await Section.create({
      courseId: course2._id,
      title: 'Module 1: Python Basics & Pandas DataFrames',
      order: 1,
    });
    const lesC2_1 = await Lesson.create({
      sectionId: secC2._id,
      courseId: course2._id,
      title: 'Data Wrangling with Pandas & NumPy',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      notes: 'Clean datasets and handle missing values.',
      type: 'video',
      duration: 30,
      order: 1,
    });

    // 6. Create Quizzes & Questions
    console.log('❓ Seeding Quizzes & MCQ Questions...');
    const quiz1 = await Quiz.create({
      lessonId: les1_3._id,
      title: 'Module 1 Quiz: MERN Backend Fundamentals',
      description: 'Test your understanding of Express routes, MongoDB Mongoose schema, and JWT auth.',
      passingScore: 80,
    });

    const q1 = await QuizQuestion.create({
      quizId: quiz1._id,
      questionText: 'Which HTTP method is typically used to create a new user resource in a REST API?',
      options: ['GET', 'POST', 'PUT', 'DELETE'],
      correctOption: 1,
      correctAnswers: 'POST',
      explanation: 'POST requests create new resources in REST standard guidelines.',
    });

    const q2 = await QuizQuestion.create({
      quizId: quiz1._id,
      questionText: 'MongoDB is a relational SQL database. (True or False)',
      options: ['True', 'False'],
      correctOption: 1,
      correctAnswers: 'False',
      explanation: 'MongoDB is a NoSQL document database.',
    });

    const q3 = await QuizQuestion.create({
      quizId: quiz1._id,
      questionText: 'What middleware is used to verify JSON Web Tokens in Express routes?',
      options: ['cors', 'helmet', 'protect / requireAuth', 'morgan'],
      correctOption: 2,
      correctAnswers: 'protect / requireAuth',
      explanation: 'Custom JWT protect middleware extracts bearer tokens and validates user signatures.',
    });

    quiz1.questions = [q1._id, q2._id, q3._id];
    await quiz1.save();

    // 7. Create Assignments & Submissions
    console.log('📝 Seeding Assignments & Student Submissions...');
    const assign1 = await Assignment.create({
      lessonId: les2_2._id,
      title: 'Build a REST API Server with Express & MongoDB',
      instructions: 'Construct a Node/Express REST API with CRUD routes for user profile management and JWT token auth.',
      totalMarks: 100,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await Submission.create({
      assignmentId: assign1._id,
      studentId: student1._id,
      fileUrl: 'https://github.com/alexjohnson/mern-express-api-demo',
      notes: 'Completed all CRUD routes with Jest test coverage.',
      marks: 95,
      feedback: 'Excellent work on controller error handling and clean modular structure!',
      status: 'Graded',
    });

    await Submission.create({
      assignmentId: assign1._id,
      studentId: student2._id,
      fileUrl: 'https://github.com/mariadev/node-express-server',
      notes: 'Implemented JWT auth middleware.',
      marks: 88,
      feedback: 'Good submission! Make sure to sanitize input body payloads.',
      status: 'Graded',
    });

    // 8. Create Active Enrolments & Payments
    console.log('💳 Seeding Enrolments & Payment Transactions...');
    // Alex Enrolled in Course 1 & 2
    const enr1 = await Enrolment.create({
      studentId: student1._id,
      courseId: course1._id,
      progressPercentage: 100,
      completedLessons: [les1_1._id, les1_2._id, les1_3._id, les2_1._id, les2_2._id],
    });

    await Payment.create({
      studentId: student1._id,
      courseId: course1._id,
      amount: 49.99,
      paymentMethod: 'Stripe Credit Card',
      status: 'Completed',
      transactionId: 'TXN-STRIPE-9901',
    });

    const enr2 = await Enrolment.create({
      studentId: student1._id,
      courseId: course2._id,
      progressPercentage: 60,
      completedLessons: [lesC2_1._id],
    });

    await Payment.create({
      studentId: student1._id,
      courseId: course2._id,
      amount: 59.99,
      paymentMethod: 'Stripe Credit Card',
      status: 'Completed',
      transactionId: 'TXN-STRIPE-9902',
    });

    // Maria Enrolled in Course 1 & 3
    const enr3 = await Enrolment.create({
      studentId: student2._id,
      courseId: course1._id,
      progressPercentage: 45,
      completedLessons: [les1_1._id, les1_2._id],
    });

    await Payment.create({
      studentId: student2._id,
      courseId: course1._id,
      amount: 49.99,
      paymentMethod: 'PayPal',
      status: 'Completed',
      transactionId: 'TXN-PAYPAL-8810',
    });

    const enr4 = await Enrolment.create({
      studentId: student2._id,
      courseId: course3._id,
      progressPercentage: 100,
      completedLessons: [],
    });

    await Payment.create({
      studentId: student2._id,
      courseId: course3._id,
      amount: 29.99,
      paymentMethod: 'Stripe Credit Card',
      status: 'Completed',
      transactionId: 'TXN-STRIPE-9904',
    });

    // Dev User Enrolled in Course 2
    await Enrolment.create({
      studentId: student3._id,
      courseId: course2._id,
      progressPercentage: 50,
      completedLessons: [lesC2_1._id],
    });

    await Payment.create({
      studentId: student3._id,
      courseId: course2._id,
      amount: 59.99,
      paymentMethod: 'Stripe Credit Card',
      status: 'Completed',
      transactionId: 'TXN-STRIPE-9905',
    });

    // Update student enrolled courses
    student1.enrolledCourses = [course1._id, course2._id];
    await student1.save();

    student2.enrolledCourses = [course1._id, course3._id];
    await student2.save();

    student3.enrolledCourses = [course2._id];
    await student3.save();

    // 9. Create Reviews & Instructor Replies
    console.log('⭐ Seeding Reviews & Ratings...');
    await Review.create({
      courseId: course1._id,
      studentId: student1._id,
      rating: 5,
      comment: 'Outstanding full-stack course! The MERN stack modules were super practical and hands-on.',
      instructorReply: {
        comment: 'Thank you Alex! Glad you enjoyed building the REST API server!',
        repliedAt: new Date(),
      },
    });

    await Review.create({
      courseId: course1._id,
      studentId: student2._id,
      rating: 4.8,
      comment: 'Clear explanations and step-by-step code walkthroughs. Highly recommended!',
    });

    await Review.create({
      courseId: course2._id,
      studentId: student1._id,
      rating: 5,
      comment: 'Pandas and Scikit-learn exercises were crystal clear!',
    });

    // 10. Create Issued Certificates
    console.log('🏆 Seeding Certificates...');
    await Certificate.create({
      studentId: student1._id,
      courseId: course1._id,
      issueDate: new Date(),
      certificateUrl: '/uploads/certificates/cert_alex_mern.pdf',
      certificateId: 'EDU-2026-9821',
    });

    await Certificate.create({
      studentId: student2._id,
      courseId: course3._id,
      issueDate: new Date(),
      certificateUrl: '/uploads/certificates/cert_maria_figma.pdf',
      certificateId: 'EDU-2026-9822',
    });

    console.log('✅ Master Database Seeding Completed Successfully!');
    console.log('--------------------------------------------------');
    console.log('Credentials Summary:');
    console.log('🔑 Admin:      admin@eduverse.com / Admin@123');
    console.log('🔑 Instructor: john.instructor@eduverse.com / Instructor@123');
    console.log('🔑 Student:    alex.student@gmail.com / Student@123');
    console.log('--------------------------------------------------');
    process.exit(0);
  } catch (error) {
    console.error('❌ Master Seeding Error:', error);
    process.exit(1);
  }
};

seedMasterData();
