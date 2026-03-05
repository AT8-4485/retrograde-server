import { createUser, findUserById, findUserByEmail, updateUser, deleteUser } from '../../src/services/user';
import { db } from '../../src/utils/db';

describe('User Service & Database Persistence', () => {
  // UUIDv7 Regex Pattern
  // e.g., 018c1b8c-572e-7xxx-axxx-xxxxxxxxxxxx
  const uuidv7Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  it('should create a user and assign a valid UUIDv7 ID', async () => {
    const user = await createUser('test1@example.com');
    
    expect(user).toBeDefined();
    expect(user.email).toBe('test1@example.com');
    
    // Check UUIDv7 compliance
    expect(user.id).toMatch(uuidv7Regex);
  });

  it('should fallback to Prisma extension UUIDv7 if ID is missing from input args', async () => {
    // We are deliberately bypassing the service layer createUser (which assigns id manually)
    // to test the "Dual Safety" of the Prisma extension in src/utils/db.ts
    const user = await db.user.create({
      data: {
        email: 'test_raw@example.com',
        // Omitting 'id' explicitly to trigger extension
      } as any,
    });
    
    expect(user).toBeDefined();
    expect(user.id).toMatch(uuidv7Regex);
  });

  it('should find a user by ID and Email', async () => {
    const user = await createUser('findme@example.com');

    const foundById = await findUserById(user.id);
    expect(foundById?.email).toBe('findme@example.com');

    const foundByEmail = await findUserByEmail('findme@example.com');
    expect(foundByEmail?.id).toBe(user.id);
  });

  it('should update a user profile correctly', async () => {
    const user = await createUser('update@example.com');
    
    const updated = await updateUser(user.id, {
      displayName: 'Jane Doe',
      bio: 'Test bio',
    });

    expect(updated.displayName).toBe('Jane Doe');
    expect(updated.bio).toBe('Test bio');
    expect(updated.email).toBe('update@example.com');
  });

  it('should delete a user and cascade delete relations', async () => {
    const user = await createUser('delete@example.com');

    // Create a mock bookmark attached to this user
    const bookmark = await db.bookmark.create({
      data: {
        userId: user.id,
        type: 'article',
        title: 'Test Bookmark',
        url: 'https://example.com',
      } as any, 
      // casting as any because bookmark expects 'id' technically, but Prisma extension handles it.
    });

    expect(bookmark.userId).toBe(user.id);

    // Delete the user
    await deleteUser(user.id);

    // Verify user is gone
    const foundUser = await findUserById(user.id);
    expect(foundUser).toBeNull();

    // Verify bookmark is cascaded (deleted)
    const foundBookmark = await db.bookmark.findUnique({ where: { id: bookmark.id } });
    expect(foundBookmark).toBeNull();
  });
});
