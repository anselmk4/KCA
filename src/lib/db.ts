// src/lib/db.ts

export type User = {
  id: string;
  name: string;
  email: string;
  level: string;
  joinedAt: string;
  activeCourse: string;
  status: "Actif" | "Suspendu" | "En attente";
};

export type Transaction = {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  courseId: string;
  date: string;
  status: "Complété" | "Échoué" | "En attente";
  method: "Carte" | "Mobile Money";
};

export type Database = {
  users: User[];
  transactions: Transaction[];
};

const defaultDB: Database = {
  users: [
    {
      id: "u1",
      name: "Jean Dupont",
      email: "jean@example.com",
      level: "Intermédiaire",
      joinedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      activeCourse: "blockchain",
      status: "Actif",
    },
    {
      id: "u2",
      name: "Marie K.",
      email: "marie@example.com",
      level: "Débutant",
      joinedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      activeCourse: "ai",
      status: "Actif",
    }
  ],
  transactions: [
    {
      id: "tx1",
      userId: "u1",
      userName: "Jean Dupont",
      amount: 300,
      courseId: "blockchain",
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      status: "Complété",
      method: "Mobile Money",
    },
    {
      id: "tx2",
      userId: "u2",
      userName: "Marie K.",
      amount: 1000,
      courseId: "ai",
      date: new Date(Date.now() - 86400000 * 5).toISOString(),
      status: "Complété",
      method: "Carte",
    }
  ],
};

// Initialize DB if empty
export const initDB = () => {
  if (typeof window !== "undefined") {
    const existing = localStorage.getItem("kuettu_db");
    if (!existing) {
      localStorage.setItem("kuettu_db", JSON.stringify(defaultDB));
    }
  }
};

export const getDB = (): Database => {
  if (typeof window === "undefined") return defaultDB;
  const data = localStorage.getItem("kuettu_db");
  if (data) return JSON.parse(data);
  return defaultDB;
};

export const saveDB = (db: Database) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("kuettu_db", JSON.stringify(db));
  }
};

export const addUser = (user: Omit<User, "id" | "joinedAt" | "status">) => {
  const db = getDB();
  const newUser: User = {
    ...user,
    id: `u${Date.now()}`,
    joinedAt: new Date().toISOString(),
    status: "Actif",
  };
  db.users.push(newUser);
  saveDB(db);
  return newUser;
};

export const addTransaction = (tx: Omit<Transaction, "id" | "date">) => {
  const db = getDB();
  const newTx: Transaction = {
    ...tx,
    id: `tx${Date.now()}`,
    date: new Date().toISOString(),
  };
  db.transactions.push(newTx);
  saveDB(db);
  return newTx;
};
