import { Kind } from "graphql";
import { withFilter } from "graphql-subscriptions";
import { IResolvers } from "graphql-tools";
import { Item } from "../entity/Item";
import { User } from "../entity/User";
import { UserEmail } from "../entity/UserEmail";
import { pubSub } from "../index";
import Auth, { IJwtPayload } from "../modules/Auth";
import ItemManager, { IDeleteItemParams } from "../modules/ItemManager";
import UserManager, {
  IAddEmailParams,
  ICreateUserParams,
  IDeleteUserParams,
  IRemoveEmailParams,
  IResetPasswordParams,
  ISendEmailVerificationParams,
  ISendForgotPasswordEmailParams,
  ISetPrimaryEmailParams,
  ISignInUserParams,
  IUpdatePasswordParams,
  IVerifyEmailTokenParams
} from "../modules/UserManager";
import metric from "../util/metric";
import {
  genItemSubPayload,
  genUserSubPayload,
  IItemSubscriptionPayload,
  IUserSubscriptionPayload
} from "./subscriptionHelper";

export interface IContext {
  jwtPayload: IJwtPayload;
  originIp?: string;
  originIps?: string[];
}

const resolvers: IResolvers = {
  Query: {
    getUserAuthParams: async (root: any, params: any, context: IContext) => {
      const email = params.email;
      return UserManager.getUserAuthParams(email);
    },
    checkResetToken: async (root: any, params: any, context: IContext) => {
      const resetToken = params.resetToken;
      return UserManager.checkResetToken(resetToken);
    },
    checkEmailExists: async (root: any, params: any, context: IContext) => {
      const email = params.email;
      return UserManager.emailExists(email);
    },
    checkUsernameExists: async (root: any, params: any, context: IContext) => {
      const username = params.username;
      return UserManager.usernameExists(username);
    },
    me: async (root: any, params: any, context: IContext) => {
      const uuid = context.jwtPayload && context.jwtPayload.uuid;
      return UserManager.getUserById(uuid);
    },
    health: async (root: any, params: any, context: IContext) => {
      return metric();
    },
    getItem: async (root: any, params: any, context: IContext) => {
      const id = params.id;
      return ItemManager.getItemById(id);
    },
    getItems: async (root: any, { params }: any, context: IContext) => {
      return ItemManager.getItems(params || {});
    },
    getUsers: async (root: any, { params }: any, context: IContext) => {
      return UserManager.getUsers(params || {});
    }
  },
  Mutation: {
    createUser: async (
      root: any,
      params: ICreateUserParams | any,
      context: IContext
    ) => {
      return UserManager.createUser(params);
    },
    updatePassword: async (
      root: any,
      params: IUpdatePasswordParams | any,
      context: IContext
    ) => {
      const uuid = context.jwtPayload && context.jwtPayload.uuid;
      const user = await UserManager.updatePassword(uuid, params);
      pubSub.publish(
        `u:${user.uuid}`,
        genUserSubPayload(user, "PASSWORD_UPDATED", user.updatedAt)
      );
      return user;
    },
    signInUser: async (
      root: any,
      params: ISignInUserParams | any,
      context: IContext
    ) => {
      return UserManager.signInUser(params);
    },
    addEmail: async (
      root: any,
      params: IAddEmailParams | any,
      context: IContext
    ) => {
      const uuid = context.jwtPayload && context.jwtPayload.uuid;
      const user = await UserManager.addEmail(uuid, params);
      const emailInstance = user.emails.find(userEmail => {
        return (
          userEmail.lEmail === (params.email as string).toLowerCase().trim()
        );
      });
      const emailAddedAt = emailInstance!.createdAt;
      const emailValue = emailInstance!.email;
      pubSub.publish(
        `u:${user.uuid}`,
        genUserSubPayload(user, "EMAIL_ADDED", emailAddedAt, emailValue)
      );
      return user;
    },
    removeEmail: async (
      root: any,
      params: IRemoveEmailParams | any,
      context: IContext
    ) => {
      const uuid = context.jwtPayload && context.jwtPayload.uuid;
      const user = await UserManager.removeEmail(uuid, params);
      pubSub.publish(
        `u:${user.uuid}`,
        genUserSubPayload(user, "EMAIL_REMOVED", new Date(), params.email)
      );
      return user;
    },
    setPrimaryEmail: async (
      root: any,
      params: ISetPrimaryEmailParams | any,
      context: IContext
    ) => {
      const uuid = context.jwtPayload && context.jwtPayload.uuid;
      const user = await UserManager.setPrimaryEmail(uuid, params);
      const emailInstance = user.emails.find(userEmail => {
        return (
          userEmail.lEmail === (params.email as string).toLowerCase().trim()
        );
      });
      const emailUpdatedAt = emailInstance!.updatedAt;
      const emailValue = emailInstance!.email;
      pubSub.publish(
        `u:${user.uuid}`,
        genUserSubPayload(
          user,
          "EMAIL_SET_AS_PRIMARY",
          emailUpdatedAt,
          emailValue
        )
      );
      return user;
    },
    deleteUser: async (
      root: any,
      params: IDeleteUserParams | any,
      context: IContext
    ) => {
      const uuid = context.jwtPayload && context.jwtPayload.uuid;
      const deleted = await UserManager.deleteUser(uuid, params);
      pubSub.publish(
        `u:${uuid!}`,
        genUserSubPayload({ uuid: uuid! }, "USER_DELETED")
      );
      return deleted;
    },
    sendEmailVerification: async (
      root: any,
      params: ISendEmailVerificationParams | any,
      context: IContext
    ) => {
      const emailSent = await UserManager.sendEmailVerification(params);
      const user = await UserManager.getUserByEmail(params.email);
      pubSub.publish(
        `u:${user!.uuid}`,
        genUserSubPayload(
          user!,
          "EMAIL_VERIFICATION_SENT",
          new Date(),
          params.email
        )
      );
      return emailSent;
    },
    verifyEmailToken: async (
      root: any,
      params: IVerifyEmailTokenParams | any,
      context: IContext
    ) => {
      const lEmail = await UserManager.verifyEmailToken(params);
      const user = await UserManager.getUserByEmail(lEmail);
      const emailInstance = user!.emails.find(
        userEmail => userEmail.lEmail === lEmail
      );
      const emailUpdatedAt = emailInstance!.updatedAt;
      const emailValue = emailInstance!.email;
      pubSub.publish(
        `u:${user!.uuid}`,
        genUserSubPayload(user!, "EMAIL_VERIFIED", emailUpdatedAt, emailValue)
      );
      return true;
    },
    sendForgotPasswordEmail: async (
      root: any,
      params: ISendForgotPasswordEmailParams | any,
      context: IContext
    ) => {
      const resetRequestSent = await UserManager.sendForgotPasswordEmail(
        params
      );
      const user = await UserManager.getUserByEmail(params.email);
      pubSub.publish(
        `u:${user!.uuid}`,
        genUserSubPayload(user!, "HARD_RESET_REQUESTED", user!.updatedAt)
      );
      return resetRequestSent;
    },
    resetPassword: async (
      root: any,
      params: IResetPasswordParams | any,
      context: IContext
    ) => {
      const { user, jwt } = await UserManager.resetPassword(params);
      pubSub.publish(
        `u:${user.uuid}`,
        genUserSubPayload(user, "USER_HARD_RESET", user.updatedAt)
      );
      return { user, jwt };
    },
    refreshJWT: async (root: any, params: any, context: IContext) => {
      const uuid = context.jwtPayload && context.jwtPayload.uuid;
      const user = await UserManager.getUserById(uuid);
      return user && Auth.signUserJWT(user);
    },
    createItem: async (root: any, { params }: any, context: IContext) => {
      const uuid = context.jwtPayload && context.jwtPayload.uuid;
      const item = await ItemManager.createItem(uuid, params);
      pubSub.publish(
        "i",
        genItemSubPayload(item, "ITEM_CREATED", item.createdAt)
      );
      return item;
    },
    updateItem: async (root: any, { id, params }: any, context: IContext) => {
      const uuid = context.jwtPayload && context.jwtPayload.uuid;
      const item = await ItemManager.updateItem(uuid, { id, ...params });
      pubSub.publish(
        "i",
        genItemSubPayload(item, "ITEM_UPDATED", item.updatedAt)
      );
      return item;
    },
    deleteItem: async (
      root: any,
      params: IDeleteItemParams | any,
      context: IContext
    ) => {
      const uuid = context.jwtPayload && context.jwtPayload.uuid;
      const item = await ItemManager.deleteItem(uuid, params);
      pubSub.publish(
        "i",
        genItemSubPayload(item, "ITEM_DELETED", item.updatedAt)
      );
      return item;
    }
  },
  Subscription: {
    health: {
      subscribe: () => pubSub.asyncIterator("health")
    },
    userSubscription: {
      subscribe: withFilter(
        (rootValue, args, context, info) => {
          // Handles splitting channels based on JWT payload username
          if (context && context.user && context.user.uuid) {
            return pubSub.asyncIterator(`u:${context.user.uuid}`);
          }
          // nothing publishes to `me`, unauthenticated, but connected
          return pubSub.asyncIterator("u");
        },
        (payload: IUserSubscriptionPayload, variables, context) => {
          // Handles authentication filtering based on JWT
          // derived from JWT (payload) on ws conn
          const user = context && context.user;
          if (user && user.uuid) {
            const { userSubscription } = payload;
            return user.uuid === userSubscription.uuid;
          }
          return false;
        }
      )
    },
    itemSubscription: {
      subscribe: withFilter(
        (rootValue, args, context, info) => {
          return pubSub.asyncIterator("i");
        },
        async (
          payload: IItemSubscriptionPayload,
          variables: {
            ancestorId?: string;
            parentId?: string;
            userId?: string;
          },
          context
        ) => {
          // if nothing is set, return nothing
          const { ancestorId, parentId, userId } = variables;
          if (!ancestorId && !parentId && !userId) {
            return false;
          }
          const { uuid } = payload.itemSubscription;
          let notifyItemChange = true;
          // check that the uuid is a descendant of the given ancestor
          if (ancestorId) {
            notifyItemChange = await ItemManager.isItemDescendantOfAncestor(
              uuid,
              ancestorId
            );
          }
          // check that the uuid is an immediate child of the given parent
          if (notifyItemChange && parentId) {
            notifyItemChange = await ItemManager.isItemImmediateChildOfParent(
              uuid,
              parentId
            );
          }
          // check that the uuid belongs to the user
          if (notifyItemChange && userId) {
            const item = await ItemManager.getItemById(uuid);
            if (item && item.user) {
              notifyItemChange = item.user.uuid === userId;
            }
          }
          return notifyItemChange;
        }
      )
    }
  },
  FullUser: {
    emails: async (root: User, params: any, context: IContext) => {
      const user = await UserManager.getUserById(root.uuid);
      return user!.emails;
    },
    items: async (root: User, { params }: any, context: IContext) => {
      return ItemManager.getItems({ userId: root.uuid, ...(params || {}) });
    }
  },
  User: {
    items: async (root: User, { params }: any, context: IContext) => {
      return ItemManager.getItems({ userId: root.uuid, ...params });
    }
  },
  Item: {
    user: async (root: Item, params: any, context: IContext) => {
      return UserManager.getUserFromItemId(root.uuid);
    },
    parent: async (root: Item, params: any, context: IContext) => {
      return ItemManager.getParentFromChildId(root.uuid);
    },
    children: async (root: Item, { params }: any, context: IContext) => {
      return ItemManager.getItems({
        parentId: root.uuid,
        depth: 1,
        ...(params || {})
      });
    }
  },
  UserEmail: {
    user: async (root: UserEmail, params: any, context: IContext) => {
      return root.user || UserManager.getUserByEmail(root.lEmail);
    }
  },
  DateTime: {
    __parseValue(value: number): Date {
      return new Date(value);
    },
    __serialize(value: Date): number {
      return value.getTime();
    },
    parseLiteral(ast: any): Date {
      if (ast.kind === Kind.INT) {
        return new Date(parseInt(ast.value, 10));
      }
      return new Date(ast.value);
    }
  }
};

export default resolvers;
