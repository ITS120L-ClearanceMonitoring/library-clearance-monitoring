import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  fetchPrograms,
  createProgram,
  updateProgram,
  deleteProgram,
  fetchPurposes,
  createPurpose,
  updatePurpose,
  deletePurpose,
} from '../services/configurationService';
import { Button, Loader, Modal } from '../../../components/ui';
import '../configuration.css';

const ConfigurationPage = () => {
  const [activeTab, setActiveTab] = useState('programs');
  const [programs, setPrograms] = useState([]);
  const [purposes, setPurposes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Program Modal States
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [programForm, setProgramForm] = useState({ program_name: '', program_code: '' });

  // Purpose Modal States
  const [showPurposeModal, setShowPurposeModal] = useState(false);
  const [editingPurpose, setEditingPurpose] = useState(null);
  const [purposeForm, setPurposeForm] = useState({ purpose_name: '', purpose_code: '' });

  // Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [programsData, purposesData] = await Promise.all([
        fetchPrograms(),
        fetchPurposes(),
      ]);
      setPrograms(programsData);
      setPurposes(purposesData);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ===== PROGRAM HANDLERS =====
  const handleAddProgram = () => {
    setProgramForm({ program_name: '', program_code: '' });
    setEditingProgram(null);
    setShowProgramModal(true);
  };

  const handleEditProgram = (program) => {
    setProgramForm({ program_name: program.program_name, program_code: program.program_code });
    setEditingProgram(program);
    setShowProgramModal(true);
  };

  const handleSaveProgram = (e) => {
    e.preventDefault();
    setConfirmAction({
      type: 'save-program',
      message: `${editingProgram ? 'Update' : 'Add'} this program?`,
      onConfirm: performSaveProgram
    });
    setShowConfirmModal(true);
  };

  const performSaveProgram = async () => {
    if (!programForm.program_name.trim() || !programForm.program_code.trim()) {
      toast.error('All fields are required');
      return;
    }

    setSubmitting(true);
    try {
      if (editingProgram) {
        await updateProgram(editingProgram.id, programForm);
        toast.success('Program updated successfully');
      } else {
        await createProgram(programForm);
        toast.success('Program added successfully');
      }
      setShowProgramModal(false);
      setShowConfirmModal(false);
      fetchData();
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProgram = (program) => {
    setConfirmAction({
      type: 'delete-program',
      message: `Delete "${program.program_name}"? This cannot be undone.`,
      program,
      onConfirm: () => performDeleteProgram(program)
    });
    setShowConfirmModal(true);
  };

  const performDeleteProgram = async (program) => {
    setSubmitting(true);
    try {
      await deleteProgram(program.id);
      toast.success('Program deleted successfully');
      setShowConfirmModal(false);
      fetchData();
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ===== PURPOSE HANDLERS =====
  const handleAddPurpose = () => {
    setPurposeForm({ purpose_name: '', purpose_code: '' });
    setEditingPurpose(null);
    setShowPurposeModal(true);
  };

  const handleEditPurpose = (purpose) => {
    setPurposeForm({ purpose_name: purpose.purpose_name, purpose_code: purpose.purpose_code });
    setEditingPurpose(purpose);
    setShowPurposeModal(true);
  };

  const handleSavePurpose = (e) => {
    e.preventDefault();
    setConfirmAction({
      type: 'save-purpose',
      message: `${editingPurpose ? 'Update' : 'Add'} this purpose?`,
      onConfirm: performSavePurpose
    });
    setShowConfirmModal(true);
  };

  const performSavePurpose = async () => {
    if (!purposeForm.purpose_name.trim() || !purposeForm.purpose_code.trim()) {
      toast.error('All fields are required');
      return;
    }

    setSubmitting(true);
    try {
      if (editingPurpose) {
        await updatePurpose(editingPurpose.id, purposeForm);
        toast.success('Purpose updated successfully');
      } else {
        await createPurpose(purposeForm);
        toast.success('Purpose added successfully');
      }
      setShowPurposeModal(false);
      setShowConfirmModal(false);
      fetchData();
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePurpose = (purpose) => {
    setConfirmAction({
      type: 'delete-purpose',
      message: `Delete "${purpose.purpose_name}"? This cannot be undone.`,
      purpose,
      onConfirm: () => performDeletePurpose(purpose)
    });
    setShowConfirmModal(true);
  };

  const performDeletePurpose = async (purpose) => {
    setSubmitting(true);
    try {
      await deletePurpose(purpose.id, purpose.purpose_name);
      toast.success('Purpose deleted successfully');
      setShowConfirmModal(false);
      fetchData();
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPrograms = programs.filter(p =>
    p.program_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.program_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPurposes = purposes.filter(p =>
    p.purpose_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.purpose_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="management-container">
      <ToastContainer position="top-right" autoClose={3000} />
      {(loading || submitting) && <Loader size="md" />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>System Configuration</h2>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: '24px', borderBottom: '2px solid #e0e0e0' }}>
        <button
          onClick={() => { setActiveTab('programs'); setSearchQuery(''); }}
          style={{
            padding: '12px 24px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'programs' ? '3px solid var(--primary)' : '3px solid transparent',
            cursor: 'pointer',
            fontWeight: '600',
            color: activeTab === 'programs' ? 'var(--primary)' : '#999',
            fontSize: '14px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            transition: 'all 0.3s ease'
          }}
        >
          Programs
        </button>
        <button
          onClick={() => { setActiveTab('purposes'); setSearchQuery(''); }}
          style={{
            padding: '12px 24px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'purposes' ? '3px solid var(--primary)' : '3px solid transparent',
            cursor: 'pointer',
            fontWeight: '600',
            color: activeTab === 'purposes' ? 'var(--primary)' : '#999',
            fontSize: '14px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            transition: 'all 0.3s ease'
          }}
        >
          Purposes
        </button>
      </div>

      {/* PROGRAMS TAB */}
      {activeTab === 'programs' && (
        <>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#333' }}>Search</label>
              <input
                type="text"
                placeholder="Search by name or code..."
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
            <Button variant="secondary" size="md" onClick={handleAddProgram}>
              + Add Program
            </Button>
          </div>

          {filteredPrograms.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Program Name</th>
                  <th>Program Code</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredPrograms.map((program) => (
                  <tr key={program.id}>
                    <td>{program.program_name}</td>
                    <td>{program.program_code}</td>
                    <td style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <Button
                        variant="primary"
                        size="xs"
                        onClick={() => handleEditProgram(program)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleDeleteProgram(program)}
                        style={{ color: '#d32f2f' }}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <tr>
              <td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                {programs.length === 0 ? 'No programs found' : 'No results match your search'}
              </td>
            </tr>
          )}
        </>
      )}

      {/* PURPOSES TAB */}
      {activeTab === 'purposes' && (
        <>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#333' }}>Search</label>
              <input
                type="text"
                placeholder="Search by name or code..."
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
            <Button variant="secondary" size="md" onClick={handleAddPurpose}>
              + Add Purpose
            </Button>
          </div>

          {filteredPurposes.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Purpose Name</th>
                  <th>Purpose Code</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredPurposes.map((purpose) => (
                  <tr key={purpose.id}>
                    <td>{purpose.purpose_name}</td>
                    <td>{purpose.purpose_code}</td>
                    <td style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <Button
                        variant="primary"
                        size="xs"
                        onClick={() => handleEditPurpose(purpose)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleDeletePurpose(purpose)}
                        disabled={purpose.purpose_name === 'Others'}
                        style={{ color: purpose.purpose_name === 'Others' ? '#ccc' : '#d32f2f' }}
                        title={purpose.purpose_name === 'Others' ? 'Cannot delete system field' : ''}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <tr>
              <td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                {purposes.length === 0 ? 'No purposes found' : 'No results match your search'}
              </td>
            </tr>
          )}
        </>
      )}

      {/* ADD/EDIT PROGRAM MODAL */}
      <Modal
        isOpen={showProgramModal}
        onClose={() => !submitting && setShowProgramModal(false)}
        title={editingProgram ? 'Edit Program' : 'Add Program'}
        size="md"
      >
        <form onSubmit={handleSaveProgram} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ marginBottom: 0 }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#333' }}>Program Name</label>
            <input
              type="text"
              placeholder="e.g., Computer Science"
              value={programForm.program_name}
              onChange={(e) => setProgramForm({ ...programForm, program_name: e.target.value })}
              required
              disabled={submitting}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: 0 }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#333' }}>Program Code</label>
            <input
              type="text"
              placeholder="e.g., CS"
              value={programForm.program_code}
              onChange={(e) => setProgramForm({ ...programForm, program_code: e.target.value })}
              required
              disabled={submitting}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <Button variant="ghost" onClick={() => setShowProgramModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} variant="primary" size="md">
              {submitting ? 'Saving...' : 'Save Program'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ADD/EDIT PURPOSE MODAL */}
      <Modal
        isOpen={showPurposeModal}
        onClose={() => !submitting && setShowPurposeModal(false)}
        title={editingPurpose ? 'Edit Purpose' : 'Add Purpose'}
        size="md"
      >
        <form onSubmit={handleSavePurpose} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ marginBottom: 0 }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#333' }}>Purpose Name</label>
            <input
              type="text"
              placeholder="e.g., Library Research"
              value={purposeForm.purpose_name}
              onChange={(e) => setPurposeForm({ ...purposeForm, purpose_name: e.target.value })}
              required
              disabled={submitting}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: 0 }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#333' }}>Purpose Code</label>
            <input
              type="text"
              placeholder="e.g., RES"
              value={purposeForm.purpose_code}
              onChange={(e) => setPurposeForm({ ...purposeForm, purpose_code: e.target.value })}
              required
              disabled={submitting}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <Button variant="ghost" onClick={() => setShowPurposeModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} variant="primary" size="md">
              {submitting ? 'Saving...' : 'Save Purpose'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* CONFIRMATION MODAL */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => !submitting && setShowConfirmModal(false)}
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
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAction?.onConfirm}
              disabled={submitting}
              size="md"
              variant={confirmAction?.type?.includes('delete') ? 'primary' : 'primary'}
              style={confirmAction?.type?.includes('delete') ? { backgroundColor: '#d32f2f', color: 'white' } : {}}
            >
              {submitting ? 'Processing...' : 'Confirm'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ConfigurationPage;
