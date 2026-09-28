import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

/*
|--------------------------------------------------------------------------
| API CONFIGURATION
|--------------------------------------------------------------------------
|
| Local development:
| VITE_API_URL=http://localhost:5000
|
| Production:
| VITE_API_URL=http://YOUR_BACKEND_IP
|
| Example:
| VITE_API_URL=http://13.234.56.78
|
*/

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/+$/, '');

console.log('Frontend API URL:', API_URL);

/*
|--------------------------------------------------------------------------
| AXIOS INSTANCE
|--------------------------------------------------------------------------
*/

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

/*
|--------------------------------------------------------------------------
| APPLICATION
|--------------------------------------------------------------------------
*/

function App() {
  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState('');

  const [success, setSuccess] = useState('');

  const [health, setHealth] = useState(null);

  const [healthLoading, setHealthLoading] = useState(true);

  const [editingUserId, setEditingUserId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user'
  });

  /*
  |--------------------------------------------------------------------------
  | ERROR HANDLER
  |--------------------------------------------------------------------------
  */

  const getErrorMessage = (err) => {
    if (err.response) {
      return (
        err.response.data?.error ||
        err.response.data?.message ||
        `Request failed with status ${err.response.status}`
      );
    }

    if (err.request) {
      return 'Backend server is not reachable. Check the backend server, Nginx, Security Group and API URL.';
    }

    return err.message || 'An unexpected error occurred';
  };

  /*
  |--------------------------------------------------------------------------
  | CLEAR MESSAGES
  |--------------------------------------------------------------------------
  */

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  /*
  |--------------------------------------------------------------------------
  | CHECK BACKEND HEALTH
  |--------------------------------------------------------------------------
  */

  const checkHealth = useCallback(async () => {
    try {
      setHealthLoading(true);

      const response = await api.get('/api/health');

      setHealth(response.data);
    } catch (err) {
      console.error('Health check failed:', err);

      setHealth({
        status: 'ERROR',
        success: false,
        message: getErrorMessage(err),
        database: {
          status: 'unknown'
        }
      });
    } finally {
      setHealthLoading(false);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | FETCH USERS
  |--------------------------------------------------------------------------
  */

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/api/users');

      setUsers(response.data?.data || []);
    } catch (err) {
      console.error('Fetch users failed:', err);

      setUsers([]);
      setError(
        `Failed to load users: ${getErrorMessage(err)}`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    checkHealth();
    fetchUsers();
  }, [checkHealth, fetchUsers]);

  /*
  |--------------------------------------------------------------------------
  | FORM INPUT
  |--------------------------------------------------------------------------
  */

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | RESET FORM
  |--------------------------------------------------------------------------
  */

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'user'
    });

    setEditingUserId(null);
  };

  /*
  |--------------------------------------------------------------------------
  | VALIDATE FORM
  |--------------------------------------------------------------------------
  */

  const validateForm = () => {
    const name = formData.name.trim();
    const email = formData.email.trim();

    if (name.length < 2) {
      setError('Name must contain at least 2 characters.');
      return false;
    }

    if (name.length > 100) {
      setError('Name cannot exceed 100 characters.');
      return false;
    }

    if (!email) {
      setError('Email is required.');
      return false;
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }

    return true;
  };

  /*
  |--------------------------------------------------------------------------
  | SUBMIT USER
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (event) => {
    event.preventDefault();

    clearMessages();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role
      };

      if (editingUserId) {
        await api.put(
          `/api/users/${editingUserId}`,
          payload
        );

        setSuccess('User updated successfully.');
      } else {
        await api.post(
          '/api/users',
          payload
        );

        setSuccess('User created successfully.');
      }

      resetForm();

      await fetchUsers();

      await checkHealth();
    } catch (err) {
      console.error('Save user failed:', err);

      setError(
        `${editingUserId ? 'Failed to update user' : 'Failed to create user'}: ${getErrorMessage(err)}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | EDIT USER
  |--------------------------------------------------------------------------
  */

  const handleEdit = (user) => {
    clearMessages();

    setEditingUserId(user._id);

    setFormData({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'user'
    });

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  /*
  |--------------------------------------------------------------------------
  | DELETE USER
  |--------------------------------------------------------------------------
  */

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this user?'
    );

    if (!confirmed) {
      return;
    }

    try {
      clearMessages();

      setDeletingId(id);

      await api.delete(`/api/users/${id}`);

      setSuccess('User deleted successfully.');

      await fetchUsers();

      await checkHealth();
    } catch (err) {
      console.error('Delete user failed:', err);

      setError(
        `Failed to delete user: ${getErrorMessage(err)}`
      );
    } finally {
      setDeletingId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | REFRESH
  |--------------------------------------------------------------------------
  */

  const handleRefresh = async () => {
    clearMessages();

    await Promise.all([
      checkHealth(),
      fetchUsers()
    ]);
  };

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  const isHealthy =
    health?.status === 'OK';

  const databaseConnected =
    health?.database?.status === 'connected';

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f4f6f8',
        padding: '30px 15px',
        fontFamily:
          'Arial, Helvetica, sans-serif',
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto'
        }}
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '25px',
            borderRadius: '10px',
            marginBottom: '20px',
            border: '1px solid #dee2e6',
            boxShadow:
              '0 2px 8px rgba(0,0,0,0.05)'
          }}
        >
          <h1
            style={{
              margin: '0 0 8px 0',
              color: '#212529',
              textAlign: 'center'
            }}
          >
            Full Stack App on AWS
          </h1>

          <p
            style={{
              margin: 0,
              textAlign: 'center',
              color: '#6c757d'
            }}
          >
            React + Express + MongoDB Atlas
          </p>
        </div>

        {/* =================================================
            SYSTEM STATUS
        ================================================= */}

        <div
          style={{
            padding: '18px',
            borderRadius: '10px',
            marginBottom: '20px',

            backgroundColor:
              isHealthy
                ? '#d4edda'
                : '#f8d7da',

            color:
              isHealthy
                ? '#155724'
                : '#721c24',

            border:
              `1px solid ${
                isHealthy
                  ? '#c3e6cb'
                  : '#f5c6cb'
              }`
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap'
            }}
          >
            <div>
              <strong>
                Backend:
              </strong>{' '}

              {healthLoading
                ? 'Checking...'
                : health?.message ||
                  'Backend unavailable'}
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={
                loading ||
                healthLoading
              }
              style={{
                border: 'none',
                padding: '8px 14px',
                borderRadius: '5px',
                cursor:
                  loading ||
                  healthLoading
                    ? 'not-allowed'
                    : 'pointer',
                backgroundColor: '#ffffff',
                color: '#212529',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: '#ced4da'
              }}
            >
              Refresh
            </button>
          </div>

          <div
            style={{
              marginTop: '10px',
              fontSize: '14px'
            }}
          >
            <div>
              <strong>
                API URL:
              </strong>{' '}
              {API_URL}
            </div>

            <div>
              <strong>
                Database:
              </strong>{' '}
              {healthLoading
                ? 'Checking...'
                : databaseConnected
                  ? 'Connected'
                  : 'Disconnected'}
            </div>

            {health?.environment && (
              <div>
                <strong>
                  Environment:
                </strong>{' '}
                {health.environment}
              </div>
            )}
          </div>
        </div>

        {/* =================================================
            SUCCESS MESSAGE
        ================================================= */}

        {success && (
          <div
            style={{
              padding: '14px',
              backgroundColor: '#d4edda',
              color: '#155724',
              border:
                '1px solid #c3e6cb',
              borderRadius: '8px',
              marginBottom: '20px'
            }}
          >
            {success}
          </div>
        )}

        {/* =================================================
            ERROR MESSAGE
        ================================================= */}

        {error && (
          <div
            style={{
              padding: '14px',
              backgroundColor: '#f8d7da',
              color: '#721c24',
              border:
                '1px solid #f5c6cb',
              borderRadius: '8px',
              marginBottom: '20px'
            }}
          >
            {error}
          </div>
        )}

        {/* =================================================
            USER FORM
        ================================================= */}

        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '25px',
            borderRadius: '10px',
            marginBottom: '25px',
            border:
              '1px solid #dee2e6',
            boxShadow:
              '0 2px 8px rgba(0,0,0,0.05)'
          }}
        >
          <h2
            style={{
              marginTop: 0
            }}
          >
            {editingUserId
              ? 'Edit User'
              : 'Add New User'}
          </h2>

          <form
            onSubmit={handleSubmit}
          >

            {/* NAME */}

            <div
              style={{
                marginBottom: '15px'
              }}
            >
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: 'bold'
                }}
              >
                Name
              </label>

              <input
                type="text"
                name="name"
                placeholder="Enter user name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={submitting}
                required
                maxLength={100}
                style={{
                  width: '100%',
                  padding: '12px',
                  boxSizing: 'border-box',
                  border:
                    '1px solid #ced4da',
                  borderRadius: '5px',
                  fontSize: '15px'
                }}
              />
            </div>

            {/* EMAIL */}

            <div
              style={{
                marginBottom: '15px'
              }}
            >
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: 'bold'
                }}
              >
                Email
              </label>

              <input
                type="email"
                name="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={handleInputChange}
                disabled={submitting}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  boxSizing: 'border-box',
                  border:
                    '1px solid #ced4da',
                  borderRadius: '5px',
                  fontSize: '15px'
                }}
              />
            </div>

            {/* ROLE */}

            <div
              style={{
                marginBottom: '20px'
              }}
            >
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: 'bold'
                }}
              >
                Role
              </label>

              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '12px',
                  boxSizing: 'border-box',
                  border:
                    '1px solid #ced4da',
                  borderRadius: '5px',
                  fontSize: '15px'
                }}
              >
                <option value="user">
                  User
                </option>

                <option value="admin">
                  Admin
                </option>

                <option value="teacher">
                  Teacher
                </option>

                <option value="student">
                  Student
                </option>

                <option value="staff">
                  Staff
                </option>
              </select>
            </div>

            {/* BUTTONS */}

            <button
              type="submit"
              disabled={submitting}
              style={{
                backgroundColor:
                  submitting
                    ? '#6c757d'
                    : '#007bff',
                color: '#ffffff',
                border: 'none',
                padding:
                  '11px 20px',
                borderRadius: '5px',
                cursor:
                  submitting
                    ? 'not-allowed'
                    : 'pointer',
                fontSize: '15px'
              }}
            >
              {submitting
                ? 'Saving...'
                : editingUserId
                  ? 'Save Changes'
                  : 'Add User'}
            </button>

            {editingUserId && (
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  clearMessages();
                }}
                disabled={submitting}
                style={{
                  marginLeft: '10px',
                  backgroundColor:
                    '#6c757d',
                  color: '#ffffff',
                  border: 'none',
                  padding:
                    '11px 20px',
                  borderRadius: '5px',
                  cursor:
                    submitting
                      ? 'not-allowed'
                      : 'pointer',
                  fontSize: '15px'
                }}
              >
                Cancel
              </button>
            )}
          </form>
        </div>

        {/* =================================================
            USERS HEADER
        ================================================= */}

        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'center',
            marginBottom: '15px',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <h2
            style={{
              margin: 0
            }}
          >
            Users ({users.length})
          </h2>

          <span
            style={{
              color: '#6c757d',
              fontSize: '14px'
            }}
          >
            {loading
              ? 'Loading...'
              : `${users.length} user(s)`}
          </span>
        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (
          <div
            style={{
              backgroundColor:
                '#ffffff',
              padding: '25px',
              textAlign: 'center',
              borderRadius: '8px',
              border:
                '1px solid #dee2e6'
            }}
          >
            Loading users...
          </div>
        )}

        {/* =================================================
            USERS LIST
        ================================================= */}

        {!loading &&
          users.length > 0 && (
            <div>
              {users.map((user) => (
                <div
                  key={user._id}
                  style={{
                    backgroundColor:
                      '#ffffff',
                    padding: '18px',
                    marginBottom: '12px',
                    border:
                      '1px solid #dee2e6',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    alignItems:
                      'center',
                    gap: '15px',
                    flexWrap: 'wrap'
                  }}
                >

                  {/* USER DETAILS */}

                  <div
                    style={{
                      minWidth: 0,
                      flex: 1
                    }}
                  >
                    <strong
                      style={{
                        fontSize: '17px',
                        color: '#212529'
                      }}
                    >
                      {user.name}
                    </strong>

                    <div
                      style={{
                        marginTop: '5px',
                        color: '#6c757d'
                      }}
                    >
                      {user.email}
                    </div>

                    <div
                      style={{
                        marginTop: '5px',
                        fontSize: '14px'
                      }}
                    >
                      <strong>
                        Role:
                      </strong>{' '}
                      {user.role}
                    </div>

                    <div
                      style={{
                        marginTop: '5px',
                        color: '#adb5bd',
                        fontSize: '13px'
                      }}
                    >
                      Created:{' '}
                      {user.createdAt
                        ? new Date(
                            user.createdAt
                          ).toLocaleString()
                        : 'N/A'}
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}

                  <div
                    style={{
                      display: 'flex',
                      gap: '8px'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        handleEdit(user)
                      }
                      disabled={
                        deletingId ===
                        user._id
                      }
                      style={{
                        backgroundColor:
                          '#ffc107',
                        color:
                          '#212529',
                        border:
                          'none',
                        padding:
                          '9px 16px',
                        borderRadius:
                          '5px',
                        cursor:
                          'pointer'
                      }}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(
                          user._id
                        )
                      }
                      disabled={
                        deletingId ===
                        user._id
                      }
                      style={{
                        backgroundColor:
                          '#dc3545',
                        color:
                          '#ffffff',
                        border:
                          'none',
                        padding:
                          '9px 16px',
                        borderRadius:
                          '5px',
                        cursor:
                          deletingId ===
                          user._id
                            ? 'not-allowed'
                            : 'pointer'
                      }}
                    >
                      {deletingId ===
                      user._id
                        ? 'Deleting...'
                        : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        {/* =================================================
            EMPTY STATE
        ================================================= */}

        {!loading &&
          users.length === 0 && (
            <div
              style={{
                backgroundColor:
                  '#ffffff',
                padding: '30px',
                textAlign: 'center',
                borderRadius: '8px',
                border:
                  '1px solid #dee2e6',
                color: '#6c757d'
              }}
            >
              No users found.
            </div>
          )}

        {/* =================================================
            FOOTER
        ================================================= */}

        <div
          style={{
            textAlign: 'center',
            marginTop: '30px',
            padding: '15px',
            color: '#6c757d',
            fontSize: '13px'
          }}
        >
          React + Vite + Axios + Express +
          MongoDB Atlas
        </div>

      </div>
    </div>
  );
}

export default App;
