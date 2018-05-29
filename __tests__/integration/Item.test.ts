import { InMemoryCache } from "apollo-cache-inmemory";
import ApolloClient from "apollo-client";
import { ApolloLink, split } from "apollo-link";
import { HttpLink } from "apollo-link-http";
import { WebSocketLink } from "apollo-link-ws";
import { getOperationDefinition } from "apollo-utilities";
import gql from "graphql-tag";
import { Server } from "http";
import fetch from "node-fetch";
import { SubscriptionClient } from "subscriptions-transport-ws";
import { getConnection } from "typeorm";
import WebSocket from "ws";
import { PORT } from "../../src/constants";
import { Item } from "../../src/entity/Item";
import { User } from "../../src/entity/User";
import { UserEmail } from "../../src/entity/UserEmail";
import start from "../../src/index";
import Auth from "../../src/modules/Auth";
import ItemManager from "../../src/modules/ItemManager";

let server: Server = null;
let itemUser: User = null;
let gqlClient: ApolloClient<any> = null;
let subscriptionClient: SubscriptionClient = null;

async function createUsers() {
  await getConnection().transaction(async transactionEntityManager => {
    // userInputtedPassword = `Another secure p455word~`;
    itemUser = new User();
    const itemEmail = new UserEmail();
    itemEmail.email = "itemTestUser@udia.ca";
    itemEmail.lEmail = "itemtestuser@udia.ca";
    itemEmail.primary = true;
    itemEmail.verified = true;
    itemUser.username = "itemtestuser";
    itemUser.lUsername = "itemtestuser";
    itemUser.pwHash =
      `$argon2i$v=19$m=4096,t=3,p=1$` +
      `oQsV2gDZcl3Qx2dfn+4hmg$2eeavsqCtG5zZRCQ/lVFSjrayzkmQGbdGYEi+p+Ny9w`;
    itemUser.pwFunc = "pbkdf2";
    itemUser.pwDigest = "sha512";
    itemUser.pwCost = 3000;
    itemUser.pwSalt = "c9b5f819984f9f2ef18ec4c4156dbbc802c79d11";
    itemUser = await transactionEntityManager.save(itemUser);
    itemEmail.user = itemUser;
    await transactionEntityManager.save(itemEmail);
  });
}

async function deleteUsers() {
  await getConnection()
    .createQueryBuilder()
    .delete()
    .from(User)
    .where({ lUsername: "itemtestuser" })
    // .orWhere("lUsername = :shrugUsername", { shrugUsername: "¯\\_(ツ)_/¯" })
    .execute();
}

/**
 * Setup the server and gql clients
 */
beforeAll(async done => {
  // Ports are staggered to prevent multiple tests from clobbering
  const itemTestPort = `${parseInt(PORT, 10) + 6}`;
  server = await start(itemTestPort);
  await deleteUsers();
  await createUsers();
  const GRAPHQL_HTTP_ENDPOINT = `http://0.0.0.0:${itemTestPort}/graphql`;
  const GRAPHQL_SUBSCRIPTIONS_ENDPOINT = `ws://0.0.0.0:${itemTestPort}/subscriptions`;

  const jwt = Auth.signUserJWT(itemUser);
  const authorizationHeader = `Bearer ${jwt}`;
  const middlewareAuthLink = new ApolloLink((operation, forward) => {
    operation.setContext({ headers: { authorization: authorizationHeader } });
    return forward(operation);
  });
  const httpLinkWithAuthToken = middlewareAuthLink.concat(
    // TODO https://github.com/apollographql/apollo-link/issues/513
    new HttpLink({ uri: GRAPHQL_HTTP_ENDPOINT, fetch: fetch as any })
  );

  subscriptionClient = new SubscriptionClient(
    GRAPHQL_SUBSCRIPTIONS_ENDPOINT,
    {
      reconnect: true,
      connectionParams: { authorization: jwt }
    },
    WebSocket
  );
  const wsLinkWithAuthToken = new WebSocketLink(subscriptionClient);
  const link = split(
    ({ query }) => {
      // TODO https://github.com/apollographql/apollo-link/issues/601
      const { kind, operation } = getOperationDefinition(query as any) || {
        kind: null,
        operation: null
      };
      return kind === "OperationDefinition" && operation === "subscription";
    },
    wsLinkWithAuthToken,
    httpLinkWithAuthToken
  );
  gqlClient = new ApolloClient({
    link,
    cache: new InMemoryCache()
  });
  done();
});

