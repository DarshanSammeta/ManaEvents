import { PrismaClient } from "@prisma/client";
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const prisma = new PrismaClient();

const CITIES = [
  { name: "Hyderabad", state: "Telangana", lat: 17.3850, lng: 78.4867 },
  { name: "Bangalore", state: "Karnataka", lat: 12.9716, lng: 77.5946 },
  { name: "Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707 },
  { name: "Mumbai", state: "Maharashtra", lat: 19.0760, lng: 72.8777 },
  { name: "Delhi", state: "Delhi", lat: 28.6139, lng: 77.2090 },
  { name: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567 },
  { name: "Vijayawada", state: "Andhra Pradesh", lat: 16.5062, lng: 80.6480 },
  { name: "Visakhapatnam", state: "Andhra Pradesh", lat: 17.6868, lng: 83.2185 },
];

const CATEGORIES_CONFIG = [
  { name: "Wedding", image: "https://images.unsplash.com/photo-1519741497674-611481863552", icon: "ring" },
  { name: "Birthday Party", image: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3", icon: "cake" },
  { name: "Anniversary", image: "https://images.unsplash.com/photo-1513151233558-d860c5398176", icon: "heart" },
  { name: "Baby Shower", image: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce", icon: "baby" },
  { name: "Engagement", image: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8", icon: "gem" },
  { name: "Corporate Events", image: "https://images.unsplash.com/photo-1511578314322-379afb476865", icon: "briefcase" },
  { name: "House Warming", image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa", icon: "home" },
  { name: "Naming Ceremony", image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed", icon: "smile" },
  { name: "Religious Events", image: "https://images.unsplash.com/photo-1544923246-77307dd654ca", icon: "sun" },
  { name: "Graduation Party", image: "https://images.unsplash.com/photo-1523580494863-6f3031224c94", icon: "graduation-cap" },
  { name: "Photography", image: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e", icon: "camera" },
  { name: "Decoration", image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed", icon: "palette" },
  { name: "Catering", image: "https://images.unsplash.com/photo-1555244162-803834f70033", icon: "utensils" },
  { name: "DJ Services", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745", icon: "music" },
  { name: "Makeup Artists", image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f", icon: "sparkles" },
  { name: "Event Venues", image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3", icon: "building" },
  { name: "Mehendi", image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa", icon: "hand" },
  { name: "Entertainment", image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3", icon: "star" },
  { name: "Event Planning", image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678", icon: "calendar" },
  { name: "Invitations", image: "https://images.unsplash.com/photo-1520854221256-17451cc331bf", icon: "mail" },
  { name: "Return Gifts", image: "https://images.unsplash.com/photo-1549465220-1d8c9d9c6703", icon: "gift" },
];

const ADJECTIVES = ["Royal", "Elite", "Grand", "Magic", "Perfect", "Creative", "Dream", "Classic", "Modern", "Urban", "Pristine", "Golden", "Silver", "Vibrant", "Luxe", "Sparkle", "Elegant", "Majestic"];
const NOUNS = ["Events", "Celebrations", "Occasions", "Solutions", "Planners", "Studios", "Kitchen", "Decors", "Sounds", "Vibes", "Delights", "Cakes", "Wheels", "Gifts", "Masters", "Artisans", "Galore"];

function getRandom(arr: any[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateBusinessName(category: string) {
  const prefix = getRandom(ADJECTIVES);
  const suffix = getRandom(NOUNS);
  return `${prefix} ${category} ${suffix}`;
}

async function main() {
  console.log("🚀 Starting Mega Production Seed...");

  // Preserve Admins
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
  console.log(`🛡️ Preserving ${admins.length} Admins.`);

  await prisma.$executeRawUnsafe("SET session_replication_role = 'replica';");
  const tables = [
    "transaction", "wallet", "payout", "staff", "bookingstatuslog", "bookingitem", "booking",
    "pricingrule", "package", "portfolio", "review", "service", "vendorscore", "vendordocument",
    "recurringavailability", "availability", "vendorsubscription", "subscriptionpayment", "subscriptionplan", "vendorprofile",
    "auditlog", "activitylog", "servicetype", "subcategory", "category", "payment", "notification", "message", "conversation", "cart", "cartitem", "wishlist", "wishlistitem"
  ];

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
    } catch (e: any) {
      console.log(`⚠️ Could not truncate ${table}: ${e.message}`);
    }
  }

  await prisma.user.deleteMany({ where: { role: { not: 'ADMIN' } } });
  await prisma.$executeRawUnsafe("SET session_replication_role = 'origin';");

  const hashedPassword = await bcrypt.hash("Password@123", 10);

  // 1. Create Subscription Plans
  console.log("💳 Creating Subscription Plans...");
  const plansData = [
    { name: "FREE", price: 0, listingLimit: 3, rank: 0, features: ["3 Service Listings", "Basic Dashboard"] },
    { name: "STARTER", price: 999, listingLimit: 10, rank: 1, features: ["10 Service Listings", "Customer Inquiries", "Basic Analytics"] },
    { name: "PRO", price: 2499, listingLimit: 25, rank: 2, features: ["25 Service Listings", "Featured Badge", "Advanced Analytics", "Lead Management"] },
    { name: "PREMIUM", price: 4999, listingLimit: -1, rank: 3, features: ["Unlimited Listings", "Top Search Priority", "Home Page Featured", "Dedicated Account Manager"] }
  ];

  const planMap: Record<string, any> = {};
  for (const p of plansData) {
    planMap[p.name] = await prisma.subscriptionplan.create({
      data: {
        id: crypto.randomUUID(),
        name: p.name,
        price: p.price,
        durationMonths: 1,
        features: JSON.stringify(p.features),
        rank: p.rank,
        updatedAt: new Date(),
      }
    });
  }

  // 2. Create Categories & Subcategories
  console.log("📁 Creating Categories...");
  const categoryObjects: Record<string, any> = {};
  for (const cat of CATEGORIES_CONFIG) {
    const createdCat = await prisma.category.create({
      data: {
        id: crypto.randomUUID(),
        name: cat.name,
        description: `Premium ${cat.name} services for all your needs.`,
        icon: cat.image
      }
    });
    categoryObjects[cat.name] = createdCat;

    const sub = await prisma.subcategory.create({
      data: {
        id: crypto.randomUUID(),
        name: `General ${cat.name}`,
        categoryId: createdCat.id
      }
    });

    const st = await prisma.servicetype.create({
      data: {
        id: crypto.randomUUID(),
        name: `Standard ${cat.name} Service`,
        subcategoryId: sub.id,
        description: `Professional ${cat.name} services.`
      }
    });
    categoryObjects[`${cat.name}_st`] = st;
  }

  // 3. Create Customers
  console.log("👤 Creating 50 Customers...");
  const customerPool = [];
  for (let i = 0; i < 50; i++) {
    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email: `customer${i}@example.com`,
        password: hashedPassword,
        fullName: `Customer ${i + 1}`,
        mobileNumber: `88800010${i.toString().padStart(2, '0')}`,
        role: 'CUSTOMER',
        updatedAt: new Date(),
        wallet: { create: { id: crypto.randomUUID(), balance: 10000, type: 'USER' } }
      }
    });
    customerPool.push(user);
  }

  // Main test customer
  await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      email: "customer@manaevents.in",
      password: hashedPassword,
      fullName: "Main Test Customer",
      mobileNumber: "9876543210",
      role: 'CUSTOMER',
      updatedAt: new Date(),
      wallet: { create: { id: crypto.randomUUID(), balance: 50000, type: 'USER' } }
    }
  });

  // 4. Create 20+ Vendors per category (approx 460+ vendors total)
  console.log("🏪 Creating 20+ Vendors per Category...");
  let totalVendorCount = 0;
  for (const catConfig of CATEGORIES_CONFIG) {
    console.log(`   - Generating vendors for ${catConfig.name}...`);
    for (let i = 0; i < 21; i++) {
      const city = getRandom(CITIES);
      const bizName = generateBusinessName(catConfig.name);
      const vendorId = crypto.randomUUID();
      const userId = crypto.randomUUID();

      const user = await prisma.user.create({
        data: {
          id: userId,
          email: `vendor${totalVendorCount}@manaevents.in`,
          password: hashedPassword,
          fullName: `Owner of ${bizName}`,
          mobileNumber: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
          role: 'VENDOR',
          updatedAt: new Date(),
          wallet: { create: { id: crypto.randomUUID(), balance: Math.floor(Math.random() * 50000), type: 'VENDOR' } }
        }
      });

      const rating = 3.5 + (Math.random() * 1.5);
      const reviewCount = 5 + Math.floor(Math.random() * 50);

      await prisma.vendorprofile.create({
        data: {
          id: vendorId,
          userId: userId,
          businessName: bizName,
          description: `Award-winning ${catConfig.name} provider in ${city.name}. We specialize in high-quality, professional delivery for all types of events. With over 10 years of experience, we guarantee satisfaction and unforgettable experiences.`,
          city: city.name,
          state: city.state,
          address: `${100 + i}, Main Street, ${city.name}`,
          zipCode: "500001",
          latitude: city.lat + (Math.random() - 0.5) * 0.05,
          longitude: city.lng + (Math.random() - 0.5) * 0.05,
          logo: `https://picsum.photos/seed/${vendorId}-logo/200/200`,
          coverImage: catConfig.image,
          verificationStatus: 'APPROVED',
          rating: rating,
          reviewCount: reviewCount,
          totalBookings: reviewCount + 10,
          vendorsubscription: {
            create: {
              id: crypto.randomUUID(),
              planId: planMap[i % 4 === 0 ? "PREMIUM" : i % 3 === 0 ? "PRO" : i % 2 === 0 ? "STARTER" : "FREE"].id,
              startDate: new Date(),
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              status: 'ACTIVE',
              updatedAt: new Date(),
            }
          }
        }
      });

      // Add a service
      const serviceId = crypto.randomUUID();
      const basePrice = 5000 + Math.floor(Math.random() * 50000);
      await prisma.service.create({
        data: {
          id: serviceId,
          vendorProfileId: vendorId,
          serviceTypeId: categoryObjects[`${catConfig.name}_st`].id,
          title: `${catConfig.name} - Premium Package`,
          description: `Comprehensive ${catConfig.name} services tailored to your needs. Includes professional setup and dedicated support.`,
          basePrice: basePrice,
          updatedAt: new Date(),
          Renamedpackage: {
            create: [
              {
                id: crypto.randomUUID(),
                name: "Basic Package",
                price: basePrice,
                description: "Essential services for your event.",
                inclusions: JSON.stringify(["Equipment", "1 Staff"])
              },
              {
                id: crypto.randomUUID(),
                name: "Royal Package",
                price: basePrice * 2.5,
                description: "Complete luxury experience with all bells and whistles.",
                inclusions: JSON.stringify(["Premium Equipment", "3 Staff", "Transport", "Decoration"])
              }
            ]
          },
          portfolio: {
            create: [
              { id: crypto.randomUUID(), vendorProfileId: vendorId, mediaUrl: catConfig.image, mediaType: "IMAGE", title: "Project Alpha" },
              { id: crypto.randomUUID(), vendorProfileId: vendorId, mediaUrl: `https://picsum.photos/seed/${serviceId}/800/600`, mediaType: "IMAGE", title: "Project Beta" }
            ]
          }
        }
      });

      // Add some reviews
      for (let r = 0; r < 3; r++) {
        await prisma.review.create({
          data: {
            id: crypto.randomUUID(),
            userId: getRandom(customerPool).id,
            vendorId: vendorId,
            rating: Math.floor(rating) + (Math.random() > 0.5 ? 1 : 0),
            comment: getRandom(["Excellent work!", "Highly recommend their services.", "Very professional and punctual.", "Great experience overall.", "Loved the attention to detail.", "The team was amazing!"]),
            updatedAt: new Date()
          }
        });
      }

      totalVendorCount++;
    }
  }

  console.log("✅ Mega Seed Completed Successfully!");
  console.log(`Summary: ${totalVendorCount} Vendors created across ${CATEGORIES_CONFIG.length} categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
