// src/lib/db.ts
// Scalable LocalStorage Database helper with seeded entities for the LMS framework

export type User = {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN" | "SUPER_ADMIN";
  level: string;
  joinedAt: string;
  activeCourse: string;
  status: "Actif" | "Suspendu" | "En attente";
  plan?: "FREE" | "BASE" | "PRO" | "MAX";
};

export type Course = {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  status: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
  instructorId: string;
  instructorName: string;
  createdAt: string;
  rating?: number;
  category?: string;
  level?: string;
};

export type CourseSection = {
  id: string;
  courseId: string;
  title: string;
  order: number;
};

export type Lesson = {
  id: string;
  sectionId: string;
  title: string;
  description: string;
  content: string; // Markdown/HTML body
  videoUrl: string;
  durationMin: number;
  order: number;
};

export type Enrollment = {
  id: string;
  studentId: string;
  courseId: string;
  progressPercent: number;
  joinedAt: string;
};

export type Progress = {
  id: string;
  enrollmentId: string;
  lessonId: string;
  completed: boolean;
  completedAt: string | null;
};

export type Quiz = {
  id: string;
  courseId: string;
  title: string;
  passPercentage: number;
};

export type Question = {
  id: string;
  quizId: string;
  text: string;
  choices: string[];
  correctIndex: number;
};

export type QuizAttempt = {
  id: string;
  studentId: string;
  quizId: string;
  score: number;
  passed: boolean;
  createdAt: string;
};

export type Certificate = {
  id: string;
  studentId: string;
  courseId: string;
  code: string; // Verification code
  issuedAt: string;
};

// Updated Transaction status to use English enums
export type Transaction = {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  courseId: string;
  date: string;
  status: "PAID" | "FAILED" | "PENDING";
  method: "Carte" | "Mobile Money" | "PayPal";
};

export type Payout = {
  id: string;
  instructorId: string;
  amount: number;
  status: "PAID" | "FAILED" | "PENDING";
  date: string;
};

export type SupportTicketReply = {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  createdAt: string;
};

export type SupportTicket = {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  message: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  createdAt: string;
  replies: SupportTicketReply[];
};

export type Database = {
  users: User[];
  courses: Course[];
  sections: CourseSection[];
  lessons: Lesson[];
  enrollments: Enrollment[];
  lessonProgress: Progress[];
  quizzes: Quiz[];
  questions: Question[];
  quizAttempts: QuizAttempt[];
  certificates: Certificate[];
  transactions: Transaction[];
  payouts: Payout[];
  supportTickets: SupportTicket[];
};

