import React, { useState, useEffect } from 'react';
import '../css/AdminPortalPage.css';

/**
 * AdminPortalPage is a React component that displays the admin portal interface.
 * It fetches and displays game records and global statistics, and provides the 
 * functionality to export this data as a CSV file.
 * 
 * - Fetches game records and global statistics from the server.
 * - Determines the winner and player for each game record based on win counts.
 * - Displays game records and global statistics in a tabular format.
 * - Allows exporting the displayed data as a CSV file.
 *
 * Uses:
 * - useState and useEffect hooks for managing state and side-effects.
 * - fetch API to retrieve data from server endpoints.
 * - Blob and URL APIs to create and download CSV files.
 */

const AdminPortalPage = () => {
  const [records, setRecords] = useState([]);
  const [globalStats, setGlobalStats] = useState({});

  useEffect(() => {
    fetchRecords();
    fetchGlobalStats();
  }, []);

  // Fetch game records
  const fetchRecords = async () => {
    try {
      const response = await fetch('/api/records');
      const data = await response.json();
      setRecords(data);
    } catch (error) {
      console.error('Error fetching records:', error);
    }
  };

  // Fetch global statistics
  const fetchGlobalStats = async () => {
    try {
      const response = await fetch('/api/win-counts');
      const data = await response.json();
      setGlobalStats(data);
    } catch (error) {
      console.error('Error fetching global stats:', error);
    }
  };

  // Determine winner and which player won
  const determineWinner = (record) => {
    if (record.linker_wins_playerone > 0 || record.linker_wins_playertwo > 0) {
      if (record.linker_wins_playerone > 0) {
        return { winner: "Linker", player: "Player One" };
      } else {
        return { winner: "Linker", player: "Player Two" };
      }
    } else if (record.knotter_wins_playerone > 0 || record.knotter_wins_playertwo > 0) {
      if (record.knotter_wins_playerone > 0) {
        return { winner: "Knotter", player: "Player One" };
      } else {
        return { winner: "Knotter", player: "Player Two" };
      }
    } else {
      return { winner: "Draw", player: "N/A" };  // In case there's a draw
    }
  };

  // Export data as CSV
  const exportCSV = () => {
    // CSV for game records
    const headers = ['Gamekey,DT Code,Winner,Player\n'];
    const recordRows = records
      .map((record) => {
        const { winner, player } = determineWinner(record);
        return `${record.Gamekey},${record.DT_Code},${winner},${player}`;
      })
      .join('\n');

    // CSV for global statistics
    const globalStatsHeaders = ['\nTotal Games,Linker Wins (Player One),Linker Wins (Player Two),Knotter Wins (Player One),Knotter Wins (Player Two)\n'];
    const globalStatsRow = [
      globalStats.total_games,
      globalStats.linker_wins_playerone,
      globalStats.linker_wins_playertwo,
      globalStats.knotter_wins_playerone,
      globalStats.knotter_wins_playertwo,
    ].join(',');

    const csvContent = headers + recordRows + globalStatsHeaders + globalStatsRow;

    // Create CSV file and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'admin_portal_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="adminpage-borderimg">
      <div className="adminpage-container">
        <h1 className="adminpage-title">Admin Portal</h1>
        <button className="adminpage-button" onClick={exportCSV}>
          Export as CSV
        </button>

        <h2 className="adminpage-subtitle">Knot VS. Linker Database</h2>
        <div className="adminpage-table-container">
          <table className="adminpage-table">
            <thead>
              <tr>
                <th>Gamekey</th>
                <th>DT Code</th>
                <th>Winner</th>
                <th>Player</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => {
                const { winner, player } = determineWinner(record);
                return (
                  <tr key={record.Gamekey}>
                    <td>{record.Gamekey}</td>
                    <td>{record.DT_Code}</td>
                    <td>{winner}</td>
                    <td>{player}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <h2 className="adminpage-subtitle">Global Win Counts</h2>
        <div className="adminpage-table-container">
          <table className="adminpage-table">
            <thead>
              <tr>
                <th>Total Games</th>
                <th>Linker Wins (Player One)</th>
                <th>Linker Wins (Player Two)</th>
                <th>Knotter Wins (Player One)</th>
                <th>Knotter Wins (Player Two)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{globalStats.total_games}</td>
                <td>{globalStats.linker_wins_playerone}</td>
                <td>{globalStats.linker_wins_playertwo}</td>
                <td>{globalStats.knotter_wins_playerone}</td>
                <td>{globalStats.knotter_wins_playertwo}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPortalPage;
