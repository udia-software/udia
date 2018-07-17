import { Server } from "http";
import { getConnection } from "typeorm";
import { PORT } from "../../constants";
import { Item } from "../../entity/Item";
import { ItemClosure } from "../../entity/ItemClosure";
import { User } from "../../entity/User";
import start from "../../index";
import ItemManager from "../../modules/ItemManager";
import { generateGenericUser } from "../testHelper";

describe("ItemManager", () => {
  const itemTestPort = `${parseInt(PORT, 10) + 6}`;
  let server: Server;

  async function deleteValues() {
    const userSubQuery = getConnection()
      .getRepository(User)
      .createQueryBuilder()
      .select(`"user"."uuid"`)
      .from(User, "user")
      .where(`"user"."lUsername" = 'createitem'`)
      .orWhere(`"user"."lUsername" = 'createitemstepuser'`)
      .orWhere(`"user"."lUsername" = 'itempaguser'`)
      .orWhere(`"user"."lUsername" = 'updateitem'`)
      .orWhere(`"user"."lUsername" = 'updateitemstepuser'`)
      .orWhere(`"user"."lUsername" = 'deleteitem'`)
      .orWhere(`"user"."lUsername" = 'deleteitemstepuser'`)
      .orWhere(`"user"."lUsername" = 'getparentitem'`)
      .getQuery();
    await getConnection()
      .createQueryBuilder()
      .delete()
      .from(Item, "item")
      .where(qb => {
        return `"item"."userUuid" IN (${userSubQuery})`;
      })
      .execute();
    await getConnection()
      .createQueryBuilder()
      .delete()
      .from(User)
      .where({ lUsername: "createitem" })
      .orWhere(`lUsername = :stepCI`, { stepCI: "createitemstepuser" })
      .orWhere(`lUsername = :pagUser`, { pagUser: "itempaguser" })
      .orWhere(`lUsername = :upUser`, { upUser: "updateitem" })
      .orWhere(`lUsername = :sUUser`, { sUUser: "updateitemstepuser" })
      .orWhere(`lUsername = :delUser`, { delUser: "deleteitem" })
      .orWhere(`lUsername = :sDUser`, { sDUser: "deleteitemstepuser" })
      .orWhere(`lUsername = :gpUser`, { gpUser: "getparentitem" })
      .orWhere(`lUsername = :delIUser`, { delIUser: "showdeleteditemsuser"})
      .execute();
  }

  beforeAll(async () => {
    server = await start(itemTestPort);
    await deleteValues();
  });

  afterAll(async done => {
    await deleteValues();
    server.close(done);
  });

  describe("createItem", () => {
    let createItemUser: User;
    let createItemStepUser: User;

    beforeAll(async () => {
      await getConnection().transaction(async transactionEntityManager => {
        const { u, e } = generateGenericUser("createItem");
        createItemUser = await transactionEntityManager.save(u);
        e.user = createItemUser;
        await transactionEntityManager.save(e);
        const { u: su, e: se } = generateGenericUser("createItemStepUser");
        createItemStepUser = await transactionEntityManager.save(su);
        se.user = createItemStepUser;
        await transactionEntityManager.save(se);
      });
    });

    afterEach(async () => {
      await getConnection()
        .getRepository(Item)
        .createQueryBuilder()
        .delete()
        .where({ user: createItemUser })
        .execute();
    });

    afterAll(async () => {
      await getConnection()
        .getRepository(Item)
        .createQueryBuilder()
        .delete()
        .where({ user: createItemStepUser })
        .execute();
      await getConnection()
        .getRepository(User)
        .delete(createItemUser);
      await getConnection()
        .getRepository(User)
        .delete(createItemStepUser);
    });

    it("should create an item", async () => {
      expect.assertions(10);
      const item = await ItemManager.createItem(createItemUser.uuid, {
        content: "testPayload",
        contentType: "plaintext",
        encItemKey: "unencrypted"
      });

      expect(item).toHaveProperty("content", "testPayload");
      expect(item).toHaveProperty("contentType", "plaintext");
      expect(item).toHaveProperty("createdAt");
      expect(item).toHaveProperty("updatedAt");
      expect(item).toHaveProperty("deleted", false);
      expect(item).toHaveProperty("encItemKey", "unencrypted");
      expect(item).toHaveProperty("user");
      expect(item).toHaveProperty("uuid");
      const closureData = await getConnection()
        .getRepository(ItemClosure)
        .find({ ancestor: item });
      expect(closureData).toContainEqual({
        ancestor: item.uuid,
        descendant: item.uuid,
        depth: 0
      });
      expect(closureData).toHaveLength(1);
    });

    it("should create an item with a parent", async () => {
      expect.assertions(13);
      const ancestorItem = await ItemManager.createItem(createItemUser.uuid, {
        content: "ancestor item",
        contentType: "plaintext",
        encItemKey: "unencrypted"
      });

      const descendantItem = await ItemManager.createItem(createItemUser.uuid, {
        content: "descendant item",
        contentType: "plaintext",
        encItemKey: "unencrypted",
        parentId: ancestorItem.uuid
      });

      expect(descendantItem).toHaveProperty("content", "descendant item");
      expect(descendantItem).toHaveProperty("contentType", "plaintext");
      expect(descendantItem).toHaveProperty("createdAt");
      expect(descendantItem).toHaveProperty("updatedAt");
      expect(descendantItem).toHaveProperty("deleted", false);
      expect(descendantItem).toHaveProperty("encItemKey", "unencrypted");
      expect(descendantItem).toHaveProperty("user");
      expect(descendantItem).toHaveProperty("uuid");
      const ancestorClosureData = await getConnection()
        .getRepository(ItemClosure)
        .find({ ancestor: ancestorItem });
      expect(ancestorClosureData).toContainEqual({
        ancestor: ancestorItem.uuid,
        descendant: ancestorItem.uuid,
        depth: 0
      });
      expect(ancestorClosureData).toContainEqual({
        ancestor: ancestorItem.uuid,
        descendant: descendantItem.uuid,
        depth: 1
      });
      expect(ancestorClosureData).toHaveLength(2);
      const descendantClosureData = await getConnection()
        .getRepository(ItemClosure)
        .find({ ancestor: descendantItem });
      expect(descendantClosureData).toContainEqual({
        ancestor: descendantItem.uuid,
        descendant: descendantItem.uuid,
        depth: 0
      });
      expect(descendantClosureData).toHaveLength(1);
    });

    it("should handle invalid username", async () => {
      expect.assertions(2);
      await expect(
        ItemManager.createItem(undefined, {
          content: "testPayload",
          contentType: "plaintext",
          encItemKey: "unencrypted"
        })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* id: Invalid JWT."
      );
      await expect(
        ItemManager.createItem("", {
          content: "testPayload",
          contentType: "plaintext",
          encItemKey: "unencrypted"
        })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* id: Invalid JWT."
      );
    });

    it("should handle invalid parentId", async () => {
      expect.assertions(2);
      await expect(
        ItemManager.createItem(createItemUser.uuid, {
          content: "invalid uuid",
          contentType: "plaintext",
          encItemKey: "unencrypted",
          parentId: "baduuid"
        })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* parentId: Invalid parentId."
      );
      await expect(
        ItemManager.createItem(createItemUser.uuid, {
          content: "invalid uuid",
          contentType: "plaintext",
          encItemKey: "unencrypted",
          parentId: "00000000-0000-0000-0000-000000000000"
        })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* parentId: Invalid parentId."
      );
    });

    it("should handle parent not found", async () => {
      expect.assertions(1);
      await expect(
        ItemManager.createItem(createItemUser.uuid, {
          content: "not mapped uuid",
          contentType: "plaintext",
          encItemKey: "unencrypted",
          parentId: "123e4567-e89b-12d3-a456-426655440000"
        })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* parentId: Parent not found."
      );
    });

    it("should handle parent not belonging to user", async () => {
      expect.assertions(1);
      const stepParentItem = await ItemManager.createItem(
        createItemStepUser.uuid,
        {
          content: "step parent value",
          contentType: "plaintext",
          encItemKey: "unencrypted"
        }
      );
      await expect(
        ItemManager.createItem(createItemUser.uuid, {
          content: "not mapped uuid",
          contentType: "plaintext",
          encItemKey: "unencrypted",
          parentId: stepParentItem.uuid
        })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* parentId: Parent does not belong to user."
      );
    });
  });

  describe("getItems", () => {
    let itemPaginationUser: User;
    let showDeletedItemsUser: User;

    beforeAll(async () => {
      await getConnection().transaction(async transactionEntityManager => {
        const { u, e } = generateGenericUser("itemPagUser");
        itemPaginationUser = await transactionEntityManager.save(u);
        e.user = itemPaginationUser;
        await transactionEntityManager.save(e);
        const { u: du, e: de } = generateGenericUser("showDeletedItemsUser");
        showDeletedItemsUser = await transactionEntityManager.save(du);
        de.user = showDeletedItemsUser;
        await transactionEntityManager.save(de);
      });
    });

    afterEach(async () => {
      await getConnection()
        .getRepository(Item)
        .createQueryBuilder()
        .delete()
        .where({ user: itemPaginationUser })
        .execute();
    });

    afterAll(async () => {
      await getConnection()
        .getRepository(User)
        .delete(itemPaginationUser);
    });

    it("should get many items with keyset pagination on date", async () => {
      expect.assertions(3);
      const getItemsTestReferences = [];
      for (let i = 1; i <= 20; i++) {
        const item = await ItemManager.createItem(itemPaginationUser.uuid, {
          content: `Flat Test Item ${i}`,
          contentType: "plaintext",
          encItemKey: "unencrypted"
        });
        getItemsTestReferences.unshift(item);
      }
      const allUserItems = await ItemManager.getItems({
        username: itemPaginationUser.lUsername,
        limit: 16
      });
      expect(allUserItems).toEqual({
        items: getItemsTestReferences.slice(0, 16).map((itemRef: Item) => ({
          uuid: itemRef.uuid,
          content: itemRef.content,
          contentType: itemRef.contentType,
          encItemKey: itemRef.encItemKey,
          createdAt: itemRef.createdAt,
          updatedAt: itemRef.updatedAt,
          deleted: itemRef.deleted
        })),
        count: 20 // total number of items matching query, despite limit 16
      });
      const lastCreatedAtDate =
        allUserItems.items[allUserItems.items.length - 1].createdAt;
      expect(lastCreatedAtDate).toBeInstanceOf(Date);
      const nextAllUserItems = await ItemManager.getItems({
        username: itemPaginationUser.lUsername,
        datetime: lastCreatedAtDate // pass in the last datetime! EZ-PZ
      });
      expect(nextAllUserItems).toEqual({
        items: getItemsTestReferences.slice(16, 20).map((itemRef: Item) => ({
          uuid: itemRef.uuid,
          content: itemRef.content,
          contentType: itemRef.contentType,
          encItemKey: itemRef.encItemKey,
          createdAt: itemRef.createdAt,
          updatedAt: itemRef.updatedAt,
          deleted: itemRef.deleted
        })),
        count: 4
      });
    });

    it("should get items specified by depth and parentId", async () => {
      expect.assertions(3);
      const rootItem = await ItemManager.createItem(itemPaginationUser.uuid, {
        content: "Root Item",
        contentType: "plaintext",
        encItemKey: "unencrypted"
      });
      const child1 = await ItemManager.createItem(itemPaginationUser.uuid, {
        content: "Child 1",
        contentType: "plaintext",
        encItemKey: "unencrypted",
        parentId: rootItem.uuid
      });
      const child2 = await ItemManager.createItem(itemPaginationUser.uuid, {
        content: "Child 2",
        contentType: "plaintext",
        encItemKey: "unencrypted",
        parentId: rootItem.uuid
      });

      const childrenOfRoot = await ItemManager.getItems({
        username: itemPaginationUser.lUsername,
        parentId: rootItem.uuid,
        depth: 1
      });
      expect(childrenOfRoot).toEqual({
        items: [child2, child1].map((itemRef: Item) => ({
          uuid: itemRef.uuid,
          content: itemRef.content,
          contentType: itemRef.contentType,
          encItemKey: itemRef.encItemKey,
          createdAt: itemRef.createdAt,
          updatedAt: itemRef.updatedAt,
          deleted: itemRef.deleted
        })),
        count: 2
      });

      const gc11 = await ItemManager.createItem(itemPaginationUser.uuid, {
        content: "Grandchild 1-1 (Child of 1)",
        contentType: "plaintext",
        encItemKey: "unencrypted",
        parentId: child1.uuid
      });
      const gc12 = await ItemManager.createItem(itemPaginationUser.uuid, {
        content: "Grandchild 1-2 (Child of 1)",
        contentType: "plaintext",
        encItemKey: "unencrypted",
        parentId: child1.uuid
      });
      const gc13 = await ItemManager.createItem(itemPaginationUser.uuid, {
        content: "Grandchild 1-3 (Child of 1)",
        contentType: "plaintext",
        encItemKey: "unencrypted",
        parentId: child1.uuid
      });
      const gc21 = await ItemManager.createItem(itemPaginationUser.uuid, {
        content: "Grandchild 2-1 (Child of 2)",
        contentType: "plaintext",
        encItemKey: "unencrypted",
        parentId: child2.uuid
      });

      const grandchildrenOfRoot = await ItemManager.getItems({
        username: itemPaginationUser.lUsername,
        parentId: rootItem.uuid,
        depth: 2,
        order: "ASC"
      });
      expect(grandchildrenOfRoot).toEqual({
        items: [gc11, gc12, gc13, gc21].map((itemRef: Item) => ({
          uuid: itemRef.uuid,
          content: itemRef.content,
          contentType: itemRef.contentType,
          encItemKey: itemRef.encItemKey,
          createdAt: itemRef.createdAt,
          updatedAt: itemRef.updatedAt,
          deleted: itemRef.deleted
        })),
        count: 4
      });

      const rootItemsOnly = await ItemManager.getItems({
        username: itemPaginationUser.lUsername,
        parentId: null
      });
      expect(rootItemsOnly).toEqual({
        items: [rootItem].map((itemRef: Item) => ({
          uuid: itemRef.uuid,
          content: itemRef.content,
          contentType: itemRef.contentType,
          encItemKey: itemRef.encItemKey,
          createdAt: itemRef.createdAt,
          updatedAt: itemRef.updatedAt,
          deleted: itemRef.deleted
        })),
        count: 1
      });
    });

    it("should get items with undefined username, any user", async () => {
      expect.assertions(3);
      const itemstesterItem = await ItemManager.createItem(
        itemPaginationUser.uuid,
        {
          content: "My Items Tester item",
          contentType: "plaintext",
          encItemKey: "unencrypted"
        }
      );
      const itemtester2Item = await ItemManager.createItem(
        itemPaginationUser.uuid,
        {
          content: "My Item Tester 2 item",
          contentType: "plaintext",
          encItemKey: "unencrypted"
        }
      );

      const { items, count } = await ItemManager.getItems({});
      expect(count).toBeGreaterThanOrEqual(2);
      expect(items).toContainEqual({
        uuid: itemstesterItem.uuid,
        content: itemstesterItem.content,
        contentType: itemstesterItem.contentType,
        encItemKey: itemstesterItem.encItemKey,
        createdAt: itemstesterItem.createdAt,
        updatedAt: itemstesterItem.updatedAt,
        deleted: itemstesterItem.deleted
      });
      expect(items).toContainEqual({
        uuid: itemtester2Item.uuid,
        content: itemtester2Item.content,
        contentType: itemtester2Item.contentType,
        encItemKey: itemtester2Item.encItemKey,
        createdAt: itemtester2Item.createdAt,
        updatedAt: itemtester2Item.updatedAt,
        deleted: itemtester2Item.deleted
      });
    });

    it("should get items by userUuid", async () => {
      expect.assertions(4);
      const itemstesterItem = await ItemManager.createItem(
        itemPaginationUser.uuid,
        {
          content: "My Items Tester item",
          contentType: "plaintext",
          encItemKey: "unencrypted"
        }
      );

      const { items, count } = await ItemManager.getItems({
        userId: itemPaginationUser.uuid
      });
      expect(count).toEqual(1);
      expect(items).toContainEqual({
        uuid: itemstesterItem.uuid,
        content: itemstesterItem.content,
        contentType: itemstesterItem.contentType,
        encItemKey: itemstesterItem.encItemKey,
        createdAt: itemstesterItem.createdAt,
        updatedAt: itemstesterItem.updatedAt,
        deleted: itemstesterItem.deleted
      });
      const { items: noItems, count: noCount } = await ItemManager.getItems({
        userId: null
      });
      expect(noCount).toBeGreaterThanOrEqual(0);
      expect(noItems.length).toBeGreaterThanOrEqual(0);
    });

    it("should handle negative number for limit", async () => {
      expect.assertions(2);
      await ItemManager.createItem(itemPaginationUser.uuid, {
        content: "Negative Limit Test item",
        contentType: "plaintext",
        encItemKey: "unencrypted"
      });
      const { items, count } = await ItemManager.getItems({ limit: -10 });
      expect(count).toBeGreaterThanOrEqual(0);
      expect(items).toHaveLength(1);
    });

    it("should show deleted items", async () => {
      expect.assertions(4);
      let toDeleteItem = await ItemManager.createItem(
        showDeletedItemsUser.uuid,
        {
          content: "About to be deleted item",
          contentType: "plaintext",
          encItemKey: "unencrypted"
        }
      );
      toDeleteItem = await ItemManager.deleteItem(showDeletedItemsUser.uuid, {
        id: toDeleteItem.uuid
      });

      const { items, count } = await ItemManager.getItems({
        userId: showDeletedItemsUser.uuid,
        showDeleted: true,
      });
      expect(count).toEqual(1);
      expect(items).toContainEqual({
        uuid: toDeleteItem.uuid,
        content: toDeleteItem.content,
        contentType: toDeleteItem.contentType,
        encItemKey: toDeleteItem.encItemKey,
        createdAt: toDeleteItem.createdAt,
        updatedAt: toDeleteItem.updatedAt,
        deleted: toDeleteItem.deleted
      });
      const { items: noItems, count: noCount } = await ItemManager.getItems({
        userId: showDeletedItemsUser.uuid,
        showDeleted: false
      });
      expect(noCount).toBeGreaterThanOrEqual(0);
      expect(noItems.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("updateItem", () => {
    let updateItemUser: User;
    let updateItemStepUser: User;

    beforeAll(async () => {
      await getConnection().transaction(async transactionEntityManager => {
        const { u, e } = generateGenericUser("updateItem");
        updateItemUser = await transactionEntityManager.save(u);
        e.user = updateItemUser;
        await transactionEntityManager.save(e);
        const { u: su, e: se } = generateGenericUser("updateItemStepUser");
        updateItemStepUser = await transactionEntityManager.save(su);
        se.user = updateItemUser;
        await transactionEntityManager.save(se);
      });
    });

    afterEach(async () => {
      await getConnection()
        .getRepository(Item)
        .createQueryBuilder()
        .delete()
        .where({ user: updateItemUser })
        .execute();
    });

    afterAll(async () => {
      await getConnection()
        .getRepository(Item)
        .createQueryBuilder()
        .delete()
        .where({ user: updateItemStepUser })
        .execute();
      await getConnection()
        .getRepository(User)
        .delete(updateItemUser);
      await getConnection()
        .getRepository(User)
        .delete(updateItemStepUser);
    });

    it("should update an item", async () => {
      expect.assertions(21);
      const item = await ItemManager.createItem(updateItemUser.uuid, {
        content: "testPayload",
        contentType: "plaintext",
        encItemKey: "unencrypted"
      });

      let updatedItem = await ItemManager.updateItem(updateItemUser.uuid, {
        id: item.uuid,
        content: "updated item content"
      });
      expect(updatedItem).toBeDefined();
      updatedItem = updatedItem!;
      expect(updatedItem.uuid).toEqual(item.uuid);
      expect(updatedItem.content).not.toEqual(item.content);
      expect(updatedItem.contentType).toEqual(item.contentType);
      expect(updatedItem.encItemKey).toEqual(item.encItemKey);
      expect(updatedItem.createdAt).toEqual(item.createdAt);
      expect(updatedItem.updatedAt).not.toEqual(item.updatedAt);

      updatedItem = await ItemManager.updateItem(updateItemUser.uuid, {
        id: item.uuid,
        content: "# this is markdown",
        contentType: "markdown"
      });
      expect(updatedItem).toBeDefined();
      updatedItem = updatedItem!;
      expect(updatedItem.uuid).toEqual(item.uuid);
      expect(updatedItem.content).not.toEqual(item.content);
      expect(updatedItem.contentType).not.toEqual(item.contentType);
      expect(updatedItem.encItemKey).toEqual(item.encItemKey);
      expect(updatedItem.createdAt).toEqual(item.createdAt);
      expect(updatedItem.updatedAt).not.toEqual(item.updatedAt);

      updatedItem = await ItemManager.updateItem(updateItemUser.uuid, {
        id: item.uuid,
        encItemKey: "123"
      });
      expect(updatedItem).toBeDefined();
      updatedItem = updatedItem!;
      expect(updatedItem.uuid).toEqual(item.uuid);
      expect(updatedItem.content).not.toEqual(item.content);
      expect(updatedItem.contentType).not.toEqual(item.contentType);
      expect(updatedItem.encItemKey).not.toEqual(item.encItemKey);
      expect(updatedItem.createdAt).toEqual(item.createdAt);
      expect(updatedItem.updatedAt).not.toEqual(item.updatedAt);
    });

    it("should update an item with a parent", async () => {
      expect.assertions(12);
      const momItem = await ItemManager.createItem(updateItemUser.uuid, {
        content: "mom item",
        contentType: "plaintext",
        encItemKey: "unencrypted"
      });

      const dadItem = await ItemManager.createItem(updateItemUser.uuid, {
        content: "dad item",
        contentType: "plaintext",
        encItemKey: "unencrypted"
      });

      let childItem = await ItemManager.createItem(updateItemUser.uuid, {
        content: "with mom",
        contentType: "plaintext",
        encItemKey: "unencrypted",
        parentId: momItem.uuid
      });

      // check mom has one kid
      const momPreTransferClosure = await getConnection()
        .getRepository(ItemClosure)
        .find({ ancestor: momItem, descendant: childItem });
      expect(momPreTransferClosure).toHaveLength(1);
      expect(momPreTransferClosure).toContainEqual({
        ancestor: momItem.uuid,
        descendant: childItem.uuid,
        depth: 1
      });

      // check dad has no kid
      const dadPreTransferClosure = await getConnection()
        .getRepository(ItemClosure)
        .find({ ancestor: dadItem, descendant: childItem });
      expect(dadPreTransferClosure).toHaveLength(0);

      // send kid to dad
      const updatedChildItem = await ItemManager.updateItem(
        updateItemUser.uuid,
        {
          id: childItem.uuid,
          content: "with dad",
          parentId: dadItem.uuid
        }
      );
      expect(updatedChildItem).toBeDefined();
      childItem = updatedChildItem!;
      expect(childItem).toHaveProperty("content", "with dad");
      expect(childItem).toHaveProperty("parent", dadItem);

      // check mom has no kid
      const momPostTransferClosure = await getConnection()
        .getRepository(ItemClosure)
        .find({ ancestor: momItem, descendant: childItem });
      expect(momPostTransferClosure).toHaveLength(0);

      // check dad has one kid
      const dadPostTransferClosure = await getConnection()
        .getRepository(ItemClosure)
        .find({ ancestor: dadItem, descendant: childItem });
      expect(dadPostTransferClosure).toHaveLength(1);
      expect(dadPostTransferClosure).toContainEqual({
        ancestor: dadItem.uuid,
        descendant: childItem.uuid,
        depth: 1
      });

      // check kid has one ancestor
      const kidPostTransferClosure = await getConnection()
        .getRepository(ItemClosure)
        .find({ descendant: childItem });
      expect(kidPostTransferClosure).toHaveLength(2);
      expect(kidPostTransferClosure).toContainEqual({
        ancestor: childItem.uuid,
        descendant: childItem.uuid,
        depth: 0
      });
      expect(kidPostTransferClosure).toContainEqual({
        ancestor: dadItem.uuid,
        descendant: childItem.uuid,
        depth: 1
      });
    });

    it("should handle invalid username", async () => {
      expect.assertions(2);
      const testInvalidUsername = await ItemManager.createItem(
        updateItemUser.uuid,
        {
          content: "test invalid username",
          contentType: "plaintext",
          encItemKey: "unencrypted"
        }
      );
      await expect(
        ItemManager.updateItem(undefined, {
          id: testInvalidUsername.uuid,
          content: "undefined username"
        })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* id: Invalid JWT."
      );
      await expect(
        ItemManager.updateItem("", {
          id: testInvalidUsername.uuid,
          content: "empty string username"
        })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* id: Invalid JWT."
      );
    });

    it("should handle invalid id", async () => {
      expect.assertions(2);
      await expect(
        ItemManager.updateItem(updateItemUser.uuid, {
          id: "baduuid",
          content: "invalid uuid",
          contentType: "plaintext",
          encItemKey: "unencrypted"
        })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* id: Invalid id."
      );
      await expect(
        ItemManager.updateItem(updateItemUser.uuid, {
          id: "00000000-0000-0000-0000-000000000000",
          content: "invalid uuid",
          contentType: "plaintext",
          encItemKey: "unencrypted"
        })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* id: Invalid id."
      );
    });

    it("should handle item not found", async () => {
      expect.assertions(1);
      await expect(
        ItemManager.updateItem(updateItemUser.uuid, {
          id: "123e4567-e89b-12d3-a456-426655440000",
          content: "not mapped uuid",
          contentType: "plaintext",
          encItemKey: "unencrypted"
        })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* id: Item not found."
      );
    });

    it("should handle item not belonging to user", async () => {
      expect.assertions(1);
      const stepItem = await ItemManager.createItem(updateItemStepUser.uuid, {
        content: "step parent value",
        contentType: "plaintext",
        encItemKey: "unencrypted"
      });
      await expect(
        ItemManager.updateItem(updateItemUser.uuid, {
          id: stepItem.uuid,
          content: "not owned item"
        })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* id: Item does not belong to user."
      );
    });

    it("should handle item update with no parameters", async () => {
      expect.assertions(1);
      const unchangedItem = await ItemManager.createItem(updateItemUser.uuid, {
        content: "unchanged item",
        contentType: "plaintext",
        encItemKey: "unencrypted"
      });
      await expect(
        ItemManager.updateItem(updateItemUser.uuid, {
          id: unchangedItem.uuid
        })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* id: Cannot update with no changes."
      );
    });

    it("should handle update deleted item", async () => {
      expect.assertions(1);
      const deletedItem = await ItemManager.createItem(updateItemUser.uuid, {
        content: "deleted item",
        contentType: "plaintext",
        encItemKey: "unencrypted"
      });
      await ItemManager.deleteItem(updateItemUser.uuid, {
        id: deletedItem.uuid
      });
      await expect(
        ItemManager.updateItem(updateItemUser.uuid, {
          id: deletedItem.uuid,
          content: "trying to update"
        })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* id: Cannot update a deleted item."
      );
    });
  });

  describe("deleteItem", () => {
    let deleteItemUser: User;
    let deleteItemStepUser: User;

    beforeAll(async () => {
      await getConnection().transaction(async transactionEntityManager => {
        const { u, e } = generateGenericUser("deleteItem");
        deleteItemUser = await transactionEntityManager.save(u);
        e.user = deleteItemUser;
        await transactionEntityManager.save(e);
        const { u: su, e: se } = generateGenericUser("deleteItemStepUser");
        deleteItemStepUser = await transactionEntityManager.save(su);
        se.user = deleteItemStepUser;
        await transactionEntityManager.save(se);
      });
    });

    afterEach(async () => {
      await getConnection()
        .getRepository(Item)
        .createQueryBuilder()
        .delete()
        .where({ user: deleteItemUser })
        .execute();
    });

    afterAll(async () => {
      await getConnection()
        .getRepository(Item)
        .createQueryBuilder()
        .delete()
        .where({ user: deleteItemStepUser })
        .execute();
      await getConnection()
        .getRepository(User)
        .delete(deleteItemUser);
      await getConnection()
        .getRepository(User)
        .delete(deleteItemStepUser);
    });

    it("should delete an item", async () => {
      expect.assertions(8);
      const item = await ItemManager.createItem(deleteItemUser.uuid, {
        content: "testPayload",
        contentType: "plaintext",
        encItemKey: "unencrypted"
      });

      let deletedItem = await ItemManager.deleteItem(deleteItemUser.uuid, {
        id: item.uuid
      });
      expect(deletedItem).toBeDefined();
      deletedItem = deletedItem!;
      expect(deletedItem.uuid).toEqual(item.uuid);
      expect(deletedItem.content).toBeNull();
      expect(deletedItem.contentType).toBeNull();
      expect(deletedItem.encItemKey).toBeNull();
      expect(deletedItem.deleted).toEqual(true);
      expect(deletedItem.createdAt).toEqual(item.createdAt);
      expect(deletedItem.updatedAt).not.toEqual(item.updatedAt);
    });

    it("should delete an item with subtree", async () => {
      expect.assertions(24);
      const parentItem = await ItemManager.createItem(deleteItemUser.uuid, {
        content: "parent item",
        contentType: "plaintext",
        encItemKey: "unencrypted"
      });

      const childItem = await ItemManager.createItem(deleteItemUser.uuid, {
        content: "child item",
        contentType: "plaintext",
        encItemKey: "unencrypted",
        parentId: parentItem.uuid
      });

      const grandchildItem = await ItemManager.createItem(deleteItemUser.uuid, {
        content: "grandchild item",
        contentType: "plaintext",
        encItemKey: "unencrypted",
        parentId: childItem.uuid
      });

      await ItemManager.deleteItem(deleteItemUser.uuid, {
        id: parentItem.uuid,
        deleteDescendants: true
      });

      let deletedParent = await ItemManager.getItemById(parentItem.uuid);
      expect(deletedParent).toBeDefined();
      deletedParent = deletedParent!;
      expect(deletedParent.uuid).toEqual(parentItem.uuid);
      expect(deletedParent.content).toBeNull();
      expect(deletedParent.contentType).toBeNull();
      expect(deletedParent.encItemKey).toBeNull();
      expect(deletedParent.deleted).toEqual(true);
      expect(deletedParent.createdAt).toEqual(parentItem.createdAt);
      expect(deletedParent.updatedAt).not.toEqual(parentItem.updatedAt);

      let deletedChild = await ItemManager.getItemById(childItem.uuid);
      expect(deletedChild).toBeDefined();
      deletedChild = deletedChild!;
      expect(deletedChild.uuid).toEqual(childItem.uuid);
      expect(deletedChild.content).toBeNull();
      expect(deletedChild.contentType).toBeNull();
      expect(deletedChild.encItemKey).toBeNull();
      expect(deletedChild.deleted).toEqual(true);
      expect(deletedChild.createdAt).toEqual(childItem.createdAt);
      expect(deletedChild.updatedAt).not.toEqual(childItem.updatedAt);

      let deletedGrandChild = await ItemManager.getItemById(
        grandchildItem.uuid
      );
      expect(deletedGrandChild).toBeDefined();
      deletedGrandChild = deletedGrandChild!;
      expect(deletedGrandChild.uuid).toEqual(grandchildItem.uuid);
      expect(deletedGrandChild.content).toBeNull();
      expect(deletedGrandChild.contentType).toBeNull();
      expect(deletedGrandChild.encItemKey).toBeNull();
      expect(deletedGrandChild.deleted).toEqual(true);
      expect(deletedGrandChild.createdAt).toEqual(grandchildItem.createdAt);
      expect(deletedGrandChild.updatedAt).not.toEqual(grandchildItem.updatedAt);
    });

    it("should delete a nested item without effecting tree", async () => {
      expect.assertions(10);
      const parentItem = await ItemManager.createItem(deleteItemUser.uuid, {
        content: "parent item",
        contentType: "plaintext",
        encItemKey: "unencrypted"
      });

      const childItem = await ItemManager.createItem(deleteItemUser.uuid, {
        content: "child item",
        contentType: "plaintext",
        encItemKey: "unencrypted",
        parentId: parentItem.uuid
      });

      const grandchildItem = await ItemManager.createItem(deleteItemUser.uuid, {
        content: "grandchild item",
        contentType: "plaintext",
        encItemKey: "unencrypted",
        parentId: childItem.uuid
      });

      await ItemManager.deleteItem(deleteItemUser.uuid, {
        id: childItem.uuid,
        deleteDescendants: false
      });

      const untouchedParent = await ItemManager.getItemById(parentItem.uuid);
      expect(untouchedParent).toEqual(parentItem);

      let deletedChild = await ItemManager.getItemById(childItem.uuid);
      expect(deletedChild).toBeDefined();
      deletedChild = deletedChild!;
      expect(deletedChild.uuid).toEqual(childItem.uuid);
      expect(deletedChild.content).toBeNull();
      expect(deletedChild.contentType).toBeNull();
      expect(deletedChild.encItemKey).toBeNull();
      expect(deletedChild.deleted).toEqual(true);
      expect(deletedChild.createdAt).toEqual(childItem.createdAt);
      expect(deletedChild.updatedAt).not.toEqual(childItem.updatedAt);

      const untouchedGChild = await ItemManager.getItemById(
        grandchildItem.uuid
      );
      expect(untouchedGChild).toEqual({ ...grandchildItem, parent: undefined });
    });

    it("should handle invalid username", async () => {
      expect.assertions(2);
      const testInvalidUsername = await ItemManager.createItem(
        deleteItemUser.uuid,
        {
          content: "test invalid username",
          contentType: "plaintext",
          encItemKey: "unencrypted"
        }
      );
      await expect(
        ItemManager.deleteItem(undefined, {
          id: testInvalidUsername.uuid
        })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* id: Invalid JWT."
      );
      await expect(
        ItemManager.deleteItem("", {
          id: testInvalidUsername.uuid
        })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* id: Invalid JWT."
      );
    });
  });

  describe("getParentFromChildId", () => {
    let getParentUser: User;
    beforeAll(async () => {
      await getConnection().transaction(async transactionEntityManager => {
        const { u, e } = generateGenericUser("getParentItem");
        getParentUser = await transactionEntityManager.save(u);
        e.user = getParentUser;
        await transactionEntityManager.save(e);
      });
    });

    afterEach(async () => {
      await getConnection()
        .getRepository(Item)
        .createQueryBuilder()
        .delete()
        .where({ user: getParentUser })
        .execute();
    });

    afterAll(async () => {
      await getConnection()
        .getRepository(User)
        .delete(getParentUser);
    });
    it("should get a parent item given a child item id", async () => {
      expect.assertions(1);
      const ancestorItem = await ItemManager.createItem(getParentUser.uuid, {
        content: "ancestor item",
        contentType: "plaintext",
        encItemKey: "unencrypted"
      });

      const descendantItem = await ItemManager.createItem(getParentUser.uuid, {
        content: "descendant item",
        contentType: "plaintext",
        encItemKey: "unencrypted",
        parentId: ancestorItem.uuid
      });

      const parentItem = await ItemManager.getParentFromChildId(
        descendantItem.uuid
      );
      expect(parentItem).toEqual({ ...ancestorItem, user: undefined });
    });
  });
});