// Seed Constants matching Catalog
const defaultDB: Database = {
  users: [
    {
      id: "u1",
      name: "Jean Dupont",
      email: "jean@example.com",
      role: "STUDENT",
      level: "Intermédiaire",
      joinedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      activeCourse: "blockchain",
      status: "Actif",
      plan: "FREE",
    },
    {
      id: "u2",
      name: "Marie K.",
      email: "marie@example.com",
      role: "STUDENT",
      level: "Débutant",
      joinedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      activeCourse: "ai",
      status: "Actif",
      plan: "FREE",
    },
    {
      id: "u3",
      name: "Prof. Kuettu",
      email: "instructor@kuettu.com",
      role: "INSTRUCTOR",
      level: "Avancé",
      joinedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      activeCourse: "web3",
      status: "Actif",
      plan: "PRO",
    },
    {
      id: "u4",
      name: "Ansel Admin",
      email: "admin@kuettu.com",
      role: "ADMIN",
      level: "Avancé",
      joinedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      activeCourse: "",
      status: "Actif",
      plan: "MAX",
    }
  ],
  courses: [
    {
      id: "blockchain",
      title: "Fondamentaux de la Blockchain",
      slug: "fondamentaux-blockchain",
      description: "Comprendre les bases du Web3, des registres distribués et des Smart Contracts.",
      price: 300,
      status: "PUBLISHED",
      instructorId: "u3",
      instructorName: "Prof. Kuettu",
      createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
      rating: 4.8,
      category: "Blockchain",
      level: "Débutant",
    },
    {
      id: "trading",
      title: "Crypto-monnaie / Trading",
      slug: "crypto-trading",
      description: "Devenez rentable grâce à des stratégies éprouvées et une gestion rigoureuse des risques.",
      price: 500,
      status: "PUBLISHED",
      instructorId: "u3",
      instructorName: "Prof. Kuettu",
      createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
      rating: 4.6,
      category: "Trading",
      level: "Intermédiaire",
    },
    {
      id: "ai",
      title: "Intelligence Artificielle",
      slug: "intelligence-artificielle",
      description: "Maîtrisez les outils d'IA pour automatiser vos tâches et multiplier vos revenus.",
      price: 1000,
      status: "PUBLISHED",
      instructorId: "u3",
      instructorName: "Prof. Kuettu",
      createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
      rating: 4.9,
      category: "Intelligence Artificielle",
      level: "Intermédiaire",
    },
    {
      id: "web3",
      title: "Développement Web3",
      slug: "developpement-web3",
      description: "Créez vos propres Smart Contracts et dApps sur Ethereum et d'autres blockchains.",
      price: 1500,
      status: "PUBLISHED",
      instructorId: "u3",
      instructorName: "Prof. Kuettu",
      createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
      rating: 4.7,
      category: "Web3",
      level: "Avancé",
    }
  ],
  sections: [
    // Blockchain Sections
    { id: "s1", courseId: "blockchain", title: "Semaine 1 : Introduction au Web3", order: 1 },
    { id: "s2", courseId: "blockchain", title: "Semaine 2 : Fonctionnement Technique", order: 2 },
    { id: "s3", courseId: "blockchain", title: "Semaine 3 : Wallets et Sécurité", order: 3 },
    { id: "s4", courseId: "blockchain", title: "Semaine 4 : Les Smart Contracts", order: 4 },
    // Trading Sections
    { id: "s5", courseId: "trading", title: "Module 1 : Psychologie et Fondations", order: 1 },
    { id: "s6", courseId: "trading", title: "Module 2 : Analyse Technique", order: 2 },
    // AI Sections
    { id: "s7", courseId: "ai", title: "Semaine 1 : Les bases de l'IA générative", order: 1 },
    { id: "s8", courseId: "ai", title: "Semaine 2 : Automatisation de workflows", order: 2 }
  ],
  lessons: [
    // Blockchain Lessons
    {
      id: "l1",
      sectionId: "s1",
      title: "Qu'est-ce que la Blockchain ?",
      description: "Comprendre les fondamentaux de la technologie de registre distribué.",
      content: "La blockchain est une technologie de stockage et de transmission d'informations, transparente, sécurisée, et fonctionnant sans organe central de contrôle. Elle ressemble à un grand livre comptable public qui contient l'historique de tous les échanges effectués entre ses utilisateurs depuis sa création.",
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      durationMin: 15,
      order: 1,
    },
    {
      id: "l2",
      sectionId: "s1",
      title: "Histoire et évolution (Bitcoin, Ethereum)",
      description: "L'histoire depuis les cypherpunks jusqu'aux contrats intelligents.",
      content: "Née en 2008 avec le Bitcoin sous le pseudonyme de Satoshi Nakamoto, la blockchain a d'abord servi de support financier décentralisé. En 2015, Vitalik Buterin lance Ethereum, introduisant les Smart Contracts et transformant la blockchain en ordinateur mondial.",
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      durationMin: 20,
      order: 2,
    },
    {
      id: "l3",
      sectionId: "s1",
      title: "Le concept de décentralisation",
      description: "Pourquoi la décentralisation change la donne pour l'économie.",
      content: "Dans un système centralisé, toutes les données passent par un serveur unique (ex: banques). Dans un réseau décentralisé, chaque nœud (ordinateur connecté) possède une copie intègre du registre, rendant toute falsification impossible sans l'accord de la majorité.",
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      durationMin: 18,
      order: 3,
    },
    {
      id: "l4",
      sectionId: "s2",
      title: "La cryptographie asymétrique",
      description: "Comprendre le chiffrement et la signature numérique.",
      content: "La blockchain utilise un système de clé publique (votre adresse visible pour recevoir des fonds) et de clé privée (votre mot de passe secret pour signer et valider des transactions).",
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      durationMin: 25,
      order: 1,
    },
    {
      id: "l5",
      sectionId: "s2",
      title: "Mécanismes de consensus (PoW, PoS)",
      description: "Comment les ordinateurs se mettent d'accord sans tiers de confiance.",
      content: "La Proof of Work (Preuve de Travail) demande de la puissance de calcul pour valider les blocs (ex: Bitcoin miners). La Proof of Stake (Preuve d'Enjeu) sélectionne les validateurs selon la quantité de cryptos qu'ils verrouillent dans le réseau (ex: Ethereum staking).",
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      durationMin: 30,
      order: 2,
    },
    // Trading Lessons
    {
      id: "l6",
      sectionId: "s5",
      title: "L'état d'esprit du trader",
      description: "Apprivoiser sa psychologie et maîtriser ses émotions.",
      content: "90% des traders débutants perdent de l'argent par manque de discipline émotionnelle. Le FOMO (Fear Of Missing Out) et le FUD (Fear, Uncertainty, and Doubt) sont les plus grands ennemis du portefeuille.",
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      durationMin: 35,
      order: 1,
    },
    {
      id: "l7",
      sectionId: "s5",
      title: "Capital initial et Money Management",
      description: "Règles strictes de préservation du capital.",
      content: "Ne risquez jamais plus de 1% à 2% de votre capital total sur un seul trade. Établissez toujours un plan avec un Stop Loss (limite de perte) et un Take Profit (prise de profit) clairs.",
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      durationMin: 22,
      order: 2,
    }
  ],
  enrollments: [
    {
      id: "e1",
      studentId: "u1",
      courseId: "blockchain",
      progressPercent: 35,
      joinedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    }
  ],
  lessonProgress: [
    { id: "p1", enrollmentId: "e1", lessonId: "l1", completed: true, completedAt: new Date().toISOString() },
    { id: "p2", enrollmentId: "e1", lessonId: "l2", completed: true, completedAt: new Date().toISOString() },
    { id: "p3", enrollmentId: "e1", lessonId: "l3", completed: true, completedAt: new Date().toISOString() },
    { id: "p4", enrollmentId: "e1", lessonId: "l4", completed: true, completedAt: new Date().toISOString() }
  ],
  quizzes: [
    { id: "q1", courseId: "blockchain", title: "Examen de mi-parcours Blockchain", passPercentage: 75 }
  ],
  questions: [
    {
      id: "q_qn1",
      quizId: "q1",
      text: "Qui a écrit le livre blanc du Bitcoin en 2008 ?",
      choices: ["Vitalik Buterin", "Satoshi Nakamoto", "Elon Musk", "Charles Hoskinson"],
      correctIndex: 1,
    },
    {
      id: "q_qn2",
      quizId: "q1",
      text: "Quel mécanisme de consensus utilise Ethereum aujourd'hui ?",
      choices: ["Proof of Work (PoW)", "Proof of Authority (PoA)", "Proof of Stake (PoS)", "Proof of Space"],
      correctIndex: 2,
    },
    {
      id: "q_qn3",
      quizId: "q1",
      text: "Quelle clé sert à signer une transaction sortante sur la blockchain ?",
      choices: ["Clé publique", "Clé privée", "Clé API", "Clé SSH"],
      correctIndex: 1,
    }
  ],
  quizAttempts: [],
  certificates: [],
  transactions: [
    {
      id: "tx1",
      userId: "u1",
      userName: "Jean Dupont",
      amount: 300,
      courseId: "blockchain",
      date: new Date(Date.now() - 86400000 * 8).toISOString(),
      status: "PAID",
      method: "Mobile Money",
    },
    {
      id: "tx2",
      userId: "u2",
      userName: "Marie K.",
      amount: 1000,
      courseId: "ai",
      date: new Date(Date.now() - 86400000 * 5).toISOString(),
      status: "PAID",
      method: "Carte",
    }
  ],
  payouts: [
    {
      id: "po1",
      instructorId: "u3",
      amount: 850,
      status: "PAID",
      date: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
    {
      id: "po2",
      instructorId: "u3",
      amount: 1200,
      status: "PENDING",
      date: new Date(Date.now() - 86400000 * 1).toISOString(),
    }
  ],
  supportTickets: [
    {
      id: "t1",
      userId: "u1",
      userName: "Jean Dupont",
      subject: "Problème de connexion Metamask",
      message: "Je n'arrive pas à connecter mon portefeuille Metamask au réseau de test Sepolia lors du TP de la semaine 4. Est-ce normal ?",
      status: "OPEN",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      replies: [
        {
          id: "r1",
          senderId: "u1",
          senderName: "Jean Dupont",
          message: "Voici mon message initial. J'attends votre aide avec impatience.",
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
        }
      ]
    }
  ]
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
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return defaultDB;
    }
  }
  return defaultDB;
};

