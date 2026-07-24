const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True if the id looks like a real Postgres uuid (vs a client-generated mock id like "prod-123"). */
export const isUuid = (id: string) => UUID_RE.test(id);
