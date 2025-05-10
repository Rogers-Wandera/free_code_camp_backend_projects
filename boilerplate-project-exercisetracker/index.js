const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const { v4: uuid } = require("uuid");
require("dotenv").config();

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  log: [
    {
      description: { type: String, required: true },
      duration: { type: Number, required: true },
      date: { type: Date, required: false },
    },
  ],
});

const User = mongoose.model("User", userSchema);

app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/users/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.json({ error: "No user found" });
  }
  res.json(user);
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/users", async (req, res) => {
  const username = req.body.username;
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }
  try {
    const user = new User({ username });
    const savedUser = await user.save();
    res.json(savedUser);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  let { description, duration, date } = req.body;
  const _id = req.body[":_id"];
  try {
    const userExists = await User.findById(_id);
    if (!userExists) {
      return res.json({ error: "No user found" });
    }
    if (!date) {
      date = new Date();
    }
    const exercise = { description, duration: Number(duration), date };
    userExists.log.push(exercise);
    userExists.count += 1;
    await userExists.save();

    res.json({
      _id,
      username: userExists.username,
      description,
      duration,
      date: new Date(date).toDateString(),
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;
  try {
    const userExists = await User.findById(_id);
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
      count: userExists.count,
      log: filteredLogs.map((log) => ({
        description: log.description,
        duration: log.duration,
        date: new Date(log.date).toDateString(),
      })),
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
