const store = require("../services/store");
const { buildAnalytics, toStudent } = require("../services/analyticsService");

const addStudent = async (req, res) => {
  try {
    const { name, rollNo, department, year } = req.body;
    if (!name || !rollNo || !department || !year) {
      return res.status(400).json({ error: "Name, roll number, department, and year are required." });
    }

    const student = await store.addStudent(req.body);
    res.status(201).json({
      message: "Student added successfully",
      student: toStudent(student),
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const getStudents = async (req, res) => {
  try {
    const students = await store.listStudents();
    res.json(students.map(toStudent));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const markAttendance = async (req, res) => {
  try {
    if (!["present", "absent", "late", "excused"].includes(req.body.status)) {
      return res.status(400).json({ error: "Status must be present, absent, late, or excused." });
    }

    const student = await store.markAttendance(req.params.id, req.body);
    if (!student) return res.status(404).json({ error: "Student not found." });
    res.json({ message: "Attendance updated", student: toStudent(student) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const students = await store.listStudents();
    res.json(buildAnalytics(students));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const resetDemoData = async (req, res) => {
  try {
    const students = await store.resetDemoData();
    res.json({ message: "Demo data reset", students: students.map(toStudent) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  const user = await store.getUserFromEmail(req.body.email);
  if (!user) {
    return res.status(401).json({
      error: "Use an AttendIQ domain email: admin@admin.attendiq.edu, teacher email, or student roll email.",
    });
  }
  res.json({ user });
};

const getScopedAnalytics = async (req, res) => {
  try {
    const user = await store.getUserFromEmail(req.query.email);
    if (!user) return res.status(401).json({ error: "Login required." });
    const students = await store.scopedStudents(user);
    res.json({ user, ...buildAnalytics(students) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTeachers = async (req, res) => {
  try {
    res.json(await store.listTeachers());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const addTeacher = async (req, res) => {
  try {
    const { name, email, department } = req.body;
    if (!name || !email || !department) {
      return res.status(400).json({ error: "Name, email, and department are required." });
    }
    const teacher = await store.addTeacher(req.body);
    res.status(201).json({ message: "Teacher added successfully", teacher });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const sendParentAlerts = async (req, res) => {
  try {
    const user = await store.getUserFromEmail(req.body.email);
    if (!user || user.role === "student") {
      return res.status(403).json({ error: "Only admin and teachers can send parent alerts." });
    }
    const emails = await store.sendParentAlerts(Number(req.body.threshold || 75), user);
    res.json({ message: "Parent alerts prepared", emails, emailLog: store.listEmailLog() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getEmailLog = async (req, res) => {
  res.json(store.listEmailLog());
};

module.exports = {
  addStudent,
  getStudents,
  markAttendance,
  getAnalytics,
  resetDemoData,
  login,
  getScopedAnalytics,
  getTeachers,
  addTeacher,
  sendParentAlerts,
  getEmailLog,
};
