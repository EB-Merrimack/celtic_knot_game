import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/navbar.css'; // Adjust path to the css folder
import logo from '../Visual assets/celticknotMC.jpg';
import trialsOfKnotting from '../Visual assets/Trials of knotting.png';
import linkerVsKnotter from '../Visual assets/linkervsknotter.png';
import freestyleLogo from '../Visual assets/freestyle logo.png';
import adminLogo from '../Visual assets/admin logo.png';
import helpicon from '../Visual assets/help.jpg';

/**
 * The Navbar component renders a navigation bar at the top of the screen.
 * It provides a list of links to the different pages of the application.
 * The navbar is responsive and will hide and show its menu based on the
 * screen size. The menu can also be toggled by clicking on the hamburger
 * icon in the top right corner of the navbar.
 * @returns {JSX.Element} The rendered navbar.
 */

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  /**
   * Toggles the navbar menu on or off by setting the value of menuOpen to its
   * negation. If the menu is currently open, it will close the menu, and if the
   * menu is currently closed, it will open the menu.
   */
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  /**
   * Closes the menu by setting menuOpen to false.
   */

  const closeMenu = () => {
    setMenuOpen(false);
  };

  /**
   * Navigates to a given location (loc) using the react-router-dom navigate hook.
   * @param {string} loc The location to navigate to.
   */
  const navigateTo = (loc) => {
    console.log(loc);
    navigate(loc);
  }

  return (
    <nav className="navbar">
      <div className="logo">
        <a href="/">
          <img src={logo} alt="Logo" />
        </a>
      </div>
      <div className="menu-toggle" id="menu-toggle" onClick={toggleMenu}>
        {/* Hamburger Icon */}
        <div className="bar"></div>
        <div className="bar"></div>
        <div class="bar"></div>
      </div>
      <ul className={`menu ${menuOpen ? 'show' : ''}`} id="menu">
       
        <li>
          <a onClick={(e) => navigateTo("./linker_vs_knotter_welcomepage")}>
            <img src={linkerVsKnotter} alt="Linker v Knotter" />
            <span>Linker v Knotter</span>
          </a>
        </li>
        <li>
          <a onClick={(e) => navigateTo("./freestyle_welcomepage")}>
            <img src={freestyleLogo} alt="Freestyle Game" />
            <span>Freestyle Game</span>
          </a>
        </li>
        <li id="help">
          <a onClick={(e) => navigateTo("./help")}>
            <img src={helpicon} alt="help icon" />
            <span>User Manual</span>
            
          </a>
        </li>
        <li id="admin-portal-li">
          <a onClick={(e) => navigateTo("./admin-portal")}>
            <img src={adminLogo} alt="Admin Portal" />
            
          </a>
        </li>
        <li id="close-menu-li">
          <button id="close-menu" onClick={closeMenu}>Close</button>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
