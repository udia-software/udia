import { getConnection, getRepository } from "typeorm";
import { Item } from "../entity/Item";
import { ItemClosure } from "../entity/ItemClosure";
import UserManager from "./UserManager";
import { IErrorMessage, ValidationError } from "./ValidationError";

export interface ICreateItemParams {
  content: string;
  contentType: string;
  encItemKey: string;
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
   * Get the item's ancestors given the item's uuid
   * @param id uuid
   */
  public static async getAncestorsFromId(id: string) {
    return getRepository(Item)
      .createQueryBuilder("i")
      .innerJoinAndMapMany(
        "ancestors",
        ItemClosure,
        "c",
        "c.descendant = i.uuid",
        { uuid: id }
      );
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
    const user = await UserManager.getUserByUsername(username);
    if (!user) {
      errors.push({ key: "id", message: "Invalid JWT." });
    }
    if (parentId) {
      try {
        const parentItem = await ItemManager.getItemById(parentId);
        if (!parentItem) {
          throw new Error('Could not retrieve parent from parentId.');
        }  
      } catch {
        errors.push({ key: "parentId", message: "Invalid parentId." });        
      }
    }
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    let newItem = new Item();
    newItem.content = content;
    newItem.contentType = contentType;
    newItem.encItemKey = encItemKey;
    newItem.user = user!;

    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();

    await queryRunner.startTransaction();

    newItem = await queryRunner.manager.save(newItem);
    if (parentId) {
      await queryRunner.query(
        `INSERT INTO "item_closure"("ancestor", "descendant", "depth") ` +
          `SELECT ancestor, '${newItem.uuid}'::uuid, depth + 1 ` +
          `FROM item_closure WHERE descendant = '${parentId}' ` +
          `UNION ALL SELECT '${newItem.uuid}', '${newItem.uuid}', 0;`
      );
    } else {
      await queryRunner.query(
        `INSERT INTO "item_closure"("ancestor", "descendant", "depth") ` +
          `VALUES ('${newItem.uuid}', '${newItem.uuid}', 0);`
      );
    }
    await queryRunner.commitTransaction();
    return newItem;
  }
}
