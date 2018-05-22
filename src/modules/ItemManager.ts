import { getConnection, getRepository } from "typeorm";
import { Item } from "../entity/Item";
import { User } from "../entity/User";
import UserManager from "./UserManager";
import { IErrorMessage, ValidationError } from "./ValidationError";

export interface ICreateItemParams {
  content: string;
  contentType: string;
  encItemKey: string;
  parentId?: string;
}

export interface IUpdateItemParams {
  id: string;
  content?: string;
  contentType?: string;
  encItemKey?: string;
  parentId?: string;
}

export default class ItemManager {
  /**
   * Get the item given the item's uuid
   * @param id uuid
   */
  public static async getItemById(id: string) {
    return getRepository(Item).findOne(id);
  }

  /**
   * Add a new item to the database. Return the created item.
   * @param username username derived from signed JWT payload
   * @param parameters GraphQL createItem parameters
   */
  public static async createItem(
    username: string = "",
    { content, contentType, encItemKey, parentId }: ICreateItemParams
  ) {
    const errors: IErrorMessage[] = [];
    const user = await ItemManager.validateUsernameJWT(username, errors);
    const parentItem = await ItemManager.validateItemParentId(
      parentId,
      user,
      errors
    );
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    let newItem = new Item();
    newItem.content = content;
    newItem.contentType = contentType;
    newItem.encItemKey = encItemKey;
    newItem.user = user!;
    newItem.parent = parentItem ? parentItem : undefined;

    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    newItem = await queryRunner.manager.save(newItem);
    if (parentItem) {
      await queryRunner.query(
        `INSERT INTO "item_closure"("ancestor", "descendant", "depth") ` +
          `SELECT ancestor, '${newItem.uuid}'::uuid, depth + 1 ` +
          `FROM item_closure WHERE descendant = '${parentItem.uuid}' ` +
          `UNION ALL SELECT '${newItem.uuid}', '${newItem.uuid}', 0;`
      );
    } else {
      await queryRunner.query(
        `INSERT INTO "item_closure"("ancestor", "descendant", "depth") ` +
          `VALUES ('${newItem.uuid}', '${newItem.uuid}', 0);`
      );
    }
    await queryRunner.commitTransaction();
    await queryRunner.release();
    return newItem;
  }

  /**
   * Update an item in the database. Return the updated item.
   * @param username username derived from signed JWT payload
   * @param parameters GraphQL updateItem parameters
   */
  public static async updateItem(
    username: string = "",
    { id, content, contentType, encItemKey, parentId }: IUpdateItemParams
  ) {
    const errors: IErrorMessage[] = [];
    const user = await ItemManager.validateUsernameJWT(username, errors);
    const parentItem = await ItemManager.validateItemParentId(
      parentId,
      user,
      errors
    );
    let item = await ItemManager.getItemById(id);
    if (!item) {
      errors.push({ key: "id", message: "Item not found." });
    } else if (item!.user!.lUsername !== user!.lUsername) {
      errors.push({ key: "id", message: "Item does not belong to user." });
    }
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    item!.content = content !== undefined ? content : item!.content;
    item!.contentType =
      contentType !== undefined ? contentType : item!.contentType;
    item!.encItemKey = encItemKey !== undefined ? encItemKey : item!.encItemKey;
    item!.user = user!;
    item!.parent = parentItem ? parentItem : item!.parent;

    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    item = await queryRunner.manager.save(item);

    // Subtree moved, updated closure relations
    if (!!parentItem) {
      // Disconnect from current ancestors
      await queryRunner.query(
        `DELETE FROM "item_closure" WHERE "descendant" IN ` +
          `(SELECT "descendant"::uuid FROM "item_closure" ` +
          `WHERE "ancestor" = '${item!.uuid}') AND "ancestor" IN ` +
          `(SELECT "ancestor"::uuid FROM "item_closure" ` +
          `WHERE "descendant" = '${item!.uuid}' ` +
          `AND "ancestor" != "descendant");`
      );
      // Mount subtree to new ancestors
      await queryRunner.query(
        `INSERT INTO "item_closure" ("ancestor", "descendant", "depth") ` +
          `SELECT "supertree"."ancestor"::uuid, ` +
          `"subtree"."descendant"::uuid, ` +
          `"supertree"."depth" + "subtree"."depth" + 1 ` +
          `FROM "item_closure" AS "supertree" ` +
          `CROSS JOIN "item_closure" AS "subtree" ` +
          `WHERE "supertree"."descendant" = '${parentItem.uuid}' ` +
          `AND "subtree"."ancestor" = '${item!.uuid}';`
      );
    }
    await queryRunner.commitTransaction();
    await queryRunner.release();
    return item;
  }

  /**
   * Check whether the parent id belongs to the user and exists
   * @param parentId uuid of the parent item
   * @param user User instance
   * @param errors array of errors to push to
   */
  private static async validateItemParentId(
    parentId: string | undefined,
    user: User | undefined,
    errors: IErrorMessage[]
  ) {
    let parentItem = null;
    if (parentId) {
      try {
        parentItem = await ItemManager.getItemById(parentId);
        if (!parentItem) {
          throw new Error("Could not retrieve parent from parentId.");
        } else if (
          (user &&
            parentItem.user &&
            user.lUsername !== parentItem.user.lUsername) ||
          !parentItem.user
        ) {
          errors.push({
            key: "parentId",
            message: "Parent does not belong to user."
          });
        }
      } catch {
        errors.push({ key: "parentId", message: "Invalid parentId." });
      }
    }
    return parentItem;
  }

  private static async validateUsernameJWT(
    username: string,
    errors: IErrorMessage[]
  ) {
    const user = await UserManager.getUserByUsername(username);
    if (!user) {
      errors.push({ key: "id", message: "Invalid JWT." });
    }
    return user;
  }
}
