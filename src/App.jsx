import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentView from './pages/StudentView';
import HomePage from './pages/HomePage';

function App() {
    return (
        <SocketProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/teacher" element={<TeacherDashboard />} />
                    <Route path="/student" element={<StudentView />} />
                    <Route path="*" element={
                        <div className="bento-box" style={{ textAlign: 'center', marginTop: '50px' }}>
                            <h2>404 - Page Not Found</h2>
                            <p>The page you are looking for does not exist.</p>
                        </div>
                    } />
                </Routes>
            </Router>
        </SocketProvider>
    );
}

export default App;