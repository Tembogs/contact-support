import { defineConfig } from "prisma/config";
import dotenv from "dotenv";
if (process.env.NODE_ENV === "test") {
    dotenv.config({ path: ".env.test" });
}
else {
    dotenv.config();
}
export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
    },
    datasource: {
        url: process.env.DATABASE_URL,
    },
});
