import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const UserRegistration = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user'
  });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');

  // CSV upload states
  const [csvFile, setCsvFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const handleRegisterChange = (e) => {
    setRegisterForm({
      ...registerForm,
      [e.target.name]: e.target.value
    });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess('');
    setRegisterLoading(true);

    try {
  await api.post('/api/admin/users/register', registerForm, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setRegisterSuccess('User registered successfully!');
      setRegisterForm({ name: '', email: '', password: '', role: 'user' });
      setTimeout(() => setRegisterSuccess(''), 3000);
    } catch (err) {
      setRegisterError(err.response?.data?.message || 'Registration failed');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setCsvFile(e.target.files[0]);
    setUploadResult(null);
  };

  const handleUpload = async () => {
    if (!csvFile) {
      alert('Please select a CSV file to upload.');
      return;
    }
    setUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', csvFile);

    try {
  const response = await api.post('/api/admin/users/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadResult(response.data);
      setRegisterSuccess('');
      setRegisterError('');
      // Redirect to Manage Users page after successful upload
      navigate('/admin/users');
    } catch (err) {
      alert('Failed to upload CSV file.');
    } finally {
      setUploading(false);
    }
  };

  const downloadSampleCsv = () => {
    const sampleCsv = 'name,email,password,role\nJohn Doe,john@example.com,Password123,user\nJane Admin,jane@example.com,AdminPass456,admin\n';
    const blob = new Blob([sampleCsv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_users.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h2 className="mb-0">
                <i className="bi bi-person-plus"></i> Register New User
              </h2>
              <p className="mb-0">Welcome, {user.name} ({user.role})</p>
            </div>
            <div className="card-body">
              {registerSuccess && <div className="alert alert-success" role="alert">{registerSuccess}</div>}
              {registerError && <div className="alert alert-danger" role="alert">{registerError}</div>}

              {/* Single User Registration Form */}
              <form onSubmit={handleRegisterSubmit}>
                <div className="row">
                  <div className="col-md-3 mb-3">
                    <label htmlFor="name" className="form-label">Name</label>
                    <input
                      type="text"
                      className="form-control"
                      id="name"
                      name="name"
                      value={registerForm.name}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={registerForm.email}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label htmlFor="password" className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      name="password"
                      value={registerForm.password}
                      onChange={handleRegisterChange}
                      required
                      minLength="6"
                    />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label htmlFor="role" className="form-label">Role</label>
                    <select
                      className="form-select"
                      id="role"
                      name="role"
                      value={registerForm.role}
                      onChange={handleRegisterChange}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={registerLoading}>
                  {registerLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Registering...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-person-plus"></i> Register User
                    </>
                  )}
                </button>
              </form>

              {/* CSV Upload Section */}
              <hr className="my-4" />
              <div className="mb-4">
                <label htmlFor="csvFile" className="form-label">Upload Users CSV</label>
                <input
                  type="file"
                  id="csvFile"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="form-control mb-2"
                />
                <button
                  onClick={handleUpload}
                  className="btn btn-success me-2"
                  disabled={uploading || !csvFile}
                >
                  {uploading ? 'Uploading...' : 'Upload CSV'}
                </button>
                <button
                  onClick={downloadSampleCsv}
                  className="btn btn-secondary"
                  disabled={uploading}
                >
                  Download Sample CSV
                </button>
              </div>

              {/* Upload Result Summary */}
              {uploadResult && (
                <div className="mb-4">
                  <h6>Import Summary:</h6>
                  <p>Successfully added users: {uploadResult.successCount}</p>
                  {uploadResult.duplicateEmails && uploadResult.duplicateEmails.length > 0 && (
                    <div>
                      <strong>Duplicate Emails Skipped:</strong>
                      <ul>
                        {uploadResult.duplicateEmails.map((email, idx) => (
                          <li key={idx}>{email}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {uploadResult.errors && uploadResult.errors.length > 0 && (
                    <div>
                      <strong>Errors:</strong>
                      <ul>
                        {uploadResult.errors.map((err, idx) => (
                          <li key={idx}>Row {err.row}: {err.errors.join(', ')}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRegistration;
