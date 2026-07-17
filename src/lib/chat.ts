// src/lib/chat.ts
// Scalable LocalStorage-based messaging simulator for learners and instructors

import { getDB } from "./db";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  text: string;
  timestamp: string; // ISO String
}

// Get all chat messages from localStorage
export function getChatMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  const saved = localStorage.getItem("kuettu_chat_messages");
  if (!saved) {
    // Seed some initial messages between existing instructors and students
    const db = getDB();
    const seeded: ChatMessage[] = [];
    
    // We'll find some enrollments to hook up messages
    const student = db.users.find(u => u.role === "STUDENT") || { id: "std1", name: "Jean Dupont" };
    const instructors = db.users.filter(u => u.role === "INSTRUCTOR");

    instructors.forEach((inst, idx) => {
      const timeOffset = idx * 60 * 60 * 1000; // hours back
      const now = new Date();
      
      seeded.push(
        {
          id: `seed-1-${idx}`,
          senderId: student.id,
          senderName: student.name,
          receiverId: inst.id,
          text: idx % 2 === 0 ? "Bonjour Professeur, j'ai beaucoup aimé votre premier chapitre sur la Blockchain." : "Bonjour ! Pourriez-vous m'éclaircir sur le module de Trading ?",
          timestamp: new Date(now.getTime() - 40 * 60 * 1000 - timeOffset).toISOString(),
        },
        {
          id: `seed-2-${idx}`,
          senderId: inst.id,
          senderName: inst.name,
          receiverId: student.id,
          text: idx % 2 === 0 ? "Bonjour Jean. Merci pour votre retour ! Avez-vous déjà abordé le concept des contrats intelligents ?" : "Bonjour ! Bien sûr, quel concept précis vous pose problème ?",
          timestamp: new Date(now.getTime() - 25 * 60 * 1000 - timeOffset).toISOString(),
        },
        {
          id: `seed-3-${idx}`,
          senderId: student.id,
          senderName: student.name,
          receiverId: inst.id,
          text: idx % 2 === 0 ? "Oui, j'ai compris la logique mais j'ai hâte de coder mon premier smart contract en Solidity !" : "Je n'ai pas compris la différence entre le carnet d'ordres et les AMM.",
          timestamp: new Date(now.getTime() - 5 * 60 * 1000 - timeOffset).toISOString(),
        }
      );
    });

    localStorage.setItem("kuettu_chat_messages", JSON.stringify(seeded));
    return seeded;
  }

  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

// Send a new message
export function sendChatMessage(senderId: string, senderName: string, receiverId: string, text: string): ChatMessage {
  const messages = getChatMessages();
  const newMessage: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    senderId,
    senderName,
    receiverId,
    text,
    timestamp: new Date().toISOString(),
  };

  messages.push(newMessage);
  if (typeof window !== "undefined") {
    localStorage.setItem("kuettu_chat_messages", JSON.stringify(messages));
    window.dispatchEvent(new Event("storage")); // Notify other listeners in the same page
  }
  return newMessage;
}

// Format message array into standard Conversations structure for the active user
export interface ChatConversation {
  userId: string;
  name: string;
  avatar: string;
  preview: string;
  time: string;
  unreadCount: number;
  messages: {
    id: string;
    from: string;
    text: string;
    time: string;
    own: boolean;
  }[];
}

export function getConversationsForUser(myId: string, myRole: string): ChatConversation[] {
  const db = getDB();
  const allMessages = getChatMessages();
  
  // Find all user IDs I have exchanged messages with
  const contactIds = new Set<string>();
  allMessages.forEach(m => {
    if (m.senderId === myId) contactIds.add(m.receiverId);
    if (m.receiverId === myId) contactIds.add(m.senderId);
  });

  // If no messages exist yet, seed a default conversation with relevant contacts
  if (contactIds.size === 0) {
    if (myRole === "STUDENT") {
      // Find instructors in courses
      db.users.filter(u => u.role === "INSTRUCTOR").forEach(inst => contactIds.add(inst.id));
    } else if (myRole === "INSTRUCTOR") {
      // Find students in my courses
      const myCourseIds = db.courses.filter(c => c.instructorId === myId).map(c => c.id);
      const studentIds = db.enrollments.filter(e => myCourseIds.includes(e.courseId)).map(e => e.studentId);
      db.users.filter(u => studentIds.includes(u.id)).forEach(std => contactIds.add(std.id));
    }
  }

  const list: ChatConversation[] = [];

  contactIds.forEach(contactId => {
    const contact = db.users.find(u => u.id === contactId);
    if (!contact) return;

    // Filter messages between me and this contact, sorted by time ascending
    const relevantMsgs = allMessages
      .filter(m => (m.senderId === myId && m.receiverId === contactId) || (m.senderId === contactId && m.receiverId === myId))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const preview = relevantMsgs.length > 0 ? relevantMsgs[relevantMsgs.length - 1].text : "Nouvelle conversation";
    
    let displayTime = "12:00";
    if (relevantMsgs.length > 0) {
      const lastMsgDate = new Date(relevantMsgs[relevantMsgs.length - 1].timestamp);
      displayTime = lastMsgDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    }

    // Unread count is simulated (e.g. messages where sender is contact and timestamp is recent)
    // To make it dynamic, we can just return a deterministic mock number if there are messages and the last message isn't ours
    const lastMsg = relevantMsgs[relevantMsgs.length - 1];
    const unreadCount = lastMsg && lastMsg.senderId === contactId ? 1 : 0;

    list.push({
      userId: contactId,
      name: contact.name,
      avatar: contact.name.split(" ").map(n => n[0] || "").join("").slice(0, 2).toUpperCase(),
      preview,
      time: displayTime,
      unreadCount,
      messages: relevantMsgs.map(m => ({
        id: m.id,
        from: m.senderName,
        text: m.text,
        time: new Date(m.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        own: m.senderId === myId,
      })),
    });
  });

  // Sort conversations by the time of the last message (most recent first)
  return list.sort((a, b) => {
    const lastA = allMessages.filter(m => (m.senderId === myId && m.receiverId === a.userId) || (m.senderId === a.userId && m.receiverId === myId)).pop();
    const lastB = allMessages.filter(m => (m.senderId === myId && m.receiverId === b.userId) || (m.senderId === b.userId && m.receiverId === myId)).pop();
    if (!lastA) return 1;
    if (!lastB) return -1;
    return new Date(lastB.timestamp).getTime() - new Date(lastA.timestamp).getTime();
  });
}
