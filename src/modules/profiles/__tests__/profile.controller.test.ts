import { ProfileController } from "../profile.controllers";
import { ProfileService } from "../profile.services";
import { Role } from "@prisma/client";

jest.mock("../profile.services");

describe("ProfileController", () => {
  const mockReq: any = {};
  const mockRes: any = {
    json: jest.fn(),
    status: jest.fn().mockReturnThis(),
  };

  const expertId = "expert-id";

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq.user = { userId: expertId, role: Role.EXPERT };
  });

  it("update should call ProfileService.updateProfile", async () => {
    const mockProfile = { id: "123", bio: "updated" };
    (ProfileService.updateProfile as jest.Mock).mockResolvedValue(mockProfile);

    mockReq.body = { bio: "updated", skills: ["TS"] };
    await ProfileController.update(mockReq, mockRes);

    expect(ProfileService.updateProfile).toHaveBeenCalledWith(expertId, { bio: "updated", skills: ["TS"] });
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Profile updated!", profile: mockProfile });
  });

  it("getMe should return profile", async () => {
    const mockProfile = { id: "123", bio: "bio", calculatedRating: "4.5" };
    (ProfileService.getProfile as jest.Mock).mockResolvedValue(mockProfile);

    await ProfileController.getMe(mockReq, mockRes);

    expect(ProfileService.getProfile).toHaveBeenCalledWith(expertId);
    expect(mockRes.json).toHaveBeenCalledWith(mockProfile);
  });

  it("getUserProfile should return user profile", async () => {
    const userId = "user-id";
    const mockProfile = { email: "user@test.com", name: "User", role: Role.USER };
    (ProfileService.getUserProfile as jest.Mock).mockResolvedValue(mockProfile);

    mockReq.params = { id: userId };
    await ProfileController.getUserProfile(mockReq, mockRes);

    expect(ProfileService.getUserProfile).toHaveBeenCalledWith(userId);
    expect(mockRes.json).toHaveBeenCalledWith(mockProfile);
  });
});
