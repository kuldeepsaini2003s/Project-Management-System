import prisma from "../config/db.js";

// Build a short uppercase prefix from a name, e.g. "Algofolks" -> "ALG".
const baseKey = (name) => {
  const letters = (name || "TEAM").replace(/[^a-zA-Z]/g, "").toUpperCase();
  return (letters.slice(0, 3) || "TEAM").padEnd(2, "X");
};

// Ensure the key is unique within the workspace (append a number if needed).
export const uniqueTeamKey = async (workspaceId, name) => {
  const base = baseKey(name);
  let key = base;
  let n = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await prisma.team.findUnique({ where: { workspaceId_key: { workspaceId, key } } })) {
    n += 1;
    key = `${base}${n}`;
  }
  return key;
};
