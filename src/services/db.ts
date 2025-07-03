import { openDB } from 'idb';

const DB_NAME = 'legal_cases_db';
const DB_VERSION = 2;

const dbPromise = (async () => {
  return await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // Create cases store if it doesn't exist
      if (!db.objectStoreNames.contains('cases')) {
        const store = db.createObjectStore('cases', {
          keyPath: 'id',
          autoIncrement: true
        });
        store.createIndex('name', 'name');
        store.createIndex('number', 'number');
        store.createIndex('description', 'description');
        store.createIndex('created_at', 'created_at');
        store.createIndex('file', 'file');
      }
    },
  });
})();

export const dbService = {
  async addCase(caseData) {
    try {
      const db = await dbPromise;
      return await db.add('cases', {
        ...caseData,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Database error in addCase:', error);
      throw error;
    }
  },

  async searchCases(term, type = 'all') {
    try {
      const db = await dbPromise;
      const tx = db.transaction('cases', 'readonly');
      const store = tx.objectStore('cases');
      const cases = await store.getAll();
      
      const searchTerm = term.toLowerCase();
      return cases.filter(caseItem => {
        if (type === 'all') {
          return (
            caseItem.name.toLowerCase().includes(searchTerm) ||
            caseItem.number.toLowerCase().includes(searchTerm) ||
            caseItem.description.toLowerCase().includes(searchTerm)
          );
        }
        return caseItem[type].toLowerCase().includes(searchTerm);
      });
    } catch (error) {
      console.error('Database error in searchCases:', error);
      throw error;
    }
  },

  async deleteCase(id) {
    try {
      const db = await dbPromise;
      await db.delete('cases', id);
    } catch (error) {
      console.error('Database error in deleteCase:', error);
      throw error;
    }
  },

  async getCase(id) {
    try {
      const db = await dbPromise;
      return await db.get('cases', id);
    } catch (error) {
      console.error('Database error in getCase:', error);
      throw error;
    }
  }
};