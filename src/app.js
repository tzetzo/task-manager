//we have our express app in separate file so we can use it with our tests as well
const express = require("express");
require("./db/mongoose"); //connection to MongoDB Server is established
const userRouter = require("./routers/user"); //endpoint for users
const taskRouter = require("./routers/task"); //endpoints for tasks

const app = express();
// const port = process.env.PORT;

//express middleware; auto used by all route handlers;
//needs to be before the route handlers;
// app.use((req, res, next) => {
//   res.status(503).send("Site under maintenance. Please come back later");
// });

app.use(express.json()); //parses the req.body JSON into object inside our path handlers
app.use(userRouter); //use these endpoints; alternative app.use("/api", require("./routers/user"));
app.use(taskRouter); //use these endpoints

module.exports = app;