export const saveDB = (db: Database) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("kuettu_db", JSON.stringify(db));
  }
};

export const addUser = (user: Omit<User, "id" | "joinedAt" | "status" | "role" | "plan"> & { role?: "STUDENT" | "INSTRUCTOR" | "ADMIN"; plan?: "FREE" | "BASE" | "PRO" | "MAX" }) => {
  const db = getDB();
  const newUser: User = {
    ...user,
    role: user.role || "STUDENT",
    plan: user.plan || "FREE",
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

export const addCourse = (course: Partial<Course> & { title: string; price: number; description?: string; instructorId?: string; instructorName?: string }) => {
  const db = getDB();
  const id = `c${Date.now()}`;
  const slug = course.slug || course.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const newCourse: Course = {
    id,
    title: course.title,
    slug,
    description: course.description || "",
    price: course.price,
    status: "DRAFT",
    instructorId: course.instructorId || "u3",
    instructorName: course.instructorName || "Prof. Kuettu",
    createdAt: new Date().toISOString(),
    rating: 0,
    category: "",
    level: "",
  };
  db.courses.push(newCourse);
  saveDB(db);
  return newCourse;
};
export const addSupportTicket = (ticket: Omit<SupportTicket, "id" | "createdAt" | "status" | "replies">) => {
  const db = getDB();
  const newTicket: SupportTicket = {
    ...ticket,
    id: `t${Date.now()}`,
    status: "OPEN",
    createdAt: new Date().toISOString(),
    replies: [],
  };
  db.supportTickets.push(newTicket);
  saveDB(db);
  return newTicket;
};

// Export function to add a quiz
export const addQuiz = (quiz: Omit<Quiz, "id">) => {
  const db = getDB();
  const newQuiz: Quiz = {
    ...quiz,
    id: `q_${Date.now()}`,
  };
  db.quizzes.push(newQuiz);
  saveDB(db);
  return newQuiz;
};

// Export function to add a question
export const addQuestion = (question: Omit<Question, "id">) => {
  const db = getDB();
  const newQuestion: Question = {
    ...question,
    id: `qn_${Date.now()}`,
  };
  db.questions.push(newQuestion);
  saveDB(db);
  return newQuestion;
};

export const deleteCourse = (courseId: string) => {
  const db = getDB();
  // Remove the course
  db.courses = db.courses.filter((c) => c.id !== courseId);
  // Remove related sections
  db.sections = db.sections.filter((s) => s.courseId !== courseId);
  // Remove lessons belonging to those sections
  const sectionIds = db.sections.map((s) => s.id);
  db.lessons = db.lessons.filter((l) => sectionIds.includes(l.sectionId) === false);
  // Remove enrollments for the course
  db.enrollments = db.enrollments.filter((e) => e.courseId !== courseId);
  // Remove related quizzes and questions
  const quizIds = db.quizzes.filter((q) => q.courseId === courseId).map((q) => q.id);
  db.quizzes = db.quizzes.filter((q) => q.courseId !== courseId);
  db.questions = db.questions.filter((qn) => quizIds.includes(qn.quizId) === false);
  // Remove transactions for the course
  db.transactions = db.transactions.filter((t) => t.courseId !== courseId);
  saveDB(db);
  return true;
};

export const addReplyToTicket = (ticketId: string, reply: Omit<SupportTicketReply, "id" | "createdAt">) => {
  const db = getDB();
  const ticket = db.supportTickets.find(t => t.id === ticketId);
  if (ticket) {
    const newReply: SupportTicketReply = {
      ...reply,
      id: `r${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    ticket.replies.push(newReply);
    ticket.status = reply.senderId === ticket.userId ? "OPEN" : "IN_PROGRESS";
    saveDB(db);
    return ticket;
  }
  return null;
};

export const addQuizAttempt = (attempt: Omit<QuizAttempt, "id" | "createdAt">) => {
  const db = getDB();
  const newAttempt: QuizAttempt = {
    ...attempt,
    id: `qa${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  db.quizAttempts.push(newAttempt);
  saveDB(db);
  return newAttempt;
};

export const addCertificate = (cert: Omit<Certificate, "id" | "issuedAt" | "code">) => {
  const db = getDB();
  const newCert: Certificate = {
    ...cert,
    id: `cert${Date.now()}`,
    code: `KCA-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    issuedAt: new Date().toISOString(),
  };
  db.certificates.push(newCert);
  saveDB(db);
  return newCert;
};


