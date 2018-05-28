import { execute } from "graphql";
import { Server } from "http";
import { getConnection } from "typeorm";
import start from "../../src";
import { PORT } from "../../src/constants";
import { Item } from "../../src/entity/Item";
import { ItemClosure } from "../../src/entity/ItemClosure";
import { User } from "../../src/entity/User";
import { UserEmail } from "../../src/entity/UserEmail";
import ItemManager from "../../src/modules/ItemManager";

let server: Server = null;
let itemPaginationUser: User = null;

async function createUsers() {
  await getConnection().transaction(async transactionEntityManager => {
    let imUser = new User();
    const imEmail = new UserEmail();
    imEmail.email = "itemTester@udia.ca";
    imEmail.lEmail = "itemtester@udia.ca";
    imEmail.primary = true;
    imEmail.verified = true;
    imUser.username = "itemTester";
    imUser.lUsername = "itemtester";
    imUser.pwHash = "$argon2i$v=1$m=1,t=1,p=1$101";
    imUser.pwFunc = "pbkdf2";
    imUser.pwDigest = "sha512";
    imUser.pwCost = 3000;
    imUser.pwSalt = "101";
    imUser = await transactionEntityManager.save(imUser);
    imEmail.user = imUser;
    await transactionEntityManager.save(imEmail);
    let imUser2 = new User();
    const imEmail2 = new UserEmail();
    imEmail2.email = "itemTester2@udia.ca";
    imEmail2.lEmail = "itemtester2@udia.ca";
    imEmail2.primary = true;
    imEmail2.verified = true;
    imUser2.username = "itemTester2";
    imUser2.lUsername = "itemtester2";
    imUser2.pwHash = "$argon2i$v=1$m=1,t=1,p=1$101";
    imUser2.pwFunc = "pbkdf2";
    imUser2.pwDigest = "sha512";
    imUser2.pwCost = 3000;
    imUser2.pwSalt = "101";
    imUser2 = await transactionEntityManager.save(imUser2);
    imEmail2.user = imUser2;
    await transactionEntityManager.save(imEmail2);
    itemPaginationUser = new User();
    const itemPaginationUserEmail = new UserEmail();
    itemPaginationUserEmail.email = "itemsTester@udia.ca";
    itemPaginationUserEmail.lEmail = "itemstester@udia.ca";
    itemPaginationUserEmail.primary = true;
    itemPaginationUserEmail.verified = true;
    itemPaginationUser.username = "itemsTester";
    itemPaginationUser.lUsername = "itemstester";
    itemPaginationUser.pwHash = "$argon2i$v=1$m=1,t=1,p=1$101";
    itemPaginationUser.pwFunc = "pbkdf2";
    itemPaginationUser.pwDigest = "sha512";
    itemPaginationUser.pwCost = 3000;
    itemPaginationUser.pwSalt = "101";
    itemPaginationUser = await transactionEntityManager.save(
      itemPaginationUser
    );
    itemPaginationUserEmail.user = itemPaginationUser;
    await transactionEntityManager.save(itemPaginationUserEmail);
  });
}

async function deleteValues() {
  const userSubQuery = getConnection()
    .getRepository(User)
    .createQueryBuilder()
    .select(`"user"."uuid"`)
    .from(User, "user")
    .where(`"user"."lUsername" = 'itemtester'`)
    .orWhere(`"user"."lUsername" = 'itemtester2'`)
    .orWhere(`"user"."lUsername" = 'itemstester'`)
    .getQuery();
  await getConnection().transaction(async transactionEntityManager => {
    await transactionEntityManager
      .createQueryBuilder()
      .delete()
      .from(Item, "item")
      .where(qb => {
        return `"item"."userUuid" IN (${userSubQuery})`;
      })
      .execute();
    await transactionEntityManager.delete(User, { lUsername: "itemtester" });
    await transactionEntityManager.delete(User, { lUsername: "itemtester2" });
    await transactionEntityManager.delete(User, { lUsername: "itemstester" });
  });
}

beforeAll(async () => {
  const itemTestPort = `${parseInt(PORT, 10) + 5}`;
  server = await start(itemTestPort);
  await deleteValues();
  await createUsers();
});

afterAll(async done => {
  await deleteValues();
  server.close(done);
});

