import { NormalizedCacheObject } from "apollo-cache-inmemory";
import ApolloClient from "apollo-client";
import gql from "graphql-tag";
import { Server } from "http";
import { SubscriptionClient } from "subscriptions-transport-ws";
import { getConnection } from "typeorm";
import { PORT } from "../../constants";
import { Item } from "../../entity/Item";
import { User } from "../../entity/User";
import start from "../../index";
import Auth from "../../modules/Auth";
import ItemManager from "../../modules/ItemManager";
import { generateGenericUser, generateGraphQLClients } from "../testHelper";

describe("Item", () => {
  // Ports are staggered to prevent multiple tests from clobbering
  const itemTestPort = `${parseInt(PORT, 10) + 4}`;

  let server: Server;
  let itemUser: User;
  let gqlClient: ApolloClient<NormalizedCacheObject>;
  let subscriptionClient: SubscriptionClient;

  async function deleteUsers() {
    await getConnection()
      .createQueryBuilder()
      .delete()
      .from(User)
      .where({ lUsername: "itemgqltest" })
      .execute();
  }

  /**
   * Setup the server and gql clients
   */
  beforeAll(async () => {
    // Ports are staggered to prevent multiple tests from clobbering
    server = await start(itemTestPort);
    await deleteUsers();
    await getConnection().transaction(async transactionEntityManager => {
      const { u, e } = generateGenericUser("itemGQLTest");
      itemUser = await transactionEntityManager.save(u);
      e.user = itemUser;
      await transactionEntityManager.save(e);
    });
    const jwt = Auth.signUserJWT(itemUser);
    const { s, g } = generateGraphQLClients(itemTestPort, jwt);
    gqlClient = g;
    subscriptionClient = s;
  });

  /**
   * Close the server
   */
  afterAll(async done => {
    await deleteUsers();
    subscriptionClient.close();
    server.close(done);
  });

  describe("getItem", () => {
    let item: Item;
    let childItem: Item;
    const query = gql`
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
    `;

    beforeAll(async () => {
      item = await ItemManager.createItem(itemUser.uuid, {
        content: "gql parent item test",
        contentType: "plaintext",
        encItemKey: "unencrypted"
      });
      childItem = await ItemManager.createItem(itemUser.uuid, {
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

    it("should get an item by id", async () => {
      expect.assertions(34);
      const getItemQueryResponse = await gqlClient.query({
        query,
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
      expect(parentItemUser).toHaveProperty("username", itemUser.username);
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
      expect(childItemUser).toHaveProperty("username", itemUser.username);
      expect(childrenItem).toHaveProperty("parent");
      const childItemParent = childrenItem.parent;
      expect(childItemParent).toHaveProperty("__typename", "Item");
      expect(childItemParent).toHaveProperty("uuid", item.uuid);
      expect(childrenItem).toHaveProperty("children");
      const childItemChildren = childrenItem.children;
      expect(childItemChildren).toHaveProperty("__typename", "ItemPagination");
      expect(childItemChildren).toHaveProperty("count", 0);
      expect(childItemChildren).toHaveProperty("items", []);
    });
  });

  describe("getItems", () => {
    let parentItem: Item;
    const items: Item[] = [];

    beforeAll(async () => {
      parentItem = await ItemManager.createItem(itemUser.uuid, {
        content: `gql items test root item`,
        contentType: "plaintext",
        encItemKey: "unencrypted"
      });
      for (let i = 1; i <= 20; i++) {
        const item = await ItemManager.createItem(itemUser.uuid, {
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

    it("should get items by pagination with no parameters", async () => {
      expect.assertions(4);
      const getItemsQuery = gql`
        query GetItems {
          getItems {
            count
          }
        }
      `;
      const getItemsQueryResponse = await gqlClient.query({
        query: getItemsQuery
      });
      expect(getItemsQueryResponse).toHaveProperty("data");
      const getItemsData: any = getItemsQueryResponse.data;
      expect(getItemsData).toHaveProperty("getItems");
      const getItems = getItemsData.getItems;
      expect(getItems).toHaveProperty("count");
      expect(getItems.count).toBeGreaterThanOrEqual(21);
    });

    it("should get items by variable pagination parameters", async () => {
      expect.assertions(113);
      const getItemsQuery = gql`
        query GetItems($params: ItemPaginationInput) {
          getItems(params: $params) {
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
          params: {
            username: itemUser.lUsername,
            parentId: parentItem.uuid,
            depth: 1,
            limit: 13,
            datetime: new Date(1),
            order: "ASC"
          }
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

      const getNextItemsQuery = gql`
        query GetItems($params: ItemPaginationInput) {
          getItems(params: $params) {
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
      getItemsQueryResponse = await gqlClient.query({
        query: getNextItemsQuery,
        variables: {
          params: {
            username: itemUser.lUsername,
            parentId: parentItem.uuid,
            depth: 1,
            limit: 13,
            datetime: items[12].createdAt,
            order: "ASC"
          }
        }
      });
      expect(getItemsQueryResponse).toHaveProperty("data");
      getItemsQueryData = getItemsQueryResponse.data;
      expect(getItemsQueryData).toHaveProperty("getItems");
      getItems = getItemsQueryData.getItems;
      expect(getItems).toHaveProperty("__typename", "ItemPagination");
      expect(getItems).toHaveProperty("count", 7);
      expect(getItems).toHaveProperty("items");
      const secondQueryItems = getItems.items;

      // Check for overlap
      expect(secondQueryItems[0].uuid).not.toEqual(
        firstQueryItems[firstQueryItems.length - 1].uuid
      );

      expect(secondQueryItems).toHaveLength(7);
      const offset = 13;
      for (let i = 0; i < secondQueryItems.length; i++) {
        expect(secondQueryItems[i]).toHaveProperty("__typename", "Item");
        expect(secondQueryItems[i]).toHaveProperty(
          "content",
          items[offset + i].content
        );
        expect(secondQueryItems[i]).toHaveProperty(
          "contentType",
          items[offset + i].contentType
        );
        expect(secondQueryItems[i]).toHaveProperty(
          "encItemKey",
          items[offset + i].encItemKey
        );
        expect(secondQueryItems[i]).toHaveProperty(
          "uuid",
          items[offset + i].uuid
        );
      }
    });

    it("should get items by inline pagination parameters", async () => {
      expect.assertions(113);
      const getItemsInlineQuery = gql`
        query GetItems {
          getItems(
            params: {
              username: "${itemUser.lUsername}"
              parentId: "${parentItem.uuid}"
              depth: 1,
              limit: 13,
              datetime: "${new Date(1).toString()}"
              order: ASC
            }
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
        query: getItemsInlineQuery
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

      const getNextItemsInlineQuery = gql`
        query GetItems {
          getItems(
            params: {
              username: "${itemUser.lUsername}"
              parentId: "${parentItem.uuid}"
              depth: 1
              limit: 13
              datetime: ${items[12].createdAt.getTime()}
              order: ASC
            }
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
      getItemsQueryResponse = await gqlClient.query({
        query: getNextItemsInlineQuery
      });
      expect(getItemsQueryResponse).toHaveProperty("data");
      getItemsQueryData = getItemsQueryResponse.data;
      expect(getItemsQueryData).toHaveProperty("getItems");
      getItems = getItemsQueryData.getItems;
      expect(getItems).toHaveProperty("__typename", "ItemPagination");
      expect(getItems).toHaveProperty("count", 7);
      expect(getItems).toHaveProperty("items");
      const secondQueryItems = getItems.items;

      // Check for overlap
      expect(secondQueryItems[0].uuid).not.toEqual(
        firstQueryItems[firstQueryItems.length - 1].uuid
      );

      expect(secondQueryItems).toHaveLength(7);
      const offset = 13;
      for (let i = 0; i < secondQueryItems.length; i++) {
        expect(secondQueryItems[i]).toHaveProperty("__typename", "Item");
        expect(secondQueryItems[i]).toHaveProperty(
          "content",
          items[offset + i].content
        );
        expect(secondQueryItems[i]).toHaveProperty(
          "contentType",
          items[offset + i].contentType
        );
        expect(secondQueryItems[i]).toHaveProperty(
          "encItemKey",
          items[offset + i].encItemKey
        );
        expect(secondQueryItems[i]).toHaveProperty(
          "uuid",
          items[offset + i].uuid
        );
      }
    });
  });

  describe("createItem", () => {
    let itemUuid: string;

    afterAll(async () => {
      await getConnection()
        .getRepository(Item)
        .delete({ uuid: itemUuid });
    });

    it("should create an item", async () => {
      expect.assertions(10);
      const createItemMutation = gql`
        mutation CreateItem($params: CreateItemInput!) {
          createItem(params: $params) {
            uuid
            content
            contentType
            encItemKey
            user {
              username
            }
          }
        }
      `;
      const createItemMutationResponse = await gqlClient.mutate({
        mutation: createItemMutation,
        variables: {
          params: {
            content: "createItemTest content",
            contentType: "plaintext",
            encItemKey: "unencrypted"
          }
        }
      });
      expect(createItemMutationResponse).toHaveProperty("data");
      const createItemData = createItemMutationResponse.data!;
      expect(createItemData).toHaveProperty("createItem");
      const createItem = createItemData.createItem;
      expect(createItem).toHaveProperty("uuid");
      itemUuid = createItem.uuid;
      expect(createItem).toHaveProperty("__typename", "Item");
      expect(createItem).toHaveProperty("content", "createItemTest content");
      expect(createItem).toHaveProperty("contentType", "plaintext");
      expect(createItem).toHaveProperty("encItemKey", "unencrypted");
      expect(createItem).toHaveProperty("user");
      const createItemUser = createItem.user;
      expect(createItemUser).toHaveProperty("__typename", "User");
      expect(createItemUser).toHaveProperty("username", itemUser.username);
    });

    it("should create an item with no encItemKey", async () => {
      expect.assertions(10);
      const createItemMutation = gql`
        mutation CreateItem($params: CreateItemInput!) {
          createItem(params: $params) {
            uuid
            content
            contentType
            encItemKey
            user {
              username
            }
          }
        }
      `;
      const createItemMutationResponse = await gqlClient.mutate({
        mutation: createItemMutation,
        variables: {
          params: {
            content: "createItemTest content2",
            contentType: "plaintext"
          }
        }
      });
      expect(createItemMutationResponse).toHaveProperty("data");
      const createItemData = createItemMutationResponse.data!;
      expect(createItemData).toHaveProperty("createItem");
      const createItem = createItemData.createItem;
      expect(createItem).toHaveProperty("uuid");
      itemUuid = createItem.uuid;
      expect(createItem).toHaveProperty("__typename", "Item");
      expect(createItem).toHaveProperty("content", "createItemTest content2");
      expect(createItem).toHaveProperty("contentType", "plaintext");
      expect(createItem).toHaveProperty("encItemKey", null);
      expect(createItem).toHaveProperty("user");
      const createItemUser = createItem.user;
      expect(createItemUser).toHaveProperty("__typename", "User");
      expect(createItemUser).toHaveProperty("username", itemUser.username);
    });
  });

  describe("updateItem", () => {
    let item: Item;

    beforeAll(async () => {
      item = await ItemManager.createItem(itemUser.uuid, {
        content: `gql items test update item`,
        contentType: "plaintext",
        encItemKey: "unencrypted"
      });
    });

    afterAll(async () => {
      await getConnection()
        .getRepository(Item)
        .delete(item);
    });

    it("should update an item", async () => {
      expect.assertions(13);
      const updateItemMutation = gql`
        mutation UpdateItem($id: ID!, $params: UpdateItemInput!) {
          updateItem(id: $id, params: $params) {
            uuid
            content
            contentType
            encItemKey
            user {
              username
            }
            createdAt
            updatedAt
          }
        }
      `;
      const updateItemMutationResponse = await gqlClient.mutate({
        mutation: updateItemMutation,
        variables: {
          id: item.uuid,
          params: {
            content: "item has been updated"
          }
        }
      });
      expect(updateItemMutationResponse).toHaveProperty("data");
      const updateItemData = updateItemMutationResponse.data!;
      expect(updateItemData).toHaveProperty("updateItem");
      const updateItem = updateItemData.updateItem;
      expect(updateItem).toHaveProperty("__typename", "Item");
      expect(updateItem).toHaveProperty("content", "item has been updated");
      expect(updateItem).toHaveProperty("contentType", "plaintext");
      expect(updateItem).toHaveProperty("encItemKey", "unencrypted");
      expect(updateItem).toHaveProperty("uuid", item.uuid);
      expect(updateItem).toHaveProperty("user");
      const updateItemUser = updateItem.user;
      expect(updateItemUser).toHaveProperty("__typename", "User");
      expect(updateItemUser).toHaveProperty("username", itemUser.username);
      expect(updateItem).toHaveProperty("createdAt");
      expect(updateItem).toHaveProperty("updatedAt");
      expect(updateItem.createdAt).toBeLessThan(updateItem.updatedAt);
    });
  });

  describe("deleteItem", () => {
    let item: Item;

    beforeAll(async () => {
      item = await ItemManager.createItem(itemUser.uuid, {
        content: `gql items test delete item`,
        contentType: "plaintext",
        encItemKey: "unencrypted"
      });
    });

    afterAll(async () => {
      await getConnection()
        .getRepository(Item)
        .delete(item);
    });

    it("should delete an item", async () => {
      const deleteItemMutation = gql`
        mutation DeleteItem($id: ID!) {
          deleteItem(id: $id) {
            uuid
            content
            contentType
            encItemKey
            user {
              username
            }
            createdAt
            updatedAt
            deleted
          }
        }
      `;
      const deleteItemMutationResponse = await gqlClient.mutate({
        mutation: deleteItemMutation,
        variables: { id: item.uuid }
      });
      expect(deleteItemMutationResponse).toHaveProperty("data");
      const deleteItemData = deleteItemMutationResponse.data!;
      expect(deleteItemData).toHaveProperty("deleteItem");
      const deleteItem = deleteItemData.deleteItem;
      expect(deleteItem).toHaveProperty("__typename", "Item");
      expect(deleteItem).toHaveProperty("content", null);
      expect(deleteItem).toHaveProperty("contentType", null);
      expect(deleteItem).toHaveProperty("encItemKey", null);
      expect(deleteItem).toHaveProperty("deleted", true);
      expect(deleteItem).toHaveProperty("user");
      const deleteItemUser = deleteItem.user;
      expect(deleteItemUser).toHaveProperty("__typename", "User");
      expect(deleteItemUser).toHaveProperty("username", itemUser.username);
      expect(deleteItem).toHaveProperty("uuid", item.uuid);
      expect(deleteItem).toHaveProperty("createdAt");
      expect(deleteItem).toHaveProperty("updatedAt");
    });
  });
});
