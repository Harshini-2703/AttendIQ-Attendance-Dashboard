function toStudent(raw) {
  const student = raw.toObject ? raw.toObject() : raw;
  return {
    id: String(student._id || student.id),
    name: student.name,
    rollNo: student.rollNo,
    department: student.department,
    year: student.year,
    section: student.section || "A",
    advisor: student.advisor || "Unassigned",
    guardianPhone: student.guardianPhone || "",
    parentEmail: student.parentEmail || `${student.rollNo?.toLowerCase()}-parent@family.demo`,
    studentEmail: student.studentEmail || `${student.rollNo?.toLowerCase()}@student.attendiq.edu`,
    attendance: student.attendance || [],
  };
}

function pct(value, total) {
  return total ? Math.round((value / total) * 100) : 0;
}

function getRecentDates(days = 14) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - index - 1));
    return date.toISOString().slice(0, 10);
  });
}

function summarizeStudent(student) {
  const records = student.attendance || [];
  const counted = records.filter((record) => record.status !== "excused");
  const attended = counted.filter((record) => ["present", "late"].includes(record.status)).length;
  const late = records.filter((record) => record.status === "late").length;
  const absent = records.filter((record) => record.status === "absent").length;
  const attendanceRate = pct(attended, counted.length);

  let currentStreak = 0;
  for (let index = records.length - 1; index >= 0; index -= 1) {
    if (records[index].status === "absent") {
      currentStreak += 1;
    } else {
      break;
    }
  }

  const midpoint = Math.ceil(counted.length / 2);
  const firstHalf = counted.slice(0, midpoint);
  const secondHalf = counted.slice(midpoint);
  const firstRate = pct(firstHalf.filter((record) => ["present", "late"].includes(record.status)).length, firstHalf.length);
  const secondRate = pct(secondHalf.filter((record) => ["present", "late"].includes(record.status)).length, secondHalf.length);
  const trend = secondRate - firstRate;
  const riskScore = Math.min(100, Math.max(0, 100 - attendanceRate + currentStreak * 12 + late * 2 + Math.max(0, -trend)));

  return {
    ...student,
    attendanceRate,
    absent,
    late,
    currentStreak,
    trend,
    riskScore,
    riskLevel: riskScore >= 55 ? "Critical" : riskScore >= 32 ? "Watch" : "Healthy",
  };
}

function buildAnalytics(studentsInput) {
  const students = studentsInput.map(toStudent).map(summarizeStudent);
  const today = new Date().toISOString().slice(0, 10);
  const todayRecords = students.flatMap((student) =>
    (student.attendance || [])
      .filter((record) => record.date === today)
      .map((record) => ({ ...record, studentId: student.id }))
  );

  const totalRecords = students.flatMap((student) => student.attendance || []).filter((record) => record.status !== "excused");
  const attendedRecords = totalRecords.filter((record) => ["present", "late"].includes(record.status));

  const byDepartment = Object.values(
    students.reduce((acc, student) => {
      acc[student.department] ||= { department: student.department, students: 0, rateSum: 0, critical: 0 };
      acc[student.department].students += 1;
      acc[student.department].rateSum += student.attendanceRate;
      if (student.riskLevel === "Critical") acc[student.department].critical += 1;
      return acc;
    }, {})
  ).map((item) => ({
    ...item,
    attendanceRate: Math.round(item.rateSum / item.students),
  }));

  const dailyTrend = getRecentDates(14).map((date) => {
    const records = students.flatMap((student) => student.attendance || []).filter((record) => record.date === date && record.status !== "excused");
    const attended = records.filter((record) => ["present", "late"].includes(record.status)).length;
    return {
      date,
      attendanceRate: pct(attended, records.length),
      absent: records.filter((record) => record.status === "absent").length,
    };
  });

  const riskStudents = [...students].sort((a, b) => b.riskScore - a.riskScore).slice(0, 6);
  const weakestDepartment = [...byDepartment].sort((a, b) => a.attendanceRate - b.attendanceRate)[0];
  const strongestDepartment = [...byDepartment].sort((a, b) => b.attendanceRate - a.attendanceRate)[0];

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalStudents: students.length,
      overallAttendanceRate: pct(attendedRecords.length, totalRecords.length),
      presentToday: todayRecords.filter((record) => record.status === "present").length,
      lateToday: todayRecords.filter((record) => record.status === "late").length,
      absentToday: todayRecords.filter((record) => record.status === "absent").length,
      criticalStudents: students.filter((student) => student.riskLevel === "Critical").length,
    },
    byDepartment,
    dailyTrend,
    students,
    insights: [
      {
        title: "Early warning list",
        severity: "High",
        message: `${riskStudents[0]?.name || "No student"} needs first attention based on absence streak, late marks, and recent trend.`,
        action: "Schedule advisor follow-up today and notify guardian if the student misses one more class.",
      },
      {
        title: "Department intervention",
        severity: weakestDepartment?.attendanceRate < 82 ? "Medium" : "Low",
        message: `${weakestDepartment?.department || "No department"} currently has the lowest attendance at ${weakestDepartment?.attendanceRate || 0}%.`,
        action: "Run a department-wise attendance review and identify timetable or transport friction.",
      },
      {
        title: "Positive signal",
        severity: "Low",
        message: `${strongestDepartment?.department || "A department"} is leading with ${strongestDepartment?.attendanceRate || 0}% attendance.`,
        action: "Reuse their advisor rhythm and reminder pattern for weaker cohorts.",
      },
    ],
  };
}

module.exports = { buildAnalytics, summarizeStudent, toStudent };
