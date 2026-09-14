import fs from 'fs';
import path from 'path';
import { Membre, Paiement, UserProfile } from '@/types';
import { INITIAL_MEMBRES, INITIAL_PAIEMENTS, INITIAL_USERS } from './demoData';

export interface DatabaseSchema {
  membres: Membre[];
  paiements: Paiement[];
  utilisateurs: UserProfile[];
  updatedAt: string;
}

// On Vercel / serverless environment, use /tmp for writeable storage
const DB_DIR = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'database.json');

// Ensure database file and directory exist
export const getDatabase = (): DatabaseSchema => {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      const initialDb: DatabaseSchema = {
        membres: INITIAL_MEMBRES,
        paiements: INITIAL_PAIEMENTS,
        utilisateurs: INITIAL_USERS,
        updatedAt: new Date().toISOString(),
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
      return initialDb;
    }

    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading server database:', error);
    return {
      membres: INITIAL_MEMBRES,
      paiements: INITIAL_PAIEMENTS,
      utilisateurs: INITIAL_USERS,
      updatedAt: new Date().toISOString(),
    };
  }
};

export const saveDatabase = (data: DatabaseSchema): boolean => {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    data.updatedAt = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error saving server database:', error);
    return false;
  }
};
