const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const User = require("../models/user");
const router = new express.Router();
const auth = require("../middleware/auth");
const { sendWelcomeEmail, sendCancelationEmail } = require("../emails/account"); //object destructuring

//public path accessible by everyone;
// SignUp user
router.post("/users", async (req, res) => {
  //req.body accessible thanks to app.use(express.json());

  const user = new User(req.body);

  try {
    await user.save();
    sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken();

    res.status(201).send({ user, token }); //this line will not run if error occurs in the previous line
  } catch (error) {
    res.status(400).send(error); //https://httpstatuses.com; also inform the user he made a bad request(wrong password format etc)
  }
});

//public path accessible by everyone;
// SignIn user
router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.send({ user, token }); //res.send() calls JSON.stringify behind the scenes (12.11 lesson)
  } catch (error) {
    res.status(400).send();
  }
});

//Logout user
router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(
      token => token.token !== req.token
    );

    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send();
  }
});

//Logout user from all devices where logged in
router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];

    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send();
  }
});

//Read my own user; use express middleware for authentication with JWT
router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

// Read specific user:
// NOT TO BE USED; SHOULDNT BE ABLE TO GET USERS BY THEIR ID; 12.12 lesson
// router.get("/users/:id", async (req, res) => {
//   // console.log(req.params.id);
//   try {
//     const user = await User.findById(req.params.id);
//     if (!user) {
//       //ID is valid MongoDB ID but user was not found;
//       return res.status(404).send();
//     }
//     res.send(user);
//   } catch (error) {
//     //fired when ID is not a valid MongoDB ID
//     res.status(500).send(error);
//   }
// });

//Allow user to update his own user only:
router.patch("/users/me", auth, async (req, res) => {
  //first validate user input by checking if only valid properties are received
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password", "age"]; //verify fields exist in /models/user
  const isValidOperation = updates.every(update =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates" });
  }

  try {
    //update provided by user fields; keep the rest like _id and the not provided:
    updates.forEach(update => (req.user[update] = req.body[update]));
    //save the user; that way Mongoose middleware 'userSchema.pre("save",...)' is auto used
    await req.user.save();

    res.send(req.user);
  } catch (error) {
    res.status(400).send(error);
  }
});

//Allow user to delete his own user only:
router.delete("/users/me", auth, async (req, res) => {
  try {
    await req.user.remove(); //same as req.user.save() but deletes the user from MongoDB
    sendCancelationEmail(req.user.email, req.user.name);

    res.send(req.user);
  } catch (error) {
    res.status(400).send(error);
  }
});

//using multer to upload files:
const upload = multer({
  // dest: "avatars", //the folder to store the uploaded files; not needed if we save the uploaded file as binary in the MongoDB as part of the user model
  limits: { fileSize: 1000000 }, //in bytes; 1MB
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(
        new Error("Please upload an image with jpg/jpeg/png extension")
      );
    }
    cb(undefined, true);
  }
});

//Create avatar image
router.post(
  "/users/me/avatar",
  auth, //middleware
  upload.single("avatar"), //using multer middleware to upload files; tell multer to look for file called avatar
  async (req, res) => {
    //success callback
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 }) //crop uploaded images
      .png() //convert uploaded images to .png
      .toBuffer(); //convert to binary
    req.user.avatar = buffer; //save the uploaded file as binary in the MongoDB (14.6 lesson)
    await req.user.save();
    res.send();
  },
  (error, req, res, next) => {
    //error callback
    res.status(400).send({ error: error.message });
  }
);

//Delete the avatar image
router.delete("/users/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send();
});

//Read the avatar image for the user with the given ID
router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.avatar) {
      return new Error();
    }

    res.set("Content-Type", "image/png");
    res.send(user.avatar);
  } catch (error) {
    res.status(404).send();
  }
});

module.exports = router;
