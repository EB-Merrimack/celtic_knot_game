import "../css/scoreboard.css"; // style sheet

/**
 * This component renders the scoreboard (tracking win counts) a Liner vs. Knotter game.
 * @returns {JSX.Element} - The scoreboard component
 */
const Scoreboard = ({ p1Linker, p2Linker, p1Knotter, p2Knotter }) => {
    return (
        <div className="scoreboard-container">
            <h2 className="scoreboard-title">Linker vs. Knotter</h2>
            <h3 className="scoreboard-subtitle">Win Count</h3>

            <div className="scoreboard-section">
                <h4 className="scoreboard-section-title">Linker</h4>
                <div className="scoreboard-players">
                    <div className="scoreboard-player">
                        <h4>Player 1</h4>
                        <p>{p1Linker}</p>
                    </div>
                    <div className="scoreboard-player">
                        <h4>Player 2</h4>
                        <p>{p2Linker}</p>
                    </div>
                </div>
            </div>

            <div className="scoreboard-section">
                <h4 className="scoreboard-section-title">Knotter</h4>
                <div className="scoreboard-players">
                    <div className="scoreboard-player">
                        <h4>Player 1</h4>
                        <p>{p1Knotter}</p>
                    </div>
                    <div className="scoreboard-player">
                        <h4>Player 2</h4>
                        <p>{p2Knotter}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Scoreboard;