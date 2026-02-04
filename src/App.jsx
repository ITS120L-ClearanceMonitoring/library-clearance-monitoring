import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DashboardLayout from "./components/layouts/DashboardLayout";
import LoginPage from "./features/auth/pages/LoginPage";
import ChangePasswordPage from "./features/auth/pages/ChangePasswordPage";
import HomePage from "./features/home/pages/HomePage";
import ClearanceListPage from "./features/clearances/pages/ClearanceListPage";
import HistoryPage from "./features/history/pages/HistoryPage";
import UserManagementPage from "./features/users/pages/UserManagementPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Change Password - Outside Dashboard (Full Page) */}
          <Route path="/change-password" element={
            <ProtectedRoute>
              <ChangePasswordPage />
            </ProtectedRoute>
          } />
          
          {/* Protected Dashboard Shell */}
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<HomePage />} />
            <Route path="clearances" element={<ClearanceListPage />} />
            <Route path="history" element={<HistoryPage />} />
            
            {/* Admin Module */}
            <Route path="users" element={
              <ProtectedRoute roleRequired="LIBRARY_ADMIN">
                <UserManagementPage />
              </ProtectedRoute>
            } />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
      <ToastContainer 
        position="top-right" 
        autoClose={5000} 
        hideProgressBar={false} 
        newestOnTop 
        closeOnClick 
        rtl={false} 
        pauseOnFocusLoss 
        draggable 
        pauseOnHover 
        theme="light"
      />
    </>
  );
}

export default App;