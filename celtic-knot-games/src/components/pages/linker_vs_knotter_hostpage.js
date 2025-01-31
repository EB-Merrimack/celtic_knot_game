import React, { useState, useEffect, useRef } from "react";
import "../css/lvkhostpage.css"; // style sheet
import "../css/lvkgeneralpage.css"; // style sheet
import { useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from "../components/socketProvider";
import Scoreboard from "../components/scoreboard";
import { Tooltip as ReactTooltip } from "react-tooltip";

/**
 * This component renders a page for hosting a Liner vs. Knotter game, with options to set game parameters and manage connections.
 * @returns {JSX.Element} - The host game page component
 */
function LvkHostPage() {
  // Fetch the params from the previous page
  const location = useLocation();
  const givenGameCode = location.state?.givenGameCode;

  const [gameCode, setGameCode] = useState(givenGameCode ? givenGameCode : "");

  const [opponentStatus, setOpponentStatus] = useState(false);
  const [player1, setPlayer1] = useState("host");
  const [linker, setLinker] = useState("host");
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
  const gameCodeRef = useRef(null); // Reference used to pass vals down to next page.
  const gameSettingsRef = useRef(null); // Reference used to pass vals down to next page.

  // Scoreboard stats
  const [scoreboard, setScoreboard] = useState({ p1Linker: 0, p2Linker: 0, p1Knotter: 0, p2Knotter: 0 })
  const scoreboardRef = useRef(scoreboard); // Used to pass vals down

  var goingToGameplayPage = false;
  const socket = useSocket();
  const navigate = useNavigate();

  // Function to generate random game key
  const generateGameKey = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';
    for (let i = 0; i < 8; i++) {
      key += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return key;
  };

  // Sets up the socket listeners
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
    // Otherwise, we want to create a game.
    else {
      const newGameCode = generateGameKey();
      setGameCode(newGameCode);
      gameCodeRef.current = newGameCode;

      // Create the game.
      var gameSettings = {
        player1,
        linker,
        width,
        height,
        colorComponent,
        breaks,
        noBreaks
      };
      socket.emit("createGame", {
        gameCode: newGameCode,
        settings: gameSettings,
        type: "online"
      });
      gameSettingsRef.current = gameSettings;
    }

    // Socket listeners
    socket.on("gameStatus", (status) => {
      setOpponentStatus(status);
    });

    socket.on('scoreboard', (scoreboard) => {
      setScoreboard(scoreboard);
    });

    socket.on("startGame", navigateToGameplayPage);

    socket.on('error', (message) => { // In-case of errors. There should be none for this page.
      alert("ERROR: " + message);
      if (message == "A game with this game code already exists. Redirecting to landing page...") {
        socket.emit('playerDisconnect', "Back button clicked.");
        navigate('/linker_vs_knotter_welcomepage');
      }
    });

    socket.on("opponentDisconnect", () => {
      setOpponentStatus(false);
    });

    socket.on('disconnect', () => {
      setOpponentStatus(false);
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
        linker,
        width,
        height,
        colorComponent,
        breaks,
        noBreaks
      };
      socket.emit("updateGameSettings", {
        gameCode,
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
  }, [player1, linker, width, height, colorComponent, breaks, noBreaks]);

  // Whenever scoreboard updates, update the reference
  useEffect(() => {
    scoreboardRef.current = scoreboard;
  }, [scoreboard]);

  /**
   * Handles the change of the player 1 dropdown option.
   * Updates the state with the new player 1 value.
   * @param {Event} e - The change event.
   */
  const handlePlayer1Change = (e) => {
    setPlayer1(e.target.value);
  };

  /**
   * Handles the change of the linker dropdown option.
   * Updates the state with the new linker value.
   * @param {Event} e - The change event.
   */
  const handleLinkerChange = (e) => {
    setLinker(e.target.value);
  };

  /**
   * Emits a 'playerDisconnected' event and navigates back to the welcome page.
   */

  const goBack = () => {
    socket.emit('playerDisconnect', "Returning to welcome page.");
    navigate("/linker_vs_knotter_welcomepage");
  };

  /**
   * Navigates to the gameplay page for the host.
   * @param {Object} state - The state to pass to the page.
   * @prop {string} type - Always "host".
   * @prop {string} gameCode - The game code for this game.
   * @prop {Object} gameSettings - The game settings.
   */
  const navigateToGameplayPage = () => {
    goingToGameplayPage = true;
    navigate('/linker_vs_knotter_gameplaypage', { state: { type: "host", gameCode: gameCodeRef.current, gameSettings: gameSettingsRef.current, initScoreboard: scoreboardRef.current } });  // navigate to the gameplay page.
  };

  /**
   * Emits a 'startGame' event to the server to start the game
   * once the opponent has joined and the host has clicked the
   * play button.
   */
  const startGame = () => {
    socket.emit("startGame", gameCode);
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
                <h1>Host a Game</h1>
                <div className="game-code-container">
                  <p> <span className="tooltip" title="Provide this code to your opponent"> <span className="question-mark-circle">?</span>
                  </span>Game Code: <span className="game-code">{gameCode}</span>

                  </p>

                </div>
                <div className="status-container">
                  <p>Opponent Status: <span className={`status ${opponentStatus ? 'connected' : 'disconnected'}`}>{opponentStatus ? 'Connected' : 'Not Connected'}</span></p>
                </div>
                {opponentStatus && (
                  <button className="start-game-button" onClick={startGame}>
                    Play
                  </button>
                )}
                <div className="playoptions-container">
                  <h3>Game Options</h3>
                  <div className="option">
                    <label>Player 1 (Who Goes First):</label><br />
                    <label>
                      <input
                        type="radio"
                        name="player1"
                        value="host"
                        checked={player1 === "host"}
                        onChange={handlePlayer1Change}
                      /> Host
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="player1"
                        value="opponent"
                        checked={player1 === "opponent"}
                        onChange={handlePlayer1Change}
                      /> Opponent
                    </label>
                  </div>
                  <div className="option">
                    <span className="tooltip" title="The linker's objective is to end the game with multiple components (or continous strings) on the grid.">
                      <span className="question-mark-circle">?</span>
                    </span>
                    <label>Linker (Who Plays as the Linker):</label>
                    <br />
                    <label>
                      <input
                        type="radio"
                        name="linker"
                        value="host"
                        checked={linker === "host"}
                        onChange={handleLinkerChange}
                      /> Host
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="linker"
                        value="opponent"
                        checked={linker === "opponent"}
                        onChange={handleLinkerChange}
                      /> Opponent
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
                    <label>Color Components:</label><br />
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
                      <span className="tooltip" title="A component is an individual knot on the board"> <span className="question-mark-circle">?</span>
                      </span>
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
                    <span className="tooltip" title="Breaks are special moves that allow you to strategically manipulate the board. Use them wisely!"><span className="question-mark-circle">?</span></span>
                  </div>
                  <div className="option">
                    <label>No Breaks:</label>
                    <select
                      value={noBreaks}
                      onChange={(e) => setNoBreaks(e.target.value)}
                    >
                      {noBreakOptions}
                    </select>
                    <span className="tooltip" title="No Breaks are additional settings for gameplay. Adjust according to your strategy!">
                      <span className="question-mark-circle">?</span> </span>
                    <ReactTooltip id="component-tooltip" />


                  </div>
                </div>
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

export default LvkHostPage;
