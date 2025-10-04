const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',         // your MySQL username
    password: 'admin', // your MySQL password
    database: 'devoura'
});

db.connect((err) => {
    if (err) {
        console.error('DB connection failed:', err);
    } else {
        console.log('Connected to MySQL database!');
    }
});

module.exports = db;
