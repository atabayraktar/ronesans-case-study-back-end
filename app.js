require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");
const Joi = require("joi");

mongoose.connect(process.env.MONGODB_URI, {});

const TodoSchema = new mongoose.Schema({
  name: String,
  time: Date,
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, max: 10 },
  password: { type: String, required: true, max: 10 },
});

UserSchema.pre("save", function (next) {
  if (this.isModified("password") || this.isNew) {
    bcrypt.hash(this.password, 10, (err, hashedPassword) => {
      if (err) {
        return next(err);
      }
      this.password = hashedPassword;
      next();
    });
  } else {
    return next();
  }
});

const Todo = mongoose.model("Todo", TodoSchema);
const User = mongoose.model("User", UserSchema);

const app = express();

app.use(cors());

app.use(bodyParser.json());

const validateUser = (user) => {
  const schema = Joi.object({
    username: Joi.string().max(10).required(),
    password: Joi.string().max(10).required(),
  });

  return schema.validate(user);
};

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
    const deletedTodo = await Todo.findByIdAndDelete(req.params.id).exec();
    if (!deletedTodo) {
      return res.status(404).json({ isDone: false, error: "Todo not found" });
    }
    res.status(200).json({ isDone: true, deletedTodo });
  } catch (error) {
    console.error(error);
    res.status(400).json({ isDone: false, error: error.message });
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
    const { error } = validateUser(req.body);
    if (error) {
      return res
        .status(400)
        .json({ isDone: false, error: error.details[0].message });
    }

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
    const { error } = validateUser(req.body);
    if (error) {
      return res
        .status(400)
        .json({ isDone: false, error: error.details[0].message });
    }

    const foundUser = await User.findOne({ username: req.body.username });
    if (foundUser) {
      bcrypt.compare(req.body.password, foundUser.password, (err, isMatch) => {
        if (err) {
          return res.status(500).json({ isDone: false, error: err });
        }
        if (isMatch) {
          res.status(200).json({ isDone: true, foundUser });
        } else {
          res.status(400).json({ isDone: false, error: "Invalid password" });
        }
      });
    } else {
      throw new Error("User not found");
    }
  } catch (error) {
    res.status(400).json({ isDone: false, error });
  }
});

app.listen(3000, "0.0.0.0", () => console.log("Server started on port 3000"));
