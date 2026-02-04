import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../../context/AuthContext';
import { Button, Loader, Modal } from '../../../components/ui';
import { fetchUsers, inviteStaff, updateUser, deleteUser } from '../services/userService';
import '../users.css';

const UserManagementPage = () => {
  const { user: authUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    role: 'LIBRARY_VERIFIER'
  });

  // Debug: Log the current user
  useEffect(() => {
    console.log('Current admin user:', authUser);
    console.log('Current admin role:', authUser?.role);
  }, [authUser]);

  // 1. Fetch users from the database
  const fetchUsersData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      console.error("Error loading users:", err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Initial Load
  useEffect(() => {
    fetchUsersData();
  }, [fetchUsersData]);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    
    try {
      await inviteStaff({
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role
      });

      toast.success(`Invitation successfully sent to ${formData.email}`);
      
      // Reset form
      setFormData({ 
        email: '', 
        first_name: '', 
        middle_name: '', 
        last_name: '', 
        role: 'LIBRARY_VERIFIER' 
      });
      
      setShowModal(false);
      // Refresh the table
      fetchUsersData();
    } catch (err) {
      // Show specific error message for email_exists
      if (err.code === 'email_exists') {
        toast.error(err.message);
      } else {
        toast.error("Invitation failed: " + (err.message || JSON.stringify(err)));
      }
    } finally {
      setInviting(false);
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      first_name: user.first_name,
      middle_name: user.middle_name || '',
      last_name: user.last_name,
      role: user.role
    });
    setShowEditModal(true);
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setInviting(true);
    
    try {
      await updateUser(editingUser.user_id, {
        first_name: formData.first_name,
        middle_name: formData.middle_name,
        last_name: formData.last_name,
        role: formData.role
      });

      toast.success('User updated successfully');
      setShowEditModal(false);
      fetchUsersData();
    } catch (err) {
      toast.error("Update failed: " + (err.message || JSON.stringify(err)));
    } finally {
      setInviting(false);
    }
  };

  const handleDeleteUser = async (user) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${user.first_name} ${user.last_name}? This action cannot be undone.`
    );
    
    if (!confirmDelete) return;

    setInviting(true);
    try {
      await deleteUser(user.user_id);
      toast.success('User deleted successfully');
      fetchUsersData();
    } catch (err) {
      toast.error("Delete failed: " + (err.message || JSON.stringify(err)));
    } finally {
      setInviting(false);
    }
  };

  const getMiddleInitial = (middleName) => {
    return middleName ? middleName.charAt(0).toUpperCase() + '.' : '';
  };

  const formatLastActive = (lastSignInAt) => {
    if (!lastSignInAt) return 'Never';
    const date = new Date(lastSignInAt);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="management-container">
      {(loading || inviting) && <Loader size="md" />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>Staff Management</h2>
        <Button variant="secondary" size="md" onClick={() => setShowModal(true)}>
          + Add Staff Member
        </Button>
      </div>

      {/* Add Staff Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add Staff Member"
        size="md"
      >
        <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Staff Email</label>
            <input 
              type="email" 
              placeholder="staff@example.com" 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              required 
              disabled={inviting}
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Full Name</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                placeholder="First Name" 
                value={formData.first_name}
                onChange={e => setFormData({...formData, first_name: e.target.value})} 
                required 
                disabled={inviting}
              />
              <input 
                type="text" 
                placeholder="Middle Name (Optional)" 
                value={formData.middle_name}
                onChange={e => setFormData({...formData, middle_name: e.target.value})} 
                disabled={inviting}
              />
              <input 
                type="text" 
                placeholder="Last Name" 
                value={formData.last_name}
                onChange={e => setFormData({...formData, last_name: e.target.value})} 
                required 
                disabled={inviting}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Role</label>
            <select 
              value={formData.role} 
              onChange={e => setFormData({...formData, role: e.target.value})}
              disabled={inviting}
            >
              <option value="LIBRARY_VERIFIER">Librarian (Verifier)</option>
              <option value="LIBRARY_ADMIN">Head Librarian (Admin)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <Button variant="ghost" onClick={() => setShowModal(false)} disabled={inviting}>
              Cancel
            </Button>
            <Button type="submit" disabled={inviting} variant="primary" size="md">
              {inviting ? 'Sending Invitation...' : 'Send Invitation Email'}
            </Button>
          </div>
        </form>
      </Modal>

      <table>
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Email</th>
            <th>Access Level</th>
            <th>Last Active</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => {
            const middleInitial = getMiddleInitial(u.middle_name);
            const fullName = `${u.first_name} ${middleInitial} ${u.last_name}`.trim();
            return (
              <tr key={u.user_id || u.email}>
                <td>{fullName}</td>
                <td>{u.email}</td>
                <td>{u.role === 'LIBRARY_ADMIN' ? 'Head Librarian' : 'Librarian'}</td>
                <td>{formatLastActive(u.last_sign_in_at)}</td>
                <td style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <Button
                    variant="primary"
                    size="xs"
                    onClick={() => openEditModal(u)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => handleDeleteUser(u)}
                    style={{ color: '#d32f2f' }}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Staff Member"
        size="md"
      >
        <form onSubmit={handleEditUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Email</label>
            <input 
              type="email" 
              value={formData.email}
              disabled
              style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Full Name</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                placeholder="First Name" 
                value={formData.first_name}
                onChange={e => setFormData({...formData, first_name: e.target.value})} 
                required 
                disabled={inviting}
              />
              <input 
                type="text" 
                placeholder="Middle Name (Optional)" 
                value={formData.middle_name}
                onChange={e => setFormData({...formData, middle_name: e.target.value})} 
                disabled={inviting}
              />
              <input 
                type="text" 
                placeholder="Last Name" 
                value={formData.last_name}
                onChange={e => setFormData({...formData, last_name: e.target.value})} 
                required 
                disabled={inviting}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Access Level</label>
            <select 
              value={formData.role} 
              onChange={e => setFormData({...formData, role: e.target.value})}
              disabled={inviting}
            >
              <option value="LIBRARY_VERIFIER">Librarian (Verifier)</option>
              <option value="LIBRARY_ADMIN">Head Librarian (Admin)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <Button variant="ghost" onClick={() => setShowEditModal(false)} disabled={inviting}>
              Cancel
            </Button>
            <Button type="submit" disabled={inviting} variant="primary" size="md">
              {inviting ? 'Updating...' : 'Update User'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagementPage;