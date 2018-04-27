import {
  IExecutableSchemaDefinition,
  ITypedef,
  makeExecutableSchema
} from "graphql-tools";
import resolvers from "./resolvers";

const typeDefs: ITypedef = `
type Query {
  getUserAuthParams(email: String!): UserAuthParams!
  checkResetToken(resetToken: String!): ResetTokenValidity!
  me: FullUser
}

type Mutation {
  createUser(
    username: String!,
    email: String!,
    pw: String!,
    pwFunc: String!,
    pwDigest: String!,
    pwCost: Int!,
    pwKeySize: Int!,
    pwSalt: String!
  ): UserAuthPayload!
  updatePassword(
    newPw: String!,
    pw: String!,
    pwFunc: String!,
    pwDigest: String!,
    pwCost: Int!,
    pwKeySize: Int!,
    pwSalt: String!
  ): FullUser!
  signInUser(email: String!, pw: String!): UserAuthPayload!
  addEmail(email: String!): FullUser!
  removeEmail(email: String!): FullUser!
  deleteUser(pw: String!): Boolean!
  sendEmailVerification(email: String!): Boolean!
  verifyEmailToken(emailToken: String!): Boolean!
  sendForgotPasswordEmail(email: String!): Boolean!
  resetPassword(
    resetToken: String!
    newPw: String!,
    pwFunc: String!,
    pwDigest: String!,
    pwCost: Int!,
    pwKeySize: Int!,
    pwSalt: String!
  ): UserAuthPayload!
}

type FullUser {
  uuid: ID!
  username: String!
  emails: [UserEmail!]!
  pwFunc: String!
  pwDigest: String!
  pwCost: Int!
  pwKeySize: Int!
  pwSalt: String!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type UserEmail {
  email: String!
  user: FullUser!
  primary: Boolean!
  verified: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
  verificationExpiry: DateTime
}

type UserAuthParams {
  pwFunc: String!
  pwDigest: String!
  pwCost: Int!
  pwKeySize: Int!
  pwSalt: String!
}

type UserAuthPayload {
  jwt: String!
  user: FullUser!
}

type ResetTokenValidity {
  isValid: Boolean!
  expiry: DateTime
}

scalar DateTime
`;

const executableSchemaDefinition: IExecutableSchemaDefinition = {
  typeDefs,
  resolvers
};
export default makeExecutableSchema(executableSchemaDefinition);
