const { createClient } = require('@supabase/supabase-js');
const url = 'https://dwhtfoqqbwsycthpksqu.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3ODM3MywiZXhwIjoyMDk2MjU0MzczfQ.o4ZWh-OcFxMGSzrMCBwioCIbwlRnJstoQQNKF4GoR4U';
const supabase = createClient(url, key);

async function main() {
  const instructorId = 'bfaf1a31-87e2-4e56-a9ef-fbc84783956c';

  // 1. Get instructor's courses
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, price")
    .eq("instructor_id", instructorId);

  console.log("courses in fetchStudents:", courses);
  if (!courses || courses.length === 0) return;
  const courseIds = courses.map(c => c.id);
  const courseMap = new Map(courses.map(c => [c.id, c]));

  // 2. Get enrollments for those courses
  const { data: enrData } = await supabase
    .from("enrollments")
    .select("id, student_id, course_id, progress_percent, status, enrolled_at")
    .in("course_id", courseIds);
  console.log("enrData in fetchStudents:", enrData);

  if (!enrData || enrData.length === 0) return;
  const studentIds = [...new Set(enrData.map(e => e.student_id))];

  // 3. Get student profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", studentIds);
  console.log("profiles in fetchStudents:", profiles);
  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  // 4. Get orders & payments for those courses
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("order_id, course_id")
    .in("course_id", courseIds);
  console.log("orderItems in fetchStudents:", orderItems);
  const orderIds = orderItems?.map(oi => oi.order_id) || [];
  
  // Notice this! We construct the map. But since orderItems has multiple order_ids mapping to the same course_id,
  // let's see how orderItemMap is created in page.tsx:
  // const orderItemMap = new Map(orderItems?.map(oi => [oi.order_id, oi.course_id]) || []);
  const orderItemMap = new Map(orderItems?.map(oi => [oi.order_id, oi.course_id]) || []);
  console.log("orderItemMap entries:", Array.from(orderItemMap.entries()));

  let paymentMap = new Map();
  if (orderIds.length > 0) {
    const { data: payments } = await supabase
      .from("payments")
      .select("order_id, status, amount, user_id")
      .in("order_id", orderIds);
    console.log("payments in fetchStudents:", payments);
    payments?.forEach(p => {
      const courseId = orderItemMap.get(p.order_id);
      if (courseId) {
        paymentMap.set(`${p.user_id}_${courseId}`, { status: p.status, amount: p.amount, userId: p.user_id });
      }
    });
  }

  console.log("paymentMap keys:", Array.from(paymentMap.keys()));

  // 5. Get certificates
  const { data: certs } = await supabase
    .from("certificates")
    .select("student_id, course_id")
    .in("course_id", courseIds);
  const certSet = new Set(certs?.map(c => `${c.student_id}_${c.course_id}`) || []);

  // 6. Map everything
  const rows = enrData.map(e => {
    const profile = profileMap.get(e.student_id);
    const course = courseMap.get(e.course_id);
    const pay = paymentMap.get(`${e.student_id}_${e.course_id}`);
    console.log(`Mapping enrollment student=${e.student_id} course=${e.course_id}. Key=${e.student_id}_${e.course_id}. Found pay?`, pay);
    return {
      studentId: e.student_id,
      studentName: profile?.full_name || "Étudiant",
      studentEmail: profile?.email || "",
      courseId: e.course_id,
      courseTitle: course?.title || "Cours",
      coursePrice: course?.price || 0,
      progressPercent: e.progress_percent || 0,
      enrollmentStatus: e.status || "ACTIVE",
      paymentStatus: (pay?.status) || "none",
      paymentAmount: pay?.amount || 0,
      hasCertificate: certSet.has(`${e.student_id}_${e.course_id}`),
    };
  });

  console.log("Mapped rows:", rows);
}

main();
