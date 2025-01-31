import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './css/styles.css';
import Navbar from './components/navbar';
import AdminPortal from './pages/adminportal'; 
import FreestyleWelcomePage from './pages/freestyle_welcomepage';
import Welcomepage from './pages/Welcomepage';
import FreestyleGamePage from './pages/freestyle_gamepage';
import LvkWelcomePage from './pages/linker_vs_knotter_welcomepage';       
import LvkJoinPage from './pages/linker_vs_knotter_joinpage';
import LvkHostPage from './pages/linker_vs_knotter_hostpage';
import LvkGameplayPage from './pages/linker_vs_knotter_gameplaypage';
import LvkOfflinePage from './pages/linker_vs_knotter_offlinepage';
import AdminPortalPage from './pages/adminpage';
import Helppage from './pages/help';

/**
 * The main application component, which sets up the routes for the different pages.
 * 
 * It contains the following routes:
 * - "/" : The main welcome page.
 * - "/admin-portal" : The admin portal page.
 * - "/freestyle_welcomepage" : The welcome page for the freestyle game.
 * - "/freestyle_gamepage" : The game page for the freestyle game.
 * - "/linker_vs_knotter_hostpage" : The host page for the linker vs. knotter game.
 * - "/linker_vs_knotter_welcomepage" : The welcome page for the linker vs. knotter game.
 * - "/linker_vs_knotter_joinpage" : The join page for the linker vs. knotter game.
 * - "/linker_vs_knotter_gameplaypage" : The game page for the linker vs. knotter game.
 * - "/linker_vs_knotter_offlinepage" : The offline page for the linker vs. knotter game.
 * - "/AdminPortalPage" : The admin portal page.
 * - "*" : Any unknown paths will be redirected to the main page.
 */
function App() {
    return (
        <Router>
            <div className="App">
                <Navbar />
                <Routes>
                    <Route exact path="/" element={<Welcomepage />} />
                    <Route path="/admin-portal" element={<AdminPortal />} />
                    <Route path="/freestyle_welcomepage" element={<FreestyleWelcomePage />} />
                    <Route path="/freestyle_gamepage" element={<FreestyleGamePage />} />
                    <Route path="/linker_vs_knotter_hostpage" element={<LvkHostPage />} />
                    <Route path="/linker_vs_knotter_welcomepage" element={<LvkWelcomePage />} />
                    <Route path="/linker_vs_knotter_joinpage" element={<LvkJoinPage />} />
                    <Route path="/linker_vs_knotter_gameplaypage" element={<LvkGameplayPage />} />
                    <Route path="/linker_vs_knotter_offlinepage" element={<LvkOfflinePage />} />
                    <Route path="/AdminPortalPage" element={<AdminPortalPage />} />
                    <Route path="/help" element={<Helppage />} />
                    <Route path="*" element={<Navigate to="/" />} /> {/* Redirect any unknown paths to the main page */}
                </Routes>
            </div>
        </Router>
    );
}

export default App;
