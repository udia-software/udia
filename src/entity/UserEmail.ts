import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn
} from "typeorm";
import { User } from "./User";

@Entity()
export class UserEmail {
  @Column({
    comment: "User provided email.",
    type: "varchar",
    length: 255,
    nullable: false
  })
  @Index({ unique: true })
  public email: string;

  @PrimaryColumn({
    comment: "Lower case email. Used for internal uniqueness and primary key.",
    type: "citext",
    // length: 255,
    nullable: false
  })
  @Index({ unique: true })
  public lEmail: string;

  @ManyToOne(type => User, user => user.emails, {
    cascade: ["insert", "update", "remove"],
    onDelete: "CASCADE"
  })
  public user: User;

  @Column({
    comment: "Is the user email their primary email?",
    type: "boolean",
    default: false
  })
  public primary: boolean;

  @Column({
    comment: "Is the user email verified?",
    type: "boolean",
    default: false
  })
  public verified: boolean;

  @Column({
    comment: "Server stored hash of client sent verification code.",
    type: "varchar",
    length: 255,
    nullable: true
  })
  public verificationHash: string | null;

  @Column({
    comment: "When the verification hash is valid until.",
    type: "timestamp with time zone",
    nullable: true
  })
  public verificationExpiry: Date | null;

  @CreateDateColumn({
    comment: "User email creation timestamp.",
    type: "timestamp with time zone"
  })
  public createdAt: Date;

  @UpdateDateColumn({
    comment: "User email last updated timestamp.",
    type: "timestamp with time zone"
  })
  public updatedAt: Date;
}
