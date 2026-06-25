import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");

    // If vendorId is provided, only fetch packages for that vendor's services of this type
    const packages = await prisma.renamedpackage.findMany({
      where: {
        service: {
          serviceTypeId: id,
          ...(vendorId ? { vendorprofileId: vendorId } : {}),
        },
      },
      include: {
        pricingrule: true,
        service: true,
      },
    });
    return NextResponse.json(packages);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch packages" }, { status: 500 });
  }
}
