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
    type: "varchar",
    length: 255,
    nullable: false
    // comment: "User provided email."
  })
  @Index({ unique: true })
  public email: string;

  @PrimaryColumn({
    type: "citext",
    nullable: false
    // comment: "Lower case email. Used for internal uniqueness and primary key"
  })
  @Index({ unique: true })
  public lEmail: string;

  @ManyToOne(type => User, user => user.emails, {
    cascade: ["insert", "update", "remove"],
    onDelete: "CASCADE"
  })
  public user: User;

  @Column({
    type: "boolean",
    default: false
    // comment: "Is user email primary."
  })
  public primary: boolean;

  @Column({
    type: "boolean",
    default: false
    // comment: "Is user email verified."
  })
  public verified: boolean;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true
    // comment: "Server stored hash of client sent verification code."
  })
  public verificationHash: string | null;

  @Column({
    type: "timestamp with time zone",
    nullable: true
    // comment: "Verification hash valid until."
  })
  public verificationExpiry: Date | null;

  @CreateDateColumn({
    type: "timestamp with time zone"
    // comment: "Email creation timestamp."
  })
  public createdAt: Date;

  @UpdateDateColumn({
    type: "timestamp with time zone"
    // comment: "Email last updated timestamp."
  })
  public updatedAt: Date;
}
