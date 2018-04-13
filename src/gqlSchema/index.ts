import {
  IExecutableSchemaDefinition,
  ITypedef,
  makeExecutableSchema
} from "graphql-tools";
import resolvers from "./resolvers";

const typeDefs: ITypedef = `
type Query {
  getUserAuthParams(email: String!): UserAuthParams!
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
  deleteUser(pw: String!): Boolean
}

type FullUser {
  uuid: ID!
  username: String!
  emails: [UserEmail!]!
  pwHash: String!
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
  verificationHash: String
  createdAt: DateTime!
  updatedAt: DateTime!
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

scalar DateTime
`;

const executableSchemaDefinition: IExecutableSchemaDefinition = {
  typeDefs,
  resolvers
};
export default makeExecutableSchema(executableSchemaDefinition);