/**
 * Close the server and clients
 */
afterAll(async done => {
  await deleteUsers();
  subscriptionClient.close();
  server.close(done);
});

describe("Item", () => {
  describe("getItem", () => {
    let item: Item = null;
    let childItem: Item = null;
    beforeAll(async () => {
      item = await ItemManager.createItem("itemtestuser", {
        content: "gql parent item test",
        contentType: "plaintext",
        encItemKey: "unencrypted"
      });
      childItem = await ItemManager.createItem("itemtestuser", {
        content: "gql child item test",
        contentType: "plaintext",
        encItemKey: "unencrypted",
        parentId: item.uuid
      });
    });

    afterAll(async () => {
      await getConnection()
        .getRepository(Item)
        .delete(item);
    });

    it("should get an item by id", async done => {
      expect.assertions(34);
      const getItemQueryResponse = await gqlClient.query({
        query: gql`
          query GetItem($id: ID!) {
            getItem(id: $id) {
              uuid
              content
              contentType
              encItemKey
              user {
                username
              }
              parent {
                uuid
              }
              children {
                count
                items {
                  uuid
                  content
                  contentType
                  encItemKey
                  user {
                    username
                  }
                  deleted
                  parent {
                    uuid
                  }
                  children {
                    count
                    items {
                      uuid
                    }
                  }
                }
              }
              deleted
            }
          }
        `,
        variables: { id: item.uuid }
      });
      expect(getItemQueryResponse).toHaveProperty("data");
      const getItemQueryData: any = getItemQueryResponse.data;
      expect(getItemQueryData).toHaveProperty("getItem");
      const getItem = getItemQueryData.getItem;
      expect(getItem).toHaveProperty("__typename", "Item");
      expect(getItem).toHaveProperty("content", "gql parent item test");
      expect(getItem).toHaveProperty("contentType", "plaintext");
      expect(getItem).toHaveProperty("deleted", false);
      expect(getItem).toHaveProperty("encItemKey", "unencrypted");
      expect(getItem).toHaveProperty("uuid", item.uuid);
      expect(getItem).toHaveProperty("user");
      const parentItemUser = getItem.user;
      expect(parentItemUser).toHaveProperty("__typename", "User");
      expect(parentItemUser).toHaveProperty("username", "itemtestuser");
      expect(getItem).toHaveProperty("parent");
      const parentItemParent = getItem.parent;
      expect(parentItemParent).toBeNull();
      expect(getItem).toHaveProperty("children");
      const parentItemChildren = getItem.children;
      expect(parentItemChildren).toHaveProperty("__typename", "ItemPagination");
      expect(parentItemChildren).toHaveProperty("count", 1);
      expect(parentItemChildren).toHaveProperty("items");
      const childrenItems = parentItemChildren.items;
      expect(childrenItems).toHaveLength(1);
      const childrenItem = childrenItems[0];
      expect(childrenItem).toHaveProperty("__typename", "Item");
      expect(childrenItem).toHaveProperty("content", "gql child item test");
      expect(childrenItem).toHaveProperty("contentType", "plaintext");
      expect(childrenItem).toHaveProperty("deleted", false);
      expect(childrenItem).toHaveProperty("encItemKey", "unencrypted");
      expect(childrenItem).toHaveProperty("uuid", childItem.uuid);
      expect(childrenItem).toHaveProperty("user");
      const childItemUser = childrenItem.user;
      expect(childItemUser).toHaveProperty("__typename", "User");
      expect(childItemUser).toHaveProperty("username", "itemtestuser");
      expect(childrenItem).toHaveProperty("parent");
      const childItemParent = childrenItem.parent;
      expect(childItemParent).toHaveProperty("__typename", "Item");
      expect(childItemParent).toHaveProperty("uuid", item.uuid);
      expect(childrenItem).toHaveProperty("children");
      const childItemChildren = childrenItem.children;
      expect(childItemChildren).toHaveProperty("__typename", "ItemPagination");
      expect(childItemChildren).toHaveProperty("count", 0);
      expect(childItemChildren).toHaveProperty("items", []);
      done();
    });
  });

  describe("getItems", () => {
    let parentItem: Item = null;
    const items: Item[] = [];
    beforeAll(async () => {
      parentItem = await ItemManager.createItem("itemtestuser", {
        content: `gql items test root item`,
        contentType: "plaintext",
        encItemKey: "unencrypted"
      });
      for (let i = 1; i <= 20; i++) {
        const item = await ItemManager.createItem("itemtestuser", {
          content: `gql items test ${i}`,
          contentType: "plaintext",
          encItemKey: "unencrypted",
          parentId: parentItem.uuid
        });
        items.push(item);
      }
    });

    afterAll(async () => {
      await getConnection()
        .getRepository(Item)
        .delete(parentItem);
      for (const item of items) {
        await getConnection()
          .getRepository(Item)
          .delete(item);
      }
    });

    it("should get items by pagination parameters", async () => {
      expect.assertions(117);
      const getItemsQuery = gql`
        query GetItems(
          $username: String
          $parentId: ID
          $depth: Int
          $limit: Int
          $datetime: DateTime
          $sort: ItemSortValue
          $order: ItemOrderValue
        ) {
          getItems(
            username: $username
            parentId: $parentId
            depth: $depth
            limit: $limit
            datetime: $datetime
            sort: $sort
            order: $order
          ) {
            items {
              uuid
              content
              contentType
              encItemKey
            }
            count
          }
        }
      `;
      let getItemsQueryResponse = await gqlClient.query({
        query: getItemsQuery,
        variables: {
          username: "itemtestuser",
          parentId: parentItem.uuid,
          depth: 1,
          limit: 13,
          order: "ASC"
        }
      });
      expect(getItemsQueryResponse).toHaveProperty("data");
      let getItemsQueryData: any = getItemsQueryResponse.data;
      expect(getItemsQueryData).toHaveProperty("getItems");
      let getItems = getItemsQueryData.getItems;
      expect(getItems).toHaveProperty("__typename", "ItemPagination");
      expect(getItems).toHaveProperty("count", 20);
      expect(getItems).toHaveProperty("items");
      const firstQueryItems = getItems.items;
      expect(firstQueryItems).toHaveLength(13);
      for (let i = 0; i < firstQueryItems.length; i++) {
        expect(firstQueryItems[i]).toHaveProperty("__typename", "Item");
        expect(firstQueryItems[i]).toHaveProperty("content", items[i].content);
        expect(firstQueryItems[i]).toHaveProperty(
          "contentType",
          items[i].contentType
        );
        expect(firstQueryItems[i]).toHaveProperty(
          "encItemKey",
          items[i].encItemKey
        );
        expect(firstQueryItems[i]).toHaveProperty("uuid", items[i].uuid);
      }
      // get second pass
      getItemsQueryResponse = await gqlClient.query({
        query: getItemsQuery,
        variables: {
          username: "itemtestuser",
          parentId: parentItem.uuid,
          depth: 1,
          limit: 13,
          datetime: items[12].createdAt,
          order: "ASC"
        }
      });
      expect(getItemsQueryResponse).toHaveProperty("data");
      getItemsQueryData = getItemsQueryResponse.data;
      expect(getItemsQueryData).toHaveProperty("getItems");
      getItems = getItemsQueryData.getItems;
      expect(getItems).toHaveProperty("__typename", "ItemPagination");
      expect(getItems).toHaveProperty("count", 8);
      expect(getItems).toHaveProperty("items");
      const secondQueryItems = getItems.items;
      expect(secondQueryItems).toHaveLength(8);
      for (let i = 0; i < secondQueryItems.length; i++) {
        expect(secondQueryItems[i]).toHaveProperty("__typename", "Item");
        expect(secondQueryItems[i]).toHaveProperty(
          "content",
          items[12 + i].content
        );
        expect(secondQueryItems[i]).toHaveProperty(
          "contentType",
          items[12 + i].contentType
        );
        expect(secondQueryItems[i]).toHaveProperty(
          "encItemKey",
          items[12 + i].encItemKey
        );
        expect(secondQueryItems[i]).toHaveProperty("uuid", items[12 + i].uuid);
      }
    });
  });
  // it.skip("should create an item", null);
  // it.skip("should create an item");
  // it.skip("should update an item");
  // it.skip("should delete an item");
});
