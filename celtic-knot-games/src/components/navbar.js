import React, { useState } from 'react';
import '../css/navbar.css'; // Adjust path to the css folder
import logo from '../Visual assets/celticknotMC.jpg';
import trialsOfKnotting from '../Visual assets/Trials of knotting.png';
import linkerVsKnotter from '../Visual assets/linkervsknotter.png';
import freestyleLogo from '../Visual assets/freestyle logo.png';
import adminLogo from '../Visual assets/admin logo.png';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

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
          <a href="#">
            <img src={trialsOfKnotting} alt="Trials of Knotting" />
            <span>Trials of Knotting</span>
          </a>
        </li>
        <li>
          <a href="#">
            <img src={linkerVsKnotter} alt="Linker v Knotter" />
            <span>Linker v Knotter</span>
          </a>
        </li>
        <li>
          <a href="./freestyle_welcomepage">
            <img src={freestyleLogo} alt="Freestyle Game" />
            <span>Freestyle Game</span>
          </a>
        </li>
        <li id="admin-portal-li">
          <a href="./admin-portal">
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
