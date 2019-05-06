const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/user");
const { userOneId, userOne, setupDatabase } = require("./fixtures/db"); //used in both user.test.js & task.test.js

//runs before EACH test case:
beforeEach(setupDatabase);

//runs after EACH test case:
// afterEach(() => {
//   console.log("afterEach");
// });

//JEST method
test("Should signup a new user", async () => {
  const response = await request(app) //supertest library used
    .post("/users")
    .send({
      name: "Tzvetan M",
      email: "tzvetanmarinov@yahoo.com",
      password: "1162Cm13!"
    })
    .expect(201); //supertest methods

  //Assert that the database was changed correctly
  const user = await User.findById(response.body.user._id);
  expect(user).not.toBeNull(); //using JEST expect methods

  expect(response.body).toMatchObject({
    //the following should be part of the response.body :
    user: { name: "Tzvetan M", email: "tzvetanmarinov@yahoo.com" },
    token: user.tokens[0].token
  });

  //assert the password was hashed
  expect(user.password).not.toBe("1162Cm13!");
});

test("Should login existing user", async () => {
  const response = await request(app)
    .post("/users/login")
    .send({
      email: userOne.email,
      password: userOne.password
    })
    .expect(200);

  //assert the user has second token
  const user = await User.findById(userOneId);
  expect(user.tokens[1].token).toBe(response.body.token);
});

test("Should not login nonexistent user", async () => {
  await request(app)
    .post("/users/login")
    .send({
      email: userOne.email,
      password: "wrongpassword"
    })
    .expect(400);
});

test("Should get profile for user", async () => {
  await request(app)
    .get("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
});

test("Should not get profile for unauthenticated user", async () => {
  await request(app)
    .get("/users/me")
    .send()
    .expect(401);
});

test("Should delete account for user", async () => {
  await request(app)
    .delete("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  //assert the user was deleted:
  const user = await User.findById(userOneId);
  expect(user).toBeNull();
});

test("Should not delete account for unauthenticated user", async () => {
  await request(app)
    .delete("/users/me")
    .send()
    .expect(401);
});

test("Should upload avatar image", async () => {
  await request(app)
    .post("/users/me/avatar")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .attach("avatar", "tests/fixtures/profile-pic.jpg")
    .expect(200);

  const user = await User.findById(userOneId);
  expect(user.avatar).toEqual(expect.any(Buffer)); //check if its a binary data; 16.12 lesson; Buffer/String/Number
});

test("Should update valid user fields", async () => {
  await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      name: "Michael"
    })
    .expect(200);

  const user = await User.findById(userOneId);
  expect(user.name).toEqual("Michael");
});

test("Should not update invalid user fields", async () => {
  await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({ location: "Sofia" })
    .expect(400);
});
