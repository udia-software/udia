import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn
} from "typeorm";
import { IUser, User } from "./User";

export interface IUserEmail {
  email: string;
  user: IUser;
  primary: boolean;
  verified: boolean;
  verificationHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Entity()
export class UserEmail {
  @Column({
    type: "varchar",
    length: 255,
    nullable: false
    //    comment: "User provided email."
  })
  @Index({ unique: true })
  public email: string;

  @PrimaryColumn({
    type: "varchar",
    length: 255,
    nullable: false
    //    comment: "Lower case email."
  })
  @Index({ unique: true })
  public lEmail: string;

  @ManyToOne(type => User, user => user.emails, {
    cascadeAll: true,
    onDelete: "CASCADE"
  })
  public user: User;

  @Column({
    type: "boolean",
    default: false
    //    comment: "Is user email primary."
  })
  public primary: boolean;

  @Column({
    type: "boolean",
    default: false
    //    comment: "Is user email verified."
  })
  public verified: boolean;

  @Column({
    type: "varchar",
    length: 255,
    default: ""
    //    comment: "Server stored hash of client sent verification code."
  })
  public verificationHash: string;

  @CreateDateColumn({
    type: "timestamp with time zone"
    //    comment: "Email creation timestamp."
  })
  public createdAt: Date;

  @UpdateDateColumn({
    type: "timestamp with time zone"
    //    comment: "Email last updated timestamp."
  })
  public updatedAt: Date;
}
