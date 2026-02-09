import request from "supertest";
import app from "../app";

describe("App bootstrap", () => {
  it("responds to health route fallback", async () => {
    const res = await request(app).get("/api/auth");

    expect(res.status).not.toBe(500);
  });
});
