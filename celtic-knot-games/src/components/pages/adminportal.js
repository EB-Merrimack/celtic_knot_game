import React, { useState } from 'react';
import '../css/adminportal.css';
import shield from '../Visual assets/shield_logo.jpg';
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';

/**
 * AdminPortal is a React component that displays the admin portal interface.
 * It provides the functionality to log in and out using Google OAuth.
 * When logged in, it displays a logout button.
 * When logged out, it displays a login button.
 * Both buttons are represented by the shield logo.
 * The component also handles the Google login and logout processes.
 * @returns {JSX.Element} - The admin portal interface component.
 */
const AdminPortal = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [profile, setProfile] = useState(null);
    const navigate = useNavigate();

    const handleLoginSuccess = (response) => {
        console.log('Login Success:', response);
        setIsLoggedIn(true);
        setProfile(response.profileObj); // Replace with appropriate response property
        alert('Login successful.');
        navigate('/AdminPortalPage');

    };

    /**
     * Handles a failed Google login attempt by logging the response to the console
     * and displaying an alert to the user to try again.
     * @param {Object} response The response object from the failed login attempt.
     */
    const handleLoginFailure = (response) => {
        console.log('Login Failed:', response);
        alert('Login failed. Please try again.');
    };

/**
 * Handles the logout process by performing Google logout,
 * resetting login state and user profile, and displaying a logout success alert.
 */

    const handleLogout = () => {
        googleLogout();
        setIsLoggedIn(false);
        setProfile(null);
        alert('Logout successful.');
    };

    return (
        <GoogleOAuthProvider clientId="396317001248-ambtvlmutpb766ign0qdminv7t5p9smf.apps.googleusercontent.com">
            <div id="admin-portal">
                <img src={shield} alt="Shield" id="shield-logo" />
                <h1>Admin Portal</h1>
                {isLoggedIn ? (
                    <div>
                        <button onClick={handleLogout}>Logout</button>
                    </div>
                ) : (
                    <GoogleLogin
                        onSuccess={handleLoginSuccess}
                        onError={handleLoginFailure}
                        render={(renderProps) => (
                            <img
                                src={shield}
                                alt="Login"
                                onClick={renderProps.onClick}
                                disabled={renderProps.disabled}
                                className="login-shield-button"
                                style={{ cursor: renderProps.disabled ? 'not-allowed' : 'pointer' }}
                            />
                        )}
                    />
                )}
            </div>
        </GoogleOAuthProvider>
    );
};

export default AdminPortal;
