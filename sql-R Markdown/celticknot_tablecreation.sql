USE Celticknots;

DROP TABLE IF EXISTS Linker_v_knotter_stats;

DROP TABLE IF EXISTS global_statistics;

-- Recreate the tables
CREATE TABLE Linker_v_knotter_stats (
    Gamekey INT PRIMARY KEY,
    DT_Code VARCHAR(100), 
    linkerwins BOOLEAN,
    knotterwins BOOLEAN,
    breakpoint TIMESTAMP,
    FOREIGN KEY (DT_Code) REFERENCES knotinfo(dt_notation) 
    ON UPDATE CASCADE 
    ON DELETE CASCADE
);


CREATE TABLE global_statistics (
    total_games INT,
    linker_wins INT,
    knotter_wins INT,
    breakpoint TIMESTAMP,
    PRIMARY KEY (total_games)
);
