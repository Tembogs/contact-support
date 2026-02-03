import { RequestStatus } from "../../generated/prisma/client.js";

export const allowedTransitions: Record<RequestStatus, RequestStatus[]> = {
  REQUESTED: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["ACTIVE", "CANCELLED"],
  ACTIVE: ["CLOSED"],
  CLOSED:[],
  CANCELLED:[],
  COMPLETED: []
}

