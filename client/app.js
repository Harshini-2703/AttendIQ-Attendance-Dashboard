const apiBase = window.location.protocol === "file:" ? "http://localhost:5000/api/students" : "/api/students";

let analytics = null;
let currentUser = JSON.parse(localStorage.getItem("attendanceUser") || "null");
let teachers = [];
let emailLog = [];

const elements = {
  loginScreen: document.querySelector("#loginScreen"),
  loginForm: document.querySelector("#loginForm"),
  loginEmail: document.querySelector("#loginEmail"),
  roleLabel: document.querySelector("#roleLabel"),
  logoutBtn: document.querySelector("#logoutBtn"),
  totalStudents: document.querySelector("#totalStudents"),
  overallRate: document.querySelector("#overallRate"),
  absentToday: document.querySelector("#absentToday"),
  criticalStudents: document.querySelector("#criticalStudents"),
  lastUpdated: document.querySelector("#lastUpdated"),
  trendChart: document.querySelector("#trendChart"),
  insightList: document.querySelector("#insightList"),
  riskList: document.querySelector("#riskList"),
  departmentList: document.querySelector("#departmentList"),
  teacherList: document.querySelector("#teacherList"),
  emailLog: document.querySelector("#emailLog"),
  alertList: document.querySelector("#alertList"),
  interventionLog: document.querySelector("#interventionLog"),
  studentRows: document.querySelector("#studentRows"),
  searchInput: document.querySelector("#searchInput"),
  statusSelect: document.querySelector("#statusSelect"),
  refreshBtn: document.querySelector("#refreshBtn"),
  resetBtn: document.querySelector("#resetBtn"),
  addStudentBtn: document.querySelector("#addStudentBtn"),
  addTeacherBtn: document.querySelector("#addTeacherBtn"),
  parentEmailBtn: document.querySelector("#parentEmailBtn"),
  exportBtn: document.querySelector("#exportBtn"),
  printBtn: document.querySelector("#printBtn"),
  clearLogBtn: document.querySelector("#clearLogBtn"),
  markFilteredBtn: document.querySelector("#markFilteredBtn"),
  toast: document.querySelector("#toast"),
  studentDialog: document.querySelector("#studentDialog"),
  studentForm: document.querySelector("#studentForm"),
  closeDialogBtn: document.querySelector("#closeDialogBtn"),
  teacherDialog: document.querySelector("#teacherDialog"),
  teacherForm: document.querySelector("#teacherForm"),
  closeTeacherDialogBtn: document.querySelector("#closeTeacherDialogBtn"),
};

function showToast(message, type = "success") {
  elements.toast.textContent = message;
  elements.toast.className = `toast show ${type}`;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    elements.toast.className = "toast";
  }, 2600);
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;
  if (!response.ok) throw new Error(payload?.error || "Request failed. Check that the server is running.");
  return payload;
}

function isAdmin() {
  return currentUser?.role === "admin";
}

function isTeacher() {
  return currentUser?.role === "teacher";
}

function canMarkAttendance() {
  return isAdmin() || isTeacher();
}

function roleAnalyticsUrl() {
  if (!currentUser) return `${apiBase}/analytics/overview`;
  return `${apiBase}/analytics/scoped?email=${encodeURIComponent(currentUser.email)}`;
}

async function fetchAnalytics(showMessage = true) {
  analytics = await requestJson(roleAnalyticsUrl());
  if (isAdmin()) teachers = await requestJson(`${apiBase}/teachers`);
  if (canMarkAttendance()) emailLog = await requestJson(`${apiBase}/alerts/email-log`);
  render();
  if (showMessage) showToast("Dashboard refreshed");
}

