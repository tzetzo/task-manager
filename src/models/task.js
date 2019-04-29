const mongoose = require("mongoose");
const validator = require("validator"); //3rd party validation library

const taskSchema = new mongoose.Schema(
  {
    description: { type: String, trim: true, required: true },
    completed: { type: Boolean, default: false },
    owner: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" } //associating the User model with the Task model field owner; task.populate('owner').execPopulate() will fetch the entire user object
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
