import { Kind } from "graphql";
import UserManager from "../modules/UserManager";

const resolvers = {
  Query: {
    getUserAuthParams: async (root: any, parameters: any, context: any) => {
      const email = parameters.email || "";
      return UserManager.getUserAuthParams(email);
    },
    me: async (root: any, parameters: any, context: any) => {
      const id = context.user.id;
      return UserManager.getUser(id);
    }
  },
  Mutation: {
    createUser: async (root: any, parameters: any, context: any) => {
      const {
        username,
        email,
        pw,
        pwCost,
        pwSalt,
        pwFunc,
        pwDigest
      } = parameters || {
        username: "",
        email: "",
        pw: "",
        pwCost: 0,
        pwSalt: "",
        pwFunc: "",
        pwDigest: ""
      };
      return UserManager.createUser(
        username,
        email,
        pw,
        pwCost,
        pwSalt,
        pwFunc,
        pwDigest
      );
    },
    updateUserPassword: async (root: any, parameters: any, context: any) => {
      const id = context.user.id;
      const { newPw, pw } = parameters || { newPw: "", pw: "" };
      return UserManager.updateUserPassword(id, newPw, pw);
    },
    signInUser: async (root: any, parameters: any, context: any) => {
      const { email, pw } = parameters || { email: "", pw: "" };
      return UserManager.signInUser(email, pw);
    },
    deleteUser: async (root: any, parameters: any, context: any) => {
      const id = context.user.id;
      const { pw } = parameters || { pw: "" };
      return UserManager.deleteUser(id, pw);
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
