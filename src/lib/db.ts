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
  allowInstallments?: boolean;
  installmentsCount?: number;
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
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "COMPLETED" | "AT_RISK";
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
  sectionId?: string;
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
  instructorId: string;
  instructorName: string;
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
  courses: [],
  sections: [],
  lessons: [],
  enrollments: [],
  lessonProgress: [],
  quizzes: [],
  questions: [],
  quizAttempts: [],
  certificates: [],
  transactions: [],
  payouts: [],
  supportTickets: []
};

export const generateUUID = (): string => {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Initialize DB if empty
export const initDB = () => {
  if (typeof window !== "undefined") {
    const existing = localStorage.getItem("kuettu_db");
    if (!existing) {
      localStorage.setItem("kuettu_db", JSON.stringify(defaultDB));
    }
    // Asynchronously trigger sync from Supabase to load real data
    import("./supabase/sync").then(({ syncFromSupabase }) => {
      syncFromSupabase().catch(err => console.error("Error in background sync:", err));
    });
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

const RoleUUIDs = {
  SUPER_ADMIN: "bad87955-3c4d-4e49-8ad8-86764e78fdcd",
  ADMIN: "1f349fbc-2447-445b-9ffc-ba140563d30f",
  FINANCE_ADMIN: "939b225c-5684-4780-b5e2-45ab0bee23da",
  ACADEMIC_ADMIN: "a7e9ca7a-a47e-438b-ba05-d9823d21d342",
  SUPPORT_AGENT: "54eb301d-f5f7-421c-a4b8-c3918ceef476",
  INSTRUCTOR: "79bb40ee-3ff8-4673-9078-a91b53221f8f",
  TEACHING_ASSISTANT: "44b4fcf9-8469-4530-87bd-219c1c6eda30",
  STUDENT: "09ecfd8e-b5c8-4f55-bebb-fa72344e0472"
};

export const addUser = (user: Omit<User, "id" | "joinedAt" | "status" | "role" | "plan"> & { id?: string; role?: "STUDENT" | "INSTRUCTOR" | "ADMIN"; plan?: "FREE" | "BASE" | "PRO" | "MAX" }) => {
  const db = getDB();
  const userId = user.id || generateUUID();
  const newUser: User = {
    ...user,
    role: user.role || "STUDENT",
    plan: user.plan || "FREE",
    id: userId,
    joinedAt: new Date().toISOString(),
    status: "Actif",
  };
  db.users.push(newUser);
  saveDB(db);

  // Sync to Supabase in background
  import("./supabase/client").then(async ({ supabase }) => {
    try {
      const levelMap: Record<string, "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT"> = {
        "Débutant": "BEGINNER",
        "Intermédiaire": "INTERMEDIATE",
        "Avancé": "ADVANCED",
        "Expert": "EXPERT"
      };
      const mappedLevel = levelMap[newUser.level] || "BEGINNER";
      const mappedRole = newUser.role as keyof typeof RoleUUIDs;
      const roleId = RoleUUIDs[mappedRole] || RoleUUIDs.STUDENT;

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: newUser.id,
        full_name: newUser.name,
        email: newUser.email,
        level: mappedLevel,
        status: "ACTIVE",
        plan: newUser.plan as any,
        created_at: newUser.joinedAt,
        updated_at: newUser.joinedAt
      });
      if (profileError) throw profileError;

      const { error: roleError } = await supabase.from("user_roles").upsert({
        user_id: newUser.id,
        role_id: roleId
      });
      if (roleError) throw roleError;
    } catch (err) {
      console.error("Error inserting profile/role in Supabase:", err);
    }
  });

  return newUser;
};

export const addTransaction = (tx: Omit<Transaction, "id" | "date"> & { instructorId?: string; instructorName?: string }) => {
  const db = getDB();
  // Auto-resolve instructor from the course if not provided
  const course = db.courses.find(c => c.id === tx.courseId);
  const newTx: Transaction = {
    ...tx,
    instructorId: tx.instructorId || course?.instructorId || "",
    instructorName: tx.instructorName || course?.instructorName || "",
    id: generateUUID(),
    date: new Date().toISOString(),
  };
  db.transactions.push(newTx);
  saveDB(db);

  // Sync to Supabase in background (Orders, Order Items, Payments)
  import("./supabase/client").then(async ({ supabase }) => {
    try {
      const orderId = generateUUID();
      const orderNumber = `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      // Create order
      const { error: orderError } = await supabase.from("orders").insert({
        id: orderId,
        user_id: newTx.userId,
        order_number: orderNumber,
        status: newTx.status === "PAID" ? "COMPLETED" : newTx.status === "PENDING" ? "PENDING" : "CANCELLED",
        subtotal: newTx.amount,
        total: newTx.amount,
        currency: "USD",
        created_at: newTx.date,
        updated_at: newTx.date
      });
      if (orderError) throw orderError;

      // Create order item
      const { error: itemError } = await supabase.from("order_items").insert({
        id: generateUUID(),
        order_id: orderId,
        course_id: newTx.courseId,
        unit_price: newTx.amount,
        final_price: newTx.amount,
        created_at: newTx.date
      });
      if (itemError) throw itemError;

      // Create payment
      const providerMap: Record<string, "STRIPE" | "PAYPAL" | "MOBILE_MONEY" | "MANUAL"> = {
        "Carte": "STRIPE",
        "PayPal": "PAYPAL",
        "Mobile Money": "MOBILE_MONEY"
      };
      const provider = providerMap[newTx.method] || "MANUAL";
      
      const { error: paymentError } = await supabase.from("payments").insert({
        id: newTx.id,
        order_id: orderId,
        user_id: newTx.userId,
        amount: newTx.amount,
        currency: "USD",
        status: newTx.status as any,
        provider: provider,
        method: newTx.method,
        created_at: newTx.date,
        updated_at: newTx.date
      });
      if (paymentError) throw paymentError;
    } catch (err) {
      console.error("Error creating transaction in Supabase:", err);
    }
  });

  return newTx;
};

export const addCourse = (course: Partial<Course> & { title: string; price: number; description?: string; instructorId?: string; instructorName?: string }) => {
  const db = getDB();
  const id = generateUUID();
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

  // Sync to Supabase via server-side API route (cookie-based auth, bypasses RLS issues)
  fetch('/api/courses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: newCourse.id,
      title: newCourse.title,
      slug: newCourse.slug,
      description: newCourse.description,
      price: newCourse.price,
      createdAt: newCourse.createdAt,
      category: newCourse.category,
      level: newCourse.level,
    }),
  }).then(async (res) => {
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error('[addCourse] API error:', res.status, body?.error);
    } else {
      console.log('[addCourse] Course persisted to Supabase via API ✓');
    }
  }).catch((err) => {
    console.error('[addCourse] Fetch error:', err);
  });

  return newCourse;
};

export const addSupportTicket = (ticket: Omit<SupportTicket, "id" | "createdAt" | "status" | "replies">) => {
  const db = getDB();
  const newTicket: SupportTicket = {
    ...ticket,
    id: generateUUID(),
    status: "OPEN",
    createdAt: new Date().toISOString(),
    replies: [],
  };
  db.supportTickets.push(newTicket);
  saveDB(db);

  // Sync to Supabase in background
  import("./supabase/client").then(async ({ supabase }) => {
    try {
      const ticketNumber = `TCK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const { error } = await supabase.from("support_tickets").insert({
        id: newTicket.id,
        user_id: newTicket.userId,
        subject: newTicket.subject,
        message: newTicket.message,
        status: "OPEN",
        ticket_number: ticketNumber,
        created_at: newTicket.createdAt,
        updated_at: newTicket.createdAt
      });
      if (error) throw error;
    } catch (err) {
      console.error("Error creating support ticket in Supabase:", err);
    }
  });

  return newTicket;
};

// Export function to add a quiz
export const addQuiz = (quiz: Omit<Quiz, "id">) => {
  const db = getDB();
  const newQuiz: Quiz = {
    ...quiz,
    id: generateUUID(),
  };
  db.quizzes.push(newQuiz);
  saveDB(db);

  // Sync to Supabase in background
  import("./supabase/client").then(async ({ supabase }) => {
    try {
      const { error } = await supabase.from("quizzes").insert({
        id: newQuiz.id,
        course_id: newQuiz.courseId,
        title: newQuiz.title,
        pass_percentage: newQuiz.passPercentage,
        section_id: newQuiz.sectionId || null,
        is_published: true
      });
      if (error) throw error;
    } catch (err) {
      console.error("Error creating quiz in Supabase:", err);
    }
  });

  return newQuiz;
};

// Export function to add a question
export const addQuestion = (question: Omit<Question, "id">) => {
  const db = getDB();
  const newQuestion: Question = {
    ...question,
    id: generateUUID(),
  };
  db.questions.push(newQuestion);
  saveDB(db);

  // Sync to Supabase in background
  import("./supabase/client").then(async ({ supabase }) => {
    try {
      const { error } = await supabase.from("questions").insert({
        id: newQuestion.id,
        quiz_id: newQuestion.quizId,
        text: newQuestion.text,
        choices: newQuestion.choices as any,
        correct_index: newQuestion.correctIndex
      });
      if (error) throw error;
    } catch (err) {
      console.error("Error creating question in Supabase:", err);
    }
  });

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

  // Sync to Supabase via server-side API route
  fetch(`/api/courses?id=${courseId}`, {
    method: 'DELETE',
  }).then(async (res) => {
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error('[deleteCourse] API error:', res.status, body?.error);
    }
  }).catch((err) => {
    console.error('[deleteCourse] Fetch error:', err);
  });

  return courseId;
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

    // Sync to Supabase in background
    import("./supabase/client").then(async ({ supabase }) => {
      try {
        const { error: replyError } = await supabase.from("support_ticket_replies").insert({
          id: newReply.id,
          ticket_id: ticketId,
          sender_id: newReply.senderId,
          message: newReply.message,
          created_at: newReply.createdAt
        });
        if (replyError) throw replyError;

        const { error: ticketError } = await supabase.from("support_tickets").update({
          status: ticket.status as any,
          updated_at: new Date().toISOString()
        }).eq("id", ticketId);
        if (ticketError) throw ticketError;
      } catch (err) {
        console.error("Error creating ticket reply in Supabase:", err);
      }
    });

    return ticket;
  }
  return null;
};

