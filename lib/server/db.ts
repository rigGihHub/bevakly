import { neon } from "@neondatabase/serverless";

export const DEFAULT_ORGANIZATION_ID = "11111111-1111-4111-8111-111111111111";

export function getOrganizationId() {
  return process.env.BEVAKLY_ORGANIZATION_ID?.trim() || DEFAULT_ORGANIZATION_ID;
}

export function getDatabase() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) return null;
  return neon(connectionString);
}

export async function ensureOrganization() {
  const sql = getDatabase();
  if (!sql) return { sql: null, organizationId: getOrganizationId() };
  const organizationId = getOrganizationId();
  await sql`
    insert into organizations (id, name, industry, geography)
    values (${organizationId}::uuid, 'Bevakly', 'Avfall & återvinning', '{}'::jsonb)
    on conflict (id) do nothing
  `;
  return { sql, organizationId };
}

export function databaseErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "Okänt databasfel");
  if (/relation .* does not exist/i.test(message)) {
    return "Neon är anslutet men Bevaklys databastabeller är inte skapade ännu.";
  }
  return message;
}
