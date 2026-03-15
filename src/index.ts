import MassClient from "./Client";

const client = new MassClient();

const { TOKEN } = process.env;

client.login(TOKEN);
