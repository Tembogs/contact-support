import { execSync } from "child_process";
import path from "path";

export default async () => {
  console.log("▶ Running migrations for TEST DB...");

  execSync(
    "npx prisma migrate deploy",
    {
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_ENV: "test",
        DOTENV_CONFIG_PATH: path.resolve(".env.test"),
      },
    }
  );
};
