import React, { useRef, useEffect, useImperativeHandle } from 'react';
import Game from '../board_functionality/game.js';
import "../css/freestylegame.css"; // style sheet

const CelticKnotBoard = React.forwardRef(({ gridWidth, gridHeight, gameType, colorComponent, callback }, ref) => {
  const gameRef = useRef(null);

  useEffect(() => {
    gameRef.current = new Game(gridWidth, gridHeight, gameType, colorComponent, callback);

    return () => {
      gameRef.current.dispose();
    }
  }, []);

  // Expose undo and redo to the parent component
  useImperativeHandle(ref, () => ({
    undo: () => gameRef.current.undo(),
    redo: () => gameRef.current.redo(),
    getAllMoves: () => gameRef.current.getAllMoves(),
    exportBoard: () => gameRef.current.saveGridAsPNG(),
    identifyKnots: () => gameRef.current.getDTCodes(),
    applyMove: (move) => gameRef.current.applyMove(move),
    disable: () => gameRef.current.disable(),
    enable: () => gameRef.current.enable(),
    enableNoBreaks: () => gameRef.current.enableNoBreaks(),
    disableNoBreaks: () => gameRef.current.disableNoBreaks(),
    restartGame: () => gameRef.current.restartGame(),
    getSnapshot: () => gameRef.current.getSnapshot()
  }));

  return (
    <div id="canvasContainer">
      <canvas id="gameCanvas"></canvas>
    </div>
  );
});

export default CelticKnotBoard;
