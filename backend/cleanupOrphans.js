const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Course = require('./models/Course');
const User = require('./models/User');

const cleanup = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eduverse';
    console.log(`🔌 Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    const courses = await Course.find();
    console.log(`📚 Inspecting ${courses.length} courses in database...`);

    let purgedCount = 0;
    for (let course of courses) {
      const instructorId = course.instructorRef || course.instructor || course.instructorId;
      if (instructorId) {
        const exists = await User.findById(instructorId);
        if (!exists) {
          await Course.findByIdAndDelete(course._id);
          console.log(`🧹 Deleted orphaned course: "${course.title}" (ID: ${course._id})`);
          purgedCount++;
        }
      } else {
        await Course.findByIdAndDelete(course._id);
        console.log(`🧹 Deleted course with missing instructor: "${course.title}" (ID: ${course._id})`);
        purgedCount++;
      }
    }

    console.log(`✅ Database Cleanup Complete! Purged ${purgedCount} orphaned course(s).`);
    process.exit(0);
  } catch (err) {
    console.error('🔥 Error during orphan cleanup:', err);
    process.exit(1);
  }
};

cleanup();
