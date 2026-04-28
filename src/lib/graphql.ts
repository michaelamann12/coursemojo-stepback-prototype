/**
 * Typed GraphQL query helper.
 *
 * Usage:
 *
 *   import { query } from "@lib/graphql";
 *
 *   const data = await query<{ allSessions: { nodes: Session[] } }>(`
 *     query {
 *       allSessions(first: 10, orderBy: CREATED_TIMESTAMP_DESC) {
 *         nodes {
 *           id
 *           userId
 *           percentageComplete
 *         }
 *       }
 *     }
 *   `);
 *
 * The Vite dev server proxies /graphql to the PostGraphile server running on
 * localhost:5001, so no port or host is needed here.
 */

interface GraphQLResponse<T> {
  data: T;
  errors?: { message: string; locations?: unknown; path?: unknown }[];
}

export async function query<T>(
  gql: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const response = await fetch("/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: gql, variables }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
  }

  const json: GraphQLResponse<T> = await response.json();

  if (json.errors?.length) {
    const messages = json.errors.map((e) => e.message).join("\n");
    throw new Error(`GraphQL errors:\n${messages}`);
  }

  return json.data;
}
