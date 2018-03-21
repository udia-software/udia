class Item {
  /** The unique identifier for the item. */
  public uuid: string;
  /** The JSON string encoded structure of the item, encrypted. */
  public content: string;
  /** The type of the structure contained in the content field. */
  public contentType: string;
  /** The locally encrypted encryption key for this item. */
  public encItemKey: string;
  /** Whether the item has been deleted. */
  public deleted: boolean;
  /** The date this item was created. */
  public createdAt: Date;
  /** The date this item was modified. */
  public updatedAt: Date;

  constructor(
    uuid: string,
    content: string,
    contentType: string,
    encItemKey: string,
    createdAt: Date
  ) {
    this.uuid = uuid;
    this.content = content;
    this.contentType = contentType;
    this.encItemKey = encItemKey;
    this.deleted = false;
    this.createdAt = createdAt;
    this.updatedAt = createdAt;
  }
}
