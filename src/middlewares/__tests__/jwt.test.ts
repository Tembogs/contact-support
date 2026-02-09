
import jwt from "jsonwebtoken";
import { verifyToken } from "../jwt";

const JWT_SECRET = process.env.JWT_SECRET!;

describe("verifyToken", () => {
  it("should decode a valid token and return userId and role", () => {
    // Arrange: create a token
    const payload = { userId: "123", role: "ADMIN" };
    const token = jwt.sign(payload, JWT_SECRET);
    // Act
    const decoded = verifyToken(token);
    // Assert
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.role).toBe(payload.role);
  });

  it("should throw an error if token is invalid", () => {
    const invalidToken = "this.is.invalid";

    expect(() => verifyToken(invalidToken)).toThrow(/invalid/);
  });

  it("should throw an error if token is expired", () => {
    // create a token that expires immediately
    const payload = { userId: "456", role: "USER" };
    const expiredToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "1ms" });
    // wait a tiny bit to ensure expiration
    return new Promise((resolve) => setTimeout(resolve, 5)).then(() => {
      expect(() => verifyToken(expiredToken)).toThrow("jwt expired");
    });
  });
});
