import { ProfileService } from "./profile.services";
export class ProfileController {
    static async update(req, res) {
        try {
            const profile = await ProfileService.updateProfile(req.user.userId, req.body);
            res.json({ message: "Profile updated!", profile });
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    static async getMe(req, res) {
        try {
            const profile = await ProfileService.getProfile(req.user.userId);
            res.json(profile);
        }
        catch (error) {
            res.status(404).json({ message: error.message });
        }
    }
    static async getUserProfile(req, res) {
        try {
            const profile = await ProfileService.getUserProfile(req.params.id);
            res.json(profile);
        }
        catch (error) {
            res.status(404).json({ message: error.message });
        }
    }
}
