import React from 'react';
import { Link } from 'react-router-dom';

function HomePage() {
    return (
        <div className="bento-box text-center" style={{ maxWidth: '500px', marginTop: '10vh' }}>
            <h1>Live Quiz Poll System</h1>
            <p className="mb-15">Select your role to begin:</p>
            <div className="flex-row" style={{ justifyContent: 'center' }}>
                <Link to="/teacher">
                    <button className="mr-10">I am a Teacher</button>
                </Link>
                <Link to="/student">
                    <button>I am a Student</button>
                </Link>
            </div>
        </div>
    );
}

export default HomePage;