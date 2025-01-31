import React from 'react';
import '../css/adminportal.css'; //path to css
import shield from '../Visual assets/shield_logo.jpg'; // shield image
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'; // Import GoogleLogin component

/**
 * The AdminPortal component renders the admin portal page. It wraps the GoogleLogin component
 * within a GoogleOAuthProvider component to provide the necessary authentication context.
 *
 * The GoogleLogin component is rendered as an image with a click event handler that fires the
 * login flow. The onSuccess and onFailure props are used to handle success and failure of the
 * login flow, respectively.
 *
 * The component is wrapped in a GoogleOAuthProvider component to provide the necessary
 * authentication context.
 *
 * @returns {JSX.Element} The rendered AdminPortal component.
 */
const AdminPortal = () => {
/**
 * Handles the successful login response.
 * Logs the response to the console, displays a success alert, 
 * and redirects the user to the admin portal page.
 *
 * @param {Object} response - The response object from the login attempt.
 */
    const handleLoginSuccess = (response) => {
        console.log('Login Success:', response);
        alert('Login successful.');
        window.location.href = './adminportal_portal';
    };

    /**
     * Handles the failed login response.
     * Logs the response to the console, displays a failure alert, 
     * and stays on the current page.
     *
     * @param {Object} response - The response object from the login attempt.
     */
    const handleLoginFailure = (response) => {
        console.log('Login Failed:', response);
        alert('Login failed. Please try again.');
    };

    return (
        <GoogleOAuthProvider clientId="396317001248-ambtvlmutpb766ign0qdminv7t5p9smf.apps.googleusercontent.com">
            <div id="borderimg">
                <div id="admin-portal">
                    <img src={shield} alt="Shield" id="shield-logo" />
                    <h1>Admin Portal</h1>
                    <p>This is where the admin functionalities will be available.</p>
                    <GoogleLogin
                        onSuccess={handleLoginSuccess}
                        onFailure={handleLoginFailure}
                        useOneTap
                        render={renderProps => (
                            <img 
                                src={shield}
                                alt="Login"
                                onClick={renderProps.onClick}
                                disabled={renderProps.disabled}
                                style={{ cursor: "pointer" }}
                                className="login-shield-button"
                            />
                        )}
                    />
                </div>
            </div>
        </GoogleOAuthProvider>
    );
};

export default AdminPortal;
