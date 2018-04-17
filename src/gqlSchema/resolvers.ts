import { Kind } from "graphql";
import { IResolvers } from "graphql-tools";
import { IUser } from "../entity/User";
import { IUserEmail } from "../entity/UserEmail";
import { IJwtPayload } from "../modules/Auth";
import UserManager from "../modules/UserManager";

export interface IContext {
  jwtPayload: IJwtPayload;
  originIp: string;
  originIps: string[];
}

const resolvers: IResolvers = {
  Query: {
    getUserAuthParams: async (root: any, params: any, context: IContext) => {
      const email = params.email;
      return UserManager.getUserAuthParams(email);
    },
    me: async (root: any, params: any, context: IContext) => {
      const username = context.jwtPayload && context.jwtPayload.username;
      return UserManager.getUserByUsername(username);
    }
  },
  Mutation: {
    createUser: async (root: any, params: any, context: IContext) => {
      return UserManager.createUser(params);
    },
    updatePassword: async (root: any, params: any, context: IContext) => {
      const username = context.jwtPayload && context.jwtPayload.username;
      return UserManager.updatePassword(username, params);
    },
    signInUser: async (root: any, params: any, context: IContext) => {
      return UserManager.signInUser(params);
    },
    deleteUser: async (root: any, params: any, context: IContext) => {
      const username = context.jwtPayload && context.jwtPayload.username;
      return UserManager.deleteUser(username, params);
    },
    sendEmailVerification: async (root: any, { email }, context: IContext) => {
      return UserManager.sendEmailVerification(email);
    },
    verifyEmailToken: async (root: any, params: any, context: IContext) => {
      const emailToken = params && params.emailToken;
      return UserManager.verifyEmailToken(emailToken);
    },
    addEmail: async (root: any, params: any, context: IContext) => {
      const username = context.jwtPayload && context.jwtPayload.username;
      const email = params && params.email;
      return UserManager.addEmail(username, email);
    }
  },
  FullUser: {
    emails: async (root: IUser, params: any, context: IContext) => {
      const user = await UserManager.getUserById(root.uuid);
      return user && user.emails;
    }
  },
  UserEmail: {
    user: async (root: IUserEmail, params: any, context: IContext) => {
      return UserManager.getUserByEmail(root.email);
    }
  },
  DateTime: {
    _parseValue(value: number) {
      return new Date(value);
    },
    __serialize(value: Date) {
      return value.getTime();
    },
    parseLiteral(ast: any) {
      if (ast.kind === Kind.INT) {
        return new Date(parseInt(ast.value, 10));
      }
      return new Date(ast.value);
    }
  }
};

export default resolvers;
