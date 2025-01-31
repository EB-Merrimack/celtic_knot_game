import React, { useState, useEffect } from "react";
import "../css/freestyle.css"; // style sheet
import logo from "../Visual assets/freestyle logo.png"; // Import the logo image

/**
 * This component renders a welcome page for the Freestyle game, with sliders for selecting the grid width and height, and a radio button for selecting whether to include a color component. When the user clicks the "Start Game" button, the component navigates to the playboard page.
 * @returns {JSX.Element} - The welcome page component
 */
function FreestyleWelcomePage() {
    const [width, setWidth] = useState(1);
    const [height, setHeight] = useState(1);
    const [colorComponent, setColorComponent] = useState("no");

    /**
     * Updates the width of the grid based on the value of the slider
     * @param {React.ChangeEvent<HTMLInputElement>} e - The event that triggered this function
     */
    const updateWidth = (e) => {
        setWidth(Number(e.target.value));
        console.log('Width changed:', e.target.value);
    };

    /**
     * Updates the height of the grid based on the value of the slider
     * @param {React.ChangeEvent<HTMLInputElement>} e - The event that triggered this function
     */
    const updateHeight = (e) => {
        setHeight(Number(e.target.value));
        console.log('Height changed:', e.target.value);
    };

    /**
     * Handles the change event of the radio buttons. Sets the state of the colorComponent to the value of the radio button.
     * @param {React.ChangeEvent<HTMLInputElement>} e - The event that triggered this function
     */
    const handleRadioChange = (e) => {
        setColorComponent(e.target.value);
        console.log(`Radio button clicked: ${e.target.value}`);
    };

    /**
     * Navigates to the playboard page when the "Start Game" button is clicked.
     */
    const startGame = () => {
        console.log("Start Game button clicked!");
        window.location.href = "#";  // navigate to playboard
    };

    useEffect(() => {
        console.log(`Width: ${width}, Height: ${height}, Color: ${colorComponent}`);
    }, [width, height, colorComponent]);

    return (
        <div>
            <div id="borderimg">
                {/* Intentionally left empty for background image */}
            </div>
            <div className="container scroll-container">
                <div className="content">
                    <div className="settings">
                        <h3>Choose Your Settings</h3>
                        <div className="slider-container">
                            <label htmlFor="width">Grid Width</label>
                            <input 
                                type="range" 
                                id="width" 
                                min="1" 
                                max="5" 
                                value={width} 
                                onChange={updateWidth} 
                            />
                            <span id="width-value">{width}</span>
                        </div>
                        <div className="slider-container">
                            <label htmlFor="height">Grid Height</label>
                            <input 
                                type="range" 
                                id="height" 
                                min="1" 
                                max="5" 
                                value={height} 
                                onChange={updateHeight} 
                            />
                            <span id="height-value">{height}</span>
                        </div>
                        <div className="radio-container">
                            <label>Color Component:</label><br />
                            <label>
                                <input 
                                    type="radio" 
                                    name="color" 
                                    value="yes" 
                                    checked={colorComponent === "yes"} 
                                    onChange={handleRadioChange} 
                                /> Yes
                            </label><br />
                            <label>
                                <input 
                                    type="radio" 
                                    name="color" 
                                    value="no" 
                                    checked={colorComponent === "no"} 
                                    onChange={handleRadioChange} 
                                /> No
                            </label>
                        </div>
                        <button className="start-game-button" onClick={startGame}>Start Game</button>
                    </div>
                    <div className="branding">
                        <h2 className="welcome-text">Welcome to</h2>
                        <img src={logo} alt="Logo" className="large-logo" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FreestyleWelcomePage;
