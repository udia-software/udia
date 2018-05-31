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
      const username = context.jwtPayload && context.jwtPayload.username;
      return UserManager.getUserByUsername(username);
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
      const username = context.jwtPayload && context.jwtPayload.username;
      const user = await UserManager.updatePassword(username, params);
      pubSub.publish(`me:${user.lUsername}`, { me: user });
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
      const username = context.jwtPayload && context.jwtPayload.username;
      const user = await UserManager.addEmail(username, params);
      if (user) {
        pubSub.publish(`me:${user.lUsername}`, { me: user });
      }
      return user;
    },
    removeEmail: async (
      root: any,
      params: IRemoveEmailParams | any,
      context: IContext
    ) => {
      const username = context.jwtPayload && context.jwtPayload.username;
      const user = await UserManager.removeEmail(username, params);
      if (user) {
        pubSub.publish(`me:${user.lUsername}`, { me: user });
      }
      return user;
    },
    setPrimaryEmail: async (
      root: any,
      params: ISetPrimaryEmailParams | any,
      context: IContext
    ) => {
      const username = context.jwtPayload && context.jwtPayload.username;
      const user = await UserManager.setPrimaryEmail(username, params);
      if (user) {
        pubSub.publish(`me:${user.lUsername}`, { me: user });
      }
      return user;
    },
    deleteUser: async (
      root: any,
      params: IDeleteUserParams | any,
      context: IContext
    ) => {
      const username = context.jwtPayload && context.jwtPayload.username;
      return UserManager.deleteUser(username, params);
    },
    sendEmailVerification: async (
      root: any,
      params: ISendEmailVerificationParams | any,
      context: IContext
    ) => {
      return UserManager.sendEmailVerification(params);
    },
    verifyEmailToken: async (
      root: any,
      params: IVerifyEmailTokenParams | any,
      context: IContext
    ) => {
      const lEmail = await UserManager.verifyEmailToken(params);
      const user = await UserManager.getUserByEmail(lEmail);
      if (user) {
        pubSub.publish(`me:${user.lUsername}`, { me: user });
      }
      return true;
    },
    sendForgotPasswordEmail: async (
      root: any,
      params: ISendForgotPasswordEmailParams | any,
      context: IContext
    ) => {
      return UserManager.sendForgotPasswordEmail(params);
    },
    resetPassword: async (
      root: any,
      params: IResetPasswordParams | any,
      context: IContext
    ) => {
      const { user, jwt } = await UserManager.resetPassword(params);
      pubSub.publish(`me:${user.lUsername}`, { me: user });
      return { user, jwt };
    },
    refreshJWT: async (root: any, params: any, context: IContext) => {
      const username = context.jwtPayload && context.jwtPayload.username;
      const user = await UserManager.getUserByUsername(username);
      return user && Auth.signUserJWT(user);
    },
    createItem: async (root: any, { params }: any, context: IContext) => {
      const username = context.jwtPayload && context.jwtPayload.username;
      return ItemManager.createItem(username, params);
    },
    updateItem: async (root: any, { id, params }: any, context: IContext) => {
      const username = context.jwtPayload && context.jwtPayload.username;
      return ItemManager.updateItem(username, { id, ...params });
    },
    deleteItem: async (
      root: any,
      params: IDeleteItemParams | any,
      context: IContext
    ) => {
      const username = context.jwtPayload && context.jwtPayload.username;
      return ItemManager.deleteItem(username, params);
    }
  },
  Subscription: {
    health: {
      subscribe: () => pubSub.asyncIterator("health")
    },
    me: {
      subscribe: withFilter(
        (rootValue, args, context, info) => {
          // Handles splitting channels based on JWT payload username
          const { user } = context;
          if (user && user.username) {
            return pubSub.asyncIterator(`me:${user.username}`);
          }
          // nothing publishes to `me`, unauthenticated
          return pubSub.asyncIterator("me");
        },
        (payload, variables, context) => {
          // Handles authentication filtering based on JWT
          const { user } = context; // derived from JWT (payload) on ws conn
          if (user && user.username) {
            const { me } = payload;
            return user.username === me.username;
          }
          return false;
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
  },
  Object: {
    __parseValue: toObject,
    __serialize: toObject,
    parseLiteral(ast: any) {
      switch (ast.kind) {
        case Kind.STRING:
          return ast.value.charAt(0) === "{" ? JSON.parse(ast.value) : null;
        case Kind.OBJECT:
          return parseObject(ast);
        default:
          return null;
      }
    }
  }
};

// Custom parse object scalar helper methods.
function toObject(value: any) {
  if (typeof value === "object") {
    return value;
  }
  if (typeof value === "string" && value.charAt(0) === "{") {
    return JSON.parse(value);
  }
  return null;
}

function parseObject(ast: any) {
  const value = Object.create(null);
  ast.fields.forEach((field: any) => {
    value[field.name.value] = parseAst(field.value);
  });
  return value;
}

function parseAst(ast: any) {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value;
    case Kind.INT:
    case Kind.FLOAT:
      return parseFloat(ast.value);
    case Kind.OBJECT:
      return parseObject(ast);
    case Kind.LIST:
      return ast.values.map(parseAst);
    default:
      return null;
  }
}

export default resolvers;
