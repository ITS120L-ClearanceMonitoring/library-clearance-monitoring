import { useState } from 'react';
import { submitStudentLog } from '../services/clearanceService';
import { Button } from '../../../components/ui';
import '../student-log.css';

const StudentLoggingForm = () => {
    const [form, setForm] = useState({
        studentNo: '',
        firstName: '',
        middleName: '',
        lastName: '',
        program: '',
        purpose: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!navigator.onLine) {
            const queue = JSON.parse(localStorage.getItem('offline_logs') || '[]');
            localStorage.setItem('offline_logs', JSON.stringify([...queue, form]));
            alert("Offline: Log queued locally.");
            return;
        }

        try {
            await submitStudentLog(form);
            alert("Log submitted successfully!");
            setForm({ studentNo: '', firstName: '', middleName: '', lastName: '', program: '', purpose: '' });
        } catch (err) {
            console.error("Submission failed:", err);
            alert("Error: " + err.message);
        }
    };

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
                    <input
                        type="text"
                        value={form.program}
                        onChange={(e) => setForm({...form, program: e.target.value})}
                        required
                    />
                </div>
            </div>

            {/* Use the class from your separate CSS file */}
            <div className="form-row">
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

            <div className="form-row">
                <div className="form-group">
                    <label>Purpose of Clearance</label>
                    <input
                        type="text"
                        value={form.purpose}
                        onChange={(e) => setForm({...form, purpose: e.target.value})}
                        required
                    />
                </div>
            </div>

            <Button type="submit" variant="primary" style={{width: '100%'}}>
                Submit Request
            </Button>
        </form>
    );
};

export default StudentLoggingForm;