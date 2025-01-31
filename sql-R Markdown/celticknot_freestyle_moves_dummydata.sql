-- Inserting sample data into Freestyle_moves with updated move names
CALL insert_freestyle_move(1, 'x5y8', 'Horizontal Break', TRUE);
CALL insert_freestyle_move(1, 'x6y9', 'Vertical Break', TRUE);
CALL insert_freestyle_move(2, 'x7y2', 'Horizontal Break', FALSE);
CALL insert_freestyle_move(2, 'x8y3', 'Vertical Break', FALSE);
