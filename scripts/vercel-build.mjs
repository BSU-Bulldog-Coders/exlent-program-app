// Vercel runs `vercel-build` instead of `build` when it exists.
//
// Production deploys: apply pending migrations, seed the first admin (a no-op
// once any admin exists), then build. `prisma migrate deploy` only applies
// migrations that are not yet recorded in the database, so a deploy with no
// schema change does nothing here. Preview deploys skip both so they never
// write to the production database.
import { spawnSync } from "node:child_process";

function run(command, args) {
  console.log(`\n> ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) {
    console.error(`\n${command} ${args[0]} failed; aborting the deployment.`);
    process.exit(result.status ?? 1);
  }
}

if (process.env.VERCEL_ENV === "production") {
  run("prisma", ["migrate", "deploy"]);
  run("tsx", ["--conditions", "react-server", "prisma/seed.ts"]);
} else {
  console.log(`VERCEL_ENV=${process.env.VERCEL_ENV ?? "(unset)"}: skipping migrations and seed.`);
}

run("next", ["build"]);
