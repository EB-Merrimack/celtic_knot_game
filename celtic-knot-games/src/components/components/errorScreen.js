import "../css/gameEndScreen.css"; // style sheet
import { Tooltip as ReactTooltip } from 'react-tooltip';

/**
 * This component renders a fatal error screen for a Liner vs. Knotter game. It will tell the user they must go Back to Home.
 * @returns {JSX.Element} - The error screen component
 */
const ErrorScreen = ({ message, navigateToHomePage }) => {
    // Note: We will utilize the game end screen for simplicity. It is already properly implemented, so why reinvent the wheel?
    return (
        <div className={`game-end-screen game-end-screen_red`}>
            <div className="ges-results-display">
                <h1>An Unexpected Error Occurred</h1>
                <p style={{ textAlign: "left", margin: 0 }}>Error details:</p>
                {/* Error Message Display */}
                <div className="ges-tab-content">
                    {message}
                </div>
                <p>We're sorry, but the game has ended because of this error. Please return to the home screen by clicking the button below.</p>
                <div className="ges-button-container">
                    <button
                        className="ges-button"
                        onClick={navigateToHomePage}
                        data-tooltip-id="backToHome-tooltip"
                        data-tooltip-content="Returns back to the Linker vs. Knotter landing page.">
                        Back to Home
                    </button>
                    <ReactTooltip id="backToHome-tooltip" />
                </div>
            </div>
        </div>
    );
}

export default ErrorScreen;