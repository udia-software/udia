import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { User } from "./User";

@Entity()
@Index(['createdAt', 'user', 'uuid'])
export class Item {
  @PrimaryGeneratedColumn("uuid") public uuid: string;

  @Column({
    comment: "JSON string encoded structure of the note, may be encrypted.",
    type: "varchar",
    nullable: true
  })
  public content: string | null;

  @Column({
    comment: "Type of the structure contained in the content field.",
    type: "citext",
    nullable: true
  })
  public contentType: string | null;

  @Column({
    comment: "Client encrypted jwt-key encryption key for this item.",
    type: "varchar",
    nullable: true
  })
  public encItemKey: string | null;

  @Column({
    comment: "Has the item has been deleted?",
    type: "boolean",
    nullable: false,
    default: false
  })
  public deleted: boolean;

  // User that created this item.
  @ManyToOne(type => User, user => user.items, {
    cascade: ["insert", "update", "remove"],
    onDelete: "SET NULL",
    nullable: true,
    eager: true
  })
  public user: User | null;

  @ManyToOne(type => Item, {
    cascade: ["insert", "update", "remove"],
    onDelete: "SET NULL",
    nullable: true
  })
  public parent: Item | null;

  @CreateDateColumn({
    comment: "Item creation timestamp.",
    type: "timestamp with time zone"
  })
  public createdAt: Date;

  @UpdateDateColumn({
    comment: "Item updated timestamp.",
    type: "timestamp with time zone"
  })
  public updatedAt: Date;
}
