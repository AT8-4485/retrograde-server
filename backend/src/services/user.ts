import { db } from '../utils/db';
import { User } from '@prisma/client';
import { v7 as uuidv7 } from 'uuid';

export const findUserById = async (id: string): Promise<User | null> => {
  return db.user.findUnique({
    where: { id },
  });
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  return db.user.findUnique({
    where: { email },
  });
};

export const createUser = async (email: string): Promise<User> => {
  return db.user.create({
    data: {
      id: uuidv7(),
      email,
    },
  });
};

export const updateUser = async (
  id: string,
  data: Partial<Pick<User, 'displayName' | 'avatarUrl' | 'bio'>>
): Promise<User> => {
  return db.user.update({
    where: { id },
    data,
  });
};

export const deleteUser = async (id: string): Promise<void> => {
  await db.user.delete({
    where: { id },
  });
};
