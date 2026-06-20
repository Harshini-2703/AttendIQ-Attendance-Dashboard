const Student = require("../models/student");
const supabase = require("../config/supabase");
const { createSampleStudents, createSampleTeachers } = require("../data/sampleData");

let usingDatabase = false;
let memoryStudents = createSampleStudents();
let memoryTeachers = createSampleTeachers();
let emailLog = [];

function setDatabaseMode(enabled) {
  usingDatabase = enabled;
}

async function listStudents() {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .order("department");

  if (error) {
    console.error("Supabase listStudents error:", error);
    return [];
  }

  return data.map((student) => ({
    id: student.id,
    name: student.name,
    rollNo: student.roll_no,
    department: student.department,
    year: student.year,
    section: student.section,
    
    studentEmail: student.student_email,
    parentEmail: student.parent_email,
    guardianPhone: student.guardian_phone,
    
    advisor: student.advisor,
    attendanceRate: student.attendance_rate,
    absent: student.absent,
    late: student.late,
    riskLevel: student.risk_level,
    riskScore: student.risk_score,
    attendance: [],
  }));
}

async function addStudent(payload) {
  const { data, error } = await supabase
    .from("students")
    .insert([
      {
        name: payload.name,
        roll_no: payload.rollNo,
        department: payload.department,
        year: Number(payload.year),
        section: payload.section || "A",
        advisor: payload.advisor || "Unassigned",
        
        student_email: payload.studentEmail || null,
        parent_email: payload.parentEmail || null,
        guardian_phone: payload.guardianPhone || null,
        
        attendance_rate: 100,
        absent: 0,
        late: 0,
        risk_level: "Low",
        risk_score: 0,
      },
    ])
    .select();

  if (error) {
    console.error("Supabase addStudent error:", error);
    throw error;
  }

  return data[0];
}

async function markAttendance(studentId, payload) {
  const date = payload.date || new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("attendance")
    .insert([
      {
        student_id: studentId,
        attendance_date: date,
        status: payload.status,
        note: payload.note || "",
      },
    ])
    .select();

  if (error) {
    console.error("Supabase attendance error:", error);
    throw error;
  }

  return data[0];
}

async function resetDemoData() {
  memoryStudents = createSampleStudents();
  memoryTeachers = createSampleTeachers();
  emailLog = [];
  return memoryStudents;
}

async function listTeachers() {
  const { data, error } = await supabase
    .from("teachers")
    .select("*")
    .order("name");

  if (error) {
    console.error("Supabase listTeachers error:", error);
    return [];
  }

  return data;
}

async function addTeacher(payload) {
  const { data, error } = await supabase
    .from("teachers")
    .insert([
      {
        name: payload.name,
        email: payload.email,
        department: payload.department,
        role: "teacher",
      },
    ])
    .select();

  if (error) {
    console.error("Supabase addTeacher error:", error);
    throw error;
  }

  return data[0];
}

async function getUserFromEmail(email = "") {
  const normalized = email.trim().toLowerCase();
 
  if (normalized.endsWith("@admin.attendiq.edu")) {
    return {
      id: "admin",
      name: "Admin",
      email: normalized,
      role: "admin",
      permissions: [
        "manage_students",
        "manage_teachers",
        "view_all",
        "mark_attendance",
        "send_parent_email",
      ],
    };
  }

const { data: teachers, error} = await supabase
  .from("teachers")
  .select("*");

if (error) {
  console.error("Teacher lookup error:", error);
} 

const teacher = teachers?.find(
  (item) => item.email.toLowerCase() === normalized
);

  if (teacher || normalized.endsWith("@teacher.attendiq.edu")) {
    return {
      id: teacher?.id || "teacher",
      name: teacher?.name || "Teacher",
      email: normalized,
      role: "teacher",
      department: teacher?.department || "Computer Science",
      permissions: [
        "view_department",
        "mark_attendance",
        "view_percentages",
        "send_parent_email",
      ],
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

  if (user.role === "teacher") {
    return students.filter(
      (student) => student.department === user.department
    );
  }

  if (user.role === "student") {
    return students.filter((student) => {
      const studentEmail =
        student.studentEmail ||
        `${student.rollNo?.toLowerCase()}@student.attendiq.edu`;

      return studentEmail.toLowerCase() === user.studentEmail;
    });
  }

  return [];
}

async function sendParentAlerts(threshold = 75, user = null) {
  const { summarizeStudent, toStudent } = require("./analyticsService");

  const students = (await scopedStudents(user))
    .map(toStudent)
    .map(summarizeStudent);

  const targets = students.filter(
    (student) => student.attendanceRate < threshold
  );

  const created = targets.map((student) => ({
    id: `${Date.now()}-${student.id}`,
    to: student.parentEmail || "parent-not-provided@example.com",
    student: student.name,
    subject: `Attendance alert for ${student.name}`,
    message: `${student.name}'s attendance is ${student.attendanceRate}%, below the ${threshold}% threshold.`,
    status: "logged-demo-email",
    createdAt: new Date().toISOString(),
  }));

  emailLog.unshift(...created);
  return created;
}

async function updateStudent(id, payload) {
  const { data, error } = await supabase
    .from("students")
    .update({
      name: payload.name,
      roll_no: payload.rollNo,
      department: payload.department,
      year: Number(payload.year),
      section: payload.section,
      advisor: payload.advisor,
      student_email: payload.studentEmail,
      parent_email: payload.parentEmail,
      guardian_phone: payload.guardianPhone,
    })
    .eq("id", id)
    .select();

  if (error) {
    console.error("Supabase updateStudent error:", error);
    throw error;
  }

  return data[0];
}

async function deleteStudent(id) {
  const { error } = await supabase
    .from("students")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Supabase deleteStudent error:", error);
    throw error;
  }

  return true;
}

function listEmailLog() {
  return emailLog;
}

module.exports = {
  setDatabaseMode,
  listStudents,
  addStudent,
  updateStudent,
  deleteStudent, markAttendance,
  resetDemoData,
  listTeachers,
  addTeacher,
  getUserFromEmail,
  scopedStudents,
  sendParentAlerts,
  listEmailLog,
};