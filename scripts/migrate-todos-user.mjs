// Assigns legacy todos (no userId) to an existing user.
// Usage: node --env-file=.env scripts/migrate-todos-user.mjs <github-username> [--dry-run]
import mongoose from "mongoose";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const username = args.find((a) => !a.startsWith("--"));

if (!username) {
  console.error("Usage: migrate-todos-user.mjs <github-username> [--dry-run]");
  process.exit(1);
}
if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not set (use --env-file=.env).");
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);
try {
  const db = mongoose.connection.db;
  // username is not unique (GitHub renames), so refuse to guess between accounts.
  const matches = await db.collection("users").find({ username }).limit(2).toArray();
  const user = matches.length === 1 ? matches[0] : null;
  if (matches.length === 0) {
    console.error(`No user "${username}". Log in with that account once, then re-run.`);
    process.exitCode = 1;
  } else if (!user) {
    console.error(`More than one user is named "${username}". Refusing to guess; nothing changed.`);
    process.exitCode = 1;
  } else {
    const filter = { userId: { $exists: false } };
    const count = await db.collection("todos").countDocuments(filter);
    if (dryRun) {
      console.log(`[dry-run] ${count} todo(s) would be assigned to ${username}.`);
    } else {
      const res = await db
        .collection("todos")
        .updateMany(filter, { $set: { userId: user._id } });
      console.log(`Assigned ${res.modifiedCount} todo(s) to ${username}.`);
    }
  }
} finally {
  await mongoose.disconnect();
}
