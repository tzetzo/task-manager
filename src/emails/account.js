const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
  //async needed if using await below
  //const resp = await sgMail.send({
  sgMail.send({
    //asynchronous, but we dont need to wait
    to: email,
    from: "tzvetanmarinov@yahoo.com",
    subject: "Thanks for joining in.",
    text: `Welcome to the app, ${name}. Let me know how you get along with the app.`
  });
  // console.log(resp);
};

const sendCancelationEmail = (email, name) => {
  //async needed if using await below
  //const resp = await sgMail.send({
  sgMail.send({
    //asynchronous, but we dont need to wait
    to: email,
    from: "tzvetanmarinov@yahoo.com",
    subject: "Sorry to see you go.",
    text: `Goodbye, ${name}. Was there something we could have done to keep you on board?`
  });
  // console.log(resp);
};

module.exports = {
  sendWelcomeEmail,
  sendCancelationEmail
};
