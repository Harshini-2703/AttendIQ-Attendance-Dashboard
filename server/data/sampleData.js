const names = [
  ["Aarav Sharma", "AI202601", "Computer Science", 3, "A", "Dr. Nisha Rao"],
  ["Diya Patel", "AI202602", "Computer Science", 3, "A", "Dr. Nisha Rao"],
  ["Kabir Khan", "AI202603", "Computer Science", 2, "B", "Prof. Iqbal Das"],
  ["Meera Iyer", "AI202604", "Computer Science", 2, "B", "Prof. Iqbal Das"],
  ["Rohan Verma", "EC202601", "Electronics", 4, "A", "Dr. Kavya Menon"],
  ["Ananya Singh", "EC202602", "Electronics", 4, "A", "Dr. Kavya Menon"],
  ["Vivaan Reddy", "EC202603", "Electronics", 1, "C", "Prof. Harish Nair"],
  ["Sara Thomas", "EC202604", "Electronics", 1, "C", "Prof. Harish Nair"],
  ["Ishaan Gupta", "ME202601", "Mechanical", 3, "B", "Dr. Arjun Bose"],
  ["Naina Das", "ME202602", "Mechanical", 3, "B", "Dr. Arjun Bose"],
  ["Aditya Rao", "ME202603", "Mechanical", 2, "A", "Prof. Priya Shah"],
  ["Zoya Ahmed", "ME202604", "Mechanical", 2, "A", "Prof. Priya Shah"],
  ["Neel Joshi", "DS202601", "Data Science", 4, "A", "Dr. Fatima Ali"],
  ["Tara Nair", "DS202602", "Data Science", 4, "A", "Dr. Fatima Ali"],
  ["Arjun Pillai", "DS202603", "Data Science", 1, "B", "Prof. Kiran Mehta"],
  ["Maya Kapoor", "DS202604", "Data Science", 1, "B", "Prof. Kiran Mehta"],
];

const today = new Date();

function isoDate(daysAgo) {
  const date = new Date(today);
  date.setDate(today.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function createAttendance(index) {
  const records = [];
  for (let daysAgo = 29; daysAgo >= 0; daysAgo -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - daysAgo);

    if (date.getDay() === 0) {
      continue;
    }

    const pattern = (index * 7 + daysAgo * 3) % 20;
    let status = "present";

    if ([2, 9, 15].includes(pattern)) {
      status = "late";
    }

    if ((index === 2 && daysAgo < 6) || (index === 8 && [1, 3, 4, 8, 11].includes(daysAgo))) {
      status = "absent";
    }

    if ((index + daysAgo) % 17 === 0) {
      status = "absent";
    }

    if ((index + daysAgo) % 23 === 0) {
      status = "excused";
    }

    records.push({ date: isoDate(daysAgo), status });
  }
  return records;
}

function createSampleStudents() {
  return names.map(([name, rollNo, department, year, section, advisor], index) => ({
    id: String(index + 1),
    name,
    rollNo,
    department,
    year,
    section,
    advisor,
    guardianPhone: `+91 90000 00${String(index + 1).padStart(2, "0")}`,
    parentEmail: `${rollNo.toLowerCase()}-parent@family.demo`,
    studentEmail: `${rollNo.toLowerCase()}@student.attendiq.edu`,
    attendance: createAttendance(index),
  }));
}

function createSampleTeachers() {
  return [
    { id: "t1", name: "Dr. Nisha Rao", email: "nisha.rao@teacher.attendiq.edu", department: "Computer Science" },
    { id: "t2", name: "Dr. Kavya Menon", email: "kavya.menon@teacher.attendiq.edu", department: "Electronics" },
    { id: "t3", name: "Dr. Arjun Bose", email: "arjun.bose@teacher.attendiq.edu", department: "Mechanical" },
    { id: "t4", name: "Dr. Fatima Ali", email: "fatima.ali@teacher.attendiq.edu", department: "Data Science" },
  ];
}

module.exports = { createSampleStudents, createSampleTeachers };
