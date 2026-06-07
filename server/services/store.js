const Student = require("../models/student");
const { createSampleStudents, createSampleTeachers } = require("../data/sampleData");

let usingDatabase = false;
let memoryStudents = createSampleStudents();
let memoryTeachers = createSampleTeachers();
let emailLog = [];

function setDatabaseMode(enabled) {
  usingDatabase = enabled;
}

async function listStudents() {
  if (usingDatabase) {
    const students = await Student.find().sort({ department: 1, rollNo: 1 });
    if (students.length > 0) return students;

    await Student.insertMany(createSampleStudents().map(({ id, ...student }) => student));
    return Student.find().sort({ department: 1, rollNo: 1 });
  }

  return memoryStudents;
}

async function addStudent(payload) {
  if (usingDatabase) {
    return Student.create({ ...payload, attendance: payload.attendance || [] });
  }

  const exists = memoryStudents.some((student) => student.rollNo.toLowerCase() === payload.rollNo.toLowerCase());
  if (exists) {
    const error = new Error("Roll number already exists");
    error.statusCode = 409;
    throw error;
  }

  const student = {
    id: String(Date.now()),
    name: payload.name,
    rollNo: payload.rollNo,
    department: payload.department,
    year: Number(payload.year),
    section: payload.section || "A",
    advisor: payload.advisor || "Unassigned",
    guardianPhone: payload.guardianPhone || "",
    parentEmail: payload.parentEmail || "",
    studentEmail: payload.studentEmail || `${payload.rollNo.toLowerCase()}@student.attendiq.edu`,
    attendance: payload.attendance || [],
  };
  memoryStudents.push(student);
  return student;
}

async function markAttendance(studentId, payload) {
  const date = payload.date || new Date().toISOString().slice(0, 10);

  if (usingDatabase) {
    const student = await Student.findById(studentId);
    if (!student) return null;
    const existing = student.attendance.find((record) => record.date === date);
    if (existing) {
      existing.status = payload.status;
      existing.note = payload.note || "";
    } else {
      student.attendance.push({ date, status: payload.status, note: payload.note || "" });
    }
    await student.save();
    return student;
  }

  const student = memoryStudents.find((item) => item.id === studentId);
  if (!student) return null;
  const existing = student.attendance.find((record) => record.date === date);
  if (existing) {
    existing.status = payload.status;
    existing.note = payload.note || "";
  } else {
    student.attendance.push({ date, status: payload.status, note: payload.note || "" });
  }
  return student;
}

async function resetDemoData() {
  memoryStudents = createSampleStudents();
  memoryTeachers = createSampleTeachers();
  emailLog = [];
  if (usingDatabase) {
    await Student.deleteMany({});
    await Student.insertMany(memoryStudents.map(({ id, ...student }) => student));
    return Student.find().sort({ department: 1, rollNo: 1 });
  }
  return memoryStudents;
}

async function listTeachers() {
  return memoryTeachers;
}

async function addTeacher(payload) {
  const teacher = {
    id: String(Date.now()),
    name: payload.name,
    email: payload.email,
    department: payload.department,
  };
  memoryTeachers.push(teacher);
  return teacher;
}

function getUserFromEmail(email = "") {
  const normalized = email.trim().toLowerCase();
  const teachers = memoryTeachers;

  if (normalized.endsWith("@admin.attendiq.edu")) {
    return {
      id: "admin",
      name: "Admin",
      email: normalized,
      role: "admin",
      permissions: ["manage_students", "manage_teachers", "view_all", "mark_attendance", "send_parent_email"],
    };
  }

  const teacher = teachers.find((item) => item.email.toLowerCase() === normalized);
  if (teacher || normalized.endsWith("@teacher.attendiq.edu")) {
    const fallbackDepartment = normalized.includes("kavya")
      ? "Electronics"
      : normalized.includes("arjun")
        ? "Mechanical"
        : normalized.includes("fatima")
          ? "Data Science"
          : "Computer Science";
    return {
      id: teacher?.id || "teacher",
      name: teacher?.name || "Teacher",
      email: normalized,
      role: "teacher",
      department: teacher?.department || fallbackDepartment,
      permissions: ["view_department", "mark_attendance", "view_percentages", "send_parent_email"],
    };
  }

  if (normalized.endsWith("@student.attendiq.edu")) {
    return {
      id: normalized.split("@")[0].toUpperCase(),
      name: "Student",
      email: normalized,
      role: "student",
      studentEmail: normalized,
      permissions: ["view_own_percentage"],
    };
  }

  return null;
}

async function scopedStudents(user) {
  const students = await listStudents();
  if (!user || user.role === "admin") return students;
  if (user.role === "teacher") return students.filter((student) => student.department === user.department);
  if (user.role === "student") {
    return students.filter((student) => {
      const studentEmail = student.studentEmail || `${student.rollNo?.toLowerCase()}@student.attendiq.edu`;
      return studentEmail.toLowerCase() === user.studentEmail;
    });
  }
  return [];
}

async function sendParentAlerts(threshold = 75, user = null) {
  const { summarizeStudent, toStudent } = require("./analyticsService");
  const students = (await scopedStudents(user)).map(toStudent).map(summarizeStudent);
  const targets = students.filter((student) => student.attendanceRate < threshold);
  const created = targets.map((student) => ({
    id: `${Date.now()}-${student.id}`,
    to: student.parentEmail || "parent-not-provided@example.com",
    student: student.name,
    subject: `Attendance alert for ${student.name}`,
    message: `${student.name}'s attendance is ${student.attendanceRate}%, below the ${threshold}% threshold. Please connect with ${student.advisor}.`,
    status: process.env.SMTP_HOST ? "ready-for-smtp" : "logged-demo-email",
    createdAt: new Date().toISOString(),
  }));
  emailLog.unshift(...created);
  return created;
}

function listEmailLog() {
  return emailLog;
}

module.exports = {
  setDatabaseMode,
  listStudents,
  addStudent,
  markAttendance,
  resetDemoData,
  listTeachers,
  addTeacher,
  getUserFromEmail,
  scopedStudents,
  sendParentAlerts,
  listEmailLog,
};
