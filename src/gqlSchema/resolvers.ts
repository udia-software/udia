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
    getUserAuthParams: async (
      root: any,
      parameters: any,
      context: IContext
    ) => {
      const email = parameters.email || "";
      return UserManager.getUserAuthParams(email);
    },
    me: async (root: any, parameters: any, context: IContext) => {
      const username =
        (context.jwtPayload && context.jwtPayload.username) || "";
      return UserManager.getUserByUsername(username);
    }
  },
  Mutation: {
    createUser: async (root: any, parameters: any, context: IContext) => {
      return UserManager.createUser(parameters);
    },
    updatePassword: async (root: any, parameters: any, context: IContext) => {
      const username =
        (context.jwtPayload && context.jwtPayload.username) || "";
      return UserManager.updatePassword(username, parameters);
    },
    signInUser: async (root: any, parameters: any, context: IContext) => {
      const { email, pw } = parameters || { email: "", pw: "" };
      return UserManager.signInUser(email, pw);
    },
    deleteUser: async (root: any, parameters: any, context: IContext) => {
      const username =
        (context.jwtPayload && context.jwtPayload.username) || "";
      const { pw } = parameters || { pw: "" };
      return UserManager.deleteUser(username, pw);
    },
    sendEmailVerification: async (
      root: any,
      parameters: any,
      context: IContext
    ) => {
      const email = parameters || { email: "" };
      return UserManager.sendEmailVerification(email);
    },
    verifyEmailToken: async (root: any, parameters: any, context: IContext) => {
      const emailToken = parameters || { emailToken: "" };
      return UserManager.verifyEmailToken(emailToken);
    }
  },
  FullUser: {
    emails: async (root: IUser, parameters: any, context: IContext) => {
      const user = await UserManager.getUserById(root.uuid);
      return user && user.emails;
    }
  },
  UserEmail: {
    user: async (root: IUserEmail, parameters: any, context: IContext) => {
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
