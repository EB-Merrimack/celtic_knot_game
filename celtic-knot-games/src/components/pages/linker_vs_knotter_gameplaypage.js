import React, { useState, useEffect, useRef } from "react";
import "../css/lvkgameplaypage.css"; // style sheet
import { useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from "../components/socketProvider";
import CelticKnotBoard from "../components/celticKnotBoard";
import GameEndScreen from "../components/gameEndScreen";
import Scoreboard from "../components/scoreboard";
import ErrorScreen from "../components/errorScreen";

/**
 * This component renders the gameplay page for the Liner vs. Knotter game.
 * @returns {JSX.Element} - The gameplay page component
 */
function LvkGameplayPage() {
    // Fetch the params from the previous page
    const location = useLocation();
    const { type, gameCode, gameSettings, initScoreboard } = location.state;

    // Socket & Game
    const socket = useSocket(); // Only use a socket in online mode
    const gameRef = useRef(); // Game reference for interacting with the grid
    const navigate = useNavigate();

    // Constants & Initial State:
    var isLinker;
    var myMoveInitialState;
    var linkerMoveInitialState;
    // Handle initial state differently for online and offline modes
    if (type == "offline") {
        isLinker = null;
        myMoveInitialState = null;
        linkerMoveInitialState = gameSettings.player1 == "linker";
    }
    else {
        isLinker = gameSettings.linker == type;
        myMoveInitialState = gameSettings.player1 == type;
        linkerMoveInitialState = gameSettings.linker == gameSettings.player1;
    }

    // Used for tracking game state & UI
    const [myMove, setMyMove] = useState(myMoveInitialState); // Determines whose move it is currently
    const [linkerMove, setLinkerMove] = useState(linkerMoveInitialState); // Determines if the linker is going or the knotter
    const [breaks, setBreaks] = useState(gameSettings.breaks); // Number of breaks remaining
    const [noBreaks, setNoBreaks] = useState(gameSettings.noBreaks); // Number of no breaks remaining

    // Tracks game end screen stats
    const [isGameOver, setIsGameOver] = useState(false);
    const [isWinner, setIsWinner] = useState(false);
    const [linkerWins, setLinkerWins] = useState(false);
    const [dtCodes, setDTCodes] = useState(null); // Array tracking DT codes for each knot
    const [movesPlayed, setMovesPlayed] = useState(null); // Array tracking the moves played

    var returningToChangeSettings = false;

    // Erroring
    const [errorMessage, setErrorMessage] = useState(null);

    // Scoreboard stats
    const [scoreboard, setScoreboard] = useState(initScoreboard);

    // When the socket changes
    useEffect(() => {
        // If the socket hasn't yet initialized, return. Once it does, this will pass
        if (!socket) {
            return;
        }
        // If we're not in offline mode, set up the socket listeners
        else {
            // If we have no breaks to use, we enable it:
            if (gameSettings.noBreaks != 0) {
                gameRef.current.enableNoBreaks();
            }
            else {
                gameRef.current.disableNoBreaks();
            }

            // Only listen for 'applyMove' if we're playing online
            if (type != "offline") {
                // When a move is applied by the other player.
                socket.on('applyMove', ({ move, user }) => {
                    // If it's meant for this socket
                    if (socket.id == user) {
                        // Apply the move:
                        gameRef.current?.applyMove(move);
                    }
                });
            }

            // Update game state differently depending on if we're playing online or offline
            if (type == "offline") {
                socket.on('gameState', (gameState) => {
                    setLinkerMove(gameState.turn == "linker");
                    setBreaks(gameState.remainingBreaks);
                    setNoBreaks(gameState.noBreaks[gameState.turn]);
                    if (gameState.noBreaks[gameState.turn] == 0) { // If no breaks = 0, disable the option
                        gameRef.current.disableNoBreaks();
                    }
                    else {
                        gameRef.current.enableNoBreaks();
                    }
                });
            }
            else {
                socket.on('gameState', (gameState) => {
                    setLinkerMove((gameState.turn == type) === isLinker);
                    setMyMove(gameState.turn == type); // Set if it's our turn
                    setBreaks(gameState.remainingBreaks);
                    setNoBreaks(gameState.noBreaks[type]);
                    if (!gameState.noBreaks[type]) { // If no breaks = 0, disable the option
                        gameRef.current.disableNoBreaks();
                    }
                });
            }

            // When we're notified the game is over
            socket.on('gameOver', async () => {
                // Disable the grid
                gameRef.current.disable();

                var dtCodes = gameRef.current.identifyKnots();
                var linkerWon = dtCodes.length > 1; // Linker has won if this is true

                // Prepare the winner object for offline
                const winner = {
                    player1: (gameSettings.player1 === "linker") === linkerWon,
                    linker: linkerWon
                };

                // If we're the winner (or in offline mode), emit the result
                if (type === "offline" || linkerWon === isLinker) {
                    socket.emit('result', {
                        gameCode: gameCode,
                        winner: type === "offline" ? winner : { player1: gameSettings.player1 == type, linker: isLinker },
                        dtCodes: dtCodes.map(dtCodeObj => dtCodeObj.dtCode) // Add dtCodes to the emit payload
                    });
                }

                // Set the vars for the game end screen to appear
                setDTCodes(await handleFormatDTCodes(dtCodes));
                setMovesPlayed(handleFormatMoves(gameRef.current.getAllMoves()));
                setIsWinner(linkerWon === isLinker);
                setLinkerWins(linkerWon);
                setIsGameOver(true);
            });

            // Update the scoreboard info upon receiving it.
            socket.on('scoreboard', (scoreboard) => {
                setScoreboard(scoreboard);
            });

            // When the game restarts
            socket.on('restartGame', () => {
                // Reset the game end screen vars
                setDTCodes(null);
                setMovesPlayed(null);
                setIsWinner(false);
                setLinkerWins(false);
                setIsGameOver(false);

                // Restart the game
                gameRef.current.restartGame();
            });

            // Server tells us to return to the settings page
            socket.on('backToSettings', () => {
                returningToChangeSettings = true;

                let pageType = type;
                if (pageType == "opponent") {
                    pageType = "join";
                }

                navigate(`/linker_vs_knotter_${pageType}page`, { state: { givenGameCode: gameCode } });
            });

            // Server disconnect event occurs
            socket.on('disconnect', () => {
                setErrorMessage("The connection to the server has been interrupted; the server may be offline. Please try connecting to another game.");
            });

            // Opponent disconnect event occurs
            socket.on('opponentDisconnect', () => {
                setErrorMessage("The opponent has left the game unexpectedly. The game has been terminated.");
            });

            // Host disconnect event occurs
            socket.on('hostDisconnect', () => {
                setErrorMessage("The host has left the game unexpectedly. The game has been terminated.");
            });

            // Alert of any errors that come from the server
            socket.on('error', (message) => {
                alert("ERROR: " + message);
            });

            return () => {
                if (!returningToChangeSettings) {
                    socket.emit('playerDisconnect', "Leaving page.");
                }
                socket.off();
            }
        }
    }, [socket]);

    // When myMove changes, enable the grid if it's our turn, and disable otherwise.
    // Note: Offline mode only has the grid enabled
    useEffect(() => {
        if (type != "offline") {
            myMove ? gameRef.current.enable() : gameRef.current.disable();
        }
    }, [myMove]);

    /**
     * Callback function we use to know what move was applied.
     * 
     * @param {Number} x x coordinate (column)
     * @param {Number} y y coordinate (row)
     * @param {Number} type type of break. 0 = NO_BREAK, 1 = VERT_BREAK, 2 = HORIZ_BREAK
     */
    const breakCallback = (x, y, breakType) => {
        // Send the move over to the game
        const move =
        {
            x: x,
            y: y,
            type: breakType
        }
        if (type == "offline") {
            socket.emit('applyMoveOffline', { move: move, gameCode: gameCode });
        }
        else {
            socket.emit('applyMoveOnline', { move: move, gameCode: gameCode });
        }
    }

    /**
     * Restarts the game using the same game settings
     */
    const restartGame = () => {
        // Tell the server to restart the game
        socket.emit('restartGame', gameCode);
    }

    /**
     * Tells the server to relocate everyone to the settings page.
     */
    const navigateToSettingsPage = () => {
        // Reset the game end screen vars
        setDTCodes(null);
        setMovesPlayed(null);
        setIsWinner(false);
        setLinkerWins(false);
        setIsGameOver(false);

        // Tell the server to go back to the settings page
        socket.emit('backToSettings', gameCode);
    }

    /**
     * Navigate to the LvK landing page.
     */
    const navigateToHomePage = () => {
        // Reset the game end screen vars
        setDTCodes(null);
        setMovesPlayed(null);
        setIsWinner(false);
        setLinkerWins(false);
        setIsGameOver(false);

        // Disconnect and navigate
        socket.emit('playerDisconnect', "Returning to home page.");
        navigate('/linker_vs_knotter_welcomepage');
    }

    /**
     * Fetches the information of all identified knots in the game, using the DT codes returned by the
     * `identifyKnots` method of the `CelticKnotGame` class. If the DT code is invalid, it will attempt to
     * fetch the information again by negating all the numbers in the DT code. If the DT code is still invalid,
     * it will set the knot name to 'N/A' and the knot atlas URL to a link that allows the user to manually
     * search for the knot on the KnotInfo database.
     *
     * @returns {Promise<string>} A formatted string summarizing all the knot information
     */
    const handleFormatDTCodes = async (dtCodes) => {
        try {
            const DT_CODES = dtCodes;
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
                    console.warn(`Error fetching data for DT Code ${dtCodeValue}.`);
                    return {
                        ...dtCodeObj,
                        knotName: "N/A",
                        knotAtlasURL: `https://knotinfo.math.indiana.edu/homelinks/knotfinder.php?DT=${dtCodeArray.join("+")}`,
                        equicable: false,
                    };
                }
            });

            return await Promise.all(knotPromises);
        } catch (error) {
            console.error("Unexpected error in handleIdentifyKnots:", error);
        }
    };

    /**
     * Formats the moves played on the board to work properly w/ displays.
     * 
     * @returns {string} Formatted list of moves.
     */
    const handleFormatMoves = (moves) => {
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

        return formattedMoves;
    }

    return (
        <div className="lvk-App">
            <div className="page-container">
                <div id="borderimg">
                    {/* Intentionally left empty for background image */}
                </div>
                <div className="game-container">
                    <CelticKnotBoard
                        ref={gameRef}
                        gridWidth={gameSettings.width}
                        gridHeight={gameSettings.height}
                        gameType={1}
                        colorComponent={gameSettings.colorComponent == 'yes'}
                        callback={breakCallback} />
                </div>
                <div className="gameStatus-container">
                    <h1>Game Status:</h1>
                    <h2>Current Move:</h2>
                    <div className={`displayBox ${type == "offline" ? "currMove_gray" : myMove ? "currMove_green" : "currMove_red"}`}>
                        {linkerMove ? "Linker" : "Knotter"}
                    </div>
                    <h2>Remaining Breaks:</h2>
                    <div className={`displayBox ${breaks > 0 ? "breakCount" : "emptyBreakCount"}`}>
                        {breaks}
                    </div>
                    <h2>"No Breaks" Remaining to Use:</h2>
                    <div className={`displayBox ${noBreaks > 0 ? "breakCount" : "emptyBreakCount"}`}>
                        {noBreaks}
                    </div>
                    <span className="tooltip" title={`Hover over any crossing and click to open the Break Selection Menu!
                        For more information on how to use the Celtic knot grid, please navigate to the Help Page`}>
                        <span className="question-mark-circle">?</span>
                    </span>
                </div>
            </div>
            <Scoreboard
                p1Linker={scoreboard.p1Linker}
                p2Linker={scoreboard.p2Linker}
                p1Knotter={scoreboard.p1Knotter}
                p2Knotter={scoreboard.p2Knotter} />
            {isGameOver && (
                <GameEndScreen
                    classColor={`game-end-screen_${type == "offline" ? "gray" : isWinner ? "green" : "red"}`}
                    type={type}
                    isLinker={isLinker}
                    linkerWins={linkerWins}
                    dtCodes={dtCodes}
                    movesPlayed={movesPlayed}
                    restartGame={restartGame}
                    navigateToSettingsPage={navigateToSettingsPage}
                    navigateToHomePage={navigateToHomePage}
                    game={gameRef.current} />
            )}
            {errorMessage && (
                <ErrorScreen
                    message={errorMessage}
                    navigateToHomePage={navigateToHomePage} />
            )}
        </div>
    );
}

export default LvkGameplayPage;