export const addQuizAttempt = (attempt: Omit<QuizAttempt, "id" | "createdAt">) => {
  const db = getDB();
  const newAttempt: QuizAttempt = {
    ...attempt,
    id: generateUUID(),
    createdAt: new Date().toISOString(),
  };
  db.quizAttempts.push(newAttempt);
  saveDB(db);

  // Sync to Supabase in background
  import("./supabase/client").then(async ({ supabase }) => {
    try {
      const { error } = await supabase.from("quiz_attempts").insert({
        id: newAttempt.id,
        student_id: newAttempt.studentId,
        quiz_id: newAttempt.quizId,
        score: newAttempt.score,
        passed: newAttempt.passed,
        created_at: newAttempt.createdAt
      });
      if (error) throw error;
    } catch (err) {
      console.error("Error creating quiz attempt in Supabase:", err);
    }
  });

  return newAttempt;
};

export const addCertificate = (cert: Omit<Certificate, "id" | "issuedAt" | "code">) => {
  const db = getDB();
  const newCert: Certificate = {
    ...cert,
    id: generateUUID(),
    code: `KCA-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    issuedAt: new Date().toISOString(),
  };
  db.certificates.push(newCert);
  saveDB(db);

  // Sync to Supabase in background
  import("./supabase/client").then(async ({ supabase }) => {
    try {
      const { error } = await supabase.from("certificates").insert({
        id: newCert.id,
        student_id: newCert.studentId,
        course_id: newCert.courseId,
        code: newCert.code,
        status: "ISSUED",
        issued_at: newCert.issuedAt,
        created_at: newCert.issuedAt,
        updated_at: newCert.issuedAt
      });
      if (error) throw error;
    } catch (err) {
      console.error("Error creating certificate in Supabase:", err);
    }
  });

  return newCert;
};

export const updateCourseDetails = (courseId: string, updates: Partial<Course>) => {
  const db = getDB();
  const courseIdx = db.courses.findIndex((c) => c.id === courseId);
  if (courseIdx === -1) return null;

  const current = db.courses[courseIdx];
  const updatedCourse = {
    ...current,
    ...updates,
  };
  db.courses[courseIdx] = updatedCourse;
  saveDB(db);

  // Sync to Supabase via server-side API route
  fetch('/api/courses', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: courseId, ...updates }),
  }).then(async (res) => {
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error('[updateCourseDetails] API error:', res.status, body?.error);
    }
  }).catch((err) => {
    console.error('[updateCourseDetails] Fetch error:', err);
  });

  return updatedCourse;
};

export const addSection = (courseId: string, title: string, order: number) => {
  const db = getDB();
  const newSection: CourseSection = {
    id: generateUUID(),
    courseId,
    title,
    order,
  };
  db.sections.push(newSection);
  saveDB(db);

  // Sync to Supabase via server-side API route
  fetch('/api/sections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: newSection.id,
      courseId: newSection.courseId,
      title: newSection.title,
      order: newSection.order,
    }),
  }).then(async (res) => {
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error('[addSection] API error:', res.status, body?.error);
    } else {
      console.log('[addSection] Section persisted to Supabase via API ✓');
    }
  }).catch((err) => {
    console.error('[addSection] Fetch error:', err);
  });

  return newSection;
};

export const updateSection = (sectionId: string, updates: Partial<Omit<CourseSection, "id" | "courseId">>) => {
  const db = getDB();
  const sectionIdx = db.sections.findIndex((s) => s.id === sectionId);
  if (sectionIdx === -1) return null;

  const current = db.sections[sectionIdx];
  const updatedSection = {
    ...current,
    ...updates,
  };
  db.sections[sectionIdx] = updatedSection;
  saveDB(db);

  // Sync to Supabase via server-side API route
  fetch('/api/sections', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: sectionId, ...updates }),
  }).then(async (res) => {
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error('[updateSection] API error:', res.status, body?.error);
    }
  }).catch((err) => {
    console.error('[updateSection] Fetch error:', err);
  });

  return updatedSection;
};

export const deleteSection = (sectionId: string) => {
  const db = getDB();
  
  db.sections = db.sections.filter((s) => s.id !== sectionId);
  db.lessons = db.lessons.filter((l) => l.sectionId !== sectionId);
  saveDB(db);

  // Sync to Supabase via server-side API route
  fetch(`/api/sections?id=${sectionId}`, {
    method: 'DELETE',
  }).then(async (res) => {
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error('[deleteSection] API error:', res.status, body?.error);
    }
  }).catch((err) => {
    console.error('[deleteSection] Fetch error:', err);
  });

  return true;
};

export const addLesson = (sectionId: string, lessonData: Omit<Lesson, "id" | "sectionId">) => {
  const db = getDB();
  const newLesson: Lesson = {
    id: generateUUID(),
    sectionId,
    ...lessonData,
  };
  db.lessons.push(newLesson);
  saveDB(db);

  // Sync to Supabase via server-side API route
  fetch('/api/lessons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: newLesson.id,
      sectionId: newLesson.sectionId,
      title: newLesson.title,
      description: newLesson.description,
      content: newLesson.content,
      videoUrl: newLesson.videoUrl,
      durationMin: newLesson.durationMin,
      order: newLesson.order,
    }),
  }).then(async (res) => {
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error('[addLesson] API error:', res.status, body?.error);
    } else {
      console.log('[addLesson] Lesson persisted to Supabase via API ✓');
    }
  }).catch((err) => {
    console.error('[addLesson] Fetch error:', err);
  });

  return newLesson;
};

export const updateLesson = (lessonId: string, updates: Partial<Omit<Lesson, "id" | "sectionId">>) => {
  const db = getDB();
  const lessonIdx = db.lessons.findIndex((l) => l.id === lessonId);
  if (lessonIdx === -1) return null;

  const current = db.lessons[lessonIdx];
  const updatedLesson = {
    ...current,
    ...updates,
  };
  db.lessons[lessonIdx] = updatedLesson;
  saveDB(db);

  // Sync to Supabase via server-side API route
  fetch('/api/lessons', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: lessonId, ...updates }),
  }).then(async (res) => {
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error('[updateLesson] API error:', res.status, body?.error);
    }
  }).catch((err) => {
    console.error('[updateLesson] Fetch error:', err);
  });

  return updatedLesson;
};

export const deleteLesson = (lessonId: string) => {
  const db = getDB();
  db.lessons = db.lessons.filter((l) => l.id !== lessonId);
  saveDB(db);

  // Sync to Supabase via server-side API route
  fetch(`/api/lessons?id=${lessonId}`, {
    method: 'DELETE',
  }).then(async (res) => {
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error('[deleteLesson] API error:', res.status, body?.error);
    }
  }).catch((err) => {
    console.error('[deleteLesson] Fetch error:', err);
  });

  return true;
};

export const updateQuiz = (quizId: string, updates: Partial<Omit<Quiz, "id" | "courseId">>) => {
  const db = getDB();
  const quizIdx = db.quizzes.findIndex((q) => q.id === quizId);
  if (quizIdx === -1) return null;

  const current = db.quizzes[quizIdx];
  const updatedQuiz = {
    ...current,
    ...updates,
  };
  db.quizzes[quizIdx] = updatedQuiz;
  saveDB(db);

  import("./supabase/client").then(async ({ supabase }) => {
    try {
      const sbUpdates: any = {};
      if (updates.title !== undefined) sbUpdates.title = updates.title;
      if (updates.passPercentage !== undefined) sbUpdates.pass_percentage = updates.passPercentage;

      const { error } = await supabase
        .from("quizzes")
        .update(sbUpdates)
        .eq("id", quizId);

      if (error) throw error;
    } catch (err) {
      console.error("Error updating quiz in Supabase:", err);
    }
  });

  return updatedQuiz;
};

export const deleteQuiz = (quizId: string) => {
  const db = getDB();
  db.quizzes = db.quizzes.filter((q) => q.id !== quizId);
  db.questions = db.questions.filter((qn) => qn.quizId !== quizId);
  saveDB(db);

  import("./supabase/client").then(async ({ supabase }) => {
    try {
      const { error } = await supabase.from("quizzes").delete().eq("id", quizId);
      if (error) throw error;
    } catch (err) {
      console.error("Error deleting quiz in Supabase:", err);
    }
  });

  return true;
};

export const updateQuestion = (questionId: string, updates: Partial<Omit<Question, "id" | "quizId">>) => {
  const db = getDB();
  const qIdx = db.questions.findIndex((qn) => qn.id === questionId);
  if (qIdx === -1) return null;

  const current = db.questions[qIdx];
  const updatedQ = {
    ...current,
    ...updates,
  };
  db.questions[qIdx] = updatedQ;
  saveDB(db);

  import("./supabase/client").then(async ({ supabase }) => {
    try {
      const sbUpdates: any = {};
      if (updates.text !== undefined) sbUpdates.text = updates.text;
      if (updates.choices !== undefined) sbUpdates.choices = updates.choices as any;
      if (updates.correctIndex !== undefined) sbUpdates.correct_index = updates.correctIndex;

      const { error } = await supabase
        .from("questions")
        .update(sbUpdates)
        .eq("id", questionId);

      if (error) throw error;
    } catch (err) {
      console.error("Error updating question in Supabase:", err);
    }
  });

  return updatedQ;
};

export const deleteQuestion = (questionId: string) => {
  const db = getDB();
  db.questions = db.questions.filter((qn) => qn.id !== questionId);
  saveDB(db);

  import("./supabase/client").then(async ({ supabase }) => {
    try {
      const { error } = await supabase.from("questions").delete().eq("id", questionId);
      if (error) throw error;
    } catch (err) {
      console.error("Error deleting question in Supabase:", err);
    }
  });

  return true;
};

export const addEnrollment = (studentId: string, courseId: string, status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "COMPLETED" | "AT_RISK" = "ACTIVE") => {
  const db = getDB();
  const existing = db.enrollments.find(e => e.studentId === studentId && e.courseId === courseId);
  if (existing) {
    existing.status = status;
    saveDB(db);
    import("./supabase/client").then(async ({ supabase }) => {
      try {
        await supabase.from("enrollments").update({ status }).eq("id", existing.id);
      } catch (err) {
        console.error("Error updating enrollment status in Supabase:", err);
      }
    });
    return existing;
  }

  const newEnrollment: Enrollment = {
    id: generateUUID(),
    studentId,
    courseId,
    progressPercent: 0,
    joinedAt: new Date().toISOString(),
    status,
  };
  db.enrollments.push(newEnrollment);
  saveDB(db);

  import("./supabase/client").then(async ({ supabase }) => {
    try {
      const { error } = await supabase.from("enrollments").upsert({
        id: newEnrollment.id,
        student_id: newEnrollment.studentId,
        course_id: newEnrollment.courseId,
        progress_percent: 0,
        enrolled_at: newEnrollment.joinedAt,
        status: newEnrollment.status
      }, { onConflict: "student_id,course_id" });
      if (error) throw error;
    } catch (err) {
      console.error("Error creating enrollment in Supabase:", err);
    }
  });

  return newEnrollment;
};

export const updateEnrollmentStatus = (studentId: string, courseId: string, status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "COMPLETED" | "AT_RISK") => {
  const db = getDB();
  const enrollmentIdx = db.enrollments.findIndex(e => e.studentId === studentId && e.courseId === courseId);
  if (enrollmentIdx === -1) return null;

  const current = db.enrollments[enrollmentIdx];
  const updatedEnrollment = {
    ...current,
    status
  };
  db.enrollments[enrollmentIdx] = updatedEnrollment;
  saveDB(db);

  import("./supabase/client").then(async ({ supabase }) => {
    try {
      const { error } = await supabase.from("enrollments").update({
        status
      }).eq("id", current.id);
      if (error) throw error;
    } catch (err) {
      console.error("Error updating enrollment status in Supabase:", err);
    }
  });

  return updatedEnrollment;
};
