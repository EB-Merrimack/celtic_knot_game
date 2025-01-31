import { useEffect, useState } from "react";
import "../css/gameEndScreen.css"; // style sheet
import { Tooltip as ReactTooltip } from 'react-tooltip';


/**
 * This component renders the game end screen for a Liner vs. Knotter game.
 * @returns {JSX.Element} - The game end screen component
 */
const GameEndScreen = ({ classColor, type, isLinker, linkerWins, dtCodes, movesPlayed, restartGame, navigateToSettingsPage, navigateToHomePage, game }) => {
    const [activeTab, setActiveTab] = useState("Moves Played");
    const [snapshotSrc, setSnapshotSrc] = useState(null);

    let formattedMoves = (
        <div className="ges-dtCode-format">
            <h3>All Moves:</h3>
            <ul>
                {movesPlayed.map((move, index) => (
                    <li key={index}>{`Move [${move.move_number}]: ${move.move} at ${move.coord}.`}</li>
                ))}
            </ul>
        </div>
    );

    let formattedKnots = (
        <div className="ges-dtCode-format">
            <h3>Knot{dtCodes.length > 1 ? "s" : ""} Identified:</h3>
            <ul>
                {dtCodes.map((knot, index) => (
                    <li key={index}>
                        <span style={{ color: knot.color }}>
                            {`Knot [${knot.link}]:`}
                        </span>
                        {` DT Code: ${knot.dtCode.length === 0 ? "N/A (unknot)" : knot.dtCode}.`}
                        {knot.equicable && knot.knotName !== 'N/A' && (
                            <span> Knot Identification: {knot.knotName}</span>
                        )}
                        {knot.knotName !== 'N/A' ? (
                            // If the knot is identified, show its name
                            <div>
                                <h3>Knot identified: {knot.knotName}</h3>
                                <a href={knot.knotAtlasURL} target="_blank" rel="noopener noreferrer">
                                    Additional Knot Identification
                                </a>
                            </div>
                        ) : (
                            // If the knot is not identified, show the link and iframe
                            knot.knotAtlasURL && (
                                <div>
                                    <a href={knot.knotAtlasURL} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
                                        Additional Knot Identification
                                    </a>
                                    <iframe
                                        src={knot.knotAtlasURL}
                                        title="Knot Info"
                                        style={{ width: "400px", height: "300px", border: "1px solid #ccc", marginTop: "10px" }}
                                    ></iframe>
                                </div>
                            )
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );

    const tabContent = {
        "Moves Played": formattedMoves,
        [`DT Code${dtCodes.length > 1 ? "s" : ""}`]: formattedKnots,
        "View Board": (
            <div id="snapshot-container">
                <img src={snapshotSrc} alt="Game Snapshot" className="game-snapshot" />
            </div>
        )
    };

    /**
     * Updates the container size on every window resize (so that the container dynamically changes)
     */
    function updateContainerSize() {
        const container = document.getElementById('snapshot-container');
        if (container) {
            // Call with dimensions
            game.getSnapshot()?.then((snapshot) => {
                setSnapshotSrc(snapshot.src); // Extract the `src` from the returned Image object
            });
        }
    }

    // Set up the resize event listener.
    useEffect(() => {
        window.addEventListener('resize', updateContainerSize);
        return () => window.removeEventListener('resize', updateContainerSize);
    }, []);

    useEffect(() => {
        if (game && activeTab === "View Board" && snapshotSrc === null) {
            updateContainerSize(); // Get a snapshot
        }
    }, [activeTab]);

    const winnerLabel = type === "offline"
        ? (`${linkerWins ? "Linker Wins" : "Knotter Wins"}`) // Offline mode branch
        : (`${isLinker ? "Linker" : "Knotter"} ${linkerWins === isLinker ? "Wins" : "Loses"}`); // Online mode branch

    return (
        <div className={`game-end-screen ${classColor}`}>
            <div className="ges-results-display">
                <h1>{winnerLabel}</h1>
                {/* Tab Navigation */}
                <div className="ges-tab-container">
                    {Object.keys(tabContent).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`ges-tab${activeTab === tab ? " ges-active-tab" : ""}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                {/* Content Display */}
                <div className="ges-tab-content">
                    {tabContent[activeTab]}
                </div>
                <div className="ges-button-container">
                    {type !== "opponent" && (
                        <button
                            className="ges-button"
                            onClick={restartGame}
                            data-tooltip-id="playAgain-tooltip"
                            data-tooltip-content="Plays the game again with the same settings.">
                            Play Again
                        </button>
                    )}
                    {type !== "opponent" && (
                        <button
                            className="ges-button"
                            onClick={navigateToSettingsPage}
                            data-tooltip-id="changeSettings-tooltip"
                            data-tooltip-content="Returns to the game lobby screen to adjust settings.">
                            Change Settings
                        </button>
                    )}
                    <button
                        className="ges-button"
                        onClick={navigateToHomePage}
                        data-tooltip-id="backToHome-tooltip"
                        data-tooltip-content="Returns back to the Linker vs. Knotter landing page.">
                        Back to Home
                    </button>
                    <ReactTooltip id="playAgain-tooltip" />
                    <ReactTooltip id="changeSettings-tooltip" />
                    <ReactTooltip id="backToHome-tooltip" />
                </div>
            </div>
        </div>
    );
}

export default GameEndScreen;