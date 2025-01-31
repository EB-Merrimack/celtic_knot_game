/**
 * Game script of the celtic knot arcade.
 * 
 * Please note, this is a THREE.js product. Licensing for THREE.js is included as follows:
 * 
 * The MIT License
 * 
 * Copyright © 2010-2024 three.js authors
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 * @author Derek Costello
 * Inspiration for grid construction from: https://w-shadow.com/celtic-knots/
 */

// COMMENT FOR TESTING
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js";
import { CSS2DRenderer } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/renderers/CSS2DRenderer.js';
import Grid from "./grid.js"

export default class Game {
  /**
   * Constructor class that initializes a game instance.
   * 
   * @param {Number} gridWidth Grid width
   * @param {Number} gridHeight Grid height
   * @param {Number} gameType Type of game. 0 = FREESTYLE, 1 = LVK
   * @param {Boolean} colorComponent Whether individual components have their own color. True = yes, false = no
   * @param {Function} breakCallback Callback function that is executed when applyBreak happens (optional)
   */
  constructor(gridWidth, gridHeight, gameType, colorComponent, breakCallback) {
    this.SCENE_SIZE = 100;
    this.GLOBAL_LABELS = []; // Labels that must have their font-size adjusted as a function of the screen size.
    this.GRID_WIDTH = gridWidth;
    this.GRID_HEIGHT = gridHeight;
    this.GAME_TYPE = gameType; // 0 = FREESTYLE, 1 = LVK
    this.COLOR_COMPONENT = colorComponent;
    this.grid = null;
    this.animationFrameID = null;
    this.breakCallback = breakCallback;
    this.FREESTYLE = 0;
    this.LVK = 1;
    this.TOK = 2;

    // Scene setup
    this.scene = new THREE.Scene();
    this.container = document.getElementById("canvasContainer");
    this.myCanvas = document.getElementById("gameCanvas");
    this.camera = null;
    this.renderer = null;
    this.labelRenderer = null;
    this.#setupScene();

    // Add the resize event listener
    window.addEventListener('resize', this.#resize.bind(this));

    this.#initialize();

    this.#setCanvasSize();
    this.#animate();
  }

  /**
   * Initializes the game (sets the grid and all the settings needed);
   */
  #initialize() {
    // ------ GAME INITIALIZATION ------
    this.grid = new Grid(this.GRID_WIDTH, this.GRID_HEIGHT, this.GAME_TYPE, this.COLOR_COMPONENT, this.GLOBAL_LABELS, this.scene, this.breakCallback);
    this.grid.init();

    if (this.GAME_TYPE == this.FREESTYLE) {
      this.grid.enableNoBreaks(); // True for FREESTYLE
    }
  }

  /**
   * Initializes the THREE.js scene
   */
  #setupScene() {
    this.container.style.justifyContent = 'center';

    // Determine the background color of the scene
    const backgroundColor = document.body.style.backgroundColor || "white";

    // Camera
    this.camera = new THREE.OrthographicCamera(-this.SCENE_SIZE, this.SCENE_SIZE, this.SCENE_SIZE, -this.SCENE_SIZE, 1, 500);
    this.scene.add(this.camera);
    this.camera.position.set(0, 0, 50); // Orthographic so it just needs to be set slightly back
    this.camera.lookAt(0, 0, 0);

    // Define renderer
    this.renderer = new THREE.WebGLRenderer({ canvas: this.myCanvas, antialias: true });
    this.renderer.setClearColor(backgroundColor);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = false;
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    // Define labelRenderer
    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.pointerEvents = 'none'; // Allows clicks to pass through to canvas


