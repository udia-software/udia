import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { User } from "./User";

@Entity()
export class Item {
  @PrimaryGeneratedColumn("uuid") public uuid: string;

  @Column({
    type: "varchar",
    nullable: true
    // comment: "JSON string encoded structure of the note, encrypted."
  })
  public content?: string;

  @Column({
    type: "citext",
    nullable: true
    // comment: "content type of the structure contained in the content field."
  })
  public contentType?: string;

  @Column({
    type: "varchar",
    nullable: true
    // comment: "locally encrypted encryption key for this item."
  })
  public encItemKey?: string;

  @Column({
    type: "boolean",
    nullable: false,
    default: false
    // comment: "Whether the item has been deleted."
  })
  public deleted: boolean;

  @ManyToOne(type => User, user => user.items, {
    cascade: ["insert", "update", "remove"],
    onDelete: "SET NULL",
    nullable: true,
    eager: true
    // comment: "User that owns this item."
  })
  public user?: User;

  @ManyToOne(type => Item, {
    cascade: ["insert", "update", "remove"],
    onDelete: "SET NULL",
    nullable: true
    // comment: "Parent that encompasses this item."
  })
  public parent?: Item;

  @CreateDateColumn({
    type: "timestamp with time zone"
    // comment: "Item creation timestamp."
  })
  public createdAt: Date;

  @UpdateDateColumn({
    type: "timestamp with time zone"
    // comment: "Item updated timestamp."
  })
  public updatedAt: Date;
}
