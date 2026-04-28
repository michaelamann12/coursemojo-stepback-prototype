import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import express from "express";
import postgraphilePkg from "postgraphile";
import ConnectionFilterPlugin from "postgraphile-plugin-connection-filter";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, ".env") });

const { default: postgraphile } = postgraphilePkg;

const {
  DB_USER_MOJO_LIBRARY, DB_PASSWORD_MOJO_LIBRARY, DB_HOST_MOJO_LIBRARY = "localhost",
  DB_PORT_MOJO_LIBRARY = "5432", DB_NAME_MOJO_LIBRARY = "aiactivitiesadmin",
} = process.env;

if (!DB_USER_MOJO_LIBRARY) {
  console.error("DB_USER_MOJO_LIBRARY is not set. Copy graphql/.env.example to graphql/.env and fill in your credentials.");
  process.exit(1);
}

const connectionString = `postgres://${DB_USER_MOJO_LIBRARY}:${DB_PASSWORD_MOJO_LIBRARY}@${DB_HOST_MOJO_LIBRARY}:${DB_PORT_MOJO_LIBRARY}/${DB_NAME_MOJO_LIBRARY}`;

const app = express();
const PORT = process.env.POSTGRAPHILE_PORT_MOJO_LIBRARY ?? 5002;

app.use(
  postgraphile(connectionString, "public", {
    watchPg: true,
    graphiql: true,
    enhanceGraphiql: true,
    dynamicJson: true,
    disableDefaultMutations: true,
    extendedErrors: ["hint", "detail", "errcode"],
    appendPlugins: [ConnectionFilterPlugin],
  })
);

app.listen(PORT, () => {
  console.log(`PostGraphile (Mojo Library) running on http://localhost:${PORT}`);
  console.log(`  GraphQL endpoint: http://localhost:${PORT}/graphql`);
  console.log(`  GraphiQL explorer: http://localhost:${PORT}/graphiql`);
  console.log(`  Connected to: ${DB_NAME_MOJO_LIBRARY} on ${DB_HOST_MOJO_LIBRARY}:${DB_PORT_MOJO_LIBRARY}`);
});
