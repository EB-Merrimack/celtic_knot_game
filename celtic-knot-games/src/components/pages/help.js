import React, { useEffect, useState } from 'react';
import '../css/Helppage.css'; // Adjust path to the css folder

/**
 * This component renders the help page for the Celtic Knots Research Arcade.
 * The help page includes a user manual loaded from an external HTML file.
 * @returns {JSX.Element} - The help page component
 */
function Helppage() {
    const [manualContent, setManualContent] = useState('');

    useEffect(() => {
        // Fetch the user manual content when the component mounts
        fetch('/UserManualTwistedTeam.html') // Ensure this path is correct
            .then(response => response.text())
            .then(data => {
                setManualContent(data); // Set the content in state
            })
            .catch(error => {
                console.error('Error loading user manual:', error);
            });
    }, []);

    return (
        <div id="help-page-wrapper">
            <div id="help-page-container">
                <h1>Help Page</h1>
                {/* Dynamically load HTML content */}
                <div 
                    id="manual-content" 
                    className="manual-content" 
                    dangerouslySetInnerHTML={{ __html: manualContent }} 
                />
            </div>
        </div>
    );
}

export default Helppage;
