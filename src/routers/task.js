const express = require("express");
const Task = require("../models/task");
const auth = require("../middleware/auth");
const router = new express.Router();

//Create a Task
router.post("/tasks", auth, async (req, res) => {
  //req.body accessible thanks to app.use(express.json());

  // const task = new Task(req.body);
  const task = new Task({ ...req.body, owner: req.user._id });

  try {
    await task.save();
    res.status(201).send(task);
  } catch (error) {
    res.status(400).send(error);
  }
});

//GET /tasks?completed=true
//GET /tasks?limit=10&skip=20
//GET /tasks?sortBy=createdAt_asc //OR desc
//Read all tasks for current user
router.get("/tasks", auth, async (req, res) => {
  const match = {};
  const sort = {};

  //check if completed query string was provided with the request and set match.completed
  if (req.query.completed) {
    match.completed = req.query.completed === "true";
  }

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split("_");
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
  }

  try {
    // const tasks = await Task.find({ owner: req.user._id, ...match }, null, {
    //   limit: parseInt(req.query.limit),
    //   skip: parseInt(req.query.skip),
    //   sort
    // });
    // res.send(tasks);
    await req.user
      .populate({
        path: "tasks",
        match, //filtering (13.3 lesson)
        options: {
          limit: parseInt(req.query.limit), //pagination (13.4 lesson)
          skip: parseInt(req.query.skip), //pagination (13.4 lesson)
          sort //(13.5 lesson)
        }
      })
      .execPopulate(); //(13.3 lesson) the virtual field "tasks" from the user model used
    res.send(req.user.tasks);
  } catch (error) {
    res.status(500).send(error);
  }
});

//Read specific task:
router.get("/tasks/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id
    });
    if (!task) {
      //ID is valid MongoDB ID but task was not found;
      return res.status(404).send();
    }
    res.send(task);
  } catch (error) {
    //fired when ID is not a valid MongoDB ID
    res.status(500).send(error);
  }
});

//Update specific task:
router.patch("/tasks/:id", auth, async (req, res) => {
  //first validate user input by checking if only valid properties are received
  const updates = Object.keys(req.body);
  const allowedUpdates = ["description", "completed"]; //verify fields exist in /models/task
  const isValidOperation = updates.every(update =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates" });
  }

  try {
    //first get the task;
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!task) {
      return res.status(404).send();
    }

    //update task fields
    updates.forEach(update => (task[update] = req.body[update]));
    //save the task; that way Mongoose middleware 'taskSchema.pre("save",...)' is auto used
    await task.save();

    res.send(task);
  } catch (error) {
    res.status(400).send(error);
  }
});

//Delete specific task:
router.delete("/tasks/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!task) {
      return res.status(404).send();
    }

    res.send(task);
  } catch (error) {
    res.status(400).send(error);
  }
});

module.exports = router;
