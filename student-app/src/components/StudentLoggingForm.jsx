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

    const [form, setForm] = useState({
        studentNo: '',
        firstName: '',
        middleName: '',
        lastName: '',
        email: '',
        program_id: '',
        purpose_id: ''
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
            alert("Offline: Request queued. It will sync automatically when wifi returns.");
            return;
        }

        try {
            // Send form directly as it now contains the correct IDs
            await submitStudentLog(form);
            alert("Log submitted successfully!");
            setForm({
                studentNo: '', firstName: '', middleName: '', lastName: '',
                email: '', program_id: '', purpose_id: ''
            });
        } catch (err) {
            console.error("Submission failed:", err);
            alert("Error: " + err.message);
        }
    };

    if (loading) return <div>Loading form options...</div>;

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
                <div className="form-group">
                    <label>Purpose of Clearance</label>
                    <select
                        value={form.purpose_id}
                        onChange={(e) => setForm({...form, purpose_id: e.target.value})}
                        required
                        className="form-select"
                    >
                        <option value="" disabled>Select Purpose</option>
                        {/* FIX 1: Use 'purposes' (plural) to match your state */}
                        {purposes.map((purp) => (
                            <option key={purp.id} value={purp.id}>
                                {/* FIX 2: Ensure these match your actual DB columns */}
                                {purp.purpose_code} - {purp.purpose_name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <Button type="submit" variant="primary" style={{width: '100%'}}>
                Submit Request
            </Button>
        </form>
    );
};

export default StudentLoggingForm;
