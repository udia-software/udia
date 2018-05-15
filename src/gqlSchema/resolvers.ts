import { Kind } from "graphql";
import { withFilter } from "graphql-subscriptions";
import { IResolvers } from "graphql-tools";
import { User } from "../entity/User";
import { UserEmail } from "../entity/UserEmail";
import { pubSub } from "../index";
import { IJwtPayload } from "../modules/Auth";
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
import logger from "../util/logger";
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
      pubSub.publish("me", { me: user });
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
      pubSub.publish("me", { me: user });
      return user;
    },
    removeEmail: async (
      root: any,
      params: IRemoveEmailParams | any,
      context: IContext
    ) => {
      const username = context.jwtPayload && context.jwtPayload.username;
      const user = await UserManager.removeEmail(username, params);
      pubSub.publish("me", { me: user });
      return user;
    },
    setPrimaryEmail: async (
      root: any,
      params: ISetPrimaryEmailParams | any,
      context: IContext
    ) => {
      const username = context.jwtPayload && context.jwtPayload.username;
      const user = await UserManager.setPrimaryEmail(username, params);
      logger.info('publish setPrimaryEmail', pubSub.publish("me", { me: user }));
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
      pubSub.publish("me", { me: user });
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
      pubSub.publish("me", { me: user });
      return { user, jwt };
    }
  },
  Subscription: {
    health: {
      subscribe: () => pubSub.asyncIterator("health")
    },
    me: {
      subscribe: withFilter(
        () => pubSub.asyncIterator("me"),
        (payload, variables, context) => {
          const { user } = context; // derived from JWT (payload) on ws conn
          if (user) {
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
      return user && user.emails;
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
