import { makeExecutableSchema } from "graphql-tools";
import resolvers from "./resolvers";

const typeDefs = `
type Query {
  getUserAuthParams(email: String!): UserAuthParams!
  me: FullUser
}

type Mutation {
  updateUserPassword(id: String!, newPw: String!, pw: String!): FullUser!
  signInUser(email: String!, pw: String!): UserAuthPayload!
  deleteUser(email: String!, pw: String!): Boolean
}

type FullUser @model {
  uuid: ID! @isUnique
  username: String! @isUnique
  email: String! @isUnique
  password: String!
  pwFunc: String!
  pwDigest: String!
  pwCost: Int!
  pwSalt: String!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type UserAuthParams {
  pwFunc: String!
  pwDigest: String!
  pwCost: Int!
  pwSalt: String!
}

type UserAuthPayload {
  jwt: String!
  user: FullUser!
}

scalar DateTime
`;

export default makeExecutableSchema({ typeDefs, resolvers })