function render() {
  renderRoleAccess();
  const { summary } = analytics;
  elements.totalStudents.textContent = summary.totalStudents;
  elements.overallRate.textContent = `${summary.overallAttendanceRate}%`;
  elements.absentToday.textContent = summary.absentToday;
  elements.criticalStudents.textContent = summary.criticalStudents;
  elements.lastUpdated.textContent = new Date(analytics.generatedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  renderTrend();
  renderInsights();
  renderRisk();
  renderDepartments();
  renderTeachers();
  renderEmailLog();
  renderAlerts();
  renderInterventionLog();
  renderStudents();
}

function renderRoleAccess() {
  const role = currentUser?.role || "guest";
  document.body.dataset.role = role;
  elements.loginScreen.classList.toggle("hidden", Boolean(currentUser));
  elements.roleLabel.textContent =
    role === "admin" ? "Admin workspace" : role === "teacher" ? `${currentUser.department} teacher` : "Student portal";
}

function getFilteredStudents() {
  const query = elements.searchInput.value.trim().toLowerCase();
  return analytics.students.filter((student) =>
    [student.name, student.rollNo, student.department, student.advisor].join(" ").toLowerCase().includes(query)
  );
}

function renderTrend() {
  const canvas = elements.trendChart;
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;
  const padding = 42;
  const points = analytics.dailyTrend;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#dfe5ef";
  ctx.lineWidth = 1;

  for (let i = 0; i <= 4; i += 1) {
    const y = padding + ((height - padding * 2) / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }

  const xStep = (width - padding * 2) / Math.max(points.length - 1, 1);
  const yFor = (rate) => height - padding - (rate / 100) * (height - padding * 2);

  ctx.beginPath();
  points.forEach((point, index) => {
    const x = padding + xStep * index;
    const y = yFor(point.attendanceRate);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = "#2563eb";
  ctx.lineWidth = 4;
  ctx.stroke();

  points.forEach((point, index) => {
    const x = padding + xStep * index;
    const y = yFor(point.attendanceRate);
    ctx.fillStyle = point.attendanceRate < 80 ? "#c24135" : "#108a61";
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "#697386";
  ctx.font = "14px Segoe UI";
  ctx.fillText("100%", 8, padding + 4);
  ctx.fillText("0%", 20, height - padding + 4);
}

function renderInsights() {
  elements.insightList.innerHTML = analytics.insights
    .map(
      (insight) => `
        <div class="insight">
          <span class="badge">${insight.severity}</span>
          <strong>${insight.title}</strong>
          <p>${insight.message}</p>
          <p><b>Action:</b> ${insight.action}</p>
        </div>
      `
    )
    .join("");
}

function renderRisk() {
  const students = [...analytics.students].sort((a, b) => b.riskScore - a.riskScore).slice(0, 5);
  elements.riskList.innerHTML = students
    .map((student) => {
      const barClass = student.riskScore >= 55 ? "danger" : student.riskScore >= 32 ? "warn" : "";
      return `
        <div class="risk-item">
          <div class="risk-top">
            <strong>${student.name}</strong>
            <span class="risk-${student.riskLevel.toLowerCase()}">${student.riskLevel}</span>
          </div>
          <p>${student.department} | ${student.rollNo} | ${student.currentStreak} day absence streak</p>
          <div class="bar"><span class="${barClass}" style="width:${student.riskScore}%"></span></div>
          ${canMarkAttendance() ? `<button class="ghost small plan-btn" data-id="${student.id}">Create plan</button>` : ""}
        </div>
      `;
    })
    .join("");

  document.querySelectorAll(".plan-btn").forEach((button) => {
    button.addEventListener("click", () => createIntervention(button.dataset.id));
  });
}

function renderDepartments() {
  elements.departmentList.innerHTML = analytics.byDepartment
    .sort((a, b) => b.attendanceRate - a.attendanceRate)
    .map((dept) => {
      const barClass = dept.attendanceRate < 80 ? "danger" : dept.attendanceRate < 88 ? "warn" : "";
      return `
        <div class="dept-item">
          <strong>${dept.department}</strong>
          <p>${dept.students} students | ${dept.critical} critical</p>
          <div class="bar"><span class="${barClass}" style="width:${dept.attendanceRate}%"></span></div>
          <p>${dept.attendanceRate}% attendance</p>
        </div>
      `;
    })
    .join("");
}

function renderTeachers() {
  elements.teacherList.innerHTML = teachers
    .map(
      (teacher) => `
        <div class="dept-item">
          <strong>${teacher.name}</strong>
          <p>${teacher.department}</p>
          <p>${teacher.email}</p>
        </div>
      `
    )
    .join("");
}

function renderEmailLog() {
  elements.emailLog.innerHTML =
    emailLog.length === 0
      ? `<div class="log-empty">No parent emails prepared yet.</div>`
      : emailLog
          .slice(0, 8)
          .map(
            (email) => `
              <div class="log-item">
                <strong>${email.student}</strong>
                <p>${email.message}</p>
                <small>To ${email.to} | ${email.status}</small>
              </div>
            `
          )
          .join("");
}

function buildAlerts() {
  const critical = analytics.students.filter((student) => student.riskLevel === "Critical");
  const falling = analytics.students.filter((student) => student.trend <= -12);
  const latePattern = analytics.students.filter((student) => student.late >= 4);
  const weakDepartments = analytics.byDepartment.filter((dept) => dept.attendanceRate < 85);

  return [
    ...critical.slice(0, 3).map((student) => ({
      title: `${student.name} is critical`,
      text: `${student.attendanceRate}% attendance with ${student.absent} absences. Advisor: ${student.advisor}.`,
      level: "danger",
    })),
    ...falling.slice(0, 2).map((student) => ({
      title: `${student.name} is dropping fast`,
      text: `Recent trend changed by ${student.trend} points. Counselling is recommended before the next class.`,
      level: "warn",
    })),
    ...latePattern.slice(0, 2).map((student) => ({
      title: `${student.name} has late-arrival pattern`,
      text: `${student.late} late marks suggest transport, timetable, or motivation friction.`,
      level: "warn",
    })),
    ...weakDepartments.map((dept) => ({
      title: `${dept.department} needs review`,
      text: `${dept.attendanceRate}% attendance across ${dept.students} students.`,
      level: "info",
    })),
  ].slice(0, 6);
}

function renderAlerts() {
  const alerts = buildAlerts();
  elements.alertList.innerHTML =
    alerts.length === 0
      ? `<div class="alert info"><strong>No urgent alerts</strong><p>Attendance health is stable today.</p></div>`
      : alerts.map((alert) => `<div class="alert ${alert.level}"><strong>${alert.title}</strong><p>${alert.text}</p></div>`).join("");
}

function getLog() {
  return JSON.parse(localStorage.getItem("attendanceInterventions") || "[]");
}

function saveLog(log) {
  localStorage.setItem("attendanceInterventions", JSON.stringify(log));
}

function renderInterventionLog() {
  const log = getLog();
  elements.interventionLog.innerHTML =
    log.length === 0
      ? `<div class="log-empty">No intervention plans recorded yet.</div>`
      : log
          .slice(0, 8)
          .map((entry) => `<div class="log-item"><strong>${entry.student}</strong><p>${entry.plan}</p><small>${entry.createdAt}</small></div>`)
          .join("");
}

function createIntervention(studentId) {
  const student = analytics.students.find((item) => item.id === studentId);
  if (!student) return;
  const plan = [
    `Advisor ${student.advisor} to meet ${student.name}.`,
    student.currentStreak > 0 ? `Resolve ${student.currentStreak}-day absence streak.` : "Confirm current attendance recovery.",
    student.late >= 4 ? "Discuss late-arrival cause and reminder timing." : "Send positive attendance nudge.",
    student.attendanceRate < 75 ? "Notify guardian if the next session is missed." : "Review again after three classes.",
  ].join(" ");

  const log = getLog();
  log.unshift({ student: student.name, plan, createdAt: new Date().toLocaleString() });
  saveLog(log);
  renderInterventionLog();
  showToast("Intervention plan created");
}

function renderStudents() {
  const filtered = getFilteredStudents();
  elements.studentRows.innerHTML = filtered
    .map(
      (student) => `
      <tr>
        <td>
          <span class="student-name">${student.name}</span>
          <span class="subtext">${student.rollNo} | Year ${student.year}-${student.section}</span>
        </td>
        <td>${student.department}</td>
        <td>${student.attendanceRate}% <span class="subtext">${student.absent} absent, ${student.late} late</span></td>
        <td><strong class="risk-${student.riskLevel.toLowerCase()}">${student.riskLevel}</strong><span class="subtext">Score ${student.riskScore}</span></td>
        <td>${student.advisor}</td>
        <td>
  ${
    canMarkAttendance()
      ? `
      <button data-id="${student.id}" class="mark-btn">
        Mark ${elements.statusSelect.value}
      </button>

      <button data-id="${student.id}" class="ghost small plan-btn">
        Plan
      </button>
      
      <button data-id="${student.id}" class="view-btn">
        View
      </button>

      <button data-id="${student.id}" class="edit-btn">
        Edit
      </button>

      <button data-id="${student.id}" class="delete-btn">
        Delete
      </button>
      `
      : `<span class="subtext">View only</span>`
  }
</td>
      </tr>
    `
    )
    .join("");

  document.querySelectorAll(".mark-btn").forEach((button) => {
    button.addEventListener("click", () => markAttendance(button.dataset.id).catch(handleError));
});
  
  document.querySelectorAll("#studentRows .plan-btn").forEach((button) => {
    button.addEventListener("click", () => createIntervention(button.dataset.id));
});

  document.querySelectorAll(".view-btn").forEach((button) => {
  button.addEventListener("click", () =>
    viewStudent(button.dataset.id)
  );
});

  document.querySelectorAll(".delete-btn").forEach((button) => {
  button.addEventListener("click", () =>
    deleteStudent(button.dataset.id).catch(handleError)
  );
});

document.querySelectorAll(".edit-btn").forEach((button) => {
  button.addEventListener("click", () =>
    editStudent(button.dataset.id).catch(handleError)
  );
});
}

async function login(event) {
  event.preventDefault();
  const { user } = await requestJson(`${apiBase}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: elements.loginEmail.value }),
  });
  currentUser = user;
  localStorage.setItem("attendanceUser", JSON.stringify(user));
  await fetchAnalytics(false);
  showToast(`Logged in as ${user.role}`);
}

async function markAttendance(studentId) {
  await requestJson(`${apiBase}/${studentId}/attendance`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: elements.statusSelect.value }),
  });
  await fetchAnalytics(false);
  showToast(`Attendance marked ${elements.statusSelect.value}`);
}

async function markFilteredStudents() {
  if (!canMarkAttendance()) return showToast("Students have view-only access", "error");
  const students = getFilteredStudents();
  await Promise.all(
    students.map((student) =>
      requestJson(`${apiBase}/${student.id}/attendance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: elements.statusSelect.value }),
      })
    )
  );
  await fetchAnalytics(false);
  showToast(`${students.length} students marked ${elements.statusSelect.value}`);
}

async function deleteStudent(id) {
  if (!confirm("Delete this student?")) return;

  await requestJson(`${apiBase}/${id}`, {
    method: "DELETE",
  });

  await fetchAnalytics(false);
  showToast("Student deleted");
}

async function editStudent(id) {
  const student = analytics.students.find((s) => s.id === id);

  if (!student) {
    showToast("Student not found", "error");
    return;
  }

  const name = prompt("Student Name", student.name);
  if (!name) return;

  const department = prompt("Department", student.department);
  if (!department) return;
  
  const advisor = prompt("Mentor / Advisor", student.advisor);
  if (!advisor) return;

  await requestJson(`${apiBase}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      department,
      advisor,
    }),
  });

  await fetchAnalytics(false);
  showToast("Student updated");
}

async function viewStudent(id) {
  const student = analytics.students.find((s) => s.id === id);

  if (!student) return;

  alert(`
Name: ${student.name}

Roll No: ${student.rollNo}

Department: ${student.department}

Year: ${student.year}

Section: ${student.section}

Advisor: ${student.advisor}

Attendance: ${student.attendanceRate}%

Risk Level: ${student.riskLevel}
  `);
}

async function addStudent(event) {
  event.preventDefault();
  if (!isAdmin()) return showToast("Only admin can add students", "error");
  const form = new FormData(elements.studentForm);
  const student = Object.fromEntries(form.entries());
  student.year = Number(student.year);
  await requestJson(apiBase, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(student),
  });
  elements.studentForm.reset();
  elements.studentDialog.close();
  await fetchAnalytics(false);
  showToast("Student added");
}

async function addTeacher(event) {
  event.preventDefault();
  if (!isAdmin()) return showToast("Only admin can add teachers", "error");
  const teacher = Object.fromEntries(new FormData(elements.teacherForm).entries());
  await requestJson(`${apiBase}/teachers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(teacher),
  });
  elements.teacherForm.reset();
  elements.teacherDialog.close();
  await fetchAnalytics(false);
  showToast("Teacher added");
}

