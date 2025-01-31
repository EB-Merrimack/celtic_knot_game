const mysql = require('mysql2/promise'); // Use promise-based interface

// Create a pool
let pool;

/**
 * Creates a connection pool to the database if one does not exist.
 * Otherwise, returns the existing pool.
 * @returns {Promise<Pool>} - The database connection pool.
 */
function connectToDatabase() {
    if (!pool) {
        pool = mysql.createPool({
            host: 'localhost',
            user: 'root',
            password: 'Disney2025',
            database: 'celticknots',
            waitForConnections: true,
            connectionLimit: 10, // Adjust based on your server's capacity
            queueLimit: 0
        });

        console.log('Database connection pool created.');
    }
    return pool;
}

/**
 * Closes the database connection pool, if it exists.
 * This should be called when the server is about to exit.
 * @returns {Promise<void>}
 */
async function closeConnections() {
    if (pool) {
        try {
            await pool.end();
            console.log('Database connection pool closed.');
        } catch (err) {
            console.error('Error closing the database connection pool:', err);
        }
    }
}

module.exports = { connectToDatabase, closeConnections };
