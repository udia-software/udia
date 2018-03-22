import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  public uuid: string;

  @Column({
    type: "varchar",
    length: 255,
    unique: true
  })
  public email: string;

  @Column({
    type: "varchar",
    length: 255
  })
  public password: string;

  @Column({
    type: "varchar",
    length: 255,
    default: "pbkdf2"
  })
  public pwFunc: string;

  @Column({
    type: "varchar",
    length: 255,
    default: "sha512"
  })
  public pwAlg: string;

  @Column({
    type: "integer",
    default: 5000
  })
  public pwCost: number;

  @Column({
    type: "integer"
  })
  public pwKeySize: number;

  @Column({
    type: "varchar",
    length: 255
  })
  public pwNonce: string;

  @Column({
    type: "varchar",
    length: 255
  })
  public pwAuth: string;

  @Column({
    type: "varchar",
    length: 255
  })
  public pwSalt: string;

  @Column({
    type: "timestamp with time zone"
  })
  public createdAt: Date;

  @Column({
    type: "timestamp with time zone"
  })
  public updatedAt: Date;
}
