const express = require("express");
require("./db/mongoose");
const userRouter = require("./routers/user");
const taskRouter = require("./routers/task");

const app = express();
const port = process.env.PORT;

//express middleware for authentication with JWT; auto used by all route handlers;
//needs to be before the route handlers;
// app.use((req, res, next) => {
//   res.status(503).send("Site under maintenance. Please come back later");
// });

app.use(express.json()); //parses the req.body JSON into object inside our path handlers
app.use(userRouter); //use these routes
app.use(taskRouter); //use these routes

app.listen(port, () => {
  console.log(`Server up on port: ${port}`);
});
