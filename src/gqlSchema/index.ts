import { GraphQLSchema } from "graphql";
import {
  IExecutableSchemaDefinition,
  ITypedef,
  makeExecutableSchema
} from "graphql-tools";
import { ITEMS_PAGE_LIMIT, USERS_PAGE_LIMIT } from "../constants";
import resolvers from "./resolvers";

// TODO: rewrite this so it's not just one big string?
const typeDefs: ITypedef[] = [
  `# UDIA Server GraphQL Queries
  type Query {
    # Given an email, return the user authentication parameters.
    getUserAuthParams(
      # User provided email.
      email: String!
    ): UserAuthParams!

    # Given a password reset token, return whether or not the token is valid.
    checkResetToken(
      # Password reset token that was emailed to the user.
      resetToken: String!
    ): TokenValidity!

    # Given an email, return the number of matching emails on the server.
    checkEmailExists(
      # User provided email.
      email: String!
    ): Int!

    # Given a username, return the number of matching usernames on the server.
    checkUsernameExists(
      # User provided username.
      username: String!
    ): Int!

    # Return the full user associated with the header authentication JWT.
    me: FullUser

    # Return the health metric of the server.
    health: HealthMetric!

    # Given an item ID, return the item.
    getItem(
      # Server generated item UUID.
      id: ID!
    ): Item

    # Given the item pagination parameters,
    # return the count of items and subset of items in an array.
    getItems(params: ItemPaginationInput): ItemPagination!

    # Given the user pagination parameters,
    # return the count of users and a subset of users in an array.
    getUsers(params: UserPaginationInput): UserPagination!
  }`,
  `# UDIA Server GraphQL Mutations
  type Mutation {
    # Create a user and corresponding public and private encryption keys.
    createUser(
      # User provided username.
      username: String!
      # User provided email.
      email: String!
      # Client generated proof of secret. (Not user inputted password!)
      pw: String!
      # Client chosen password function. (Defaults to PBKDF2)
      pwFunc: String!
      # Client chosen password digest. (Defaults to SHA-512)
      pwDigest: String!
      # Client chosen derivation cost/iterations. (Defaults to 100000)
      pwCost: Int!
      # Client chosen derivation key byte size. (Defaults to 768)
      pwKeySize: Int!
      # Client generated password salt. (Not server password salt!)
      pwSalt: String!
      # Unencrypted jwk-pub signing key (JSON.stringified)
      pubSignKey: String!
      # Encrypted private jwk-priv signing key
      encPrivSignKey: String!
      # Encrypted symmetric jwk-key for user secrets.
      encSecretKey: String!
      # Unencrypted asymmetric jwk-pub encryption key (JSON.stringified)
      pubEncKey: String!
      # Encrypted asymmetric jwk-priv encryption key
      encPrivEncKey: String!
    ): UserAuthPayload!

    # Update user's password and corresponding private encryption keys.
    updatePassword(
      # Client generated new/updated proof of secret.
      newPw: String!
      # Client generated existing proof of secret.
      pw: String!
      # Client chosen password function.
      pwFunc: String!
      # Client chosen password digest.
      pwDigest: String!
      # Client chosen derivation cost/iterations.
      pwCost: Int!
      # Client chosen derivation key byte size.
      pwKeySize: Int!
      # Client generated password salt.
      pwSalt: String!
      # Encrypted private jwk-priv signing key.
      encPrivSignKey: String!
      # Encrypted symmetric jwk-key for user secrets.
      encSecretKey: String!
      # Encrypted asymmetric jwk-priv encryption key.
      encPrivEncKey: String!
    ): FullUser!

    # Sign in a user.
    signInUser(
      # User provided email.
      email: String!
      # Client generated proof of secret.
      pw: String!
    ): UserAuthPayload!

    # Add an email for the user.
    addEmail(
      # User provided email.
      email: String!
    ): FullUser!

    # Remove an email for the user.
    removeEmail(
      # User provided email.
      email: String!
    ): FullUser!

    # Set an email to be the primary email for the user.
    setPrimaryEmail(
      # User provided email.
      email: String!
    ): FullUser!

    # Delete a user.
    deleteUser(
      # Client generated proof of secret.
      pw: String!
    ): Boolean!

    # Send a verification email.
    sendEmailVerification(
      # User provided email.
      email: String!
    ): Boolean!

    # Given an email verification token, verify the email.
    verifyEmailToken(
      # Email verification token that was emailed to the user.
      emailToken: String!
    ): Boolean!

    # Send a forgot password email.
    sendForgotPasswordEmail(
      # User provided email.
      email: String!
    ): Boolean!

    # Reset a user password and all corresponding encryption keys.
    resetPassword(
      # Password reset token that was emailed to the user.
      resetToken: String!
      # Client generated proof of secret.
      newPw: String!
      # Client chosen password function.
      pwFunc: String!
      # Client chosen password digest.
      pwDigest: String!
      # Client chosen derivation cost/iterations.
      pwCost: Int!
      # Client chosen derivation key byte size.
      pwKeySize: Int!
      # Client generated password salt.
      pwSalt: String!
      # Unencrypted jwk-pub signing key (JSON.stringified)
      pubSignKey: String!
      # Encrypted private jwk-priv signing key.
      encPrivSignKey: String!
      # Encrypted symmetric jwk-key for user secrets.
      encSecretKey: String!
      # Unencrypted asymmetric jwk-pub encryption key (JSON.stringified)
      pubEncKey: String!
      # Encrypted asymmetric jwk-priv encryption key.
      encPrivEncKey: String!
    ): UserAuthPayload!

    # Return a refreshed JWT associated from  the header authentication JWT.
    refreshJWT: String

    # Create an item.
    createItem(params: CreateItemInput!): Item!

    # Update an item.
    updateItem(
      # Server generated item UUID.
      id: ID!
      # Parameters of the item field to update.
      params: UpdateItemInput!
    ): Item!

    # Delete an item.
    deleteItem(
      # Server generated item UUID.
      id: ID!
    ): Item!
  }`,
  `# UDIA Server GraphQL Subscriptions
  type Subscription {
    # Subscribe to server health metric.
    health: HealthMetric!
    # Subscribe to user changes based on JWT.
    me: FullUser
  }`,
  `# Public facing User type
  type User {
    # Server generated UUID.
    uuid: ID!
    # User chosen username.
    username: String!
    # When this user was created.
    createdAt: DateTime!
    # Items belonging to the user.
    # Parameter 'username' is overridden.
    items(params: ItemPaginationInput): ItemPagination!
    # Unencrypted jwk-pub signing key (JSON.stringified)
    pubSignKey: String!
    # Unencrypted asymmetric jwk-pub encryption key (JSON.stringified)
    pubEncKey: String!
  }`,
  `# Protected FullUser type
  type FullUser {
    # Server generated UUID.
    uuid: ID!
    # User chosen username.
    username: String!
    # Emails belonging to the user.
    emails: [UserEmail!]!
    # Unencrypted jwk-pub signing key (JSON.stringified)
    pubSignKey: String!
    # Encrypted private jwk-priv signing key.
    encPrivSignKey: String!
    # Encrypted symmetric jwk-key for user secrets.
    encSecretKey: String!
    # Unencrypted asymmetric jwk-pub encryption key (JSON.stringified)
    pubEncKey: String!
    # Encrypted asymmetric jwk-priv encryption key.
    encPrivEncKey: String!
    # User client password derivation function.
    pwFunc: String!
    # User client password derivation digest.
    pwDigest: String!
    # User client derivation cost or iterations.
    pwCost: Int!
    # User client derived secret keysize.
    pwKeySize: Int!
    # User client password salt.
    pwSalt: String!
    # Items belonging to the user.
    # Parameter 'username' is overridden.
    items(params: ItemPaginationInput): ItemPagination!
    # When this user was created.
    createdAt: DateTime!
    # When this user was last updated.
    updatedAt: DateTime!
  }`,
  `# Protected UserEmail type
  type UserEmail {
    email: String!
    user: FullUser!
    primary: Boolean!
    verified: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    verificationExpiry: DateTime
  }`,
  `# Public facing User Authentication Parameters
  type UserAuthParams {
    # Client chosen password function.
    pwFunc: String!
    # Client chosen password digest.
    pwDigest: String!
    # Client chosen derivation cost/iterations.
    pwCost: Int!
    # Client chosen derivation key byte size.
    pwKeySize: Int!
    # Client generated password salt.
    pwSalt: String!
  }`,
  `# Protected Authentication Payload
  type UserAuthPayload {
    # JSON Web Token for specifing authenticated user to the server.
    jwt: String!
    # Full User object.
    user: FullUser!
  }`,
  `# Protected Password Reset Token Validity
  type TokenValidity {
    # Is the provided token valid.
    isValid: Boolean!
    # When does the provided token expire.
    expiry: DateTime
  }`,
  `# Public facing Item
  type Item {
    # Server generated UUID.
    uuid: ID!
    # Content of the item. If encrypted, ensure base64 encoding.
    content: String
    # Type of the item content.
    contentType: String
    # Encrypted item key, according to Udia Encryption API specification.
    encItemKey: String
    # User that owns the item.
    user: User
    # Is this item deleted.
    deleted: Boolean!
    # Immediate parent of the item.
    parent: Item
    # Immediate children of the item.
    # Parameters 'parentId' and 'depth' are overridden.
    children(params: ItemPaginationInput): ItemPagination!
    # When the item was created.
    createdAt: DateTime!
    # When the item was last updated.
    updatedAt: DateTime!
  }`,
  `enum KeysetSortValue {
    createdAt
    updatedAt
  }`,
  `enum KeysetOrderValue {
    ASC
    DESC
  }`,
  `# Public facing Item Pagination structure
  type ItemPagination {
    # Array of item objects
    items: [Item]!
    # Total number of items matching pagination query parameters
    count: Int!
  }`,
  `# Public facing User Pagination structure
  type UserPagination {
    # Array of user objects
    users: [User]!
    # Total number of users matching pagination query parameters
    count: Int!
  }`,
  `# Public Facing Health Metric Object
  type HealthMetric {
    # Package.json name field
    name: String!
    # UDIA API Version
    version: String!
    # Server NodeJS Version
    nodeVersion: String!
    # Server OS architecture
    arch: String!
    # Server OS hostname
    hostname: String!
    # Server OS platform
    platform: String!
    # Server OS release
    release: String!
    # Server OS Free Memory in Gibibytes (1 GiB = 1024^3 bytes)
    freememGiB: Float!
    # Server OS Total Memory in Gibibytes (1 GiB = 2^30 bytes)
    totalmemGiB: Float!
    # Server OS Free Memory in Gigabytes (1 GB = 1000^3 bytes)
    freememGB: Float!
    # Server OS Total Memory in Gigabytes (1 GB = 10^9 bytes)
    totalmemGB: Float!
    # Server OS Uptime in seconds
    osUptime: Int!
    # Server process uptime in seconds
    pUptime: Int!
    # Server OS current time
    now: DateTime!
    # Server OS CPU load averages. (1 minute, 5 minutes, 15 minutes)
    loadavg: [Float]!
    # Server OS CPU metrics
    cpus: [Cpu]!
  }`,
  `# OS reported CPU metric
  type Cpu {
    # Server OS CPU Model Name
    model: String!
    # Server OS CPU Speed in MHz
    speed: Int!
    # Server OS CPU Times
    times: CpuTime!
  }`,
  `# OS reported CPU Time
  type CpuTime {
    # User space mode in seconds
    user: Int!
    # Nice mode in seconds
    nice: Int!
    # Kernel mode in seconds
    sys: Int!
    # Idle mode in seconds
    idle: Int!
    # Interrupt Request mode in seconds
    irq: Int!
  }`,
  `# Users Pagination Parameters
  input UserPaginationInput {
    # Filter users by lower case username SQL LIKE
    usernameLike: String
    # Filter users by lower case username SQL NOT LIKE
    usernameNotLike: String
    # Maximum number of users returned from query (Hard cap ${USERS_PAGE_LIMIT})
    limit: Int
    # Datetime for keyset pagination
    datetime: DateTime
    # Sort users by? (Defaults to createdAt)
    sort: KeysetSortValue
    # Order users by? (Defaults to DESC)
    order: KeysetOrderValue
  }
  `,
  `# Items Pagination Parameters
  input ItemPaginationInput {
    # Filter items by username (or null for orphaned by deleted user)
    username: String
    # Filter items by parentID (or null for root)
    parentId: ID
    # Filter items by depth in relation to parentId
    depth: Int
    # Maximum number of items returned from query (Hard cap ${ITEMS_PAGE_LIMIT})
    limit: Int
    # Datetime for keyset pagination
    datetime: DateTime
    # Sort items by? (Defaults to createdAt)
    sort: KeysetSortValue
    # Order items by? (Defaults to DESC)
    order: KeysetOrderValue
  }`,
  `# Create Item Parameters
  input CreateItemInput {
    # Content of the item. If encrypted, ensure base64 encoding.
    content: String!
    # Type of the item content.
    contentType: String!
    # Encrypted item key, according to Udia Encryption API specification.
    encItemKey: String
    # Optional parent item UUID.
    parentId: ID
  }`,
  `# Update Item Parameters
  input UpdateItemInput {
    # Content of the item. If encrypted, ensure base64 encoding.
    content: String
    # Type of the item content.
    contentType: String
    # Encrypted item key, according to Udia Encryption API specification.
    encItemKey: String
    # Parent item UUID.
    parentId: ID
  }`,
  `# Custom scalar for supporting Javascript Date
  scalar DateTime`
];

const executableSchemaDefinition: IExecutableSchemaDefinition = {
  typeDefs,
  resolvers
};
const executableSchema: GraphQLSchema = makeExecutableSchema(
  executableSchemaDefinition
);
export default executableSchema;
