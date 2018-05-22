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
  });
}

async function deleteValues() {
  await getConnection().transaction(async transactionEntityManager => {
    await transactionEntityManager.delete(User, { lUsername: "itemtester" });
    await transactionEntityManager.query("DELETE FROM item_closure");
    await transactionEntityManager.query("DELETE FROM item;");
  });
}

beforeAll(async done => {
  const itemTestPort = `${parseInt(PORT, 10) + 5}`;
  server = await start(itemTestPort);
  await deleteValues();
  await createUser();
  done();
});

afterAll(async done => {
  await deleteValues();
  server.close(done);
});

describe("ItemManager", () => {
  describe("createItem", () => {
    it("should create an item", async done => {
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
      done();
    });

    it("should create an item with a parent", async done => {
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
      done();
    });

    it("should handle invalid username", async () => {
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
          content: "not mapped uuid",
          contentType: "plaintext",
          encItemKey: "unencrypted",
          parentId: "123e4567-e89b-12d3-a456-426655440000"
        })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* parentId: Invalid parentId."
      );
    });
  });
});
