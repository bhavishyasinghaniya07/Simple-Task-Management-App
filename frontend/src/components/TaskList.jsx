import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext.jsx";

const TaskList = ({ onViewTask, onEditTask, refreshTrigger }) => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState({
    low: [],
    medium: [],
    high: [],
    urgent: [],
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
  });
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchTasks();
  }, [currentPage, filters, refreshTrigger]);

  useEffect(() => {
    organizeTasks();
  }, [tasks]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 10,
        ...filters,
      };

      const response = await axios.get("/api/tasks", { params });
      setTasks(response.data.tasks);
      setTotalPages(response.data.totalPages);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setLoading(false);
    }
  };

  const organizeTasks = () => {
    const organized = {
      low: tasks.filter((task) => task.priority === "low"),
      medium: tasks.filter((task) => task.priority === "medium"),
      high: tasks.filter((task) => task.priority === "high"),
      urgent: tasks.filter((task) => task.priority === "urgent"),
    };
    setFilteredTasks(organized);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await axios.put(`/api/tasks/${taskId}`, { status: newStatus });
      fetchTasks();
    } catch (err) {
      alert("Failed to update task status");
    }
  };

  const handlePriorityChange = async (taskId, newPriority) => {
    try {
      await axios.put(`/api/tasks/${taskId}`, { priority: newPriority });
      fetchTasks();
    } catch (err) {
      alert("Failed to update task priority");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      await axios.delete(`/api/tasks/${taskId}`);
      fetchTasks();
    } catch (err) {
      alert("Failed to delete task");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isOverdue = (dueDate, status) => {
    if (status === "completed") return false;
    return new Date(dueDate) < new Date();
  };

  const renderTaskCard = (task) => (
    <div key={task._id} className="task-card">
      <div className="task-header">
        <h4 onClick={() => onViewTask(task)} className="task-title">
          {task.title}
        </h4>
        <span className={`status-badge ${task.status}`}>{task.status}</span>
      </div>

      <p className="task-description">
        {task.description.substring(0, 100)}...
      </p>

      <div className="task-meta">
        <div className="task-info">
          <strong>Due:</strong>
          <span
            className={isOverdue(task.dueDate, task.status) ? "overdue" : ""}
          >
            {formatDate(task.dueDate)}
          </span>
        </div>
        <div className="task-info">
          <strong>Assigned to:</strong> {task.assignedTo.name}
        </div>
      </div>

      <div className="task-actions">
        <select
          value={task.status}
          onChange={(e) => handleStatusChange(task._id, e.target.value)}
          className="status-select"
        >
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={task.priority}
          onChange={(e) => handlePriorityChange(task._id, e.target.value)}
          className="priority-select"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        <button onClick={() => onEditTask(task)} className="btn-edit">
          Edit
        </button>
        <button
          onClick={() => handleDeleteTask(task._id)}
          className="btn-danger"
        >
          Delete
        </button>
      </div>
    </div>
  );

  if (loading) return <div className="loading">Loading tasks...</div>;

  return (
    <div className="task-list-container">
      <div className="filters">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      <div className="priority-columns">
        <div className="priority-column low">
          <h3>Low Priority</h3>
          <div className="tasks-wrapper">
            {filteredTasks.low.length > 0 ? (
              filteredTasks.low.map(renderTaskCard)
            ) : (
              <p className="no-tasks">No low priority tasks</p>
            )}
          </div>
        </div>

        <div className="priority-column medium">
          <h3>Medium Priority</h3>
          <div className="tasks-wrapper">
            {filteredTasks.medium.length > 0 ? (
              filteredTasks.medium.map(renderTaskCard)
            ) : (
              <p className="no-tasks">No medium priority tasks</p>
            )}
          </div>
        </div>

        <div className="priority-column high">
          <h3>High Priority</h3>
          <div className="tasks-wrapper">
            {filteredTasks.high.length > 0 ? (
              filteredTasks.high.map(renderTaskCard)
            ) : (
              <p className="no-tasks">No high priority tasks</p>
            )}
          </div>
        </div>

        <div className="priority-column urgent">
          <h3>Urgent Priority</h3>
          <div className="tasks-wrapper">
            {filteredTasks.urgent.length > 0 ? (
              filteredTasks.urgent.map(renderTaskCard)
            ) : (
              <p className="no-tasks">No urgent tasks</p>
            )}
          </div>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskList;
