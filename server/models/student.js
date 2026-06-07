const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  rollNo: {
    type: String,
    required: true,
    unique: true,
  },
  department: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  section: {
    type: String,
    default: "A",
  },
  advisor: {
    type: String,
    default: "Unassigned",
  },
  guardianPhone: {
    type: String,
    default: "",
  },
  parentEmail: {
    type: String,
    default: "",
  },
  studentEmail: {
    type: String,
    default: "",
  },
  attendance: [
    {
      date: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        enum: ["present", "absent", "late", "excused"],
        required: true,
      },
      note: {
        type: String,
        default: "",
      },
    },
  ],
});

module.exports = mongoose.model("Student", studentSchema);
