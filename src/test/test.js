import { createPool } from "mysql2/promise";
import { exit } from "process";

async function an() {
  let pool = createPool({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "root",
  });

  let res = await pool.query("SELECT * FROM `bot`.`guild`");
  console.log(res);

  
  exit(0);
}

an();
