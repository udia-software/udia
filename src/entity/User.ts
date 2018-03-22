import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid") public uuid: string;

  @Column({
    type: "varchar",
    length: 255,
    nullable: false
  })
  @Index({ unique: true })
  public email: string;

  @Column({
    type: "varchar",
    length: 255,
    nullable: false
  })
  public password: string;

  @Column({
    type: "varchar",
    length: 255,
    default: () => "pbkdf2",
    nullable: false
  })
  public pwFunc: string;

  @Column({
    type: "varchar",
    length: 255,
    default: () => "sha512",
    nullable: false
  })
  public pwAlg: string;

  @Column({
    type: "integer",
    default: () => 5000,
    nullable: false
  })
  public pwCost: number;

  @Column({
    type: "integer",
    default: () => 512,
    nullable: false
  })
  public pwKeySize: number;

  @Column({
    type: "varchar",
    length: 255,
    default: "",
    nullable: false
  })
  public pwNonce: string;

  @Column({
    type: "varchar",
    length: 255,
    default: "",
    nullable: false
  })
  public pwAuth: string;

  @Column({
    type: "varchar",
    length: 255,
    default: "",
    nullable: false
  })
  public pwSalt: string;

  @Column({
    type: "timestamp with time zone",
    default: () => "CURRENT_TIMESTAMP",
    nullable: false
  })
  public createdAt: Date;

  @Column({
    type: "timestamp with time zone",
    default: () => "CURRENT_TIMESTAMP",
    nullable: true
  })
  public updatedAt: Date;
}
