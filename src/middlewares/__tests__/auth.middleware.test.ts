import { authMiddleware, AuthRequest } from "../auth.middleware";
import { verifyToken } from "../jwt";
import { Request, Response, NextFunction } from "express";

// Mock verifyToken
jest.mock("../jwt");

const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;

describe("authMiddleware", () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    mockVerifyToken.mockReset();
  });

  it("should return 401 if no Authorization header", () => {
    authMiddleware()(req as AuthRequest, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Not Authorized" });
  });

  it("should return 401 if token is missing", () => {
    req.headers = { authorization: "Bearer" };
    authMiddleware()(req as AuthRequest, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Token missing" });
  });

  it("should return 401 if token is invalid", () => {
    req.headers = { authorization: "Bearer fake-token" };
    mockVerifyToken.mockImplementation(() => {
      throw new Error("Invalid token");
    });

    authMiddleware()(req as AuthRequest, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid or expired token" });
  });

  it("should return 403 if role is not allowed", () => {
    req.headers = { authorization: "Bearer valid-token" };
    mockVerifyToken.mockReturnValue({ userId: "123", role: "USER" });

    authMiddleware(["ADMIN"])(req as AuthRequest, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Forbidden: Insufficient permissions" });
  });

  it("should call next if token is valid and role is allowed", () => {
    req.headers = { authorization: "Bearer valid-token" };
    mockVerifyToken.mockReturnValue({ userId: "123", role: "ADMIN" });

    authMiddleware(["ADMIN"])(req as AuthRequest, res as Response, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ userId: "123", role: "ADMIN" });
  });

  it("should call next if no roles specified", () => {
    req.headers = { authorization: "Bearer valid-token" };
    mockVerifyToken.mockReturnValue({ userId: "456", role: "USER" });

    authMiddleware()(req as AuthRequest, res as Response, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ userId: "456", role: "USER" });
  });
});
