import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import '../css/styles.css'; // Adjust path to the css folder
import App from '../App'; // Update the path according to the structure

ReactDOM.render(
    <React.StrictMode>
        <Router>
            <App />
        </Router>
    </React.StrictMode>,
    document.getElementById('root')
);
