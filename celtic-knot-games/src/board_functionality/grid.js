import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js";
import { CSS2DObject } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/renderers/CSS2DRenderer.js';

/**
 * Object representing the GRID that will be instantiated at game start.
 * 
 * @param {Number} gridWidth width of our grid (maximum is 5, minimum is 1)
 * @param {Number} gridHeight width of our grid (maximum is 5, minimum is 1)
 * @param {Number} gameType 0 = FREESTYLE, 1 = LVK, 2 = TOK
 * @param {Boolean} colorComponent true = color each link uniquely; false = color each link the same color
 * @param {Array} labelsArr array storing the labels that are produced for the menu
 * @param {THREE.js Scene} threeScene the THREE.js scene
 * @param {DOM Document} doc the document that we're attaching the listeners to.
 * @param {Function} breakCallback callback function that gets called when applyBreak happens (optional)
 */
export default function Grid(gridWidth, gridHeight, gameType, colorComponent, labelsArr, threeScene, breakCallback) {

    // #region ---- FIELDS ----
    // THREE.js / DOM Necessities:
    const scene = threeScene;
    var myCanvas = document.getElementById("gameCanvas");

    // Dimensions, Sizing, & Drawing Constants:
    const GRID_WIDTH = gridWidth;
    const GRID_HEIGHT = gridHeight;
    const SCENE_SIZE = 100;
    const TILE_SIZE = 20; // Everything will be drawn as a function of the tile size
    const OFFSET = TILE_SIZE / 2;
    const OFFSETX = TILE_SIZE * -GRID_WIDTH; // Starts at the left (used for drawing lines)
    const OFFSETY = TILE_SIZE * -GRID_HEIGHT; // Starts at the bottom
    const LINE_SIZE = 2;
    const BORDER_SIZE = 3;
    const BREAK_SIZE = 0.5;
    const COLOR_COMPONENT = colorComponent;
    const DEFAULT_LINE_COLOR = 0xf0990c;
    const BORDER_COLOR = 0x111111;
    const TILE_OUTLINE_COLOR = 0xBBBBBB;
    const BREAK_COLOR = 0x222222;
    const OVER_Z = -5;
    const UNDER_Z = -200;

    // Color pallette (for links):
    // Color pallette determined from https://davidmathlogic.com/colorblind/#%23648FFF-%23785EF0-%23DC267F-%23FE6100-%23FFB000
    const COLORS = [
        0x900F0F, 0xE0C92D, 0x25908A, 0x8910A7, 0x599025,
        0xBD4182, 0x9AF436, 0x997DD2, 0x11BD70, 0x77F1D4,
        0xDAB1B6, 0xF54F5E, 0x52331A, 0xE1147E, 0xEFCDFF,
        0xE46A36, 0x9BA1F9, 0xDDCB82, 0x4E0A7F, 0x5652BD,
        0x144E1E, 0x99EA8F, 0xEA0EDA, 0x865B18, 0x8A064E
    ];

    // Modifiable Grid Elements:
    const GRID = new Array(GRID_WIDTH * 2); // Our grid is GRID[WIDTH][HEIGHT]
    var LINKS = new Array(GRID_WIDTH * 2); // Each element is a number starting at 1 determining which link is at that coordinate
    const GRID_OBJ = []; // Stores the objects in the scene so they can be disposed of properly
    const BREAKS = new Array(GRID_WIDTH * 2 + 1);
    const CROSSINGS = []; // Stores the crossings (AKA where breaks are) in a linear fashion for efficiency
    const GRID_LINES = []; // Stores the grid lines so they can be disposed of properly
    var _enabled = true;

    // Crossing Selection:
    const CROSSING_SELECTION_PROXIMITY = 4;
    var _hoveredCrossing;

    // Break Menu:
    var _menu;
    var _noBreaksAllowed = false;
    const LABELS = labelsArr;
    var _fontSize;

    // Game Type:
    var _gameType = gameType;
    const FREESTYLE = 0;
    const LVK = 1;
    const TOK = 2;

    // Freestyle:
    // Note: Breaks are stored as [[X, Y], TYPE] in these arrays for storage efficiency
    const MOVES = []; // Stores moves made in an array
    const UNDO = []; // Stores the move to undo (stack)
    var movesIdx = 0; // Index to walk the MOVES array (used for undo)

    // Enums:
    const TR_BL = 0;
    const TL_BR = 1;
    const NO_BREAK = 0;
    const VERT_BREAK = 1;
    const HORIZ_BREAK = 2;
    const MUTABLE = true;
    const IMMUTABLE = false;
    // #endregion

    // #region ---- GRID DRAWING/RENDERING FUNCTIONS ----
    /**
     * Closure that represents the ways to draw each tile for the grid, and returns the tiles to the caller.
     * Internal function only.
     * 
     * @returns 3D matrix representing what tile should be drawn determined by the surrounding breaks.
     */
    function drawFuncs() {
        // ---- DRAWING FUNCTIONS ----
        const BORDER_MAT = new THREE.MeshBasicMaterial({ color: BORDER_COLOR });

        /**
         * Draws a line and its border from a given curve.
         * 
         * @param {THREE.CatmullRomCurve3} curve
         * @returns THREE.Group of THREE.TubeGeometry line and THREE.TubeGeometry border offset by -10 z.
         */
        function drawFromCurve(curve, startPos, color) {
            // Make the line material:
            const LINE_MAT = new THREE.MeshBasicMaterial({ color: color });

            // Line construction
            var lineGeom = new THREE.TubeGeometry(curve, 64, LINE_SIZE, 8, false);  // 64 segments, 2 thickness, 8 radial segments
            var line = new THREE.Mesh(lineGeom, LINE_MAT);

            // Border construction
            var borderGeom = new THREE.TubeGeometry(curve, 64, BORDER_SIZE, 8, false);
            var border = new THREE.Mesh(borderGeom, BORDER_MAT);

            border.position.z -= 150;

            // Group them together and add the group
            var group = new THREE.Group();
            group.add(line);
            group.add(border);

            // Set the position back to where it should be (this was drawn based on 0,0 for rotation purposes)
            group.position.x = startPos.x + OFFSET;
            group.position.y = startPos.y + OFFSET;
            group.position.z = startPos.z;

            return group;
        }

        /**
         * Draws a straight line down the middle.
         * 
         * @param {THREE.Vector3} startPos the position that we start drawing from
         * @returns straight line and its border
         */
        function drawStraightLine(startPos, crossOver, color) {
            // Define the points in terms of centering around 0,0
            var curve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(0, -OFFSET, OVER_Z),
                new THREE.Vector3(0, OFFSET, OVER_Z)
            ]);

            return drawFromCurve(curve, startPos, color);
        }

        /**
         * Draws a straight line diagonally along the line y = x.
         * 
         * @param {THREE.Vector3} startPos the position that we start drawing from
         * @returns diagonal line and its border
         */
        function drawStraightDiagonal(startPos, crossOver, color) {
            // Define the points in terms of centering around 0,0
            var curve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(-OFFSET, -OFFSET, crossOver ? UNDER_Z : OVER_Z),
                // Middle points help transition it
                new THREE.Vector3(-OFFSET + OFFSET / 5, -OFFSET + OFFSET / 5, crossOver ? UNDER_Z : OVER_Z),
                new THREE.Vector3(OFFSET - OFFSET / 5, OFFSET - OFFSET / 5, crossOver ? OVER_Z : UNDER_Z),
                new THREE.Vector3(OFFSET, OFFSET, crossOver ? OVER_Z : UNDER_Z)
            ]);

            return drawFromCurve(curve, startPos, color);
        }

        /**
         * Draws a curve starting from the bottom middle of the tile and ends as a
         * diagonal line y = x towards the top-right corner
         * 
         * @param {THREE.Vector3} startPos the position that we start drawing from
         * @returns curved diagonal line and its border
         */
        function drawCurvedDiagonal(startPos, crossOver, color) {
            // Define the points in terms of centering around 0,0
            var points = [];

            // Start points (need two to start from the bottom middle properly)
            points.push(new THREE.Vector3(0, -OFFSET, crossOver ? UNDER_Z : OVER_Z));
            points.push(new THREE.Vector3(0, -OFFSET + 0.5, crossOver ? UNDER_Z : OVER_Z));

            var z = crossOver ? UNDER_Z : OVER_Z;
            // Add 10 points where the line is curving quadratically to the top-right from the middle along the bottom
            for (let i = 1; i <= 10; i++) {
                var deltaX = (i * 0.1) * TILE_SIZE / 2;

                // Found by fiddling on desmos: y = (1/sqrt(1/2)) * sqrt(x)
                var deltaY = (TILE_SIZE / Math.sqrt(TILE_SIZE / 2)) * Math.sqrt(deltaX); // (i * 0.1) just gets us 10% intervals of the desired shape

                // We want to overlap partway through. Too early or too late in the geometry causes visual issues
                if (i > 1 && i < 5) {
                    if (crossOver) {
                        z = UNDER_Z - ((i * 0.1) * UNDER_Z);
                    } else {
                        z = (i * 0.1) * UNDER_Z;
                    }
                }
                else if (i == 5) {
                    z = crossOver ? OVER_Z : UNDER_Z;
                }

                // Define the points and add them
                points.push(new THREE.Vector3(deltaX, -OFFSET + deltaY, z));
            }

            // Use the points to define our curve
            var curve = new THREE.CatmullRomCurve3(points);

            // Draw from the curve
            return drawFromCurve(curve, startPos, color);
        }

        /**
         * Draws a corner quadratically from a given start position.
         * 
         * @param {THREE.Vector3} startPos the position that we start drawing from
         * @returns corner line and its border
         */
        function drawCorner(startPos, crossOver, color) {
            // Define the points in terms of centering around 0,0
            var points = [];

            // Start points (need two to start from the bottom middle properly)
            points.push(new THREE.Vector3(-OFFSET, 0, OVER_Z));
            points.push(new THREE.Vector3(-OFFSET + 0.5, 0, OVER_Z));

            // Add 10 points where the line is curving quadratically to the top-right from the middle along the bottom
            for (let i = 1; i <= 9; i++) {
                var deltaX = (i * 0.1) * TILE_SIZE / 2;

                // Found by fiddling on desmos: y = -sqrt(-x^2 + (TILE_SIZE/2)^2) + TILE_SIZE
                var deltaY = -Math.sqrt(-(deltaX ** 2) + (TILE_SIZE / 2) ** 2) + TILE_SIZE; // (i * 0.1) just gets us 10% intervals of the desired shape

                // Define the points and add them
                points.push(new THREE.Vector3(-OFFSET + deltaX, -OFFSET + deltaY, OVER_Z));
            }

            // End point (used to get flush to GRID sides)
            points.push(new THREE.Vector3(0, OFFSET - 0.5, OVER_Z));
            points.push(new THREE.Vector3(0, OFFSET, OVER_Z));

            // Use the points to define our curve
            var curve = new THREE.CatmullRomCurve3(points);

            return drawFromCurve(curve, startPos, color);
        }

        /**
         * Draws an error icon (red cross out tile).
         * 
         * Debugging purposes only.
         * 
         * @param {THREE.Vector3} startPos the position that we start drawing from
         * @returns a red crossing used for debug purposes
         */
        function drawError(startPos) {
            // Define the points for one line in the crossing
            var curve1 = new THREE.CatmullRomCurve3([
                new THREE.Vector3(startPos.x, startPos.y, OVER_Z),
                new THREE.Vector3(startPos.x + TILE_SIZE, startPos.y + TILE_SIZE, OVER_Z)
            ]);

            // Build the line from the points
            var lineMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            var lineGeom1 = new THREE.TubeGeometry(curve1, 64, 2, 8, false);  // 64 segments, 0.5 thickness, 8 radial segments
            var line1 = new THREE.Mesh(lineGeom1, lineMat);

            // Define the points for the second line in the crossing
            var curve2 = new THREE.CatmullRomCurve3([
                new THREE.Vector3(startPos.x + TILE_SIZE, startPos.y, OVER_Z),
                new THREE.Vector3(startPos.x, startPos.y + TILE_SIZE, OVER_Z)
            ]);

            // Build the line from the points
            var lineGeom2 = new THREE.TubeGeometry(curve2, 64, 2, 8, false);  // 64 segments, 0.5 thickness, 8 radial segments
            var line2 = new THREE.Mesh(lineGeom2, lineMat);

            // Group the lines together so it is one element
            var group = new THREE.Group();
            group.add(line1);
            group.add(line2);

            // Return the crossing
            return group;
        }

        // ---- TRANSFORMATION FUNCTIONS ----
        /**
         * Rotates a THREE.js object around its center in terms of radians.
         * 
         * @param {function} drawFunction function that knows how to draw the THREE.js object
         * @param {number} radians rotation in radians
         */
        function rotate(drawFunction, radians, reverseCrossOver = false) {
            return function (startPos, crossOver, color) {
                // Reverse the crossOver for this drawing if defined
                if (reverseCrossOver) {
                    crossOver = !crossOver;
                }

                // 1. Draw the object
                var obj = drawFunction(startPos, crossOver, color);

                // 2. Rotate
                obj.rotateZ(radians);

                return obj;
            }
        }

        /**
         * Reflects an object over the y-axis.
         * 
         * @param {function} drawFunction function that knows how to draw the THREE.js object
         * @returns the object reflected across the y-axis
         */
        function reflectYAxis(drawFunction, reverseCrossOver = false) {
            return function (startPos, crossOver, color) {
                // Reverse the crossOver for this drawing if defined
                if (reverseCrossOver) {
                    crossOver = !crossOver;
                }

                // 1. Draw the object
                var obj = drawFunction(startPos, crossOver, color);

                // 2. Reflect over the y-axis
                obj.scale.x *= -1;

                return obj;
            }
        }

        /**
         * Reflects an object over the x-axis.
         * 
         * @param {function} drawFunction function that knows how to draw the THREE.js object
         * @returns the object reflected across the x-axis
         */
        function reflectXAxis(drawFunction, reverseCrossOver = false) {
            return function (startPos, crossOver, color) {
                // Reverse the crossOver for this drawing if defined
                if (reverseCrossOver) {
                    crossOver = !crossOver;
                }

                // 1. Draw the object
                var obj = drawFunction(startPos, crossOver, color);

                // 2. Reflect over the x-axis
                obj.scale.y *= -1;

                return obj;
            }
        }


        // ---- TILE SELECTION MATRIX INITIALIZATION ----
        /**
         * Drawing tiles inspired by https://w-shadow.com/celtic-knots/ (TODO: formal credits). Tweaked slightly (read details below).
         * 
         * Notes:
         * 1. Each "tile" in the array is a preset drawing.
         * 2. Tiles are categorized by array indices as follows:
         *  a. 0 = TopRight/BotLeft breaks mattering,
         *     1 = TopLeft/BotRight breaks mattering
         *  b. Top Crossing:
         *     0 = No Break
         *     1 = Vertical Break
         *     2 = Horizontal Break
         *  c. Bottom Crossing:
         *     0 = No Break
         *     1 = Vertical Break
         *     2 = Horizontal Break
         *  - For example: tiles[1][0][0] = A straight line y = x
         *  - For example: tiles[1][2][1] = A downward-right facing corner piece
         *  - etc.
         * 3. Reminder for the coordinate system in place for tiles:
         *  - OO / EE = TopLeft/BotRight matter
         *  - OE / EO = TopRight/BotLeft matter
         */

        // Initializes the tile matrix (drawError is done in-case we miss something -- debugging purposes)
        var tiles = [];
        for (var i = 0; i < 2; i++) {
            tiles[i] = [];
            for (var j = 0; j < 3; j++) {
                tiles[i][j] = [];
                for (var k = 0; k < 3; k++) {
                    tiles[i][j][k] = drawError;
                }
            }
        }

        // Define each tile by hand: tiles[TL/TR][TopBreak][BotBreak]
        tiles[TR_BL][NO_BREAK][NO_BREAK] = drawStraightDiagonal; // y = x
        tiles[TR_BL][NO_BREAK][VERT_BREAK] = drawCurvedDiagonal; // Starts y = x --> curve away from break
        tiles[TR_BL][NO_BREAK][HORIZ_BREAK] = reflectXAxis(rotate(drawCurvedDiagonal, Math.PI / 2));

        tiles[TR_BL][VERT_BREAK][NO_BREAK] = rotate(drawCurvedDiagonal, Math.PI, true); // Reverse the crossOver
        tiles[TR_BL][VERT_BREAK][VERT_BREAK] = drawStraightLine; // Straight through between breaks
        tiles[TR_BL][VERT_BREAK][HORIZ_BREAK] = drawCorner; // Corner avoiding both breaks

        tiles[TR_BL][HORIZ_BREAK][NO_BREAK] = reflectYAxis(rotate(drawCurvedDiagonal, Math.PI / 2), true); // Reverse the crossOver
        tiles[TR_BL][HORIZ_BREAK][VERT_BREAK] = rotate(drawCorner, Math.PI);
        tiles[TR_BL][HORIZ_BREAK][HORIZ_BREAK] = rotate(drawStraightLine, Math.PI / 2);

        tiles[TL_BR][NO_BREAK][NO_BREAK] = rotate(drawStraightDiagonal, Math.PI / 2);
        tiles[TL_BR][NO_BREAK][VERT_BREAK] = reflectYAxis(drawCurvedDiagonal);
        tiles[TL_BR][NO_BREAK][HORIZ_BREAK] = rotate(drawCurvedDiagonal, Math.PI / 2);

        tiles[TL_BR][VERT_BREAK][NO_BREAK] = reflectXAxis(drawCurvedDiagonal, true); // Reverse the crossOver
        tiles[TL_BR][VERT_BREAK][VERT_BREAK] = drawStraightLine;
        tiles[TL_BR][VERT_BREAK][HORIZ_BREAK] = reflectYAxis(drawCorner);

        tiles[TL_BR][HORIZ_BREAK][NO_BREAK] = rotate(drawCurvedDiagonal, Math.PI * 3 / 2, true); // Reverse the crossOver
        tiles[TL_BR][HORIZ_BREAK][VERT_BREAK] = reflectXAxis(drawCorner);
        tiles[TL_BR][HORIZ_BREAK][HORIZ_BREAK] = rotate(drawStraightLine, Math.PI / 2);

        return tiles;
    }

    /**
     * Function that renders the grid once invoked by the caller.
     */
    this.render = function () {
        var tiles = drawFuncs();
        this.clear();
        resetLinks();

        const BREAK_MAT = new THREE.MeshBasicMaterial({ color: BREAK_COLOR });
        var link = 1;

        // 2. Determine the draw function that associates with each grid element, determine individual links, and render the breaks.
        for (let x = 0; x < GRID_WIDTH * 2; x++) {
            for (let y = 0; y < GRID_HEIGHT * 2; y++) {
                // a. Get the odd parity for the rows and columns
                const rowOddParity = (y % 2) == 1;
                const colOddParity = (x % 2) == 1;

                // b. If the parities are the same, it's top-left/bottom-right dependent; otherwise it's top-right/bottom-left dependent
                const breakDependency = rowOddParity == colOddParity ? TL_BR : TR_BL;
                var topBreak;
                var botBreak;

                // c. We grab the top and bottom breaks differently depending on the dependency
                if (breakDependency == TL_BR) {
                    topBreak = BREAKS[x][y + 1];
                    botBreak = BREAKS[x + 1][y];

                    // Render the breaks
                    renderBreak(x, y + 1, topBreak); // Top break
                    renderBreak(x + 1, y, botBreak); // Bottom break
                }
                else {
                    topBreak = BREAKS[x + 1][y + 1];
                    botBreak = BREAKS[x][y];

                    // Render the breaks
                    renderBreak(x + 1, y + 1, topBreak); // Top break
                    renderBreak(x, y, botBreak); // Bottom break
                }

                // d. Apply the draw function to this cell depending on the breaks
                GRID[x][y] = tiles[breakDependency][topBreak.type][botBreak.type];

                // e. Also, identify links for this piece of the grid:
                if (!LINKS[x][y]) // If there's a link already there we'll just skip
                {
                    identifyLink(x, y, link++);
                }
            }
        }

        // 3. Render the grid based on the drawFunctions
        for (let i = 0; i < GRID_WIDTH * 2; i++) {
            for (let j = 0; j < GRID_HEIGHT * 2; j++) {
                // Determine the column's odd parity (important for rendering overlap).
                const colOddParity = (i % 2) == 1;

                // 2. Draw the tile if the draw function is set (should always be set)
                if (GRID[i][j] != undefined) {
                    // CrossOver defines whether the top-most part of the shape goes over or under for a crossing. True = over; false = under
                    var crossOver = colOddParity; // It seems crossover is directly related to the column parity
                    var color = DEFAULT_LINE_COLOR;

                    // If we color components, change the color to a unique color based on the link:
                    if (COLOR_COMPONENT) {
                        color = COLORS[LINKS[i][j] - 1];
                        if (!color) { // If we ran out of colors.
                            // Add a random one to colors
                            COLORS.push((Math.random() * 0xffffff))
                            color = COLORS[LINKS[i][j] - 1];
                        }
                    }

                    var currX = OFFSETX + i * TILE_SIZE;
                    var currY = OFFSETY + j * TILE_SIZE;

                    var startPos = new THREE.Vector3(currX, currY, 0);
                    var obj = GRID[i][j](startPos, crossOver, color);
                    scene.add(obj);
                    GRID_OBJ.push(obj);
                }
            }
        }

        /**
         * Renders the break at the given X,Y coordinate. Adds to the GRID_OBJ array for clearing during rendering.
         * 
         * @param {Number} x X coordinate where the break occurs (grid coordinates)
         * @param {Number} y Y coordinate where the break occurs (grid coordinates)
         * @param {Number} breakType the type of break
         */
        function renderBreak(x, y, currBreak) {
            // If the break has no definition, skip
            if (currBreak == null || currBreak == undefined) {
                return;
            }
            // If there is a VERT or HORIZ break
            else if (currBreak.type != 0) {
                var points = [];
                var currX = OFFSETX + x * TILE_SIZE;
                var currY = OFFSETY + y * TILE_SIZE;

                // Define the points from where the break is
                switch (currBreak.type) {
                    case VERT_BREAK:
                        points.push(new THREE.Vector3(currX, currY + TILE_SIZE, 0))
                        points.push(new THREE.Vector3(currX, currY - TILE_SIZE, 0));
                        break;
                    case HORIZ_BREAK:
                        points.push(new THREE.Vector3(currX - TILE_SIZE, currY, 0))
                        points.push(new THREE.Vector3(currX + TILE_SIZE, currY, 0));
                        break;
                }
                // Define the points in terms of centering around 0,0
                var curve = new THREE.CatmullRomCurve3(points);
                var lineGeom = new THREE.TubeGeometry(curve, 64, BREAK_SIZE, 8, false);  // 64 segments, 2 thickness, 8 radial segments
                var line = new THREE.Mesh(lineGeom, BREAK_MAT);

                scene.add(line);
                GRID_OBJ.push(line);
            }

            // If the break is immutable, render the immutable indicator
            if (currBreak.mutability == IMMUTABLE && x != 0 && y != 0 && x != GRID_WIDTH * 2 && y != GRID_HEIGHT * 2) {
                var crossing = CROSSINGS.find(c => c.position.col == x && c.position.row == y);
                var indicator = drawHoverIndicator(crossing, 0x444444);
                scene.add(indicator);
                GRID_OBJ.push(indicator);
            }
        }

        /**
         * Identifies a link starting from an x and y coordinate.
         * 
         * @param {Number} startX starting x coordinate
         * @param {Number} startY starting y coordinate
         * @param {Number} link the link we're identifying
         */
        function identifyLink(startX, startY, link) {
            let x = startX;
            let y = startY;
            // Always move to the right to start.
            let xdir = 1;
            // Based on the cols parities we know if it's TL/BR or TR/BL dependent. We will go rightward in up or down direction depending on this.
            let ydir = (y % 2) == (x % 2) ? -1 : 1; // TL/BR = -1; TR/BL = 1;

            // Run until we've fully identified the link
            do {
                // Assign the node we visit as this link
                LINKS[x][y] = link;

                // Decide how to move X and Y along
                var flippedX = false;
                var flippedY = false;

                // If the parities are the same, it's top-left/bottom-right dependent; otherwise it's top-right/bottom-left dependent
                const breakDependency = (y % 2) == (x % 2) ? TL_BR : TR_BL;

                // 1. We look at the right-sided break if we're traveling right.
                // 2. We look at the top break if:
                //   a. We're traveling right && we're dependent on the TR/BL breaks
                //   b. We're traveling left && we're dependent on the TL/BR breaks
                var breakX = x + (xdir > 0 ? 1 : 0);
                var breakY = y + ((xdir > 0) === (breakDependency == TR_BL) ? 1 : 0);
                var currBreak = BREAKS[breakX][breakY].type;

                // Determine if we flip the X or Y based on the break type.
                switch (currBreak) {
                    case VERT_BREAK:
                        flippedX = true;
                        xdir *= -1;
                        break;
                    case HORIZ_BREAK:
                        flippedY = true;
                        ydir *= -1;
                        break;
                }

                // Move the x and y (if x and y were not flipped).
                if (!flippedX) x += xdir;
                if (!flippedY) y += ydir;
            }
            while (x != startX || y != startY);
        }
    }

    /**
     * Resets the LINKS array.
     */
    function resetLinks() {
        LINKS = new Array(GRID_WIDTH * 2);
        for (let i = 0; i < LINKS.length; i++) {
            LINKS[i] = new Array(GRID_HEIGHT * 2);
        }
    }

    /**
     * Clears the scene.
     * 
     * Proper disposal discovered here: https://stackoverflow.com/questions/37762961/three-js-proper-removing-object-from-scene-still-reserved-in-heap/
     */
    this.clear = function () {
        for (var idx in GRID_OBJ) {
            // The object will either be a group or an object itself
            const obj = GRID_OBJ[idx];

            if (obj) {
                scene.remove(obj);
                // Remove each TubeGeometry object from the scene
                obj.children.forEach(child => { // Handle the children in a group

                    // Dispose of the geometry to free up memory
                    if (child.geometry) {
                        child.geometry.dispose();
                    }

                    // Dispose of the material if it exists and isn't shared
                    if (child.material && child.material.dispose) {
                        child.material.dispose();
                    }
                });

                // Dispose of the geometry of the obj itself to free up memory
                if (obj.geometry) {
                    obj.geometry.dispose();
                }

                // Dispose of the material if it exists and isn't shared
                if (obj.material && obj.material.dispose) {
                    obj.material.dispose();
                }

                // Set the grid cell to null to avoid dangling references
                GRID_OBJ[idx] = null;
            }
        }
    }
    // #endregion

    // #region ---- BREAKS / CROSSING SELECTION FUNCTIONS ----
    /**
     * Enables the menu option for noBreaks.
     */
    this.enableNoBreaks = function () {
        _noBreaksAllowed = true;
    }

    /**
     * Disables the menu option for noBreaks.
     */
    this.disableNoBreaks = function () {
        _noBreaksAllowed = false;
    }

    /**
     * Enables the grid.
     */
    this.enableGrid = function () {
        _enabled = true;
    }

    /**
     * Disables the grid.
     */
    this.disableGrid = function () {
        _enabled = false;
    }

    /**
     * Applies the given break to the break matrix properly.
     * 
     * @param {Number} row The row to apply the break to (0 - HEIGHT + 1)
     * @param {Number} col The col to apply the break to (0 - WIDTH + 1)
     * @param {Number} breakType The type of break (0 = NONE, 1 = VERT, 2 = HORIZ)
     * @param {Boolean} breakMutability The mutability of the break (true = MUTABLE, false = IMMUTABLE)
     * @param {Boolean} useCallback Whether to use the callback function or not when a break is applied. Default is true. Override if we don't want the callback to fire.
     * 
     * @returns the breakType that used to be there, or null if not a valid crossing.
     */
    this.applyBreak = function (col, row, breakType, breakMutability, useCallback = true) {
        var prevBreakType = null;

        // If the break exists as a valid option and it's able to be changed (MUTABLE).
        if (BREAKS[col][row].mutability == MUTABLE) {
            // Get the original breakType
            prevBreakType = BREAKS[col][row].type;

            // Apply the break at the location
            BREAKS[col][row] = {
                type: breakType,
                mutability: breakMutability
            };

            // If we're applying an immutable crossing, make sure the hover indicator doesn't show up
            if (breakMutability == IMMUTABLE) {
                CROSSINGS.find(c => c.position.col == col && c.position.row == row).mutability = breakMutability;
            }

            // If the callback function exists, call it and pass the breakType, col, and row
            if (breakCallback && useCallback) {
                breakCallback(col, row, breakType);
            }

            this.render();
        }

        return prevBreakType;
    }

    /**
     * Adds a move to the MOVES array.
     * 
     * @param {Number} col column a break occurs in
     * @param {Number} row row a break occurs in
     * @param {BreakType} breakType break type
     */
    this.addMove = function (col, row, breakType) {
        // First, always point to the next element:
        // a: If we have undone something, we need to clear the next move and everything after.
        // b: If we have not undone anything, clear will do nothing.
        movesIdx++;

        // If an undo occurred and we made a new move, this applies:
        // Any moves ahead of the undone state no longer matter and will be cleared.
        for (let i = movesIdx; i < MOVES.length; i++) {
            MOVES[i] = null;
        }
        MOVES.length = movesIdx + 1; // Set the length (this is due to how js works)

        // Add the move
        MOVES[movesIdx] = [[col, row], breakType];
    }

    /**
     * Determines if the mouse position is near enough to a particular crossing.
     * 
     * @param {Number} mouseX X position of the mouse.
     * @param {Number} mouseY Y position of the mouse.
     * @param {crossing} crossing crossing we're checking the bounds for.
     * 
     * @returns true if the mouse is within the bounds, false otherwise (or false if the crossing is IMMUTABLE).
     */
    this.withinBounds = function (mouseX, mouseY, crossing) {
        // Ignore the crossing if it can't be selected anyways
        if (crossing.mutability == IMMUTABLE) {
            return false;
        }

        // Determine the bounding box for each crossing
        var leftBound = (crossing.position.col * TILE_SIZE / 2) - CROSSING_SELECTION_PROXIMITY;
        var rightBound = (crossing.position.col * TILE_SIZE / 2) + CROSSING_SELECTION_PROXIMITY;
        var topBound = (crossing.position.row * TILE_SIZE / 2) + CROSSING_SELECTION_PROXIMITY;
        var bottomBound = (crossing.position.row * TILE_SIZE / 2) - CROSSING_SELECTION_PROXIMITY;

        // Return whether we are within the bounds of the rectangle defined above.
        return mouseX >= leftBound && mouseX <= rightBound &&
            mouseY <= topBound && mouseY >= bottomBound;
    }

    /**
     * Determines if the mouse position is near enough to any crossing on the board.
     * If we find a crossing that it is near enough to, we return that crossing. Otherwise, return null
     * 
     * @param {Number} mouseX X position of the muose.
     * @param {Number} mouseY Y position of the mouse.
     * 
     * @returns a crossing if one is within bounds. Null otherwise.
     */
    this.findNearEnoughCrossing = function (mouseX, mouseY) {
        // Iterate through every crossing, and return one if we're within bounds.
        for (var idx in CROSSINGS) {
            var crossing = CROSSINGS[idx];
            if (this.withinBounds(mouseX, mouseY, crossing)) {
                return crossing;
            }
        }
        // Otherwise, if we've exhausted our options, return null.
        return null;
    }

    /**
     * Polled by the mousemove event listener when within bounds of the THREE.js scene to see if we need to
     * add a hover indicator over any of the crossings available on the Celtic knot grid.
     * 
     * @param {MouseEvent} event contains mouse movement information.
     * @param {Rectangle} rect rectangle of the canvas element.
     */
    this.pollCrossingHoverIndicator = function (event, rect) {
        // Relate the mouse coordinates to grid coordinates
        var mouseX = ((event.clientX - rect.left) / rect.width) * SCENE_SIZE - (TILE_SIZE * (5 - GRID_WIDTH) / 2); // 5 being the max grid width
        var mouseY = ((rect.bottom - event.clientY) / rect.height) * SCENE_SIZE - (TILE_SIZE * (5 - GRID_HEIGHT) / 2); // 5 being the max grid height

        // If a menu is open, do nothing (the indicator will remain until the menu is closed)
        if (_menu) {
            return;
        }

        // Figure out if we're in the bounds of a crossing
        var crossing = this.findNearEnoughCrossing(mouseX, mouseY);

        // If crossing is a truthy value (i.e. exists), continue logically.
        if (crossing) {
            if (_hoveredCrossing) {
                // If it's the same crossing that's already got an indicator, skip.
                if ((crossing.position.col == _hoveredCrossing.crossing.position.col &&
                    crossing.position.row == _hoveredCrossing.crossing.position.row)) {
                    return;
                }
                // If not, remove the other crossing indicator
                else {
                    removeHoverIndicator(_hoveredCrossing.indicator);
                    _hoveredCrossing = null;
                }
            }

            // Add the hover indicator to the current crossing.
            var point = drawHoverIndicator(crossing, 0x0000ff);
            scene.add(point);
            _hoveredCrossing = {
                crossing: crossing,
                indicator: point
            };
        }
        // If there was no crossing that we're within, we remove the indicator if it exists.
        else {
            if (_hoveredCrossing) {
                removeHoverIndicator(_hoveredCrossing.indicator);
                _hoveredCrossing = null;
            }
        }

    }

    /**
       * @returns Hover indicator THREE.js object.
       * 
       * Note: Can be adjusted to be any object we'd like.
       */
    function drawHoverIndicator(crossing, color) {
        // Draw an indicator overtop the crossing
        const pointGeometry = new THREE.BufferGeometry();
        var x = OFFSETX + crossing.position.col * TILE_SIZE;
        var y = OFFSETY + crossing.position.row * TILE_SIZE;
        pointGeometry.setAttribute('position', new THREE.Float32BufferAttribute([x, y, 10], 3));

        const pointMaterial = new THREE.PointsMaterial({ color: color, size: 10 });
        return new THREE.Points(pointGeometry, pointMaterial);
    }

    /**
     * Removes the indicator from the previously selected crossing.
     * 
     * @param {THREE.Object} indicator the hover indicator for the previously selected crossing
     */
    function removeHoverIndicator(indicator) {
        // Remove the indicator from the scene, and dispose of everything properly
        scene.remove(indicator);
        // Dispose of the geometry to free up memory
        if (indicator.geometry) {
            indicator.geometry.dispose();
        }

        // Dispose of the material if it exists and isn't shared
        if (indicator.material && indicator.material.dispose) {
            indicator.material.dispose();
        }
    }

    /**
     * Runs the logic to determine which of the functions for mouse clicking is used
     * on a mouse click.
     * 
     * @param {MouseEvent} event contains mouse movement information.
     * @param {Rectangle} rect rectangle of the canvas element.
     */
    this.onMouseClick = function (event, rect) {
        // Relate the mouse coordinates to grid coordinates
        var mouseX = ((event.clientX - rect.left) / rect.width) * SCENE_SIZE - (TILE_SIZE * (5 - GRID_WIDTH) / 2); // 5 being the max grid width
        var mouseY = ((rect.bottom - event.clientY) / rect.height) * SCENE_SIZE - (TILE_SIZE * (5 - GRID_HEIGHT) / 2); // 5 being the max grid height

        // If we have a menu already open, either confirm a selection on the menu, or close the menu.
        if (_menu) {
            var selectedBreak = _menu.makeSelection(mouseX, mouseY);
            // If a break was selected, apply the break
            if (selectedBreak != null) {
                const mutability = _gameType == FREESTYLE ? MUTABLE : IMMUTABLE;
                const col = _hoveredCrossing.crossing.position.col;
                const row = _hoveredCrossing.crossing.position.row;
                this.addMove(col, row, selectedBreak);
                const prevType = this.applyBreak(col, row, selectedBreak, mutability);

                // Add what used to be there to UNDO:
                UNDO.push([[col, row], prevType]);
            }

            // Always dispose the menu after clicking
            _menu.dispose();
            _menu = null;

            // Also remove the hover indicator
            removeHoverIndicator(_hoveredCrossing.indicator);
            _hoveredCrossing = null;
        }
        // Otherwise, if we're hovered over a crossing and the mouse was clicked, we've now clicked on that crossing.
        // Thus, we open the menu here.
        else if (_hoveredCrossing) {
            // First, we do the logic behind finding which break options are available
            var breakTypes = [VERT_BREAK, HORIZ_BREAK];
            if (_noBreaksAllowed) {
                breakTypes.push(NO_BREAK);
            }

            // Determine if we need to remove the break that's currently there as an option
            var crossingBreak = BREAKS[_hoveredCrossing.crossing.position.col][_hoveredCrossing.crossing.position.row];
            if (crossingBreak && _gameType != LVK) { // If a break already exists there and we're not playing LVK
                // Remove the break type from the list of options
                const index = breakTypes.indexOf(crossingBreak.type);
                if (index > -1) {
                    breakTypes.splice(index, 1);
                }
            }

            _menu = new Menu(_hoveredCrossing.crossing.position.col, _hoveredCrossing.crossing.position.row, breakTypes);
        }

    }
    // #endregion

    // #region ---- GAME LOGIC ----
    /**
     * Sets the game type that the board is.
     * 
     * @param {Number} gameType FREESTYLE, LVK, or TOK
     */
    this.setGameType = function (gameType) {
        _gameType = gameType;
    }

    /**
     * @returns 0 = FREESTYLE, 1 = LVK, 2 = TOK
     */
    this.getGameType = function () {
        return _gameType;
    }

    /**
     * Retrieves the DT code(s) of the knot(s) in the grid.
     * 
     * @returns DT code in the form of a string.
     */
    this.getDTCodes = function () {
        var DT_CODES = [];
        var VISITED_LINKS = [];

        // Run through every tile. If we find a new link number, we get the DT code for it.
        for (let x = 0; x < GRID_WIDTH * 2; x++) {
            for (let y = 0; y < GRID_HEIGHT * 2; y++) {
                // If we've not already identified this link's DT code
                if (!VISITED_LINKS.includes(LINKS[x][y])) {
                    // Add the link to the VISITED_LINKS array
                    VISITED_LINKS.push(LINKS[x][y]);

                    // Get the DT code
                    let dtCode = getDTCode(x, y, LINKS[x][y]);

                    // Determine what color is being sent through
                    var color = `#${COLORS[LINKS[x][y] - 1].toString(16).padStart(6, '0')}`;
                    if (!COLOR_COMPONENT) {
                        color = `#${DEFAULT_LINE_COLOR.toString(16).padStart(6, '0')};`
                    }

                    // Add the link - DT code pair to DT_CODES
                    DT_CODES.push({ link: LINKS[x][y], dtCode: dtCode.trim(), color: color });
                }
            }
        }

        return DT_CODES;

        /**
         * Finds the DT code for this particular link.
         * 
         * @param {Number} startX starting x coordinate
         * @param {Number} startY starting y coordinate
         * @param {Number} link link number we're finding the DT code for
         */
        function getDTCode(startX, startY, link) {
            let x = startX;
            let y = startY;
            // Always move to the right to start.
            let xdir = 1;
            // Based on the cols parities we know if it's TL/BR or TR/BL dependent. We will go rightward in up or down direction depending on this.
            let ydir = (y % 2) == (x % 2) ? -1 : 1; // TL/BR = -1; TR/BL = 1;

            // We'll also identify the DT codes of each link while we're here.
            let dtCount = 1;
            let dtCrossings = {};

            // Run until we've run through the entire link
            do {
                // Decide how to move X and Y along
                var flippedX = false;
                var flippedY = false;

                // If the parities are the same, it's top-left/bottom-right dependent; otherwise it's top-right/bottom-left dependent
                const breakDependency = (y % 2) == (x % 2) ? TL_BR : TR_BL;

                // 1. We look at the right-sided break if we're traveling right.
                // 2. We look at the top break if:
                //   a. We're traveling right && we're dependent on the TR/BL breaks
                //   b. We're traveling left && we're dependent on the TL/BR breaks
                var breakX = x + (xdir > 0 ? 1 : 0);
                var breakY = y + ((xdir > 0) === (breakDependency == TR_BL) ? 1 : 0);
                var currBreak = BREAKS[breakX][breakY].type;

                // Determine if we flip the X or Y based on the break type.
                switch (currBreak) {
                    case VERT_BREAK:
                        flippedX = true;
                        xdir *= -1;
                        break;
                    case HORIZ_BREAK:
                        flippedY = true;
                        ydir *= -1;
                        break;
                    // This means we've encountered a crossing. We need to identify the DT number here.
                    case NO_BREAK:
                        // First, if x or y are the border, we don't consider it.
                        if (breakX == 0 || breakY == 0 || breakX == GRID_WIDTH * 2 || breakY == GRID_HEIGHT * 2) {
                            break;
                        }

                        // Second, we need to make sure this crossing is ONLY intersecting with itself.
                        var botLeftLink = LINKS[breakX - 1][breakY - 1];
                        var botRightLink = LINKS[breakX][breakY - 1];
                        // If the botleft and botright are not the same link, we skip the DT code portion for this.
                        if (botLeftLink != botRightLink) {
                            break;
                        }

                        // Now that we've made sure we're actually intersecting with the same string, calculate the DT code stuff.
                        const id = `${breakX},${breakY}`; // Unique identifier for a crossing
                        if (!dtCrossings.hasOwnProperty(id)) {
                            dtCrossings[id] = {}; // init the object if it doesn't already exist for this key
                        }

                        if (dtCount % 2 == 0) { // If it is even
                            // ColOddParity defines whether the top-most part of the shape goes over or under for a crossing. True = over; false = under
                            const colOddParity = (x % 2) == 1;

                            // Determine if we're looking at the top break.
                            const lookingAtTopBreak = xdir > 0 ? breakDependency == TR_BL : breakDependency == TL_BR; // If going right, see if we're depending on TR break & vice versa
                            var crossOver = colOddParity === lookingAtTopBreak; // If the vals are the same we say it's crossing over.

                            // Even numbers that cross over are put in as negatives
                            dtCrossings[id].even = crossOver ? -dtCount++ : dtCount++;
                        }
                        else {
                            dtCrossings[id].odd = dtCount++;
                        }
                        break;
                }

                // Move the x and y (if x and y were not flipped).
                if (!flippedX) x += xdir;
                if (!flippedY) y += ydir;
            }
            while (x != startX || y != startY);

            // Actually place the DT code in DT_CODES
            // Step 1: Extract entries from the object
            const entries = Object.entries(dtCrossings);

            // Step 2: Sort entries by the `odd` property
            entries.sort((a, b) => a[1].odd - b[1].odd);

            // Step 3: Generate the desired string from the `even` property
            const result = entries.map(entry => entry[1].even).join(" ");
            return result;
        }
    }

    // #region -- FREESTYLE --
    /**
     * Undoes the last move.
     */
    this.undo = function () {
        if (movesIdx > 0) {
            movesIdx--; // Shift back one in the index of MOVES

            // Get the undone value
            var vals = UNDO.pop();
            var x = vals[0][0];
            var y = vals[0][1];
            var type = vals[1];

            // Apply the undone break (UNDO tracks what was previously there)
            this.applyBreak(x, y, type, MUTABLE);
        }
    }

    /**
     * Redoes the last undone move.
     */
    this.redo = function () {
        if (movesIdx < MOVES.length - 1) {
            movesIdx++;

            // Get the values to redo
            var vals = MOVES[movesIdx];
            var x = vals[0][0];
            var y = vals[0][1];
            var type = vals[1];

            // Apply the redo:
            type = this.applyBreak(x, y, type, MUTABLE);

            // Add what the break used to be to undo:
            UNDO.push([[x, y], type]);
        }
    }

    /**
     * @returns MOVES array (except the first element, as it is blank due to the code logic).
     */
    this.getAllMoves = function () {
        return MOVES.slice(1, movesIdx + 1);;
    }
    // #endregion

    // #region -- LINKER VS KNOTTER --
    // #endregion
    // #endregion

    // #region ---- INITIALIZATION ----
    /**
     * Initializes the grid & break matrices, and automatically applies the necessary breaks around the grid's border.
     * 
     * Notes:
     * - Breaks are stored in breaks[WIDTH + 1][HEIGHT + 1]
     *  - +1 is because we track the borders as forced "breaks" for ease of computation
     * - Each "break" is stored as an array of length = 2 (AKA a tuple), storing:
     *  - The break type (VERT, HORIZ, NO BREAK)
     *  - Break mutability (whether it can be modified in the future) (true = MUTABLE, false = IMMUTABLE/permanent break)
     */
    this.init = function () {
        // Initialize the grid matrix
        for (let i = 0; i < GRID_WIDTH * 2; i++) {
            GRID[i] = new Array(GRID_HEIGHT * 2);

            // Draw the grid lines in
            for (let j = 0; j < GRID_HEIGHT * 2; j++) {
                // 1. Draw the outline of the tile
                var lineMat = new THREE.LineBasicMaterial({ color: TILE_OUTLINE_COLOR });
                var points = [];

                var currX = OFFSETX + i * TILE_SIZE;
                var currY = OFFSETY + j * TILE_SIZE;

                points.push(new THREE.Vector3(currX, currY + TILE_SIZE, -400));
                points.push(new THREE.Vector3(currX + TILE_SIZE, currY + TILE_SIZE, -400));
                points.push(new THREE.Vector3(currX + TILE_SIZE, currY, -400));
                points.push(new THREE.Vector3(currX, currY, -400));
                points.push(new THREE.Vector3(currX, currY + TILE_SIZE, -400));
                var lineGeom = new THREE.BufferGeometry().setFromPoints(points);
                var line = new THREE.Line(lineGeom, lineMat);

                GRID_LINES.push(line);
                scene.add(line);
            }
        }

        // Initialize the breaks + crossings (they work in conjunction)
        for (let i = 0; i < GRID_WIDTH * 2 + 1; i++) {
            BREAKS[i] = new Array(GRID_HEIGHT * 2 + 1);

            // Fill the grid
            for (let j = 0; j < GRID_HEIGHT * 2 + 1; j++) {
                // Fill the border as permanent breaks when necessary
                if (i == 0 || j == 0 || i == GRID_WIDTH * 2 || j == GRID_HEIGHT * 2) {
                    // Corners we can ignore and treat as either VERT or HORIZ breaks (they are not ever read)
                    // Left \ Right borders are vertical breaks
                    if (i == 0 || i == GRID_WIDTH * 2) {
                        BREAKS[i][j] = {
                            type: VERT_BREAK,
                            mutability: IMMUTABLE
                        };
                    }
                    // Top \ Bottom borders are horizontal breaks
                    else {
                        BREAKS[i][j] = {
                            type: HORIZ_BREAK,
                            mutability: IMMUTABLE
                        };
                    }
                }
                // Non-border places fill as "NO BREAK", MUTABLE
                else {
                    BREAKS[i][j] = {
                        type: NO_BREAK,
                        mutability: MUTABLE
                    };

                    // On non-border crossings, fill the crossing w/ the coordinates and the mutability.
                    if ((i + j) % 2 == 1) { // i + j is odd = crossing is there
                        CROSSINGS.push({
                            position: {
                                col: i,
                                row: j
                            },
                            mutability: MUTABLE
                        });
                    }
                }
            }
        }

        this.render();
    }

    // #region ---- MOUSE EVENT LISTENERS ----
    // Add mouse movement listener for putting in hover indicators
    const doMouseMove = (event) => {
        // Only do anything if the grid is enabled (meaning it can be played on)
        if (_enabled) {
            // Determine if the mouse is even on the canvas element to begin with.
            var rect = myCanvas.getBoundingClientRect();
            var mouseX = event.clientX;
            var mouseY = event.clientY;
            var withinBounds = mouseX >= rect.left && mouseX <= rect.right &&
                mouseY >= rect.top && mouseY <= rect.bottom;

            // If the mouse is on the canvas element, pass the cursor information to the grid to determine if a selection hover needs to be made.
            if (withinBounds) {
                this.pollCrossingHoverIndicator(event, rect);
            }
        }
        else if (_hoveredCrossing) { // If not enabled, remove the indicator if it exists
            removeHoverIndicator(_hoveredCrossing.indicator);
        }
    }
    document.addEventListener('mousemove', doMouseMove);

    // Add the mouse click event for crossing selection
    const doClick = (event) => {
        // Only do anything if the grid is enabled (meaning it can be played on)
        if (_enabled) {
            // Determine if the mouse is even on the canvas element to begin with.
            var rect = myCanvas.getBoundingClientRect();
            var mouseX = event.clientX;
            var mouseY = event.clientY;
            var withinBounds = mouseX >= rect.left && mouseX <= rect.right &&
                mouseY >= rect.top && mouseY <= rect.bottom;

            // If the mouse is on the canvas element, pass the cursor information to the grid to determine if a selection hover needs to be made.
            if (withinBounds) {
                this.onMouseClick(event, rect);
            }
        }
    }
    document.addEventListener('click', doClick);
    // #endregion
    // #endregion

    // #region ---- DISPOSAL ----
    /**
     * Disposes all objects from this so it can be garbage collected.
     */
    this.dispose = function () {
        // 1. Clear the board (already properly disposes)
        this.clear();

        // 2. Dispose of the GRID_LINES
        for (let i = 0; i < GRID_LINES.length; i++) {
            var gridLine = GRID_LINES[i];

            scene.remove(gridLine);
            // Dispose of the geometry to free up memory
            if (gridLine.geometry) {
                gridLine.geometry.dispose();
            }

            // Dispose of the material if it exists and isn't shared
            if (gridLine.material && gridLine.material.dispose) {
                gridLine.material.dispose();
            }

            GRID_LINES[i] = null;
        }

        // 3. If a hovered indicator or menu exist, dispose of them
        if (_hoveredCrossing) {
            removeHoverIndicator(_hoveredCrossing.indicator);
            _hoveredCrossing = null;
        }

        if (_menu) {
            _menu.dispose();
            _menu = null;
        }

        // 4. Remove the mouse event listeners
        document.removeEventListener('mousemove', doMouseMove);
        document.removeEventListener('click', doClick);
    }
    // #endregion

    // #region ---- BREAK MENU OBJECT ----
    /**
     * Class that represents the break menu and its options
     */
    class Menu {
        #SEGMENT_WIDTH = TILE_SIZE * 1.75;
        #SEGMENT_HEIGHT = TILE_SIZE * 1.5;
        #ELEMENTS = [];
        #BORDER_SIZE = 3;

        // Build the menu at construction
        constructor(startX, startY, breakTypes) {
            // Determine if the menu will be drawn going upward, downward, and will it be drawn on the left or right.
            // Start by trying top-down. Will it go out-of-bounds in y?
            var baseX = OFFSETX + startX * TILE_SIZE;
            var baseY = OFFSETY + startY * TILE_SIZE;

            const width = this.#SEGMENT_WIDTH + this.#BORDER_SIZE;
            const height = this.#SEGMENT_HEIGHT * breakTypes.length + this.#BORDER_SIZE;

            var drawRight = true;
            var drawDown = true;

            // Determine whether we're drawing it to the left or to the right.
            if ((baseX + width) >= 100) { // If we exceed the right-most boundary of the scene
                drawRight = false;
            }

            // Determine whether we're drawing it up or down
            if ((baseY - height) <= -100) { // If we exceed the bottom-most boundary of the scene
                drawDown = false;
            }

            // Draw the break options:
            var x = baseX;
            var y = baseY;
            for (let i = 0; i < breakTypes.length; i++) {
                this.#drawBreakOption(x, y, breakTypes[i], drawRight, drawDown);
                y += (this.#SEGMENT_HEIGHT + BORDER_SIZE / 2) * (drawDown ? -1 : 1); // Flip the offset depending on which direction we're drawing in
            }
        }

        // #region ---- RENDERING / DRAWING ----
        /**
         * Dynamically draws the break option for the menu.
         * 
         * @param {Number} startX starting X position.
         * @param {Number} startY starting Y position.
         * @param {Number} breakType type of break.
         * @param {Boolean} drawRight whether we are drawing to the right or left.
         * @param {Boolean} drawDown whether we are drawing downward or upward.
         */
        #drawBreakOption(startX, startY, breakType, drawRight, drawDown) {
            // Define the x based on whether it should be drawn on the right or left of the selection.
            const x = startX + (drawRight ? this.#SEGMENT_WIDTH : -this.#SEGMENT_WIDTH) / 2 +
                (drawRight ? this.#BORDER_SIZE : -this.#BORDER_SIZE) / 2;
            // Define the y based on whether it should be drawn on the left or the right of the selection.
            const y = startY + (drawDown ? -this.#SEGMENT_HEIGHT : this.#SEGMENT_HEIGHT) / 2 +
                (drawDown ? -this.#BORDER_SIZE : this.#BORDER_SIZE) / 2;

            // Define the element
            var geom = new THREE.PlaneGeometry(this.#SEGMENT_WIDTH, this.#SEGMENT_HEIGHT);
            var mat = new THREE.MeshBasicMaterial({ color: 0xeeeeee });
            var mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(x, y, 12);

            // Define the border
            var borderGeom = new THREE.PlaneGeometry((this.#SEGMENT_WIDTH + this.#BORDER_SIZE), (this.#SEGMENT_HEIGHT + this.#BORDER_SIZE));
            var borderMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
            var borderMesh = new THREE.Mesh(borderGeom, borderMat);
            borderMesh.position.set(x, y, 11);

            // Add the text to the element
            const label = this.#addTextToElement(x, y, breakType);

            // Group them and add them to the scene
            var group = new THREE.Group();
            group.add(mesh);
            group.add(borderMesh);
            group.add(label);
            scene.add(group);

            // Add the element to #ELEMENTS
            this.#ELEMENTS.push({
                threeObj: group,
                breakType: breakType,
                rect: {
                    top: y + (this.#SEGMENT_HEIGHT + this.#BORDER_SIZE) / 2,
                    bottom: y - (this.#SEGMENT_HEIGHT + this.#BORDER_SIZE) / 2,
                    left: x - (this.#SEGMENT_WIDTH + this.#BORDER_SIZE) / 2,
                    right: x + (this.#SEGMENT_HEIGHT + this.#BORDER_SIZE) / 2
                },
                label: label
            });
        }

        /**
         * Enters text (using HTML) where the element is on the board. This will likely make the text more legible (though if the board shrinks this may cause issues).
         * 
         * @param {Number} x X coordinate where the element is drawn
         * @param {Number} y Y coordinate where the element is drawn
         * @param {breakType} breakType type of break (NO_BREAK, VERT_BREAK, HORIZ_BREAK)
         */
        #addTextToElement(x, y, breakType) {
            // Identify the break type, and determine the innerHTML that should be used accordingly.
            var innerText = "";
            switch (breakType) {
                case NO_BREAK:
                    innerText = "No Break";
                    break;
                case VERT_BREAK:
                    innerText = "Vertical<br>Break";
                    break;
                case HORIZ_BREAK:
                    innerText = "Horizontal<br>Break";
                    break;
            }

            // Create the div element and populate the text
            const div = document.createElement('div');
            div.style.fontSize = _fontSize;
            div.innerHTML = innerText;
            div.style.color = 'black';
            div.style.left = '0px';

            const label = new CSS2DObject(div);
            label.position.set(x, y, 0);

            // Add the div to the "LABELS" array (which just makes sure the font size is appropriate upon resizing)
            LABELS.push(div);

            // Also, return the label to the caller (so that it can be added to #ELEMENTS)
            return label;
        }
        // #endregion

        // #region ---- SELECTION ----
        /**
         * Returns the breakType of the selection if the mouse was within a selection. Otherwise we return null.
         * 
         * @param {Number} mouseX X position of the mouse.
         * @param {Number} mouseY Y position of the mouse.
         * @returns breakType if the mouse is within an element, and null otherwise.
         */
        makeSelection(mouseX, mouseY) {
            // Mouse coords are 0 to GRID_WIDTH * TILE_SIZE * 2. Make it so it's -GRID_WIDTH * TILE_SIZE to GRID_WIDTH * TILE_SIZE (world coordinates). Same for height
            const trueMouseX = mouseX * 2 - GRID_WIDTH * TILE_SIZE;
            const trueMouseY = mouseY * 2 - GRID_HEIGHT * TILE_SIZE;
            var breakType = null;

            // Look through each element to see if we clicked on one.
            this.#ELEMENTS.forEach(element => {
                // Determine the bounds
                var leftBound = element.rect.left;
                var rightBound = element.rect.right;
                var topBound = element.rect.top;
                var bottomBound = element.rect.bottom;

                // If the mouse is within the bounds of this element
                if (trueMouseX >= leftBound && trueMouseX <= rightBound &&
                    trueMouseY <= topBound && trueMouseY >= bottomBound) {
                    breakType = element.breakType; // Assign the breakType
                }
            });

            // If we never found an element, the breakType remains null.
            return breakType;
        }
        // #endregion

        // #region ---- DISPOSAL ----
        /**
         * Dispose of the menu properly.
         */
        dispose() {
            // Dispose of everything properly.
            for (let i in this.#ELEMENTS) {
                // First, handle the THREE.js objects
                let group = this.#ELEMENTS[i].threeObj;
                if (group) {
                    scene.remove(group);
                    // Remove each TubeGeometry object from the scene
                    group.children.forEach(child => {

                        // Dispose of the geometry to free up memory
                        if (child.geometry) {
                            child.geometry.dispose();
                        }

                        // Dispose of the material if it exists and isn't shared
                        if (child.material && child.material.dispose) {
                            child.material.dispose();
                        }
                    });

                    // Next, handle the labels that go along with the element
                    let label = this.#ELEMENTS[i].label;
                    if (label) {
                        // Remove the CSS2DObject from the group
                        group.remove(label);

                        // Dispose of the associated HTML element (optional, but good for memory cleanup)
                        const div = label.element;
                        if (div && div.parentNode) {
                            div.parentNode.removeChild(div); // Remove the label from the DOM
                        }
                    }
                }
            }

            this.#ELEMENTS = []; // Remove all dangling references.
        }
        // #endregion
    }

    /**
     * Sets the font size for the labels.
     * 
     * @param {CSS fontSize} fontSize CSS-style fontSize ('#px')
     */
    this.setFontSize = function (fontSize) {
        _fontSize = fontSize;
    }

    /**
     * @returns the font size for the labels
     */
    this.getFontSize = function () {
        return _fontSize;
    }
    // #endregion
}