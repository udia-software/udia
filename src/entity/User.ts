import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { IUserEmail, UserEmail } from "./UserEmail";

export interface IUser {
  uuid: string;
  username: string;
  lUsername: string;
  emails: IUserEmail[];
  pwHash: string;
  pwFunc: string;
  pwDigest: string;
  pwCost: number;
  pwKeySize: number;
  pwSalt: string;
  forgotPwHash: string;
  forgotPwExpiry: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid") public uuid: string;

  @Column({
    type: "varchar",
    length: 24,
    nullable: false
    // comment: "Public facing username."
  })
  @Index({ unique: true })
  public username: string;

  @Column({
    type: "citext",
    nullable: false
    // comment: "Lower Case username. Used for internal uniqueness."
  })
  @Index({ unique: true })
  public lUsername: string;

  @OneToMany(type => UserEmail, email => email.user, {
    cascade: ["insert", "update"],
    eager: true
  })
  public emails: UserEmail[];

  @Column({
    type: "varchar",
    length: 512,
    nullable: false
    // comment: "Server side storage of password hash."
  })
  public pwHash: string;

  @Column({
    type: "varchar",
    length: 255,
    default: "pbkdf2",
    nullable: false
    // comment: "Client side password derivation function."
  })
  public pwFunc: string;

  @Column({
    type: "varchar",
    length: 255,
    default: "sha512",
    nullable: false
    // comment: "Client side password derivation digest."
  })
  public pwDigest: string;

  @Column({
    type: "integer",
    default: 5000,
    nullable: false
    // comment: "Client side password derivation cost."
  })
  public pwCost: number;

  @Column({
    type: "integer",
    default: 768,
    nullable: false
    // comment: "Client side derived password key size."
  })
  public pwKeySize: number;

  @Column({
    type: "varchar",
    length: 512,
    default: "",
    nullable: false
    // comment: "Client side derived password salt."
  })
  public pwSalt: string;

  @Column({
    type: "varchar",
    length: 512,
    nullable: true
    // comment: "Forgot Password, set temporary hash."
  })
  public forgotPwHash: string;

  @Column({
    type: "timestamp with time zone",
    nullable: true
    // comment: "Forgot Password, hash valid until."
  })
  public forgotPwExpiry: Date;

  @CreateDateColumn({
    type: "timestamp with time zone"
    // comment: "User creation timestamp."
  })
  public createdAt: Date;

  @UpdateDateColumn({
    type: "timestamp with time zone"
    // comment: "User updated timestamp."
  })
  public updatedAt: Date;
}
