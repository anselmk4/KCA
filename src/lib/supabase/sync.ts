import { supabase } from './client';
import { Database as LocalDatabase } from '../db';

export async function syncFromSupabase(): Promise<LocalDatabase | null> {
  if (typeof window === 'undefined') return null;

  try {
    // Only sync when there is a valid auth session
    const { data: { session: authSession } } = await supabase.auth.getSession();
    if (!authSession) {
      // No authenticated session — skip Supabase sync to avoid overwriting local mock data
      return null;
    }
    // Fetch all tables in parallel to optimize speed
    const [
      { data: profiles },
      { data: userRoles },
      { data: roles },
      { data: courses },
      { data: sections },
      { data: lessons },
      { data: enrollments },
      { data: progress },
      { data: quizzes },
      { data: questions },
      { data: quizAttempts },
      { data: certificates },
      { data: payments },
      { data: orders },
      { data: orderItems },
      { data: payouts },
      { data: tickets },
      { data: replies },
      { data: categoriesData }
    ] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('user_roles').select('*'),
      supabase.from('roles').select('*'),
      supabase.from('courses').select('*'),
      supabase.from('course_sections').select('*'),
      supabase.from('lessons').select('*'),
      supabase.from('enrollments').select('*'),
      supabase.from('lesson_progress').select('*'),
      supabase.from('quizzes').select('*'),
      supabase.from('questions').select('*'),
      supabase.from('quiz_attempts').select('*'),
      supabase.from('certificates').select('*'),
      supabase.from('payments').select('*'),
      supabase.from('orders').select('*'),
      supabase.from('order_items').select('*'),
      supabase.from('payouts').select('*'),
      supabase.from('support_tickets').select('*'),
      supabase.from('support_ticket_replies').select('*'),
      supabase.from('categories').select('*')
    ]);

    // Helpers to resolve names/roles
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    const roleMap = new Map(roles?.map(r => [r.id, r]) || []);
    
    // User roles mapping: userId -> array of role names
    const userRolesMap = new Map<string, string[]>();
    userRoles?.forEach(ur => {
      const role = roleMap.get(ur.role_id);
      if (role) {
        const existing = userRolesMap.get(ur.user_id) || [];
        existing.push(role.name);
        userRolesMap.set(ur.user_id, existing);
      }
    });

    const categoryMap = new Map<string, string>(); // categoryId -> category name
    categoriesData?.forEach(cat => {
      categoryMap.set(cat.id, cat.name);
    });
    const courseMap = new Map(courses?.map(c => [c.id, c]) || []);

    // 1. Users
    const users = (profiles || []).map(p => {
      const userRoles = userRolesMap.get(p.id) || [];
      // Prefer SUPER_ADMIN, ADMIN, INSTRUCTOR, then STUDENT
      let role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | 'SUPER_ADMIN' = 'STUDENT';
      if (userRoles.includes('SUPER_ADMIN')) role = 'SUPER_ADMIN';
      else if (userRoles.includes('ADMIN')) role = 'ADMIN';
      else if (userRoles.includes('INSTRUCTOR')) role = 'INSTRUCTOR';

      // Map level
      let level = 'Débutant';
      if (p.level === 'INTERMEDIATE') level = 'Intermédiaire';
      else if (p.level === 'ADVANCED') level = 'Avancé';
      else if (p.level === 'EXPERT') level = 'Expert';

      // Map status
      let status: 'Actif' | 'Suspendu' | 'En attente' = 'Actif';
      if (p.status === 'SUSPENDED') status = 'Suspendu';
      else if (p.status === 'INACTIVE') status = 'En attente';

      return {
        id: p.id,
        name: p.full_name,
        email: p.email,
        role,
        level,
        joinedAt: p.created_at,
        activeCourse: '',
        status,
        plan: (p.plan as any) || 'FREE'
      };
    });

    // 2. Courses
    const localCourses = (courses || []).map(c => {
      const instructor = profileMap.get(c.instructor_id);
      
      let level = 'Débutant';
      if (c.level === 'INTERMEDIATE') level = 'Intermédiaire';
      else if (c.level === 'ADVANCED') level = 'Avancé';
      else if (c.level === 'EXPERT') level = 'Expert';

      let allowInstallments = false;
      let installmentsCount = 1;
      if (c.short_description) {
        try {
          const parsed = JSON.parse(c.short_description);
          if (parsed && typeof parsed === 'object') {
            allowInstallments = !!parsed.allowInstallments;
            installmentsCount = Number(parsed.installmentsCount) || 1;
          }
        } catch {
          // Ignore
        }
      }

      return {
        id: c.id,
        title: c.title,
        slug: c.slug,
        description: c.description || '',
        price: c.price,
        status: c.status as any,
        instructorId: c.instructor_id,
        instructorName: instructor?.full_name || 'Prof. Kuettu',
        createdAt: c.created_at,
        rating: c.rating_avg || 0,
        category: categoryMap.get(c.category_id ?? '') || c.category_id || '',
        level,
        allowInstallments,
        installmentsCount
      };
    });

    // 3. Sections
    const localSections = (sections || []).map(s => ({
      id: s.id,
      courseId: s.course_id,
      title: s.title,
      order: s.sort_order
    }));

    // 4. Lessons
    const localLessons = (lessons || []).map(l => ({
      id: l.id,
      sectionId: l.section_id,
      title: l.title,
      description: l.description || '',
      content: l.content || '',
      videoUrl: l.video_url || '',
      durationMin: l.duration_minutes || 0,
      order: l.sort_order
    }));

    // 5. Enrollments
    const localEnrollments = (enrollments || []).map(e => ({
      id: e.id,
      studentId: e.student_id,
      courseId: e.course_id,
      progressPercent: e.progress_percent || 0,
      joinedAt: e.enrolled_at,
      status: (e.status as any) || "ACTIVE"
    }));

    // 6. Lesson Progress
    const localProgress = (progress || []).map(p => ({
      id: p.id,
      enrollmentId: p.enrollment_id,
      lessonId: p.lesson_id,
      completed: p.completed || false,
      completedAt: p.completed_at
    }));

    // 7. Quizzes
    const localQuizzes = (quizzes || []).map(q => ({
      id: q.id,
      courseId: q.course_id,
      title: q.title,
      passPercentage: q.pass_percentage || 75,
      sectionId: q.section_id || undefined
    }));

    // 8. Questions
    const localQuestions = (questions || []).map(qn => {
      let choices: string[] = [];
      try {
        choices = Array.isArray(qn.choices) ? qn.choices : JSON.parse(qn.choices as string);
      } catch {
        choices = [];
      }
      return {
        id: qn.id,
        quizId: qn.quiz_id,
        text: qn.text,
        choices,
        correctIndex: qn.correct_index
      };
    });

    // 9. Quiz Attempts
    const localQuizAttempts = (quizAttempts || []).map(qa => ({
      id: qa.id,
      studentId: qa.student_id,
      quizId: qa.quiz_id,
      score: qa.score,
      passed: qa.passed,
      createdAt: qa.created_at
    }));

    // 10. Certificates
    const localCertificates = (certificates || []).map(cert => ({
      id: cert.id,
      studentId: cert.student_id,
      courseId: cert.course_id,
      code: cert.code,
      issuedAt: cert.issued_at
    }));

    // Helper to find course_id for an order
    const orderItemsMap = new Map(orderItems?.map(oi => [oi.order_id, oi.course_id]) || []);

    // 11. Transactions
    const localTransactions = (payments || []).map(pay => {
      const user = profileMap.get(pay.user_id);
      const courseId = orderItemsMap.get(pay.order_id) || '';
      const course = courseMap.get(courseId);
      const instructor = course ? profileMap.get(course.instructor_id) : null;
      
      let status: 'PAID' | 'FAILED' | 'PENDING' = 'PENDING';
      if (pay.status === 'PAID') status = 'PAID';
      else if (pay.status === 'FAILED') status = 'FAILED';

      let method: 'Carte' | 'Mobile Money' | 'PayPal' = 'Carte';
      if (pay.provider === 'MOBILE_MONEY') method = 'Mobile Money';
      else if (pay.provider === 'PAYPAL') method = 'PayPal';

      return {
        id: pay.id,
        userId: pay.user_id,
        userName: user?.full_name || 'Étudiant',
        amount: pay.amount,
        courseId,
        instructorId: course?.instructor_id || '',
        instructorName: instructor?.full_name || '',
        date: pay.paid_at || pay.created_at,
        status,
        method
      };
    });

    // 12. Payouts
    const localPayouts = (payouts || []).map(po => {
      let status: 'PAID' | 'FAILED' | 'PENDING' = 'PENDING';
      if (po.status === 'PAID') status = 'PAID';
      else if (po.status === 'FAILED') status = 'FAILED';

      return {
        id: po.id,
        instructorId: po.instructor_id,
        amount: po.amount,
        status,
        date: po.processed_at || po.created_at
      };
    });

    // 13. Support Tickets
    const ticketRepliesMap = new Map<string, any[]>();
    replies?.forEach(rep => {
      const sender = profileMap.get(rep.sender_id);
      const existing = ticketRepliesMap.get(rep.ticket_id) || [];
      existing.push({
        id: rep.id,
        senderId: rep.sender_id,
        senderName: sender?.full_name || 'Utilisateur',
        message: rep.message,
        createdAt: rep.created_at
      });
      ticketRepliesMap.set(rep.ticket_id, existing);
    });

    const localTickets = (tickets || []).map(t => {
      const user = profileMap.get(t.user_id);
      const ticketReplies = ticketRepliesMap.get(t.id) || [];
      // Sort replies by date ascending
      ticketReplies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      return {
        id: t.id,
        userId: t.user_id,
        userName: user?.full_name || 'Utilisateur',
        subject: t.subject,
        message: t.message,
        status: t.status as any,
        createdAt: t.created_at,
        replies: ticketReplies
      };
    });

    const db: LocalDatabase = {
      users,
      courses: localCourses,
      sections: localSections,
      lessons: localLessons,
      enrollments: localEnrollments,
      lessonProgress: localProgress,
      quizzes: localQuizzes,
      questions: localQuestions,
      quizAttempts: localQuizAttempts,
      certificates: localCertificates,
      transactions: localTransactions,
      payouts: localPayouts,
      supportTickets: localTickets
    };

    // Merge strategy: preserve local-only courses (created but not yet in Supabase)
    // This prevents the race condition where a newly created course is wiped by the sync.
    const existingRaw = localStorage.getItem('kuettu_db');
    if (existingRaw) {
      try {
        const existingLocal: LocalDatabase = JSON.parse(existingRaw);
        const supabaseCourseIds = new Set(localCourses.map((c: any) => c.id));
        // Keep local-only courses (id not in Supabase response)
        const localOnlyCourses = (existingLocal.courses || []).filter(
          (c: any) => !supabaseCourseIds.has(c.id)
        );
        db.courses = [...localCourses, ...localOnlyCourses];
      } catch {
        // If parsing fails just use Supabase data
      }
    }

    localStorage.setItem('kuettu_db', JSON.stringify(db));
    // Trigger storage event to notify other windows/listeners
    window.dispatchEvent(new Event('storage'));

    return db;
  } catch (error) {
    console.error('Error syncing from Supabase:', error);
    return null;
  }
}
