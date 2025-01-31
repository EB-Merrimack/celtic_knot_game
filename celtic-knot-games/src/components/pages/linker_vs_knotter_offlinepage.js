import React, { useState, useEffect, useRef } from "react";
import "../css/lvkofflinepage.css"; // style sheet
import "../css/lvkgeneralpage.css"; // style sheet
import { useSocket } from "../components/socketProvider";
import { useLocation, useNavigate } from "react-router-dom";
import Scoreboard from "../components/scoreboard";

/**
 * This component renders a page for hosting a Liner vs. Knotter game offline, with options to set game parameters.
 * @returns {JSX.Element} - The offline game page component
 */
function LvkOfflinePage() {
    const location = useLocation();
    const givenGameCode = location.state?.givenGameCode;

    const [player1, setPlayer1] = useState("linker");
    const [width, setWidth] = useState(3);
    const [height, setHeight] = useState(3);
    const [colorComponent, setColorComponent] = useState("no");
    const [breaks, setBreaks] = useState("1");
    const [noBreaks, setNoBreaks] = useState("0");
    const [breakOptions, setBreakOptions] = useState(Array.from({ length: 101 }, (_, i) => (
        <option key={i} value={i}>{i}</option>
    )));
    const [noBreakOptions, setNoBreakOptions] = useState(Array.from({ length: 101 }, (_, i) => (
        <option key={i} value={i}>{i}</option>
    )));

    // Scoreboard stats
    const [scoreboard, setScoreboard] = useState({ p1Linker: 0, p2Linker: 0, p1Knotter: 0, p2Knotter: 0 })
    const scoreboardRef = useRef(scoreboard); // Used to pass vals down

    const gameSettingsRef = useRef(null); // Reference used to pass vals down to next page.
    var goingToGameplayPage = false;
    const socket = useSocket();
    const navigate = useNavigate();

    // Sets up the socket listeners
    useEffect(() => {
        // If the socket hasn't yet initialized, return. Once it does, this will pass
        if (!socket) {
            return;
        }

        // If we're given a game code, just fetch the settings for this game
        if (givenGameCode) {
            socket.emit('getGameSettings', givenGameCode);
        }
        // Otherwise, we want to create a game.
        else {
            // Create the game.
            var gameSettings = {
                player1,
                width,
                height,
                colorComponent,
                breaks,
                noBreaks
            };
            socket.emit('createGame', {
                gameCode: socket.id, // Use the socket id as the game code
                settings: gameSettings,
                type: "offline"
            });
            gameSettingsRef.current = gameSettings;
        }

        socket.on('startGame', navigateToGameplayPage);

        socket.on('error', (message) => { // In-case of errors. There should be none for this page.
            alert("ERROR: " + message);
            if (message == "A game with this game code already exists. Redirecting to landing page...") {
                socket.emit('playerDisconnect', "Back button clicked.");
                navigate('/linker_vs_knotter_welcomepage');
            }
        });

        socket.on('scoreboard', (scoreboard) => {
            setScoreboard(scoreboard);
        });

        socket.on('disconnect', () => {
            alert("ERROR: The server appears to be offline at the moment. Please try again later.", 10);
        });

        return () => {
            if (!goingToGameplayPage) {
                socket.emit('playerDisconnect', "Leaving page.");
            }
            socket.off(); // Remove all event listeners. They must be reconfigured when entering the gameplay page
        }
    }, [socket]);

    // Updates the settings + break options
    useEffect(() => {
        if (socket) {
            var gameSettings = {
                player1,
                width,
                height,
                colorComponent,
                breaks,
                noBreaks
            };
            socket.emit('updateGameSettings', {
                gameCode: socket.id,
                settings: gameSettings
            });
            gameSettingsRef.current = gameSettings;
        }
        // Number of breaks = number of crossings, which is given by: 2mn - m - n for an m x n grid
        let numCrossings = (2 * width * height) - width - height;
        setBreakOptions(Array.from({ length: numCrossings }, (_, i) => (
            <option key={i + 1} value={i + 1}>{i + 1}</option>
        )));
        if (breaks > numCrossings) {
            setBreaks(1);
        }
        // No break options is at most half the total number of breaks to be played (one no break per move per player)
        setNoBreakOptions(Array.from({ length: Math.floor(breaks / 2) + 1 }, (_, i) => (
            <option key={i} value={i}>{i}</option>
        )));
        if (noBreaks > breaks / 2) {
            setNoBreaks(0);
        }
    }, [player1, width, height, colorComponent, breaks, noBreaks]);

    // Whenever scoreboard updates, update the reference
    useEffect(() => {
        scoreboardRef.current = scoreboard;
    }, [scoreboard]);

    const handlePlayer1Change = (e) => {
        setPlayer1(e.target.value);
    };

    const startGame = () => {
        socket.emit("startGame", socket.id);
    };

    const goBack = () => {
        socket.emit('playerDisconnect', "Returning to welcome page.");
        navigate("/linker_vs_knotter_welcomepage");
    };

    const navigateToGameplayPage = () => {
        goingToGameplayPage = true;
        navigate('/linker_vs_knotter_gameplaypage', { state: { type: "offline", gameCode: socket.id, gameSettings: gameSettingsRef.current, initScoreboard: scoreboardRef.current } });  // navigate to the gameplay page.
    };

    return (
        <div className="lvk-App">
            <div className="lvk-content-container">
                <header className="lvk-header">
                    <div id="borderimg">
                        {/* Intentionally left empty for background image */}
                    </div>
                    <div className="lvk-content">
                        <button className="go-back-button" onClick={goBack}>Go Back</button>
                        <div className="lvkhostcontainer">
                            <div className="lvkhosttext">
                                <h1>Offline Game</h1>
                                <div className="playoptions-container">
                                    <h3>Game Options</h3>
                                    <div className="option">
                                        <span className="tooltip" title="The linker's objective is to end the game with multiple components (or continous strings) on the grid.">
                                            <span className="question-mark-circle">?</span>
                                        </span>
                                        <label>Player 1 (Who Goes First):</label><br />
                                        <label>
                                            <input
                                                type="radio"
                                                name="player1"
                                                value="linker"
                                                checked={player1 === "linker"}
                                                onChange={handlePlayer1Change}
                                            /> Linker
                                        </label>
                                        <label>
                                            <input
                                                type="radio"
                                                name="player1"
                                                value="knotter"
                                                checked={player1 === "knotter"}
                                                onChange={handlePlayer1Change}
                                            /> Knotter
                                        </label>
                                    </div>
                                    <div className="option">
                                        <label>Grid Width</label>
                                        <input
                                            type="range"
                                            min="1"
                                            max="5"
                                            value={width}
                                            onChange={(e) => setWidth(Number(e.target.value))}
                                        />
                                        <span>{width}</span>
                                    </div>
                                    <div className="option">
                                        <label>Grid Height</label>
                                        <input
                                            type="range"
                                            min="1"
                                            max="5"
                                            value={height}
                                            onChange={(e) => setHeight(Number(e.target.value))}
                                        />
                                        <span>{height}</span>
                                    </div>
                                    <div className="option">
                                        <label>Color Components:</label> <span className="tooltip" title="A component is an individual knot on the board">
                                            <span className="question-mark-circle">?</span>
                                        </span><br />
                                        <label>
                                            <input
                                                type="radio"
                                                name="colorComponent"
                                                value="yes"
                                                checked={colorComponent === "yes"}
                                                onChange={(e) => setColorComponent(e.target.value)}
                                            /> Yes
                                        </label>
                                        <label>
                                            <input
                                                type="radio"
                                                name="colorComponent"
                                                value="no"
                                                checked={colorComponent === "no"}
                                                onChange={(e) => setColorComponent(e.target.value)}
                                            /> No
                                        </label>
                                    </div>
                                    <div className="option">
                                        <label>Breaks:</label>
                                        <select
                                            value={breaks}
                                            onChange={(e) => setBreaks(e.target.value)}
                                        >
                                            {breakOptions}
                                        </select>
                                        <span className="tooltip" title="Breaks are special moves that allow you to strategically manipulate the board. Use them wisely!"> <span className="question-mark-circle">?</span>
                                        </span>
                                    </div>
                                    <div className="option">
                                        <label>No Breaks:</label>
                                        <select
                                            value={noBreaks}
                                            onChange={(e) => setNoBreaks(e.target.value)}
                                        >
                                            {noBreakOptions}
                                        </select>
                                        <span className="tooltip" title="No Breaks are additional settings for gameplay. Adjust according to your strategy!"> <span className="question-mark-circle">?</span>
                                        </span>
                                    </div>
                                </div>
                                <button className="start-game-button" onClick={startGame}>
                                    Play Offline
                                </button>
                            </div>
                        </div>
                    </div>
                </header>
            </div>
            <Scoreboard
                p1Linker={scoreboard.p1Linker}
                p2Linker={scoreboard.p2Linker}
                p1Knotter={scoreboard.p1Knotter}
                p2Knotter={scoreboard.p2Knotter} />
        </div>
    );
}

export default LvkOfflinePage;
