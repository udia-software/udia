import { User } from "../entity/User";

export type IUserPayloadActionType =
  | "EMAIL_ADDED"
  | "EMAIL_VERIFICATION_SENT"
  | "EMAIL_VERIFIED"
  | "EMAIL_SET_AS_PRIMARY"
  | "EMAIL_REMOVED"
  | "PASSWORD_UPDATED"
  | "HARD_RESET_REQUESTED"
  | "USER_HARD_RESET"
  | "USER_DELETED";

export interface IUserSubscriptionPayload {
  userSubscription: {
    uuid: string;
    actionType: IUserPayloadActionType;
    timestamp: Date;
    meta?: string;
  };
}

export const genUserSubPayload = (
  user: User | { uuid: string },
  actionType: IUserPayloadActionType,
  timestamp: Date = new Date(),
  meta?: string
): IUserSubscriptionPayload => ({
  userSubscription: {
    uuid: user.uuid,
    actionType,
    timestamp,
    meta
  }
});
