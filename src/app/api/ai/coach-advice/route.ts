import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { studentName, courseTitle, stuckLesson, lastQuizScore } = await req.json();

    if (!studentName || !stuckLesson) {
      return NextResponse.json(
        { error: "Paramètres studentName et stuckLesson requis" },
        { status: 400 }
      );
    }

    const firstName = studentName.split(" ")[0];

    const generatedAdvice =
      `Bonjour ${firstName} 👋,\n\n` +
      `J'ai remarqué que tu avais fait une pause sur la leçon "${stuckLesson}" du cours "${courseTitle}". C'est un sujet exigeant, mais crucial pour la suite de ton parcours !\n\n` +
      `💡 Mon conseil de coach : Reprends les 3 dernières minutes de la vidéo et réessaie le QCM de validation (score précédent: ${lastQuizScore || 50}%). N'hésite pas à me poser tes questions ou à réserver un créneau de coaching 1-on-1 si tu souhaites qu'on débloque cela ensemble.\n\n` +
      `Tu es très proche de valider ce chapitre, garde le cap ! 💪`;

    return NextResponse.json({
      success: true,
      advice: generatedAdvice,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
