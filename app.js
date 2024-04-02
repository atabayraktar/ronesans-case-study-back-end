const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

mongoose.connect(
  "mongodb+srv://atabayraktar17:UCSQvP12SjCm37jj@ronesans-to-do.1tuyzpq.mongodb.net/?retryWrites=true&w=majority&appName=ronesans-to-do",
  {}
);

const TodoSchema = new mongoose.Schema({
  name: String,
  time: Date,
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const Todo = mongoose.model("Todo", TodoSchema);
const User = mongoose.model("User", UserSchema);

const app = express();

app.use(cors());

app.use(bodyParser.json());

app.get("/todo/getAll", async (req, res) => {
  try {
    const todos = await Todo.find({ user_id: req.body.user_id });
    res.status(200).json({ isDone: true, todos });
  } catch (error) {
    res.status(400).json({ isDone: false, error });
  }
});

app.get("/todo/getOne/:id", async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    res.status(200).json({ isDone: true, todo });
  } catch (error) {
    res.status(400).json({ isDone: false, error });
  }
});

app.post("/todo/create", async (req, res) => {
  try {
    const newTodo = new Todo({
      name: req.body.name,
      time: new Date(req.body.time),
      user_id: req.body.user_id,
    });
    await newTodo.save();
    res.status(200).json({ isDone: true, newTodo });
  } catch (error) {
    res.status(400).json({ isDone: false, error });
  }
});

app.put("/todo/update/:id", async (req, res) => {
  try {
    const updatedTodo = await Todo.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        time: new Date(req.body.time),
      },
      {
        new: true,
      }
    );
    res.status(200).json({ isDone: true, updatedTodo });
  } catch (error) {
    res.status(400).json({ isDone: false, error });
  }
});

app.delete("/todo/delete/:id", async (req, res) => {
  try {
    const deletedTodo = await Todo.findByIdAndRemove(req.params.id);
    res.status(200).json({ isDone: true, deletedTodo });
  } catch (error) {
    res.status(400).json({ isDone: false, error });
  }
});

app.get("/todo/filter", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = new Date(startDate);
    const end = new Date(endDate);

    const todos = await Todo.find({ user_id: req.body.user_id });

    const filteredTodos = todos.filter((todo) => {
      const todoTime = new Date(todo.time);
      return todoTime >= start && todoTime <= end;
    });

    res.status(200).json({ isDone: true, filteredTodos });
  } catch (error) {
    res.status(400).json({ isDone: false, error });
  }
});

app.post("/user/register", async (req, res) => {
  try {
    const newUser = new User({
      username: req.body.username,
      password: req.body.password,
    });
    await newUser.save();
    res.status(200).json({ isDone: true, message: "User created" });
  } catch (error) {
    res.status(400).json({ isDone: false, error });
  }
});

app.post("/user/login", async (req, res) => {
  try {
    const foundUser = await User.findOne({
      username: req.body.username,
      password: req.body.password,
    });
    if (foundUser) {
      res.status(200).json({ isDone: true, foundUser });
    } else {
      throw new Error("User not found");
    }
  } catch (error) {
    res.status(400).json({ isDone: false, error });
  }
});

app.listen(3000, "0.0.0.0", () => console.log("Server started on port 3000"));
