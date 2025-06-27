import type { StateStorage } from 'zustand/middleware';

/**
 * State migration utilities for handling version updates
 * 
 * This module provides:
 * - Version-based state migrations
 * - Safe migration execution with error handling
 * - Migration history tracking
 * - Rollback capabilities
 */

export interface MigrationFunction {
  version: number;
  description: string;
  migrate: (state: any) => any;
  rollback?: (state: any) => any;
}

// Define all migrations
export const migrations: MigrationFunction[] = [
  {
    version: 1,
    description: 'Initial state structure',
    migrate: (state) => {
      // This is the initial version, no migration needed
      return state;
    },
  },
  {
    version: 2,
    description: 'Add customer preferences to auth state',
    migrate: (state) => {
      return {
        ...state,
        auth: {
          ...state.auth,
          preferences: {
            currency: 'USD',
            language: 'en',
            notifications: {
              email: true,
              push: false,
            },
          },
        },
      };
    },
    rollback: (state) => {
      const { preferences, ...authWithoutPreferences } = state.auth;
      return {
        ...state,
        auth: authWithoutPreferences,
      };
    },
  },
  {
    version: 3,
    description: 'Add cart metadata and expiry',
    migrate: (state) => {
      return {
        ...state,
        cart: {
          ...state.cart,
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          },
        },
      };
    },
    rollback: (state) => {
      const { metadata, ...cartWithoutMetadata } = state.cart;
      return {
        ...state,
        cart: cartWithoutMetadata,
      };
    },
  },
  {
    version: 4,
    description: 'Add wishlist categories and notes',
    migrate: (state) => {
      return {
        ...state,
        wishlist: {
          ...state.wishlist,
          categories: ['default'],
          items: state.wishlist.items.map((item: any) => ({
            ...item,
            category: 'default',
            notes: '',
            addedAt: new Date().toISOString(),
          })),
        },
      };
    },
    rollback: (state) => {
      return {
        ...state,
        wishlist: {
          ...state.wishlist,
          categories: undefined,
          items: state.wishlist.items.map((item: any) => {
            const { category, notes, addedAt, ...itemWithoutNewFields } = item;
            return itemWithoutNewFields;
          }),
        },
      };
    },
  },
];

/**
 * Execute migrations from current version to target version
 */
export function executeMigrations(
  state: any,
  currentVersion: number,
  targetVersion: number
): any {
  let migratedState = state;

  // Forward migration
  if (currentVersion < targetVersion) {
    for (const migration of migrations) {
      if (migration.version > currentVersion && migration.version <= targetVersion) {
        try {
          console.log(`Executing migration v${migration.version}: ${migration.description}`);
          migratedState = migration.migrate(migratedState);
        } catch (error) {
          console.error(`Migration v${migration.version} failed:`, error);
          throw new Error(`Failed to migrate to version ${migration.version}`);
        }
      }
    }
  }
  
  // Backward migration (rollback)
  else if (currentVersion > targetVersion) {
    // Get migrations to rollback in reverse order
    const rollbackMigrations = migrations
      .filter(m => m.version > targetVersion && m.version <= currentVersion)
      .reverse();
      
    for (const migration of rollbackMigrations) {
      if (migration.rollback) {
        try {
          console.log(`Rolling back migration v${migration.version}: ${migration.description}`);
          migratedState = migration.rollback(migratedState);
        } catch (error) {
          console.error(`Rollback v${migration.version} failed:`, error);
          throw new Error(`Failed to rollback version ${migration.version}`);
        }
      } else {
        console.warn(`No rollback defined for v${migration.version}`);
      }
    }
  }

  return migratedState;
}

/**
 * Create a migration-aware storage wrapper
 */
export function createMigrationStorage(
  storage: StateStorage,
  currentVersion: number
): StateStorage {
  return {
    getItem: async (name) => {
      const storedData = await storage.getItem(name);
      if (!storedData) return null;

      try {
        // Handle case where stored data is corrupted (e.g., "[object Object]")
        if (typeof storedData !== 'string' || storedData === "[object Object]" || (!storedData.startsWith('{') && !storedData.startsWith('['))) {
          console.warn('Corrupted localStorage data detected, clearing:', storedData);
          await storage.removeItem(name);
          return null;
        }
        
        const parsed = JSON.parse(storedData);
        const storedVersion = parsed.version || 0;

        if (storedVersion !== currentVersion) {
          console.log(`Migrating state from v${storedVersion} to v${currentVersion}`);
          
          // Migrate the state
          const migratedState = executeMigrations(
            parsed.state,
            storedVersion,
            currentVersion
          );

          // Update version
          parsed.state = migratedState;
          parsed.version = currentVersion;

          // Save migrated state back
          await storage.setItem(name, JSON.stringify(parsed));
        }

        return JSON.stringify(parsed);
      } catch (error) {
        console.error('Failed to parse stored state:', error);
        return null;
      }
    },
    setItem: async (name, value) => {
      try {
        const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
        return await storage.setItem(name, serializedValue);
      } catch (error) {
        console.error('Failed to serialize state for storage:', error);
        throw error;
      }
    },
    removeItem: storage.removeItem,
  };
}

/**
 * Check if migration is needed
 */
export function isMigrationNeeded(
  currentVersion: number,
  targetVersion: number
): boolean {
  return currentVersion !== targetVersion;
}

/**
 * Get migration path description
 */
export function getMigrationPath(
  currentVersion: number,
  targetVersion: number
): string[] {
  const path: string[] = [];

  if (currentVersion < targetVersion) {
    for (const migration of migrations) {
      if (migration.version > currentVersion && migration.version <= targetVersion) {
        path.push(`v${migration.version}: ${migration.description}`);
      }
    }
  } else if (currentVersion > targetVersion) {
    const rollbackMigrations = migrations
      .filter(m => m.version > targetVersion && m.version <= currentVersion)
      .reverse();
      
    for (const migration of rollbackMigrations) {
      path.push(`Rollback v${migration.version}: ${migration.description}`);
    }
  }

  return path;
}