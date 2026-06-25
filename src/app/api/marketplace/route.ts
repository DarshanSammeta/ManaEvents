import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const city = searchParams.get("city");
    const query = searchParams.get("query");
    const minPriceStr = searchParams.get("minPrice");
    const maxPriceStr = searchParams.get("maxPrice");
    const ratingStr = searchParams.get("rating");
    const sort = searchParams.get("sort") || "featured";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    const lat = searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : undefined;
    const lng = searchParams.get("lng") ? parseFloat(searchParams.get("lng")!) : undefined;

    const minPrice = minPriceStr ? parseFloat(minPriceStr) : undefined;
    const maxPrice = maxPriceStr ? parseFloat(maxPriceStr) : undefined;
    const rating = ratingStr ? parseFloat(ratingStr) : undefined;

    const latNum = lat ?? null;
    const lngNum = lng ?? null;

    // Build the base query for filtering
    const baseQuery = Prisma.sql`
      FROM vendorprofile v
      INNER JOIN user u ON v.userId = u.id
      WHERE v.verificationStatus = 'APPROVED'
      ${city ? Prisma.sql`AND v.city ILIKE ${`%${city}%`}` : Prisma.empty}
      ${query ? Prisma.sql`AND (
        v.businessName ILIKE ${`%${query}%`} OR
        v.description ILIKE ${`%${query}%`} OR
        EXISTS (
          SELECT 1 FROM service s
          LEFT JOIN servicetype st ON s.serviceTypeId = st.id
          LEFT JOIN subcategory sc ON st.subcategoryId = sc.id
          LEFT JOIN category c ON sc.categoryId = c.id
          WHERE s.vendorProfileId = v.id AND (
            s.title ILIKE ${`%${query}%`} OR
            s.description ILIKE ${`%${query}%`} OR
            st.name ILIKE ${`%${query}%`} OR
            sc.name ILIKE ${`%${query}%`} OR
            c.name ILIKE ${`%${query}%`}
          )
        )
      )` : Prisma.empty}
      ${category ? Prisma.sql`AND EXISTS (
          SELECT 1 FROM service s
          JOIN servicetype st ON s.serviceTypeId = st.id
          JOIN subcategory sc ON st.subcategoryId = sc.id
          JOIN category c ON sc.categoryId = c.id
          WHERE s.vendorProfileId = v.id AND (
            sc.name = ${category} OR c.name = ${category}
          )
      )` : Prisma.empty}
      ${(minPrice !== undefined || maxPrice !== undefined) ? Prisma.sql`AND (
        EXISTS (
          SELECT 1 FROM "package" p
          JOIN service s ON p.serviceId = s.id
          WHERE s.vendorProfileId = v.id
          AND p.price >= ${minPrice ?? 0}
          AND p.price <= ${maxPrice ?? 99999999}
        ) OR EXISTS (
          SELECT 1 FROM service s
          WHERE s.vendorProfileId = v.id
          AND s.basePrice >= ${minPrice ?? 0}
          AND s.basePrice <= ${maxPrice ?? 99999999}
        )
      )` : Prisma.empty}
      ${rating !== undefined ? Prisma.sql`AND (
          SELECT AVG(r.rating) FROM review r WHERE r.vendorId = v.id
      ) >= ${rating}` : Prisma.empty}
    `;

    // Get total count for pagination
    const countResult = await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT COUNT(DISTINCT v.id)::text as total ${baseQuery}
    `);
    const total = parseInt(countResult[0]?.total || "0");

    // Dynamic sorting
    let orderBy = Prisma.sql`ORDER BY v."createdAt" DESC`;
    if (sort === "price_low") {
      orderBy = Prisma.sql`ORDER BY "minPrice" ASC`;
    } else if (sort === "price_high") {
      orderBy = Prisma.sql`ORDER BY "minPrice" DESC`;
    } else if (sort === "rating") {
      orderBy = Prisma.sql`ORDER BY "avgRating" DESC`;
    } else if (sort === "popularity") {
      orderBy = Prisma.sql`ORDER BY v."totalBookings" DESC`;
    } else if (sort === "newest") {
      orderBy = Prisma.sql`ORDER BY v."createdAt" DESC`;
    } else if (sort === "featured" || sort === "nearby") {
      orderBy = Prisma.sql`ORDER BY (COALESCE(distance, 100) * 0.4 - COALESCE("avgRating", 0) * 0.8 - COALESCE(v."totalBookings", 0) * 0.2) ASC`;
    }

    // Main data query with aggregates and distance
    const vendorsData = await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT
        v.id,
        (
          SELECT MIN(price_val)
          FROM (
            SELECT MIN(p.price) as price_val FROM "package" p JOIN service s ON p.serviceId = s.id WHERE s.vendorProfileId = v.id
            UNION ALL
            SELECT MIN(s."basePrice") as price_val FROM service s WHERE s.vendorProfileId = v.id
          ) as all_prices
        ) as "minPrice",
        (SELECT AVG(r.rating) FROM review r WHERE r.vendorId = v.id) as "avgRating",
        (SELECT COUNT(r.id)::int FROM review r WHERE r.vendorId = v.id) as "reviewCount",
        ${(latNum !== null && lngNum !== null)
            ? Prisma.sql`(6371 * acos(cos(radians(${latNum})) * cos(radians(v.latitude)) * cos(radians(v.longitude) - radians(${lngNum})) + sin(radians(${latNum})) * sin(radians(v.latitude))))`
            : Prisma.sql`NULL`} as distance
      ${baseQuery}
      ${orderBy}
      LIMIT ${limit} OFFSET ${skip}
    `);

    const vendorIds = vendorsData.map(v => v.id);

    // Fetch full vendor details using Prisma for complex relations
    const fullVendors = await prisma.vendorprofile.findMany({
      where: { id: { in: vendorIds } },
      select: {
        id: true,
        userId: true,
        businessName: true,
        description: true,
        logo: true,
        coverImage: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        latitude: true,
        longitude: true,
        serviceRadius: true,
        gstNumber: true,
        bankDetails: true,
        verificationStatus: true,
        commissionRate: true,
        rating: true,
        reviewCount: true,
        completionRate: true,
        responseTime: true,
        totalBookings: true,
        searchScore: true,
        user: {
          select: { fullName: true }
        },
        service: {
          select: {
            id: true,
            title: true,
            basePrice: true,
            Renamedpackage: {
              select: {
                id: true,
                price: true,
                name: true
              }
            },
            servicetype: {
              select: {
                name: true,
                subcategory: {
                  select: {
                    name: true,
                    category: {
                      select: { name: true }
                    }
                  }
                }
              }
            }
          }
        },
        review: {
          select: {
            id: true,
            rating: true
          }
        },
      }
    });

    // Re-sort and merge with raw query metrics
    const finalVendors = vendorIds.map(id => {
      const v = fullVendors.find(fv => fv.id === id);
      if (!v) return null;
      const raw = vendorsData.find(rv => rv.id === id)!;

      return {
        ...v,
        distance: raw.distance !== null ? Number(raw.distance) : Infinity,
        avgRating: raw.avgRating !== null ? Number(raw.avgRating) : 0,
        minPrice: raw.minPrice !== null ? Number(raw.minPrice) : Infinity,
        reviewCount: raw.reviewCount !== null ? Number(raw.reviewCount) : 0,
        latitude: v.latitude ? Number(v.latitude) : null,
        longitude: v.longitude ? Number(v.longitude) : null
      };
    }).filter(v => v !== null);

    return NextResponse.json({
      vendors: finalVendors,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error("Marketplace API Error:", error);
    return NextResponse.json(
      { vendors: [], message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
