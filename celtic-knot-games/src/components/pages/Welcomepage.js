import React from 'react';
import '../css/Welcomepage.css'; // Adjust path to the css folder
import WelcomeCarousel from '../components/Carousel';  // Import the carousel component

/**
 * This component renders the welcome page for the Celtic Knots Research Arcade.
 * The welcome page includes a brief introduction to the arcade, a carousel with
 * information about the two games, and a link to the games.
 * @returns {JSX.Element} - The welcome page component
 */
function Welcomepage() {
    return (
        <div id="borderimg">
            <div id="welcome-page-container">
                <h1>Welcome to the Celtic Knots Research Arcade!</h1>
                <p>
                    This interactive platform offers Two engaging games designed
                    to explore the intricate beauty and complexity of Celtic Knots.
                    Each game is a unique challenge that deepens your understanding of knot theory 
                    while contributing to research in this fascinating area. Whether you’re here to test your strategic thinking 
                    or participate in knot-related studies, our games are crafted to both entertain and educate. 
                    Dive in and start unraveling the mysteries of Celtic Knots!
                </p>
                <WelcomeCarousel />  {/* Add the carousel component */}
            </div>
        </div>
    );
}

export default Welcomepage;
