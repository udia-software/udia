import { Item } from "../entity/Item";
import { User } from "../entity/User";

type UserPayloadActionType =
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
    type: UserPayloadActionType;
    timestamp: Date;
    meta?: string;
  };
}

export const genUserSubPayload = (
  user: User | { uuid: string },
  type: UserPayloadActionType,
  timestamp: Date = new Date(),
  meta?: string
): IUserSubscriptionPayload => ({
  userSubscription: {
    uuid: user.uuid,
    type,
    timestamp,
    meta
  }
});

type ItemPayloadActionType = "ITEM_CREATED" | "ITEM_UPDATED" | "ITEM_DELETED";

export interface IItemSubscriptionPayload {
  itemSubscription: {
    uuid: string;
    type: ItemPayloadActionType;
    timestamp: Date;
    meta?: string;
  };
}

export const genItemSubPayload = (
  item: Item | { uuid: string },
  type: ItemPayloadActionType,
  timestamp: Date = new Date(),
  meta?: string
): IItemSubscriptionPayload => ({
  itemSubscription: {
    uuid: item.uuid,
    type,
    timestamp,
    meta
  }
});
