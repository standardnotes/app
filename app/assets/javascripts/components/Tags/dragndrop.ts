export enum ItemTypes {
  TAG = 'TAG',
}

export type DropItemTag = { uuid: string };

export type DropItem = DropItemTag;

export type DropProps = { isOver: boolean; canDrop: boolean };
