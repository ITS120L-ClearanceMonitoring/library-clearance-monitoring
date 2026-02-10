import React from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLoggingForm from '../components/StudentLoggingForm';
import { Button } from '../../../components/ui';

const StudentPortalPage = () => {
    const navigate = useNavigate();

    return (
        <div className="auth-container">
            <div className="auth-form" style={{ maxWidth: '500px' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    borderBottom: '1px solid var(--border)',
                    paddingBottom: '10px'
                }}>
                    <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)' }}>Student Log</h2>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                        Back to Login
                    </Button>
                </div>

                <StudentLoggingForm />

                <p style={{
                    marginTop: '20px',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--gray)',
                    textAlign: 'center'
                }}>
                    Please ensure your Student Number is correct before submitting.
                </p>
            </div>
        </div>
    );
};

export default StudentPortalPage;