import {
  IExecutableSchemaDefinition,
  ITypedef,
  makeExecutableSchema
} from "graphql-tools";
import resolvers from "./resolvers";

const typeDefs: ITypedef = `
type Query {
  getUserAuthParams(email: String!): UserAuthParams!
  checkResetToken(resetToken: String!): TokenValidity!
  me: FullUser
  health: HealthMetric!
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

type Subscription {
  health: HealthMetric!
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

type TokenValidity {
  isValid: Boolean!
  expiry: DateTime
}

type HealthMetric {
  version: String!
  nodeVersion: String!
  arch: String!
  hostname: String!
  platform: String!
  release: String!
  freememGiB: Float!
  totalmemGiB: Float!
  freememGB: Float!
  totalmemGB: Float!
  osUptime: Int!
  pUptime: Int!
  now: DateTime!
  loadavg: [Float]!
  cpus: [Cpu]!
}

type Cpu {
  model: String!
  speed: Int!
  times: CpuTime!
}

type CpuTime {
  user: Int!
  nice: Int!
  sys: Int!
  idle: Int!
  irq: Int!
}

scalar DateTime
`;

const executableSchemaDefinition: IExecutableSchemaDefinition = {
  typeDefs,
  resolvers
};
export default makeExecutableSchema(executableSchemaDefinition);
