import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import express from "express";
import postgraphilePkg from "postgraphile";

// Load .env from the graphql/ directory regardless of where npm runs from.
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, ".env") });

const { default: postgraphile } = postgraphilePkg;

// ---------------------------------------------------------------------------
// Connection
// ---------------------------------------------------------------------------
// Copy .env.example to .env and fill in your local credentials.
// These match the variable names used in mojo/main/data/.env.
const { DB_USER, DB_PASSWORD, DB_HOST = "localhost", DB_PORT = "5432", DB_NAME = "coursemojo" } = process.env;

if (!DB_USER) {
  console.error("DB_USER is not set. Copy graphql/.env.example to graphql/.env and fill in your credentials.");
  process.exit(1);
}

const connectionString = `postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------
const app = express();
const PORT = process.env.POSTGRAPHILE_PORT ?? 5001;

app.use(
  postgraphile(connectionString, "public", {
    // Re-introspect the schema whenever it changes — useful during development.
    watchPg: true,

    // Serve the GraphiQL visual query editor at /graphiql.
    graphiql: true,
    enhanceGraphiql: true,

    // Return JSON values from JSON/JSONB columns as parsed objects rather than
    // raw strings — much easier to work with in the frontend.
    dynamicJson: true,

    // Disable write mutations. This adapter is intended for read-only data
    // exploration during the lab. Remove this line if you need to write data.
    disableDefaultMutations: true,

    // Surface detailed errors in development so engineers can see exactly what
    // went wrong without digging through server logs.
    extendedErrors: ["hint", "detail", "errcode"],
  })
);

app.listen(PORT, () => {
  console.log(`PostGraphile running on http://localhost:${PORT}`);
  console.log(`  GraphQL endpoint: http://localhost:${PORT}/graphql`);
  console.log(`  GraphiQL explorer: http://localhost:${PORT}/graphiql`);
  console.log(`  Connected to: ${DB_NAME} on ${DB_HOST}:${DB_PORT}`);
});
