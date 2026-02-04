export const allowedTransitions = {
    REQUESTED: ["ACCEPTED", "CANCELLED"],
    ACCEPTED: ["ACTIVE", "CANCELLED"],
    ACTIVE: ["CLOSED"],
    CLOSED: [],
    CANCELLED: [],
    COMPLETED: []
};
