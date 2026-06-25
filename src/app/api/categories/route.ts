import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Optimize categories query using select instead of include to reduce payload and memory consumption
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        icon: true,
        description: true,
        commissionRate: true,
        _count: {
          select: {
            subcategory: {
              where: {
                servicetype: {
                  some: {
                    service: {
                      some: {
                        vendorprofile: {
                          verificationStatus: "APPROVED"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        subcategory: {
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                servicetype: {
                  where: {
                    service: {
                      some: {
                        vendorprofile: {
                          verificationStatus: "APPROVED"
                        }
                      }
                    }
                  }
                }
              }
            },
            servicetype: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        }
      }
    });

    // Post-process to get accurate vendor counts if needed,
    // but the above Prisma count is for subcategories/servicetypes.
    // To get actual VENDOR count per category:
    const categoriesWithVendorCount = await Promise.all(categories.map(async (cat) => {
      const vendorCount = await prisma.vendorprofile.count({
        where: {
          verificationStatus: "APPROVED",
          service: {
            some: {
              servicetype: {
                subcategory: {
                  categoryId: cat.id
                }
              }
            }
          }
        }
      });
      return { ...cat, vendorCount };
    }));

    return NextResponse.json(categoriesWithVendorCount);
  } catch (error: any) {
    console.error("CRITICAL ERROR: GET /api/categories failed");
    console.error("Error Name:", error.name);
    console.error("Error Message:", error.message);
    console.error("Prisma Code:", error.code);
    console.error("Meta:", error.meta);
    console.error("Stack Trace:", error.stack);

    return NextResponse.json({
      error: "Internal Server Error",
      details: error.message,
      code: error.code,
      suggestion: error.code === 'P1001' ? "Database server is unreachable. Please ensure the Supabase/PostgreSQL database is running and the connection string is correct." : undefined
    }, { status: 500 });
  }
}
