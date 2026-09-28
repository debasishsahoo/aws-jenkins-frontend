import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
console.log('API URL:', API_URL);

function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [health, setHealth] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'user' });
  const [editingUserId, setEditingUserId] = useState(null);

  // Check API Health
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/health`);
        setHealth(res.data);
      } catch (err) {
        console.error('Health check failed:', err);
        setHealth({ status: 'ERROR', message: 'Backend not reachable' });
      }
    };

    checkHealth();
  }, []);

  // Fetch Users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/users`);
      setUsers(res.data.data ?? []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch users: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/users`);

        if (isMounted) {
          setUsers(res.data.data ?? []);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to fetch users: ' + (err.response?.data?.error || err.message));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  // Add User
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUserId) {
        await axios.put(`${API_URL}/api/users/${editingUserId}`, formData);
      } else {
        await axios.post(`${API_URL}/api/users`, formData);
      }

      resetForm();
      await fetchUsers();
    } catch (err) {
      setError(`${editingUserId ? 'Failed to update user' : 'Failed to add user'}: ${err.response?.data?.error || err.message}`);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', role: 'user' });
    setEditingUserId(null);
  };

  const handleEdit = (user) => {
    setEditingUserId(user._id);
    setFormData({ name: user.name, email: user.email, role: user.role });
    setError(null);
  };

  // Delete User
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/users/${id}`);
      await fetchUsers();
    } catch (err) {
      setError('Failed to delete user: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>
         Full Stack App on AWS
      </h1>

      {/* Health Status */}
      <div style={{
        padding: '10px 20px',
        borderRadius: '8px',
        marginBottom: '20px',
        backgroundColor: health?.status === 'OK' ? '#d4edda' : '#f8d7da',
        color: health?.status === 'OK' ? '#155724' : '#721c24',
        border: `1px solid ${health?.status === 'OK' ? '#c3e6cb' : '#f5c6cb'}`
      }}>
        <strong>API Status:</strong> {health?.message || 'Checking...'}
        <br />
        <small>Backend URL: {API_URL}</small>
      </div>

      {/* Add User Form */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #dee2e6'
      }}>
        <h2>{editingUserId ? 'Edit User' : 'Add New User'}</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ced4da' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ced4da' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ced4da' }}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            style={{
              backgroundColor: '#007bff',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            {editingUserId ? 'Save Changes' : 'Add User'}
          </button>
          {editingUserId && (
            <button
              type="button"
              onClick={resetForm}
              style={{
                marginLeft: '10px',
                backgroundColor: '#6c757d',
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '10px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {/* Users List */}
      <h2>Users ({users.length})</h2>
      {loading ? (
        <p>Loading users...</p>
      ) : (
        <div>
          {users.map((user) => (
            <div
              key={user._id}
              style={{
                padding: '15px',
                marginBottom: '10px',
                backgroundColor: '#fff',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <strong>{user.name}</strong>
                <br />
                <small style={{ color: '#6c757d' }}>{user.email} | {user.role}</small>
                <br />
                <small style={{ color: '#adb5bd' }}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </small>
              </div>
              <div>
                <button
                  onClick={() => handleEdit(user)}
                  style={{
                    marginRight: '8px',
                    backgroundColor: '#ffc107',
                    color: '#212529',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(user._id)}
                  style={{
                    backgroundColor: '#dc3545',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {users.length === 0 && <p style={{ color: '#6c757d' }}>No users found.</p>}
        </div>
      )}
    </div>
  );
}

export default App;