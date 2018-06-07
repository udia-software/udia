import { getConnection, getRepository } from "typeorm";
import { ITEMS_PAGE_LIMIT } from "../constants";
import { Item } from "../entity/Item";
import { ItemClosure } from "../entity/ItemClosure";
import { User } from "../entity/User";
import UserManager from "./UserManager";
import { IErrorMessage, ValidationError } from "./ValidationError";

const UUID_TEST = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface IGetItemsParams {
  userId?: string | null;
  username?: string;
  parentId?: string | null;
  depth?: number;
  limit?: number;
  datetime?: Date;
  sort?: "createdAt" | "updatedAt";
  order?: "ASC" | "DESC";
}

export interface ICreateItemParams {
  content: string;
  contentType: string;
  encItemKey?: string;
  parentId?: string;
}

export interface IUpdateItemParams {
  id: string;
  content?: string;
  contentType?: string;
  encItemKey?: string;
  parentId?: string;
}

export interface IDeleteItemParams {
  id: string;
  deleteDescendants?: boolean;
}

export default class ItemManager {
  /**
   * Get the item given the item's uuid
   * @param {string} id uuid of the item
   */
  public static async getItemById(id: string) {
    return getRepository(Item).findOne(id);
  }

  /**
   * Add a new item to the database. Return the created item.
   * @param {string} username username derived from signed JWT payload
   * @param {ICreateItemParams} parameters GraphQL createItem parameters
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
    if (encItemKey) {
      newItem.encItemKey = encItemKey;
    }
    newItem.user = user!;
    if (parentItem) {
      newItem.parent = parentItem;
    }

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
   * Get an array of items matching the given critera, with an additional
   * count of all items for pagination. Uses Keyset pagination over createdAt
   * @param {IGetItemsParams} parameters GraphQL getItems parameters
   */
  public static async getItems({
    userId, // Get items that belong to the given user (prioritized higher than username)
    username, // Get items that belong to the given user (username) or undefined
    parentId, // Get items from ancestor (null for root, undefined for all)
    depth = 0, // Get items at a specific depth from ancestor
    limit = 10, // Limit number of items returned
    datetime, // Keyset pagination on date (unindexed for updatedAt)
    sort = "createdAt", // Sort by createdAt field
    order = "DESC" // Order by descending value (show newest first)
  }: IGetItemsParams) {
    // Initialize the query builder
    const itemQueryBuilder = getRepository(Item).createQueryBuilder("item");

    // Perform depth/parent id closure table subquery
    itemQueryBuilder.where(qb => {
      const closureQueryBuilder = qb
        .subQuery()
        .select("closure.descendant")
        .from(ItemClosure, "closure")
        .where("closure.depth = :depth", { depth });
      // if the parent id is set, do the mapping here
      if (typeof parentId === "string") {
        closureQueryBuilder.andWhere("closure.ancestor = :parentId", {
          parentId
        });
      }
      const closureSubQuery = closureQueryBuilder.getQuery();
      return `"item"."uuid" IN ${closureSubQuery}`;
    });

    // If username is set, perform username mapping
    if (userId !== undefined) {
      if (typeof userId === "string") {
        // Get items with the given userId
        itemQueryBuilder.andWhere(`"item"."userUuid" = :userId`, { userId });
      } else {
        // Get items where the user is deleted.
        itemQueryBuilder.andWhere(`"item"."userUuid" IS NULL`);
      }
    } else if (username !== undefined) {
      itemQueryBuilder.andWhere(qb => {
        const userSubQuery = qb
          .subQuery()
          .select("user.uuid")
          .from(User, "user")
          .where("user.lUsername = :lUsername", {
            lUsername: username.trim().toLowerCase()
          })
          .limit(1)
          .getQuery();
        return `"item"."userUuid" IN ${userSubQuery}`;
      });
    }
    // if parentId is null, enforce only root items.
    // depth should be 0 otherwise the returned array will always be empty
    if (parentId === null) {
      itemQueryBuilder.andWhere(`"item"."parentUuid" IS NULL`);
    }

    // Don't show deleted items.
    itemQueryBuilder.andWhere(`"item"."deleted" = FALSE`);

    // Datetime is used for pagination over items
    if (datetime !== undefined) {
      // operator depends on ASC or DESC
      const datetimeOp = { DESC: "<", ASC: ">" };
      itemQueryBuilder.andWhere(
        `"item"."${sort}" ${datetimeOp[order]} :datetime`,
        { datetime }
      );
    }

    // Ensure limit is between 1 and ITEMS_PAGE_LIMIT
    let safeLimit = Math.min(limit, parseInt(ITEMS_PAGE_LIMIT, 10));
    safeLimit = Math.max(1, safeLimit);

    const [items, count] = await itemQueryBuilder
      .orderBy(`"item"."${sort}"`, order)
      .limit(safeLimit)
      .getManyAndCount();
    return { items, count };
  }

