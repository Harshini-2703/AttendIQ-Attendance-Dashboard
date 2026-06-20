const express = require("express");
const router = express.Router();

const {
  addStudent,
  getStudents,
  updateStudent,
  deleteStudent,
  markAttendance,
  getAnalytics,
  resetDemoData,
  login,
  getScopedAnalytics,
  getTeachers,
  addTeacher,
  sendParentAlerts,
  getEmailLog,
} = require("../controllers/studentController");

router.get("/", getStudents);
router.post("/", addStudent);
router.post("/addStudent", addStudent);
router.put("/:id", updateStudent);
router.delete("/:id", deleteStudent);
router.patch("/:id/attendance", markAttendance);
router.get("/analytics/overview", getAnalytics);
router.get("/analytics/scoped", getScopedAnalytics);
router.post("/demo/reset", resetDemoData);
router.post("/auth/login", login);
router.get("/teachers", getTeachers);
router.post("/teachers", addTeacher);
router.post("/alerts/parents", sendParentAlerts);
router.get("/alerts/email-log", getEmailLog);

module.exports = router;
