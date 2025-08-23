import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TaskContext = createContext();

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);

  const API_BASE_URL = 'http://localhost:8000';

  useEffect(() => {
    loadStoredTasks();
  }, []);

  const loadStoredTasks = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem('tasks');
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      }
    } catch (error) {
      console.error('Error loading stored tasks:', error);
    }
  };

  const storeTasks = async (tasksToStore) => {
    try {
      await AsyncStorage.setItem('tasks', JSON.stringify(tasksToStore));
    } catch (error) {
      console.error('Error storing tasks:', error);
    }
  };

  const getAuthHeaders = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };
    } catch (error) {
      console.error('Error getting auth headers:', error);
      return {
        'Content-Type': 'application/json',
      };
    }
  };

  const syncWithBackend = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/tasks/`, { headers });
      
      if (response.ok) {
        const backendTasks = await response.json();
        setTasks(backendTasks);
        await storeTasks(backendTasks);
        setLastSync(new Date());
        return backendTasks;
      } else {
        throw new Error('Failed to sync with backend');
      }
    } catch (error) {
      console.error('Sync error:', error);
      throw error;
    }
  };

  const getTasks = async (forceSync = false) => {
    try {
      setLoading(true);
      setError(null);

      if (forceSync || !lastSync || Date.now() - lastSync.getTime() > 5 * 60 * 1000) {
        return await syncWithBackend();
      }

      return tasks;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getTask = async (taskId) => {
    try {
      setLoading(true);
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, { headers });
      
      if (response.ok) {
        const task = await response.json();
        return task;
      } else {
        throw new Error('Failed to get task');
      }
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData) => {
    try {
      setLoading(true);
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/tasks/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(taskData),
      });

      if (response.ok) {
        const newTask = await response.json();
        setTasks(prev => [newTask, ...prev]);
        await storeTasks([newTask, ...tasks]);
        return newTask;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create task');
      }
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (taskId, taskData) => {
    try {
      setLoading(true);
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(taskData),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(prev => prev.map(task => 
          task.id === taskId ? updatedTask : task
        ));
        await storeTasks(tasks.map(task => 
          task.id === taskId ? updatedTask : task
        ));
        return updatedTask;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update task');
      }
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(prev => prev.map(task => 
          task.id === taskId ? updatedTask : task
        ));
        await storeTasks(tasks.map(task => 
          task.id === taskId ? updatedTask : task
        ));
        return updatedTask;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update task status');
      }
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const deleteTask = async (taskId) => {
    try {
      setLoading(true);
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers,
      });

      if (response.ok) {
        setTasks(prev => prev.filter(task => task.id !== taskId));
        await storeTasks(tasks.filter(task => task.id !== taskId));
        return true;
      } else {
        throw new Error('Failed to delete task');
      }
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const searchTasks = async (query) => {
    try {
      setLoading(true);
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/tasks/search?q=${encodeURIComponent(query)}`, { headers });
      
      if (response.ok) {
        const searchResults = await response.json();
        return searchResults;
      } else {
        throw new Error('Failed to search tasks');
      }
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getTasksByStatus = async (status) => {
    try {
      setLoading(true);
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/tasks/status/${status}`, { headers });
      
      if (response.ok) {
        const statusTasks = await response.json();
        return statusTasks;
      } else {
        throw new Error('Failed to get tasks by status');
      }
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getTasksByPriority = async (priority) => {
    try {
      setLoading(true);
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/tasks/priority/${priority}`, { headers });
      
      if (response.ok) {
        const priorityTasks = await response.json();
        return priorityTasks;
      } else {
        throw new Error('Failed to get tasks by priority');
      }
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getTasksByTags = async (tags) => {
    try {
      setLoading(true);
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/tasks/tags/${encodeURIComponent(tags)}`, { headers });
      
      if (response.ok) {
        const tagTasks = await response.json();
        return tagTasks;
      } else {
        throw new Error('Failed to get tasks by tags');
      }
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getTasksStats = async () => {
    try {
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/tasks/stats`, { headers });
      
      if (response.ok) {
        const stats = await response.json();
        return stats;
      } else {
        throw new Error('Failed to get task statistics');
      }
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const getOverdueTasks = async () => {
    try {
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/tasks/overdue`, { headers });
      
      if (response.ok) {
        const overdueTasks = await response.json();
        return overdueTasks;
      } else {
        throw new Error('Failed to get overdue tasks');
      }
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const getTasksDueSoon = async (days = 3) => {
    try {
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/tasks/due-soon?days=${days}`, { headers });
      
      if (response.ok) {
        const dueSoonTasks = await response.json();
        return dueSoonTasks;
      } else {
        throw new Error('Failed to get tasks due soon');
      }
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const bulkUpdateStatus = async (taskIds, newStatus) => {
    try {
      setLoading(true);
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/tasks/bulk/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          task_ids: taskIds,
          status: newStatus,
        }),
      });

      if (response.ok) {
        const updatedTasks = await response.json();
        setTasks(prev => prev.map(task => {
          const updatedTask = updatedTasks.find(ut => ut.id === task.id);
          return updatedTask || task;
        }));
        await storeTasks(tasks.map(task => {
          const updatedTask = updatedTasks.find(ut => ut.id === task.id);
          return updatedTask || task;
        }));
        return updatedTasks;
      } else {
        throw new Error('Failed to bulk update task status');
      }
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const bulkDeleteTasks = async (taskIds) => {
    try {
      setLoading(true);
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/tasks/bulk/delete`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ task_ids: taskIds }),
      });

      if (response.ok) {
        setTasks(prev => prev.filter(task => !taskIds.includes(task.id)));
        await storeTasks(tasks.filter(task => !taskIds.includes(task.id)));
        return true;
      } else {
        throw new Error('Failed to bulk delete tasks');
      }
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const refreshTasks = async () => {
    try {
      await syncWithBackend();
    } catch (error) {
      console.error('Refresh error:', error);
    }
  };

  const value = {
    tasks,
    loading,
    error,
    lastSync,
    getTasks,
    getTask,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    searchTasks,
    getTasksByStatus,
    getTasksByPriority,
    getTasksByTags,
    getTasksStats,
    getOverdueTasks,
    getTasksDueSoon,
    bulkUpdateStatus,
    bulkDeleteTasks,
    clearError,
    refreshTasks,
    syncWithBackend,
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};
