import React from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLoggingForm from '../components/StudentLoggingForm';
import { Button } from '../../../components/ui';
import '../student-log.css';

const StudentPortalPage = () => {
    const navigate = useNavigate();

    return (
        <div className="auth-container">
            <div className="auth-form">

                <div className="portal-header">
                    <h2 className="portal-title">Clearance Request Form</h2>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/login')}
                    >
                        Back to Login
                    </Button>

                </div>

                <div className="portal-body">
                    <StudentLoggingForm />
                </div>
                <p className="portal-footer-text">
                    Please ensure your Student Number is correct before submitting.
                </p>
            </div>
        </div>
    );
};

export default StudentPortalPage;