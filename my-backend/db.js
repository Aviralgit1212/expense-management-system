const mysql = require('mysql2');
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'your_mysql_password', // <-- set your actual MySQL password here
    database: 'your_db'
});
module.exports = db;
