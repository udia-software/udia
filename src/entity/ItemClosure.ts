import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn
} from "typeorm";
import { Item } from "./Item";

@Entity()
@Index(["ancestor", "descendant"], { unique: true })
export class ItemClosure {
  @PrimaryColumn()
  @ManyToOne(type => Item, {
    cascade: ["insert", "update", "remove"],
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: "ancestor", referencedColumnName: "uuid" })
  public ancestor: Item;

  @PrimaryColumn()
  @ManyToOne(type => Item, {
    cascade: ["insert", "update", "remove"],
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: "descendant", referencedColumnName: "uuid" })
  public descendant: Item;

  @Column({
    comment: "Depth of relation between descendant and ancestor.",
    type: "integer",
    nullable: false,
    default: 0
  })
  public depth: number;
}
