import fs from 'fs';
import {createConnection} from 'mysql2/promise';

async function runSQLScript() {
  const connection = await createConnection({
    host: 'localhost',
    user: 'root',
    password: 'your_password',
    database: 'your_database',
    multipleStatements: true
  });

  const sql = fs.readFileSync('./script.sql', 'utf8');

  try {
    await connection.query(sql);
    console.log('SQL script executed successfully.');
  } catch (err) {
    console.error('Error executing SQL script:', (err as Error).message);
  }
}

runSQLScript();
