import prisma from "../../config/prisma";
export class ProfileService {
    // Update expert bio and skills
    static async updateProfile(userId, data) {
        return prisma.$transaction(async (tx) => {
            // 1. Update/Create the profile & bio
            const profile = await tx.expertProfile.upsert({
                where: { userId },
                update: { bio: data.bio },
                create: { userId, bio: data.bio },
            });
            // 2. Refresh skills (Delete old ones and add new ones)
            await tx.skill.deleteMany({ where: { expertId: profile.id } });
            if (data.skills.length > 0) {
                await tx.skill.createMany({
                    data: data.skills.map((skillName) => ({
                        name: skillName,
                        expertId: profile.id,
                    })),
                });
            }
            return profile;
        });
    }
    // Get profile WITH joined skills and average rating
    static async getProfile(userId) {
        const profile = await prisma.expertProfile.findUnique({
            where: { userId },
            include: {
                skills: true,
                user: {
                    select: {
                        email: true,
                        // JOIN: Get all reviews for this specific user
                        reviewsReceived: true,
                    },
                },
            },
        });
        if (!profile)
            throw new Error("Profile not found");
        // Calculate actual average from the Reviews table
        const reviews = profile.user.reviewsReceived;
        const avg = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;
        return { ...profile, calculatedRating: avg.toFixed(1) };
    }
    static async getUserProfile(userId) {
        const profile = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                email: true,
                name: true,
                role: true,
            },
        });
        if (!profile)
            throw new Error("Profile not found");
        return profile;
    }
}
