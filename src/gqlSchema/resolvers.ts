import { Kind } from "graphql";
import { IResolvers } from "graphql-tools";
import { User } from "../entity/User";
import { UserEmail } from "../entity/UserEmail";
import { IJwtPayload } from "../modules/Auth";
import UserManager, {
  IAddEmailParams,
  ICreateUserParams,
  IDeleteUserParams,
  IRemoveEmailParams,
  IResetPasswordParams,
  ISendEmailVerificationParams,
  ISendForgotPasswordEmailParams,
  ISignInUserParams,
  IUpdatePasswordParams,
  IVerifyEmailTokenParams
} from "../modules/UserManager";

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
    checkResetToken: async(root: any, params: any, context: IContext) => {
      const resetToken = params.resetToken;
      return UserManager.checkResetToken(resetToken);
    },
    me: async (root: any, params: any, context: IContext) => {
      const username = context.jwtPayload && context.jwtPayload.username;
      return UserManager.getUserByUsername(username);
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
      return UserManager.updatePassword(username, params);
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
      return UserManager.addEmail(username, params);
    },
    removeEmail: async (
      root: any,
      params: IRemoveEmailParams | any,
      context: IContext
    ) => {
      const username = context.jwtPayload && context.jwtPayload.username;
      return UserManager.removeEmail(username, params);
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
      return UserManager.verifyEmailToken(params);
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
      return UserManager.resetPassword(params);
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
