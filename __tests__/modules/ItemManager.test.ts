import { execute } from "graphql";
import { Server } from "http";
import { getConnection } from "typeorm";
import start from "../../src";
import { PORT } from "../../src/constants";
import { ItemClosure } from "../../src/entity/ItemClosure";
import { User } from "../../src/entity/User";
import { UserEmail } from "../../src/entity/UserEmail";
import ItemManager from "../../src/modules/ItemManager";

let server: Server = null;

async function createUser() {
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
  });
}

async function deleteValues() {
  await getConnection().transaction(async transactionEntityManager => {
    await transactionEntityManager.delete(User, { lUsername: "itemtester" });
    await transactionEntityManager.delete(User, { lUsername: "itemtester2" });
    await transactionEntityManager.query("DELETE FROM item_closure");
    await transactionEntityManager.query("DELETE FROM item;");
  });
}

beforeAll(async () => {
  const itemTestPort = `${parseInt(PORT, 10) + 5}`;
  server = await start(itemTestPort);
  await deleteValues();
  await createUser();
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
});
