import dotenv from "dotenv";
import MassClient from "./Client";

dotenv.config();

const client = new MassClient("default");

const { TOKEN } = process.env;

client.login(TOKEN);
