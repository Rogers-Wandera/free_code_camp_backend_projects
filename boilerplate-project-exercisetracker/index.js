const express = require("express");
const app = express();
const cors = require("cors");
const { v4: uuid } = require("uuid");
require("dotenv").config();

const users = [];

app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/users/:id", (req, res) => {
  const user = users.find((user) => user._id === req.params.id);
  if (!user) {
    return res.json({ error: "No user found" });
  }
  res.json(user);
});

app.get("/api/users", (req, res) => {
  res.json(users);
});

app.post("/api/users", (req, res) => {
  const username = req.body.username;
  const userId = uuid();
  users.push({ username, _id: userId });
  res.redirect(`/api/users/${userId}`);
});

app.post("/api/users/:_id/exercises", (req, res) => {
  const { description, duration, date } = req.body;
  const _id = req.body[":_id"];
  const userExists = users.find((user) => user._id === _id);
  if (!userExists) {
    return res.json({ error: "No user found" });
  }
  const exercise = { description, duration, date };
  if (userExists.log) {
    userExists.log.push(exercise);
  } else {
    userExists.log = [exercise];
  }
  res.json({
    _id,
    username: userExists.username,
    description,
    duration,
    date: new Date(date).toDateString(),
  });
});

app.get("/api/users/:_id/logs", (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;
  const userExists = users.find((user) => user._id === _id);
  if (!userExists) {
    return res.json({ error: "No user found" });
  }
  let filteredLogs = userExists.log;
  if (from) {
    filteredLogs = filteredLogs.filter(
      (log) => new Date(log.date) >= new Date(from)
    );
  }
  if (to) {
    filteredLogs = filteredLogs.filter(
      (log) => new Date(log.date) <= new Date(to)
    );
  }
  if (limit) {
    filteredLogs = filteredLogs.slice(0, limit);
  }
  res.json({
    _id,
    username: userExists.username,
    count: filteredLogs.length,
    log: filteredLogs,
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
