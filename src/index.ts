import * as dotenv from "dotenv";
import SuwaBot from "./bot/SuwaBot";

dotenv.config();

const { TOKEN, CLIENT_ID } = process.env;

if (TOKEN && CLIENT_ID) {
  const client = new SuwaBot(CLIENT_ID);
  client.start(TOKEN);
} else {
  console.error("Token is empty !");
}