    // Append labelRenderer to the same container as myCanvas
    this.container.appendChild(this.labelRenderer.domElement);
  }

  /**
   * Sets the size of the canvas that the user will see (responsive to the size of the parent container)
   */
  #setCanvasSize() {
    // Fit to the smaller dimension between the width and height of the parent container (as a sqaure)
    const minDimension = Math.min(this.container.offsetWidth, this.container.offsetHeight);

    // Apply minDimension to both width and height for a square canvas
    this.myCanvas.style.width = `${minDimension}px`;
    this.myCanvas.style.height = `${minDimension}px`;
    this.renderer.setSize(minDimension, minDimension);
    this.labelRenderer.setSize(minDimension, minDimension);

    // Additionally, adjust the font size of every label that appears on the board
    this.grid.setFontSize(`${minDimension * 0.025}px`);
    this.GLOBAL_LABELS.forEach(label => label.style.fontSize = this.grid.getFontSize());
  }

  // Got function from https://codepen.io/anon/pen/qNNNzJ
  #resize(e) {
    this.#setCanvasSize();
    this.renderer.render(this.scene, this.camera);
  }

  // Render the scene
  #render() {
    // Render the scene from the perspective of the camera
    this.renderer.render(this.scene, this.camera);
    // Render the 2D label overlay
    this.labelRenderer.render(this.scene, this.camera);
  }

  // Animation loop
  #animate() {
    this.#render();

    this.animationFrameID = requestAnimationFrame(this.#animate.bind(this));
  }

  // #region -- GAME COMMANDS --
  /**
   * Performs undo() on the grid.
   */
  undo() {
    this.grid.undo();
  }

  /**
   * Performs redo() on the grid.
   */
  redo() {
    this.grid.redo();
  }

  /**
   * Opens up a dialog menu and saves the grid as a PNG.
   * 
   * Code for saving blob from: https://threejs.org/manual/#en/tips#screenshot
   */
  saveGridAsPNG() {
    // We need to render just before saving. Browsers clear the WebGL cache for efficiency. Source: https://threejs.org/manual/#en/tips#screenshot
    this.#render();
    this.myCanvas.toBlob((blob) => {
      saveBlob(blob, 'grid.png');
    });

    const saveBlob = (function () {
      const a = document.createElement('a');
      document.body.appendChild(a);
      a.style.display = 'none';
      return function saveData(blob, fileName) {
        const url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = fileName;
        a.click();
        //document.body.removeChild(a);
      };
    }());
  }

  /**
   * @returns MOVES array to the caller
   */
  getAllMoves() {
    return this.grid.getAllMoves();
  }

  /**
   * @returns DT code of each knot identified in the grid.
   */
  getDTCodes() {
    return this.grid.getDTCodes();
  }

  /**
   * Applies the break given a particular move. Since this is only called for LvK, we make the move immutable.
   * 
   * @param {JSON} move move to be applied. We assume it's of the form: {x: 0, y: 0, type: 0}
   */
  applyMove(move) {
    this.grid.addMove(move.x, move.y, move.type);
    this.grid.applyBreak(move.x, move.y, move.type, false, false);
  }

  /**
   * Enables use of no breaks
   */
  enableNoBreaks() {
    this.grid.enableNoBreaks();
  }

  /**
   * Disables use of no breaks
   */
  disableNoBreaks() {
    this.grid.disableNoBreaks();
  }

  /**
   * Disables the grid.
   */
  disable() {
    this.grid.disableGrid();
  }

  /**
   * Enables the grid.
   */
  enable() {
    this.grid.enableGrid();
  }

  /**
   * Restarts the game with all the same settings it was initialized with
   */
  restartGame() {
    // Dispose of the old grid
    this.grid.dispose();

    // Initialize the scene again and set the canvas size (so the font size is corrected)
    this.#initialize();
    this.#setCanvasSize();
  }
  // #endregion

  /**
   * Takes a snapshot of the game at a specified aspect ratio.
   * 
   * @param {Number} width The width of the snapshot.
   * @param {Number} height The height of the snapshot.
   * @returns {HTMLImageElement} The snapshot image element.
   */
  getSnapshot() {
    // Initialize the snapshot before saving the src
    var snapshot = new Image();

    // We need to render just before saving. Browsers clear the WebGL cache for efficiency. Source: https://threejs.org/manual/#en/tips#screenshot
    this.#render();
    
    // Return a promise that resolves when the blob is available
    return new Promise((resolve) => {
      this.myCanvas.toBlob((blob) => {
        // Convert Blob to a data URL
        const url = URL.createObjectURL(blob);
        snapshot.src = url;

        // Resolve the promise with the snapshot after the src is set
        snapshot.onload = () => {
          resolve(snapshot);  // Ensure you have the snapshot ready before proceeding
        };
      });
    });
  }

  /**
   * Disposes of the scene & its elements properly.
   */
  dispose() {
    // Stop the animation loop
    if (this.animationFrameID) {
      cancelAnimationFrame(this.animationFrameID);
      this.animationFrameID = null;
    }

    // Dispose of the grid
    this.grid.dispose();

    // Dispose of objects in the scene
    this.scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();

      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => {
            if (material.map) material.map.dispose();
            material.dispose();
          });
        } else {
          if (object.material.map) object.material.map.dispose();
          object.material.dispose();
        }
      }
    });

    // Clear the scene
    this.scene.clear();

    // Dispose of renderers
    this.renderer.dispose();

    // Remove the event listeners
    window.removeEventListener('resize', this.#resize);
  }
}