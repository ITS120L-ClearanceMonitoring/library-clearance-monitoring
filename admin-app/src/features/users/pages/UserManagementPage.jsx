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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
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
    
    // Show confirmation modal
    setConfirmAction({
      type: 'add',
      message: `Send invitation to ${formData.email}?`,
      onConfirm: performInvite
    });
    setShowConfirmModal(true);
  };

  const performInvite = async () => {
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
      setShowConfirmModal(false);
      // Refresh the table
      fetchUsersData();
    } catch (err) {
      console.error("Full error object:", err);
      console.error("Error code:", err.code);
      console.error("Error message:", err.message);
      
      // Show specific error message for duplicates
      if (err.code === 'email_exists' || err.message?.includes('Duplicated')) {
        toast.error(err.message || 'Duplicated user data: This email is already registered.');
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
    
    // Show confirmation modal
    setConfirmAction({
      type: 'edit',
      message: `Update ${formData.first_name} ${formData.last_name}'s information?`,
      onConfirm: performEdit
    });
    setShowConfirmModal(true);
  };

  const performEdit = async () => {
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
      setShowConfirmModal(false);
      fetchUsersData();
    } catch (err) {
      toast.error("Update failed: " + (err.message || JSON.stringify(err)));
    } finally {
      setInviting(false);
    }
  };

  const handleDeleteUser = async (user) => {
    // Show confirmation modal
    setConfirmAction({
      type: 'delete',
      message: `Delete ${user.first_name} ${user.last_name}? This action cannot be undone.`,
      user: user,
      onConfirm: () => performDelete(user) // Pass user directly
    });
    setShowConfirmModal(true);
  };

  const performDelete = async (user) => {
    setInviting(true);
    try {
      await deleteUser(user.user_id);
      toast.success('User deleted successfully');
      setShowConfirmModal(false);
      setConfirmAction(null);
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

  const filteredUsers = users.filter(u => {
    const search = searchQuery.toLowerCase();
    const fullName = `${u.first_name} ${u.middle_name || ''} ${u.last_name}`.toLowerCase();
    const roleDisplay = u.role === 'LIBRARY_ADMIN' ? 'head librarian' : 'librarian';
    
    // Filter by role if selected
    const roleMatch = roleFilter === 'all' || u.role === roleFilter;
    
    // Filter by search query
    const searchMatch = 
      fullName.includes(search) ||
      u.email.toLowerCase().includes(search) ||
      roleDisplay.includes(search);
    
    return roleMatch && (search === '' || searchMatch);
  });

  return (
    <div className="management-container">
      {(loading || inviting) && <Loader size="md" />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>Staff Management</h2>
      </div>

      {/* Search, Filter and Add Button Controls */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#333' }}>Search</label>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
          />
        </div>
        
        <div style={{ minWidth: '180px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#333' }}>Filter by Role</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              cursor: 'pointer',
              backgroundColor: '#fff'
            }}
          >
            <option value="all">All Roles</option>
            <option value="LIBRARY_ADMIN">Head Librarian</option>
            <option value="LIBRARY_VERIFIER">Librarian</option>
          </select>
        </div>
        
        <Button variant="secondary" size="md" onClick={() => setShowModal(true)}>
          + Add Staff
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
            <th>Role</th>
            <th>Access Level</th>
            <th>Last Active</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.length > 0 ? (
            filteredUsers.map(u => {
              const middleInitial = getMiddleInitial(u.middle_name);
              const fullName = `${u.first_name} ${middleInitial} ${u.last_name}`.trim();
              const roleDisplay = u.role === 'LIBRARY_ADMIN' ? 'Head Librarian' : 'Librarian';
              const isPending = u.must_change_password === true;
              const accessDisplay = isPending ? 'PENDING' : (u.role === 'LIBRARY_ADMIN' ? 'FULL' : 'PARTIAL');
              const badgeClass = isPending ? 'badge-pending' : (u.role === 'LIBRARY_ADMIN' ? 'badge-full' : 'badge-partial');
              return (
                <tr key={u.user_id || u.email}>
                  <td>{fullName}</td>
                  <td>{u.email}</td>
                  <td>{roleDisplay}</td>
                  <td><span className={`badge ${badgeClass}`}>{accessDisplay}</span></td>
                  <td>{formatLastActive(u.last_login)}</td>
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
            })
          ) : (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                {users.length === 0 ? 'No staff members found' : 'No results match your search'}
              </td>
            </tr>
          )}
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

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => !inviting && setShowConfirmModal(false)}
        title="Confirm Action"
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p style={{ margin: 0, color: '#333', fontSize: '16px' }}>
            {confirmAction?.message}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button 
              variant="ghost" 
              onClick={() => setShowConfirmModal(false)} 
              disabled={inviting}
            >
              Cancel
            </Button>
            <Button 
              variant={confirmAction?.type === 'delete' ? 'danger' : 'primary'} 
              onClick={confirmAction?.onConfirm} 
              disabled={inviting}
              size="md"
            >
              {inviting ? 'Processing...' : 'Confirm'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagementPage;