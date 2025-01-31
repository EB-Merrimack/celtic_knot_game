import React, { useState, useRef } from "react";
import { useLocation } from 'react-router-dom';
import "../css/freestylegame.css"; // style sheet
import logo from "../Visual assets/freestyle logo.png"; // Import the logo image
import CelticKnotBoard from "../components/celticKnotBoard";

/**
 * This component renders a page for playing the Freestyle game, with buttons for the various options.
 * @returns {JSX.Element} - The playboard page component
 */
function FreestyleGamePage() {
    const [showMoves, setShowMoves] = useState(false);
    const [moves, setMoves] = useState([]);
    const [showKnots, setShowKnots] = useState(false);
    const [knots, setKnots] = useState([]);
    const [gameKey, setGameKey] = useState(1); // Use the actual game key you want to test with
    const [iframeUrl, setIframeUrl] = useState(null); // State to hold the iframe URL

    // Fetch the params from the welcome page
    const location = useLocation();
    const { gridWidth, gridHeight, colorComponent } = location.state || { width: 0, height: 0, colorComponent: 'yes' };

    // Game reference for button press functions
    const gameRef = useRef();

    /**
     * Calls the undo method on the current game instance.
     * If the game instance exists, it will revert the last move made.
     */

    const handleUndo = () => {
        gameRef.current?.undo();
    };

    /**
     * Calls the redo method on the current game instance.
     * If the game instance exists, it will reapply the last undone move.
     */

    const handleRedo = () => {
        gameRef.current?.redo();
    };

    /**
     * Calls the exportBoard method on the current game instance.
     * If the game instance exists, it will prompt the user to download the current
     * state of the board as a JSON file.
     */
    const handleExportBoard = () => {
        gameRef.current?.exportBoard();
    };

    /**
     * Toggles the moves menu on or off. If the moves menu was previously hidden, it will call handleShowAllMoves to fetch the moves and display them. If the knots menu is currently visible, it will toggle that off as well.
     */
    const toggleMoves = () => {
        if (!showMoves) {
            handleShowAllMoves();
        }

        if (showKnots) {
            toggleKnots();
        }

        setShowMoves(!showMoves);
    };

    /**
     * Retrieves all moves from the game and formats them into an array of objects containing move number, type, and coordinates.
     * Updates the moves state with the formatted moves.
     */
    const handleShowAllMoves = () => {
        const moves = gameRef.current?.getAllMoves();
        let counter = 1;
        const formattedMoves = moves.map(currMove => {
            const [x, y] = currMove[0];
            let moveType = "";
            switch (currMove[1]) {
                case 0: moveType = "None"; break;
                case 1: moveType = "Vertical"; break;
                case 2: moveType = "Horizontal"; break;
            }

            return {
                move_number: counter++,
                move: moveType,
                coord: `(${x}, ${y})`
            };
        });
        setMoves(formattedMoves);
    };

    /**
     * Toggles the knots menu on or off. If the knots menu was previously hidden, it will call handleIdentifyKnots to fetch the knots and display them. If the moves menu is currently visible, it will toggle that off as well.
     */

    const toggleKnots = () => {
        if (!showKnots) {
            handleIdentifyKnots();
        }

        if (showMoves) {
            toggleMoves();
        }

        setShowKnots(!showKnots);
    };

    /**
     * Fetches the information of all identified knots in the game, using the DT codes returned by the
     * `identifyKnots` method of the `CelticKnotGame` class. If the DT code is invalid, it will attempt to
     * fetch the information again by negating all the numbers in the DT code. If the DT code is still invalid,
     * it will set the knot name to 'N/A' and the knot atlas URL to a link that allows the user to manually
     * search for the knot on the KnotInfo database.
     *
     * @returns {Promise<void>}
     */
    const handleIdentifyKnots = async () => {
        try {
            const DT_CODES = gameRef.current?.identifyKnots();
            if (!DT_CODES || DT_CODES.length === 0) {
                console.warn("No knots identified.");
                return;
            }

            const knotPromises = DT_CODES.map(async (dtCodeObj) => {
                let dtCodeArray = dtCodeObj.dtCode.split(" ").map(Number).filter(n => !isNaN(n));

                if (dtCodeArray.every(n => n < 0)) {
                    dtCodeArray = dtCodeArray.map(Math.abs);
                }

                const dtCodeValue = `[${dtCodeArray.join(", ")}]`;

                try {
                    const response = await fetch(`/api/knot-info`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ dtCode: dtCodeValue }),
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.warn(`API error for DT Code ${dtCodeValue}: ${errorText}`);
                        throw new Error(`API response not OK: ${errorText}`);
                    }

                    const knotData = await response.json();
                    console.log("Knot Data:", knotData);  // Log to check the data
                    const { knot_name, knot_atlas_anon, equicable } = knotData;

                    const isValidURL = knot_atlas_anon && knot_atlas_anon.startsWith("http");

                    return {
                        ...dtCodeObj,
                        knotName: knot_name || "N/A",
                        knotAtlasURL: isValidURL
                            ? `https://knotinfo.math.indiana.edu/homelinks/knotfinder.php?DT=${dtCodeArray.join("+")}`
                            : `https://knotinfo.math.indiana.edu/homelinks/knotfinder.php?DT=${dtCodeArray.join("+")}`,
                        equicable: equicable ?? false,
                    };
                } catch (error) {
                    console.error(`Error fetching data for DT Code ${dtCodeValue}:`, error);
                    return {
                        ...dtCodeObj,
                        knotName: "N/A",
                        knotAtlasURL: `https://knotinfo.math.indiana.edu/homelinks/knotfinder.php?DT=${dtCodeArray.join("+")}`,
                        equicable: false,
                    };
                }
            });

            const updatedKnots = await Promise.all(knotPromises);
            setKnots(updatedKnots);

            if (updatedKnots.length > 0) {
                const firstKnotURL = updatedKnots[0].knotAtlasURL;
                console.log("Setting iframe URL:", firstKnotURL);  // Log the URL before setting
                setIframeUrl(firstKnotURL);
            }
        } catch (error) {
            console.error("Unexpected error in handleIdentifyKnots:", error);
        }
    };





    return (
        <div className="page-container">
            <div id="borderimg"></div>
            <div className="options-container">
                <div className="branding">
                    <img src={logo} alt="Logo" className="large-logo circle-logo" />
                </div>
                <div className="options">
                    <button className="option-button" onClick={handleUndo}>Undo</button>
                    <button className="option-button" onClick={handleRedo}>Redo</button>
                    <button className="option-button" onClick={toggleMoves}>
                        {showMoves ? "Hide All Moves" : "See All Moves"}
                    </button>
                    <button className="option-button" onClick={handleExportBoard}>Export Board</button>
                    <button className="option-button" onClick={toggleKnots}>
                        {showKnots ? "Hide Knot Identification" : "Identify All Knots"}
                    </button>
                    <button className="option-button" onClick={() => window.location.href = "/freestyle_welcomepage"}>Restart Freestyle</button>
                </div>
            </div>
            <div className="game-container">
                <CelticKnotBoard
                    ref={gameRef}
                    gridWidth={gridWidth}
                    gridHeight={gridHeight}
                    gameType={0}
                    colorComponent={colorComponent === 'yes'} />
                <span className="tooltip" title={`Hover over any crossing and click to open the Break Selection Menu!
                    For more information on how to use the Celtic knot grid, please navigate to the Help Page`}>
                    <span className="question-mark-circle">?</span>
                </span>
                {showMoves && (
                    <div className="moves-container">
                        <div className="moves-display">
                            <h3>All Moves:</h3>
                            <ul>
                                {moves.map((move, index) => (
                                    <li key={index}>{`Move [${move.move_number}]: ${move.move} at ${move.coord}.`}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
                {showKnots && (
                    <div className="moves-container">
                        <div className="moves-display">
                            <h3>Knot{knots.length > 1 ? "s" : ""} Identified:</h3>
                            <ul>
                                {knots.map((knot, index) => (
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
                                                    <a href={knot.knotAtlasURL} target="_blank" rel="noopener noreferrer">
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
                    </div>
                )}
            </div>
        </div>
    );
}

export default FreestyleGamePage;
