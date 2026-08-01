import dotenv from "dotenv";
import MassClient from "./Client";

dotenv.config();

const client = new MassClient("debug");

const { TOKEN } = process.env;

client.login(TOKEN);