  /**
   * Update an item in the database. Return the updated item.
   * @param {string} username username derived from signed JWT payload
   * @param {IUpdateItemParams} parameters GraphQL updateItem parameters
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
    let item = await ItemManager.validateItemUserOwnership(id, user, errors);
    const updateParams = new Set([content, contentType, encItemKey, parentId]);
    if (updateParams.size === 1 && updateParams.has(undefined)) {
      errors.push({ key: "id", message: "Cannot update with no changes." });
    }
    if (item && item.deleted) {
      errors.push({ key: "id", message: "Cannot update a deleted item." });
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
   * Clear all content fields from the item, set deleted to be true.
   * Do not run SQL DELETE. Tree structure must always be enforced.
   * @param {string} username username derived from JWT payload
   * @param {IDeleteItemParams} parameters GraphQL deleteItem parameters
   */
  public static async deleteItem(
    username: string = "",
    { id, deleteDescendants = true }: IDeleteItemParams
  ) {
    const errors: IErrorMessage[] = [];
    const user = await ItemManager.validateUsernameJWT(username, errors);
    let item = await ItemManager.validateItemUserOwnership(id, user, errors);
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    // do these have to be nulls? Test for this.
    item!.content = null;
    item!.contentType = null;
    item!.encItemKey = null;
    item!.deleted = true;

    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    item = await queryRunner.manager.save(item);

    // only expose the deleteDescendants path in api, but make optional in case
    if (deleteDescendants) {
      await queryRunner.query(
        `UPDATE "item" SET ` +
          `"content" = NULL, ` +
          `"contentType" = NULL, ` +
          `"encItemKey" = NULL, ` +
          `"deleted" = TRUE, ` +
          `"updatedAt" = now() ` +
          `WHERE "uuid" IN (` +
          `SELECT "descendant"::uuid FROM "item_closure" ` +
          `WHERE "ancestor" = '${item!.uuid}'` +
          `);`
      );
    }
    await queryRunner.commitTransaction();
    await queryRunner.release();
    return item;
  }

  public static async getParentFromChildId(id: string) {
    return getRepository(Item)
      .createQueryBuilder("item")
      .where(qb => {
        const subItemQuery = qb
          .subQuery()
          .select("closure.ancestor")
          .from(ItemClosure, "closure")
          .where("closure.depth = :depth", { depth: 1 })
          .andWhere("closure.descendant = :id", { id })
          .getQuery();
        return `"item"."uuid" IN ${subItemQuery}`;
      })
      .limit(1)
      .getOne();
  }

  /**
   * Check whether the item belongs to the user and exists
   * @param id uuid of the item
   * @param user User instance
   * @param errors array of errors to push to
   */
  private static async validateItemUserOwnership(
    id: string,
    user: User | undefined,
    errors: IErrorMessage[]
  ) {
    let item = null;
    try {
      if (UUID_TEST.test(id)) {
        item = await ItemManager.getItemById(id);
      } else {
        throw new Error("Invalid UUID.");
      }
      if (!item) {
        errors.push({ key: "id", message: "Item not found." });
      } else if (user && item.user && item.user.lUsername !== user.lUsername) {
        errors.push({ key: "id", message: "Item does not belong to user." });
      }
    } catch {
      errors.push({ key: "id", message: "Invalid id." });
    }
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
        if (UUID_TEST.test(parentId)) {
          parentItem = await ItemManager.getItemById(parentId);
        } else {
          throw new Error("Invalid UUID.");
        }
        if (!parentItem) {
          errors.push({
            key: "parentId",
            message: "Parent not found."
          });
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
