import React from "react";
import { Tooltip as ReactTooltip } from 'react-tooltip';
import "../css/lvkwelcomepage.css"; // style sheet
import { useNavigate } from "react-router-dom";

/**
 * This component renders a welcome page for the Liner vs. Knotter game, with buttons for selecting the game mode (host, join, or offline) and a background image.
 * @returns {JSX.Element} - The welcome page component
 */
function LvkWelcomePage() {
  const navigate = useNavigate();

  /**
   * Navigates to the specified path.
   * @param {string} path - The path to navigate to.
   */
  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="App">
      <header className="App-header">
        <div id="borderimg">
          {/* Intentionally left empty for background image */}
        </div>
        <div className="lvkscroll">
          <div className="lvktext">
            <h1 className="welcome-text">Linker vs. Knotter</h1>
            <p>
              Linker vs. Knotter is a dynamic, head-to-head strategy game where you will take on one of two roles: the Linker or the Knotter. As the Linker, your goal is to strategically manipulate the Celtic knot board to split it into two distinct components, or links. On the other hand, the Knotter must work to unify the board as a single, unified component—a knot. Each move counts as you navigate this intricate dance between division and unity, challenging your opponent in a battle of wit and strategy.
            </p>
            <div className="button-container">
              <button 
                className="option-button" 
                onClick={() => handleNavigation('/linker_vs_knotter_hostpage')}
                data-tooltip-id="host-tooltip" 
                data-tooltip-content="Start a new game and host a session."
              >
                Host
              </button>
              <button 
                className="option-button" 
                onClick={() => handleNavigation('/linker_vs_knotter_joinpage')}
                data-tooltip-id="join-tooltip" 
                data-tooltip-content="Join an existing game session."
              >
                Join
              </button>
              <button 
                className="option-button" 
                onClick={() => handleNavigation('/linker_vs_knotter_offlinepage')}
                data-tooltip-id="offline-tooltip" 
                data-tooltip-content="Play the game offline through one device."
              >
                Offline
              </button>
              <ReactTooltip id="host-tooltip" />
              <ReactTooltip id="join-tooltip" />
              <ReactTooltip id="offline-tooltip" />
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}

export default LvkWelcomePage;
