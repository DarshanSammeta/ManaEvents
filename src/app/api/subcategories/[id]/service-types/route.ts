import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const serviceTypes = await prisma.servicetype.findMany({
      where: { subcategoryId: id },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(serviceTypes);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch service types" }, { status: 500 });
  }
}