async function sendParentEmails() {
  if (!canMarkAttendance()) return showToast("Only admin and teachers can email parents", "error");
  const result = await requestJson(`${apiBase}/alerts/parents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: currentUser.email, threshold: 75 }),
  });
  emailLog = result.emailLog;
  renderEmailLog();
  showToast(`${result.emails.length} parent email alerts prepared`);
}

function exportCsv() {
  const rows = [
    ["Name", "Roll No", "Department", "Year", "Section", "Advisor", "Attendance Rate", "Risk Level", "Risk Score"],
    ...analytics.students.map((student) => [
      student.name,
      student.rollNo,
      student.department,
      student.year,
      student.section,
      student.advisor,
      `${student.attendanceRate}%`,
      student.riskLevel,
      student.riskScore,
    ]),
  ];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `attendance-report-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("CSV report exported");
}

function bindEvents() {
  elements.loginForm.addEventListener("submit", (event) => login(event).catch(handleError));
  document.querySelectorAll(".demo-logins button").forEach((button) => {
    button.addEventListener("click", () => {
      elements.loginEmail.value = button.dataset.email;
    });
  });
  elements.logoutBtn.addEventListener("click", () => {
    currentUser = null;
    localStorage.removeItem("attendanceUser");
    renderRoleAccess();
    showToast("Logged out");
  });
  elements.searchInput.addEventListener("input", renderStudents);
  elements.statusSelect.addEventListener("change", renderStudents);
  elements.refreshBtn.addEventListener("click", () => fetchAnalytics().catch(handleError));
  elements.resetBtn.addEventListener("click", async () => {
    await requestJson(`${apiBase}/demo/reset`, { method: "POST" });
    await fetchAnalytics(false);
    showToast("Demo data reset");
  });
  elements.addStudentBtn.addEventListener("click", () => elements.studentDialog.showModal());
  elements.addTeacherBtn.addEventListener("click", () => elements.teacherDialog.showModal());
  elements.parentEmailBtn.addEventListener("click", () => sendParentEmails().catch(handleError));
  elements.closeDialogBtn.addEventListener("click", () => elements.studentDialog.close());
  elements.closeTeacherDialogBtn.addEventListener("click", () => elements.teacherDialog.close());
  elements.studentForm.addEventListener("submit", (event) => addStudent(event).catch(handleError));
  elements.teacherForm.addEventListener("submit", (event) => addTeacher(event).catch(handleError));
  elements.exportBtn.addEventListener("click", exportCsv);
  elements.printBtn.addEventListener("click", () => window.print());
  elements.clearLogBtn.addEventListener("click", () => {
    saveLog([]);
    renderInterventionLog();
    showToast("Intervention log cleared");
  });
  elements.markFilteredBtn.addEventListener("click", () => markFilteredStudents().catch(handleError));
}

function handleError(error) {
  showToast(error.message, "error");
}

bindEvents();
renderRoleAccess();
if (currentUser) {
  fetchAnalytics(false).catch(handleError);
}
