import { BaseEntity, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Locks extends BaseEntity {
  @PrimaryColumn('integer')
  id: number;
}
