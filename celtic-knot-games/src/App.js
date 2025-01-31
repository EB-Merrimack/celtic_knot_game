import React from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import './css/styles.css';
import Navbar from './components/navbar';
import AdminPortal from './pages/adminportal'; 
import FreestyleWelcomePage from './pages/freestyle_welcomepage';

function App() {
    return (
        <Router>
            <div className="App">
                <Navbar />
                <Switch>
                    <Route exact path="/" component={() => (
                        <div id="borderimg">
                            <h1>Celtic Knotter</h1>
                            <p>This is where the Game will be</p>
                        </div>
                    )} />
                    <Route path="/admin-portal" component={AdminPortal} />
                    <Route path="/freestyle_welcomepage" component={FreestyleWelcomePage} />

                    <Redirect to="/" /> {/* Redirect any unknown paths to the main page */}
                </Switch>
            </div>
        </Router>
    );
}

export default App;