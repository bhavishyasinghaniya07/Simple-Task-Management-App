const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Task = require("../models/Task");
const { auth, isAdmin } = require("../middleware/auth");

// Create new task
router.post(
  "/",
  auth,
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required"),
    body("dueDate").isISO8601().withMessage("Valid due date is required"),
    body("assignedTo").notEmpty().withMessage("Assigned user is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, description, dueDate, priority, assignedTo } = req.body;

      const task = new Task({
        title,
        description,
        dueDate,
        priority: priority || "medium",
        assignedTo,
        createdBy: req.userId,
      });

      await task.save();
      await task.populate("assignedTo", "name email");
      await task.populate("createdBy", "name email");

      res.status(201).json(task);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error creating task" });
    }
  }
);

// Get tasks with pagination and filters
router.get("/", auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query based on user role
    let query = {};
    if (req.user.role !== "admin") {
      query.assignedTo = req.userId;
    }

    // Add filters
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    const tasks = await Task.find(query)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalTasks: total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching tasks" });
  }
});

// Get single task by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check if user has access to this task
    if (
      req.user.role !== "admin" &&
      task.assignedTo._id.toString() !== req.userId.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching task" });
  }
});

// Update task
router.put(
  "/:id",
  auth,
  [
    body("title")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Title cannot be empty"),
    body("description")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Description cannot be empty"),
    body("dueDate")
      .optional()
      .isISO8601()
      .withMessage("Valid due date is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const task = await Task.findById(req.params.id);

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Check permissions
      if (
        req.user.role !== "admin" &&
        task.assignedTo.toString() !== req.userId.toString()
      ) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { title, description, dueDate, status, priority, assignedTo } =
        req.body;

      if (title) task.title = title;
      if (description) task.description = description;
      if (dueDate) task.dueDate = dueDate;
      if (status) task.status = status;
      if (priority) task.priority = priority;
      if (assignedTo && req.user.role === "admin") task.assignedTo = assignedTo;

      await task.save();
      await task.populate("assignedTo", "name email");
      await task.populate("createdBy", "name email");

      res.json(task);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error updating task" });
    }
  }
);

// Delete task
router.delete("/:id", auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check permissions
    if (
      req.user.role !== "admin" &&
      task.createdBy.toString() !== req.userId.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting task" });
  }
});

module.exports = router;
