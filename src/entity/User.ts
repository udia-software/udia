import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid") public uuid: string;

  @Column({
    type: "varchar",
    length: 24,
    nullable: false
  })
  @Index({ unique: true })
  public username: string;

  @Column({
    type: "varchar",
    length: 255,
    nullable: false
  })
  @Index({ unique: true })
  public email: string;

  @Column({
    type: "varchar",
    length: 512,
    nullable: false
  })
  public password: string;

  @Column({
    type: "varchar",
    length: 255,
    default: "pbkdf2",
    nullable: false
  })
  public pwFunc: string;

  @Column({
    type: "varchar",
    length: 255,
    default: "sha512",
    nullable: false
  })
  public pwDigest: string;

  @Column({
    type: "integer",
    default: 5000,
    nullable: false
  })
  public pwCost: number;

  @Column({
    type: "varchar",
    length: 512,
    default: "",
    nullable: false
  })
  public pwSalt: string;

  @CreateDateColumn({
    type: "timestamp with time zone"
  })
  public createdAt: Date;

  @UpdateDateColumn({
    type: "timestamp with time zone"
  })
  public updatedAt: Date;
}
