import React from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLoggingForm from '../components/StudentLoggingForm';
import { Button } from '../../../components/ui';
import '../student-log.css';

const StudentPortalPage = () => {
    const navigate = useNavigate();

    return (
        <div className="auth-container">
            <div className="auth-form" style={{ maxWidth: '500px' }}>
                {/* Use the new .portal-header class */}
                <div className="portal-header">
                    <h2 className="portal-title">Student Log</h2>

                    {/* You can also add styles directly to the Button via className if needed */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/login')}
                    >
                        Back to Login
                    </Button>

                </div>

                <StudentLoggingForm />

                <p className="portal-footer-text">
                    Please ensure your Student Number is correct before submitting.
                </p>
            </div>
        </div>
    );
};

export default StudentPortalPage;