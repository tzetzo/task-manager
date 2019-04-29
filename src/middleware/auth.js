const jwt = require("jsonwebtoken");
const User = require("../models/user");

//express middleware used to give access to the route handlers only if valid token is provided
const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET); //contains '_id' of the user
    const user = await User.findOne({
      _id: decoded._id,
      "tokens.token": token //find user with the _id & token provided
    });
    if (!user) {
      throw new Error(); //fires the catch block
    }

    req.token = token;
    req.user = user; //save the user in the req object so that the request handler doesnt have to fetch the user again
    next();
  } catch (error) {
    res.status(401).send({ error: "Please authenticate" });
  }
  // next();
};

module.exports = auth;
