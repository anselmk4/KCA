import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    sessions: [
      {
        id: "b1",
        studentName: "Thomas Dubois",
        studentEmail: "thomas.dubois@email.com",
        courseTitle: "Masterclass IA & Web3 Automation",
        date: "Aujourd'hui, 22 Juillet",
        time: "15:00 - 15:45",
        durationMin: 45,
        meetingUrl: "https://meet.google.com/abc-defg-hij",
        status: "CONFIRMED",
      },
      {
        id: "b2",
        studentName: "Amélie Morel",
        studentEmail: "amelie.m@email.com",
        courseTitle: "Bourse & Trading Crypto Algorithmique",
        date: "Demain, 23 Juillet",
        time: "10:30 - 11:15",
        durationMin: 45,
        meetingUrl: "https://meet.google.com/xyz-uvwx-rst",
        status: "CONFIRMED",
      },
    ],
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    return NextResponse.json({
      success: true,
      message: "Créneau de coaching créé avec succès",
      slot: body,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
