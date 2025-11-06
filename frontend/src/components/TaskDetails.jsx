import React, { useState, useEffect } from "react";
import axios from "axios";

const TaskDetails = ({ taskId, onClose, onEdit }) => {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  const fetchTaskDetails = async () => {
    try {
      const response = await axios.get(`/api/tasks/${taskId}`);
      setTask(response.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to load task details");
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await axios.put(`/api/tasks/${taskId}`, { status: newStatus });
      fetchTaskDetails();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) return <div className="loading">Loading task details...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!task) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Task Details</h2>
          <button onClick={onClose} className="close-button">
            &times;
          </button>
        </div>

        <div className="task-details">
          <div className="detail-section">
            <h3>{task.title}</h3>
            <div className="badges">
              <span className={`priority-badge ${task.priority}`}>
                {task.priority}
              </span>
              <span className={`status-badge ${task.status}`}>
                {task.status}
              </span>
            </div>
          </div>

          <div className="detail-section">
            <label>Description</label>
            <p>{task.description}</p>
          </div>

          <div className="detail-row">
            <div className="detail-section">
              <label>Due Date</label>
              <p>{formatDate(task.dueDate)}</p>
            </div>

            <div className="detail-section">
              <label>Priority</label>
              <p className={`priority-text ${task.priority}`}>
                {task.priority}
              </p>
            </div>
          </div>

          <div className="detail-row">
            <div className="detail-section">
              <label>Assigned To</label>
              <p>
                {task.assignedTo.name} ({task.assignedTo.email})
              </p>
            </div>

            <div className="detail-section">
              <label>Created By</label>
              <p>{task.createdBy.name}</p>
            </div>
          </div>

          <div className="detail-row">
            <div className="detail-section">
              <label>Created At</label>
              <p>{formatDate(task.createdAt)}</p>
            </div>

            <div className="detail-section">
              <label>Last Updated</label>
              <p>{formatDate(task.updatedAt)}</p>
            </div>
          </div>

          <div className="detail-section">
            <label>Update Status</label>
            <div className="status-buttons">
              <button
                onClick={() => handleStatusChange("pending")}
                className={`btn-status ${
                  task.status === "pending" ? "active" : ""
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => handleStatusChange("in-progress")}
                className={`btn-status ${
                  task.status === "in-progress" ? "active" : ""
                }`}
              >
                In Progress
              </button>
              <button
                onClick={() => handleStatusChange("completed")}
                className={`btn-status ${
                  task.status === "completed" ? "active" : ""
                }`}
              >
                Completed
              </button>
            </div>
          </div>

          <div className="modal-actions">
            <button onClick={() => onEdit(task)} className="btn-primary">
              Edit Task
            </button>
            <button onClick={onClose} className="btn-secondary">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
