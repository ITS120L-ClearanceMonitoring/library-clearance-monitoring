import { useState, useEffect } from 'react';
import { submitStudentLog } from '../services/clearanceService';
import { Button } from '../components/ui/Button';
import { supabase } from '../services/supabaseClient'; //
import '../styles/student-log.css';
// import { PROGRAM_LIST } from '../data/programs';
// import { PURPOSE_LIST } from '../data/purpose';

const StudentLoggingForm = () => {
    const [programs, setPrograms] = useState([]);
    const [purposes, setPurposes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        studentNo: '',
        firstName: '',
        middleName: '',
        lastName: '',
        email: '',
        program_id: '',
        purpose_id: '',
        notes: ''
    });

    // Background Sync Effect
    // Effect to sync Dropdown Data (Programs/Purposes)
    useEffect(() => {
        const syncDropdownData = async () => {
            if (navigator.onLine) {
                try {
                    const [progRes, purpRes] = await Promise.all([
                        // Using your confirmed singular table names
                        supabase.from('program').select('id, program_name, program_code').order('program_name'),
                        supabase.from('purpose').select('id, purpose_name, purpose_code').order('purpose_name')
                    ]);

                    if (progRes.data && purpRes.data) {
                        setPrograms(progRes.data);
                        setPurposes(purpRes.data);
                        // Update cache with the new correct data
                        localStorage.setItem('cached_programs', JSON.stringify(progRes.data));
                        localStorage.setItem('cached_purposes', JSON.stringify(purpRes.data));
                    }
                } catch (err) {
                    console.error("Fetch failed, falling back to cache", err);
                    loadFromCache();
                }
            } else {
                loadFromCache();
            }
            setLoading(false);
        };

        const loadFromCache = () => {
            setPrograms(JSON.parse(localStorage.getItem('cached_programs') || '[]'));
            setPurposes(JSON.parse(localStorage.getItem('cached_purposes') || '[]'));
        };

        syncDropdownData();
    }, []);

    useEffect(() => {
        const handleSync = async () => {
            if (navigator.onLine) {
                const queue = JSON.parse(localStorage.getItem('offline_logs') || '[]');
                if (queue.length === 0) return;

                const remainingQueue = [];
                for (const item of queue) {
                    try {
                        await submitStudentLog(item);
                    } catch (err) {
                        remainingQueue.push(item);
                    }
                }
                localStorage.setItem('offline_logs', JSON.stringify(remainingQueue));
            }
        };

        window.addEventListener('online', handleSync);
        return () => window.removeEventListener('online', handleSync);
    }, []);

    const handleReset = () => {
        setForm({
            studentNo: '', firstName: '', middleName: '', lastName: '',
            email: '', program_id: '', purpose_id: ''
        });
        setSubmitted(false);
    };

    const isOthersSelected = () => {
        const selectedPurpose = purposes.find(p => p.id === form.purpose_id);
        return selectedPurpose?.purpose_code === 'OTH' || selectedPurpose?.purpose_name === 'Others';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation updated to use purpose_id
        if (!form.purpose_id) {
            alert("Please select a purpose.");
            return;
        }

        if (!navigator.onLine) {
            const queue = JSON.parse(localStorage.getItem('offline_logs') || '[]');
            localStorage.setItem('offline_logs', JSON.stringify([...queue, form]));

            // FIX: Trigger the confirmation page even when offline
            setSubmitted(true);

            // Keep the alert and confirmation page UI
            console.log("Offline: Request queued locally.");
            alert("Offline: Request queued. It will sync automatically when wifi returns.");
            return;
        }

        setSubmitting(true);
        try {
            // Send form directly as it now contains the correct IDs
            await submitStudentLog(form);
            setSubmitted(true);
            alert("Log submitted successfully!");
            setForm({
                studentNo: '', firstName: '', middleName: '', lastName: '',
                email: '', program_id: '', purpose_id: '', notes: ''
            });
        } catch (err) {
            console.error("Submission failed:", err);
            alert("Error: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div>Loading form options...</div>;

    if (submitted) {
        return (
            <div className="confirmation-container" style={{ textAlign: 'center', padding: '40px' }}>
                <h2>Submission Successful!</h2>
                <p>Your clearance request has been logged.</p>
                <Button onClick={handleReset} variant="primary">
                    Submit Another Request
                </Button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-row">
                <div className="form-group">
                    <label>Student Number</label>
                    <input
                        type="text"
                        value={form.studentNo}
                        onChange={(e) => setForm({...form, studentNo: e.target.value})}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Program</label>
                    <select
                        value={form.program_id}
                        onChange={(e) => setForm({...form, program_id: e.target.value})}
                        required
                        className="form-select"
                    >
                        <option value="" disabled>Select Program</option>
                        {programs.map((prog) => (
                            <option key={prog.id} value={prog.id}>
                                {/* Must use program_code and program_name from your CSV  */}
                                {prog.program_code} - {prog.program_name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <hr className="line"/>

            <div className="form-row">
                <div className="form-group" style={{width: '100%'}}>
                    <label>Email</label>
                    <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({...form, email: e.target.value})}
                        required
                    />
                </div>
            </div>

            <hr className="line"/>

            <div className="form-row name-row">
                <div className="form-group">
                    <label>First Name</label>
                    <input
                        type="text"
                        value={form.firstName}
                        onChange={(e) => setForm({...form, firstName: e.target.value})}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Middle Name</label>
                    <input
                        type="text"
                        value={form.middleName}
                        onChange={(e) => setForm({...form, middleName: e.target.value})}
                    />
                </div>
                <div className="form-group">
                    <label>Last Name</label>
                    <input
                        type="text"
                        value={form.lastName}
                        onChange={(e) => setForm({...form, lastName: e.target.value})}
                        required
                    />
                </div>
            </div>

            <hr className="line" />

            <div className="form-row">
                <div className="form-group" style={{ width: '100%' }}>
                    <label>Purpose of Clearance</label>
                    <select
                        value={form.purpose_id}
                        onChange={(e) => setForm({ ...form, purpose_id: e.target.value, notes: '' })}
                        required
                        className="form-select"
                    >
                        <option value="" disabled>Select Purpose</option>
                        {purposes.map((purp) => (
                            <option key={purp.id} value={purp.id}>
                                {purp.purpose_code} - {purp.purpose_name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Conditionally show Notes field if "Others" is selected  */}
            {isOthersSelected() && (
                <div className="form-row">
                    <div className="form-group" style={{ width: '100%' }}>
                        <label>Please specify purpose:</label>
                        <input
                            type="text"
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            placeholder="Type your purpose here..."
                            required
                        />
                    </div>
                </div>
            )}

            <Button type="submit" variant="primary" style={{width: '100%'}} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Request'}
            </Button>
        </form>
    );
};

export default StudentLoggingForm;
