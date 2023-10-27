import {
  BaseEntity,
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Users extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 128 })
  first_name: string;

  @Column({ type: 'varchar', length: 128 })
  last_name: string;

  @Column({ type: 'varchar', length: 128 })
  @Index()
  email: string;

  @Column({ type: 'varchar', length: 128, default: '' })
  address: string;

  @Column({ type: 'varchar', length: 128, default: '' })
  city: string;

  @Column({ type: 'varchar', length: 128, default: '' })
  phone: string;
}
