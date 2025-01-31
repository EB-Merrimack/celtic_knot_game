import React, { useState, useEffect, useRef } from "react";
import "../css/lvkjoinpage.css"; // style sheet
import "../css/lvkgeneralpage.css"; // style sheet
import { useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from "../components/socketProvider";
import Scoreboard from "../components/scoreboard";

/**
 * This component renders a page for joining a Liner vs. Knotter game, allowing users to enter a game code and connect.
 * @returns {JSX.Element} - The join game page component
 */
function LvkJoinPage() {
  // Fetch the params from the previous page
  const location = useLocation();
  const givenGameCode = location.state?.givenGameCode;

  const [gameCode, setGameCode] = useState(givenGameCode ? givenGameCode : "");
  const [gameSettings, setGameSettings] = useState(null);
  const [status, setStatus] = useState("Not Connected");
  const [errorMessage, setErrorMessage] = useState("");

  // Scoreboard stats
  const [scoreboard, setScoreboard] = useState({ p1Linker: 0, p2Linker: 0, p1Knotter: 0, p2Knotter: 0 })
  const scoreboardRef = useRef(scoreboard); // Used to pass vals down

  var goingToGameplayPage = false;
  const gameSettingsRef = useRef(null); // Reference used to pass vals down to next page.
  const gameCodeRef = useRef(null); // Reference used to pass vals down to next page.
  const socket = useSocket();
  const navigate = useNavigate();
  var errorTimeoutId = null; // Tracks the timeout of the error message.

  // Initialize socket connection when component mounts
  useEffect(() => {
    // If the socket hasn't yet initialized, return. Once it does, this will pass
    if (!socket) {
      return;
    }

    // If we're given a game code, just fetch the settings for this game
    if (givenGameCode) {
      socket.emit('getGameSettings', givenGameCode);
      gameCodeRef.current = givenGameCode;
    }

    // Set up the socket listeners
    socket.on("gameSettings", (settings) => {
      if (settings) {
        setGameSettings(settings);
      }
      else {
        handleSetErrorMessage("ERROR: The game settings could not be retrieved correctly.", 7.5);
      }
    });

    socket.on('scoreboard', (scoreboard) => {
      setScoreboard(scoreboard);
    });

    socket.on("gameStatus", (status) => {
      setStatus(status ? "Connected" : "Not Connected");
    });

    socket.on("startGame", navigateToGameplayPage);

    socket.on("error", (message) => {
      handleSetErrorMessage("ERROR: " + message, 7.5);
    });

    socket.on('disconnect', () => {
      setStatus("Not Connected");
      handleSetErrorMessage("ERROR: The server appears to be offline at the moment. Please try again later.", 10);
    });

    socket.on("hostDisconnect", () => {
      disconnect(socket);
      handleSetErrorMessage("The host has disconnected. Please try joining another game.", 10);
    });

    return () => {
      if (!goingToGameplayPage) {
        socket.emit('playerDisconnect', "Leaving page.");
      }
      socket.off(); // Remove all event listeners. They must be reconfigured when entering the gameplay page
    }
  }, [socket]); // Empty array ensures it runs only once, when the component mounts

  // Whenever one of them updates, update the refs. Refs are used for moving to the next page
  useEffect(() => {
    gameSettingsRef.current = gameSettings;
    gameCodeRef.current = gameCode;
  }, [gameSettings, gameCode]);

  // Whenever scoreboard updates, update the reference
  useEffect(() => {
    scoreboardRef.current = scoreboard;
  }, [scoreboard]);


  const handleCodeChange = (e) => {
    setGameCode(e.target.value.toUpperCase());
  };

  /**
   * Handles the button press for connecting to a lobby.
   */
  const connectToGame = () => {
    if (gameCode.length === 8) { // If the game code is the proper length, attempt to join
      socket.emit("joinGame", gameCode);
      setStatus("Connecting...");
    }
    else {
      setStatus(status == "Connected" ? "Connected" : "Not Connected");
    }
  };

  /**
   * Disconnects from the game, emitting a playerDisconnect event to the server, 
   * and sets the local state to indicate that the game is not connected.
   * @param {Socket} socket - The socket to disconnect from the game
   */
  const disconnect = (socket) => {
    socket.emit("playerDisconnect", null);
    setStatus("Not Connected");
    setGameSettings(null);
  };

  const goBack = () => {
    socket.emit('playerDisconnect', "Returning to welcome page.");
    navigate("/linker_vs_knotter_welcomepage");
  };

  // Handles setting an error message by including a timeout on the error
  const handleSetErrorMessage = (message, time) => {
    setErrorMessage(message);
    if (errorTimeoutId) {
      clearTimeout(errorTimeoutId);
    }
    errorTimeoutId = setTimeout(setErrorMessage, time * 1000, ""); // Set the error message back to invisible after {time} seconds
  }

/**
 * Navigates to the gameplay page with the current game settings and code.
 * The page state is set to "opponent" for the joining player.
 */

  const navigateToGameplayPage = () => {
    goingToGameplayPage = true;
    navigate('/linker_vs_knotter_gameplaypage', { state: { type: "opponent", gameCode: gameCodeRef.current, gameSettings: gameSettingsRef.current, initScoreboard: scoreboardRef.current } }); // type = "host" / "opponent" / "offline"
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
            <div className="lvkjoincontainer">
              <div className="lvkjoinext">
                <h1>Join a Game</h1>
                <div className="game-code-input">
                  <label>Enter Game Code:</label>
                  <input
                    type="text"
                    value={gameCode}
                    onChange={handleCodeChange}
                    maxLength="8"
                  />
                </div>
                {gameSettings && (
                  <div className="game-settings">
                    <h3>Game Settings</h3>
                    <p>Player 1 (Who Goes First): {gameSettings.player1}</p>
                    <p>Linker: {gameSettings.linker}</p>
                    <p>Grid Width: {gameSettings.width}</p>
                    <p>Grid Height: {gameSettings.height}</p>
                    <p>Color Components: {gameSettings.colorComponent}</p>
                    <p>Breaks: {gameSettings.breaks}</p>
                    <p>No Breaks: {gameSettings.noBreaks}</p>
                  </div>
                )}
                <div className="status-container">
                  <p>Status: <span className={`status ${status === 'Connected' ? 'connected' : 'disconnected'}`}>{status}</span></p>
                </div>
                {errorMessage && (
                  <div className="error-message">
                    <p>{errorMessage}</p>
                  </div>
                )}
                {status !== "Connected" && (
                  <button className="connect-button" onClick={connectToGame} disabled={gameCode.length !== 8}>
                    Connect
                  </button>
                )}
                {status === "Connected" && (
                  <button className="connect-button" onClick={() => /*navigateToGameplayPage()*/disconnect(socket)/**/}>
                    Disconnect
                  </button>
                )}
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

export default LvkJoinPage;
