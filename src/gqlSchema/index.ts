import {
  IExecutableSchemaDefinition,
  ITypedef,
  makeExecutableSchema
} from "graphql-tools";
import resolvers from "./resolvers";

const typeDefs: ITypedef[] = [
  // GraphQL Query methods
  `type Query {
    getUserAuthParams(email: String!): UserAuthParams!
    checkResetToken(resetToken: String!): TokenValidity!
    checkEmailExists(email: String!): Int!
    checkUsernameExists(username: String!): Int!
    me: FullUser
    health: HealthMetric!
    getItem(id: ID!): Item
    getItems(
      username: String,
      parentId: ID,
      depth: Int,
      limit: Int,
      datetime: DateTime,
      sort: ItemSortValues,
      order: ItemOrderValues
    ): ItemPagination!
  }`,
  // GraphQL Mutation methods
  `type Mutation {
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
    setPrimaryEmail(email: String!): FullUser!
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
    createItem(
      content: String!,
      contentType: String!,
      encItemKey: String!
      parentId: ID
    ): Item!
    updateItem(
      id: ID!,
      content: String,
      contentType: String,
      encItemKey: String,
      parentId: ID
    ): Item!
    deleteItem(
      id: ID!
    ): Item!
  }`,
  // GraphQL Subscriptions
  `type Subscription {
    health: HealthMetric!,
    me: FullUser
  }`,
  // Public Facing User
  `type User {
    uuid: ID!
    username: String!
    createdAt: DateTime!
    items(
      parentId: ID,
      depth: Int,
      limit: Int,
      datetime: DateTime,
      sort: ItemSortValues,
      order: ItemOrderValues
    ): ItemPagination!
  }`,
  // Protected Facing Full User
  `type FullUser {
    uuid: ID!
    username: String!
    emails: [UserEmail!]!
    pwFunc: String!
    pwDigest: String!
    pwCost: Int!
    pwKeySize: Int!
    pwSalt: String!
    items(
      parentId: ID,
      depth: Int,
      limit: Int,
      datetime: DateTime,
      sort: ItemSortValues,
      order: ItemOrderValues
    ): ItemPagination!
    createdAt: DateTime!
    updatedAt: DateTime!
  }`,
  // Protected Facing User Email
  `type UserEmail {
    email: String!
    user: FullUser!
    primary: Boolean!
    verified: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    verificationExpiry: DateTime
  }`,
  // Public Facing User Authentication Parameters
  `type UserAuthParams {
    pwFunc: String!
    pwDigest: String!
    pwCost: Int!
    pwKeySize: Int!
    pwSalt: String!
  }`,
  // Protected Facing Authentication Payload
  `type UserAuthPayload {
    jwt: String!
    user: FullUser!
  }`,
  // Protected Facing Password Reset Token Validity
  `type TokenValidity {
    isValid: Boolean!
    expiry: DateTime
  }`,
  // Public Facing Item
  `type Item {
    uuid: ID!
    content: String
    contentType: String
    encItemKey: String
    user: User
    deleted: Boolean!
    parent: Item
    children(
      username: String,
      limit: Int,
      datetime: DateTime,
      sort: ItemSortValues,
      order: ItemOrderValues
    ): ItemPagination!
    createdAt: DateTime!
    updatedAt: DateTime!
  }`,
  `enum ItemSortValues {
    createdAt
    updatedAt
  }`,
  `enum ItemOrderValues {
    ASC
    DESC
  }`,
  `type ItemPagination {
    items: [Item]!,
    count: Int!,
  }`,
  // Public Facing Health Metric Object
  `type HealthMetric {
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
  }`,
  // Used in Health Metric Object
  `type Cpu {
    model: String!
    speed: Int!
    times: CpuTime!
  }`,
  // Used in Health Metric Object
  `type CpuTime {
    user: Int!
    nice: Int!
    sys: Int!
    idle: Int!
    irq: Int!
  }`,
  // Our one Scalar, supporting Javascript Date
  `scalar DateTime`
];

const executableSchemaDefinition: IExecutableSchemaDefinition = {
  typeDefs,
  resolvers
};
export default makeExecutableSchema(executableSchemaDefinition);