describe("ItemManager", () => {
  describe("createItem", () => {
    it("should create an item", async () => {
      expect.assertions(10);
      const item = await ItemManager.createItem("itemtester", {
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
      const ancestorItem = await ItemManager.createItem("itemtester", {
        content: "ancestor item",
        contentType: "plaintext",
        encItemKey: "unencrypted"
      });

      const descendantItem = await ItemManager.createItem("itemtester", {
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
      expect.assertions(3);
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
        ItemManager.createItem(null, {
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
        ItemManager.createItem("itemtester", {
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
        ItemManager.createItem("itemtester", {
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
        ItemManager.createItem("itemtester", {
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
      const stepParent = await ItemManager.createItem("itemtester2", {
        content: "step parent value",
        contentType: "plaintext",
        encItemKey: "unencrypted"
      });
      await expect(
        ItemManager.createItem("itemtester", {
          content: "not mapped uuid",
          contentType: "plaintext",
          encItemKey: "unencrypted",
          parentId: stepParent.uuid
        })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* parentId: Parent does not belong to user."
      );
    });
  });

  describe("getItems", () => {
    afterEach(async () => {
      // delete all of the itemPaginationUser's items after each getItems test
      await getConnection()
        .getRepository(Item)
        .createQueryBuilder()
        .delete()
        .where({ user: itemPaginationUser })
        .execute();
    });

    it("should get many items with keyset pagination on date", async () => {
      expect.assertions(3);
      const getItemsTestReferences = [];
      for (let i = 1; i <= 20; i++) {
        const item = await ItemManager.createItem("itemstester", {
          content: `Flat Test Item ${i}`,
          contentType: "plaintext",
          encItemKey: "unencrypted"
        });
        getItemsTestReferences.unshift(item);
      }
      const allUserItems = await ItemManager.getItems({
        username: "itemstester",
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
        username: "itemstester",
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
      const rootItem = await ItemManager.createItem("itemstester", {
        content: "Root Item",
        contentType: "plaintext",
        encItemKey: "unencrypted"
      });
      const child1 = await ItemManager.createItem("itemstester", {
        content: "Child 1",
        contentType: "plaintext",
        encItemKey: "unencrypted",
        parentId: rootItem.uuid
      });
      const child2 = await ItemManager.createItem("itemstester", {
        content: "Child 2",
        contentType: "plaintext",
        encItemKey: "unencrypted",
        parentId: rootItem.uuid
      });

      const childrenOfRoot = await ItemManager.getItems({
        username: "itemstester",
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

      const gc11 = await ItemManager.createItem("itemstester", {
        content: "Grandchild 1-1 (Child of 1)",
        contentType: "plaintext",
        encItemKey: "unencrypted",
        parentId: child1.uuid
      });
      const gc12 = await ItemManager.createItem("itemstester", {
        content: "Grandchild 1-2 (Child of 1)",
        contentType: "plaintext",
        encItemKey: "unencrypted",
        parentId: child1.uuid
      });
      const gc13 = await ItemManager.createItem("itemstester", {
        content: "Grandchild 1-3 (Child of 1)",
        contentType: "plaintext",
        encItemKey: "unencrypted",
        parentId: child1.uuid
      });
      const gc21 = await ItemManager.createItem("itemstester", {
        content: "Grandchild 2-1 (Child of 2)",
        contentType: "plaintext",
        encItemKey: "unencrypted",
        parentId: child2.uuid
      });

      const grandchildrenOfRoot = await ItemManager.getItems({
        username: "itemstester",
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
        username: "itemstester",
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

    it("should get items with undefined username (any)", async () => {
      expect.assertions(3);
      const itemstesterItem = await ItemManager.createItem("itemstester", {
        content: "My Items Tester item",
        contentType: "plaintext",
        encItemKey: "unencrypted"
      });
      const itemtester2Item = await ItemManager.createItem("itemtester2", {
        content: "My Item Tester 2 item",
        contentType: "plaintext",
        encItemKey: "unencrypted"
      });

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
      expect.assertions(3);
      const itemstesterItem = await ItemManager.createItem("itemstester", {
        content: "My Items Tester item",
        contentType: "plaintext",
        encItemKey: "unencrypted"
      });

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
      // todo: rewrite this test so other items don't effect it
      // expect(noItems).toEqual([]);
    });
  });

  describe("updateItem", () => {
    it("should update an item", async () => {
      expect.assertions(18);
      const item = await ItemManager.createItem("itemtester", {
        content: "testPayload",
        contentType: "plaintext",
        encItemKey: "unencrypted"
      });

      let updatedItem = await ItemManager.updateItem("itemtester", {
        id: item.uuid,
        content: "updated item content"
      });
      expect(updatedItem.uuid).toEqual(item.uuid);
      expect(updatedItem.content).not.toEqual(item.content);
      expect(updatedItem.contentType).toEqual(item.contentType);
      expect(updatedItem.encItemKey).toEqual(item.encItemKey);
      expect(updatedItem.createdAt).toEqual(item.createdAt);
      expect(updatedItem.updatedAt).not.toEqual(item.updatedAt);

      updatedItem = await ItemManager.updateItem("itemtester", {
        id: item.uuid,
        content: "# this is markdown",
        contentType: "markdown"
      });
      expect(updatedItem.uuid).toEqual(item.uuid);
      expect(updatedItem.content).not.toEqual(item.content);
      expect(updatedItem.contentType).not.toEqual(item.contentType);
      expect(updatedItem.encItemKey).toEqual(item.encItemKey);
      expect(updatedItem.createdAt).toEqual(item.createdAt);
      expect(updatedItem.updatedAt).not.toEqual(item.updatedAt);

      updatedItem = await ItemManager.updateItem("itemtester", {
        id: item.uuid,
        encItemKey: "123"
      });
      expect(updatedItem.uuid).toEqual(item.uuid);
      expect(updatedItem.content).not.toEqual(item.content);
      expect(updatedItem.contentType).not.toEqual(item.contentType);
      expect(updatedItem.encItemKey).not.toEqual(item.encItemKey);
      expect(updatedItem.createdAt).toEqual(item.createdAt);
      expect(updatedItem.updatedAt).not.toEqual(item.updatedAt);
    });

    it("should update an item with a parent", async () => {
      expect.assertions(11);
      const momItem = await ItemManager.createItem("itemtester", {
        content: "mom item",
        contentType: "plaintext",
        encItemKey: "unencrypted"
      });

      const dadItem = await ItemManager.createItem("itemtester", {
        content: "dad item",
        contentType: "plaintext",
        encItemKey: "unencrypted"
      });

      let childItem = await ItemManager.createItem("itemtester", {
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
      childItem = await ItemManager.updateItem("itemtester", {
        id: childItem.uuid,
        content: "with dad",
        parentId: dadItem.uuid
      });

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
      expect.assertions(3);
      const testInvalidUsername = await ItemManager.createItem("itemtester", {
        content: "test invalid username",
        contentType: "plaintext",
        encItemKey: "unencrypted"
      });
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
        ItemManager.updateItem(null, {
          id: testInvalidUsername.uuid,
          content: "null username"
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
        ItemManager.updateItem("itemtester", {
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
        ItemManager.updateItem("itemtester", {
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
        ItemManager.updateItem("itemtester", {
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
      const stepParent = await ItemManager.createItem("itemtester2", {
        content: "step parent value",
        contentType: "plaintext",
        encItemKey: "unencrypted"
      });
      await expect(
        ItemManager.updateItem("itemtester", {
          id: stepParent.uuid,
          content: "not owned item"
        })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* id: Item does not belong to user."
      );
    });

    it("should handle item update with no parameters", async () => {
      expect.assertions(1);
      const unchangedItem = await ItemManager.createItem("itemtester", {
        content: "unchanged item",
        contentType: "plaintext",
        encItemKey: "unencrypted"
      });
      await expect(
        ItemManager.updateItem("itemtester", { id: unchangedItem.uuid })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* id: Cannot update with no changes."
      );
    });
  });

  describe("deleteItem", () => {
    it("should delete an item", async () => {
      expect.assertions(7);
      const item = await ItemManager.createItem("itemtester", {
        content: "testPayload",
        contentType: "plaintext",
        encItemKey: "unencrypted"
      });

      const deletedItem = await ItemManager.deleteItem("itemtester", {
        id: item.uuid
      });
      expect(deletedItem.uuid).toEqual(item.uuid);
      expect(deletedItem.content).toBeNull();
      expect(deletedItem.contentType).toBeNull();
      expect(deletedItem.encItemKey).toBeNull();
      expect(deletedItem.deleted).toEqual(true);
      expect(deletedItem.createdAt).toEqual(item.createdAt);
      expect(deletedItem.updatedAt).not.toEqual(item.updatedAt);
    });

    it("should delete an item with subtree", async () => {
      expect.assertions(21);
      const parentItem = await ItemManager.createItem("itemtester", {
        content: "parent item",
        contentType: "plaintext",
        encItemKey: "unencrypted"
      });

      const childItem = await ItemManager.createItem("itemtester", {
        content: "child item",
        contentType: "plaintext",
        encItemKey: "unencrypted",
        parentId: parentItem.uuid
      });

      const grandchildItem = await ItemManager.createItem("itemtester", {
        content: "grandchild item",
        contentType: "plaintext",
        encItemKey: "unencrypted",
        parentId: childItem.uuid
      });

      await ItemManager.deleteItem("itemtester", {
        id: parentItem.uuid,
        deleteDescendants: true
      });

      const deletedParent = await ItemManager.getItemById(parentItem.uuid);
      expect(deletedParent.uuid).toEqual(parentItem.uuid);
      expect(deletedParent.content).toBeNull();
      expect(deletedParent.contentType).toBeNull();
      expect(deletedParent.encItemKey).toBeNull();
      expect(deletedParent.deleted).toEqual(true);
      expect(deletedParent.createdAt).toEqual(parentItem.createdAt);
      expect(deletedParent.updatedAt).not.toEqual(parentItem.updatedAt);

      const deletedChild = await ItemManager.getItemById(childItem.uuid);
      expect(deletedChild.uuid).toEqual(childItem.uuid);
      expect(deletedChild.content).toBeNull();
      expect(deletedChild.contentType).toBeNull();
      expect(deletedChild.encItemKey).toBeNull();
      expect(deletedChild.deleted).toEqual(true);
      expect(deletedChild.createdAt).toEqual(childItem.createdAt);
      expect(deletedChild.updatedAt).not.toEqual(childItem.updatedAt);

      const deletedGrandChild = await ItemManager.getItemById(
        grandchildItem.uuid
      );
      expect(deletedGrandChild.uuid).toEqual(grandchildItem.uuid);
      expect(deletedGrandChild.content).toBeNull();
      expect(deletedGrandChild.contentType).toBeNull();
      expect(deletedGrandChild.encItemKey).toBeNull();
      expect(deletedGrandChild.deleted).toEqual(true);
      expect(deletedGrandChild.createdAt).toEqual(grandchildItem.createdAt);
      expect(deletedGrandChild.updatedAt).not.toEqual(grandchildItem.updatedAt);
    });

    it("should delete a nested item without effecting tree", async () => {
      expect.assertions(9);
      const parentItem = await ItemManager.createItem("itemtester", {
        content: "parent item",
        contentType: "plaintext",
        encItemKey: "unencrypted"
      });

      const childItem = await ItemManager.createItem("itemtester", {
        content: "child item",
        contentType: "plaintext",
        encItemKey: "unencrypted",
        parentId: parentItem.uuid
      });

      const grandchildItem = await ItemManager.createItem("itemtester", {
        content: "grandchild item",
        contentType: "plaintext",
        encItemKey: "unencrypted",
        parentId: childItem.uuid
      });

      await ItemManager.deleteItem("itemtester", {
        id: childItem.uuid,
        deleteDescendants: false
      });

      const untouchedParent = await ItemManager.getItemById(parentItem.uuid);
      expect(untouchedParent).toEqual(parentItem);

      const deletedChild = await ItemManager.getItemById(childItem.uuid);
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
      expect.assertions(3);
      const testInvalidUsername = await ItemManager.createItem("itemtester", {
        content: "test invalid username",
        contentType: "plaintext",
        encItemKey: "unencrypted"
      });
      await expect(
        ItemManager.deleteItem(undefined, {
          id: testInvalidUsername.uuid
        })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* id: Invalid JWT."
      );
      await expect(
        ItemManager.deleteItem(null, {
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
    it("should get a parent item given a child item id", async () => {
      expect.assertions(1);
      const ancestorItem = await ItemManager.createItem("itemtester", {
        content: "ancestor item",
        contentType: "plaintext",
        encItemKey: "unencrypted"
      });

      const descendantItem = await ItemManager.createItem("itemtester", {
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
