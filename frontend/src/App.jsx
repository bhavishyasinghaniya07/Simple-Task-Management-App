import React, { useState, useContext } from "react";
import { AuthContext, AuthProvider } from "./context/AuthContext.jsx";
import Login from "./components/Login.jsx";
import Register from "./components/Register.jsx";
import TaskForm from "./components/TaskForm.jsx";
import TaskList from "./components/TaskList.jsx";
import TaskDetails from "./components/TaskDetails.jsx";
import UserManagement from "./components/UserManagement.jsx";
import "./App.css";

function AppContent() {
  const { user, loading, logout } = useContext(AuthContext);
  const [showRegister, setShowRegister] = useState(false);
  const [activeTab, setActiveTab] = useState("tasks");
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTaskSaved = () => {
    setTaskToEdit(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleViewTask = (task) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
  };

  const handleEditTask = (task) => {
    setTaskToEdit(task);
    setShowTaskDetails(false);
    setActiveTab("create");
  };

  const handleCloseDetails = () => {
    setShowTaskDetails(false);
    setSelectedTask(null);
  };

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!user) {
    return showRegister ? (
      <Register onSwitchToLogin={() => setShowRegister(false)} />
    ) : (
      <Login onSwitchToRegister={() => setShowRegister(true)} />
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>Task Manager</h1>
          <div className="user-info">
            <span>Welcome, {user.name}</span>
            {user.role === "admin" && (
              <span className="role-badge admin">Admin</span>
            )}
            <button onClick={logout} className="btn-logout">
              Logout
            </button>
          </div>
        </div>
      </header>

      <nav className="app-nav">
        <button
          className={activeTab === "tasks" ? "active" : ""}
          onClick={() => setActiveTab("tasks")}
        >
          My Tasks
        </button>
        <button
          className={activeTab === "create" ? "active" : ""}
          onClick={() => {
            setActiveTab("create");
            setTaskToEdit(null);
          }}
        >
          {taskToEdit ? "Edit Task" : "Create Task"}
        </button>
        {user.role === "admin" && (
          <button
            className={activeTab === "users" ? "active" : ""}
            onClick={() => setActiveTab("users")}
          >
            Manage Users
          </button>
        )}
      </nav>

      <main className="app-main">
        {activeTab === "tasks" && (
          <TaskList
            onViewTask={handleViewTask}
            onEditTask={handleEditTask}
            refreshTrigger={refreshTrigger}
          />
        )}

        {activeTab === "create" && (
          <TaskForm
            taskToEdit={taskToEdit}
            onTaskSaved={handleTaskSaved}
            onCancel={() => {
              setTaskToEdit(null);
              setActiveTab("tasks");
            }}
          />
        )}

        {activeTab === "users" && user.role === "admin" && <UserManagement />}
      </main>

      {showTaskDetails && selectedTask && (
        <TaskDetails
          taskId={selectedTask._id}
          onClose={handleCloseDetails}
          onEdit={handleEditTask}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
