import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { Item } from "./Item";
import { UserEmail } from "./UserEmail";

@Entity()
@Index(['createdAt', 'uuid', 'lUsername'])
export class User {
  @PrimaryGeneratedColumn("uuid") public uuid: string;

  @Column({
    comment: "Public facing username.",
    type: "varchar",
    length: 24,
    nullable: false
  })
  @Index({ unique: true })
  public username: string;

  @Column({
    comment: "Lower case username. Used for internal uniqueness.",
    type: "citext",
    nullable: false
  })
  @Index({ unique: true })
  public lUsername: string;

  @OneToMany(type => UserEmail, email => email.user, {
    cascade: ["insert", "update"],
    eager: true
  })
  public emails: UserEmail[];

  @OneToMany(type => Item, item => item.user, {
    cascade: ["insert", "update"],
    eager: false
  })
  public items: Item[];

  @Column({
    comment: "Unencrypted jwk-pub signing key for verification.",
    type: "varchar",
    nullable: false,
    default: ""
  })
  public pubSignKey: string;

  @Column({
    comment: "Encrypted private jwk-priv signing key for verification.",
    type: "varchar",
    nullable: false,
    default: ""
  })
  public encPrivSignKey: string;

  @Column({
    comment: "Encrypted symmetric jwk-key for user secrets.",
    type: "varchar",
    nullable: false,
    default: ""
  })
  public encSecretKey: string;

  @Column({
    comment: "Unencrypted asymmetric jwk-pub encryption key for P2P.",
    type: "varchar",
    nullable: false,
    default: ""
  })
  public pubEncKey: string;

  @Column({
    comment: "Encrypted asymmetric jwk-priv encryption key for P2P.",
    type: "varchar",
    nullable: false,
    default: ""
  })
  public encPrivEncKey: string;

  @Column({
    comment: "Server side storage of password hash used for Auth and JWT.",
    type: "varchar",
    length: 512,
    nullable: false
  })
  public pwHash: string;

  @Column({
    comment: "Client side password derivation function.",
    type: "varchar",
    length: 255,
    default: "PBKDF2",
    nullable: false
  })
  public pwFunc: string;

  @Column({
    comment: "Client side password derivation digest.",
    type: "varchar",
    length: 255,
    default: "SHA-512",
    nullable: false
  })
  public pwDigest: string;

  @Column({
    comment: "Client side password derivation cost or iterations.",
    type: "integer",
    default: 100000,
    nullable: false
  })
  public pwCost: number;

  @Column({
    comment: "Client side derived password key size in bytes.",
    type: "integer",
    default: 768,
    nullable: false
  })
  public pwKeySize: number;

  @Column({
    comment: "Client side derived password salt.",
    type: "varchar",
    length: 512,
    default: "",
    nullable: false
  })
  public pwSalt: string;

  @Column({
    comment: "If user forgot password, set temporary token hash.",
    type: "varchar",
    length: 512,
    nullable: true
  })
  public forgotPwHash: string | null;

  @Column({
    comment: "If user forgot password, hash valid until.",
    type: "timestamp with time zone",
    nullable: true
  })
  public forgotPwExpiry: Date | null;

  @CreateDateColumn({
    comment: "User creation timestamp.",
    type: "timestamp with time zone"
  })
  public createdAt: Date;

  @UpdateDateColumn({
    comment: "User updated timestamp.",
    type: "timestamp with time zone"
  })
  public updatedAt: Date;
}
