const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");

const prisma = new PrismaClient();

const CITIES = [
  { name: "Hyderabad", state: "Telangana", lat: 17.3850, lng: 78.4867 },
  { name: "Secunderabad", state: "Telangana", lat: 17.4399, lng: 78.4983 },
  { name: "Warangal", state: "Telangana", lat: 17.9689, lng: 79.5941 },
  { name: "Karimnagar", state: "Telangana", lat: 18.4386, lng: 79.1288 },
  { name: "Vijayawada", state: "Andhra Pradesh", lat: 16.5062, lng: 80.6480 },
  { name: "Visakhapatnam", state: "Andhra Pradesh", lat: 17.6868, lng: 83.2185 },
  { name: "Guntur", state: "Andhra Pradesh", lat: 16.3067, lng: 80.4365 },
  { name: "Bengaluru", state: "Karnataka", lat: 12.9716, lng: 77.5946 },
  { name: "Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707 },
];

const CATEGORIES = [
  { name: "Wedding", subcategories: ["Decoration", "Photography", "Catering", "Transportation", "Return Gifts", "Mehendi Artists", "Invitation Design", "Flower Decoration", "Dance Choreography"] },
  { name: "Birthday Party", subcategories: ["Decoration", "Cakes", "Entertainment", "Photography", "Magic Show", "Balloon Decoration"] },
  { name: "Anniversary", subcategories: ["Decoration", "Cakes", "Photography", "Catering"] },
  { name: "Baby Shower", subcategories: ["Decoration", "Photography", "Cakes"] },
  { name: "Engagement", subcategories: ["Decoration", "Photography", "Catering"] },
  { name: "Corporate Events", subcategories: ["Catering", "DJ & Music", "Entertainment", "Photography", "Sound & Lighting"] },
  { name: "House Warming", subcategories: ["Decoration", "Catering", "Photography"] },
  { name: "Naming Ceremony", subcategories: ["Decoration", "Catering", "Photography"] },
  { name: "Graduation Party", subcategories: ["DJ & Music", "Catering", "Photography"] },
  { name: "Religious Events", subcategories: ["Decoration", "Catering", "Photography"] },
  { name: "Photography", subcategories: ["Wedding Photography", "Candid Photography", "Cinematic Photography"] },
  { name: "Videography", subcategories: ["Event Videography", "Cinematic Film"] },
  { name: "Catering", subcategories: ["South Indian", "North Indian", "Multi-cuisine"] },
  { name: "Decoration", subcategories: ["Floral", "Theme", "Stage"] },
  { name: "Makeup Artist", subcategories: ["Bridal Makeup", "Party Makeup"] },
  { name: "DJ Services", subcategories: ["DJ", "Sound System"] },
  { name: "Live Music", subcategories: ["Live Band", "Singers"] },
  { name: "Event Planning", subcategories: ["Wedding Planner", "Corporate Planner"] },
  { name: "Venues", subcategories: ["Banquet Hall", "Lawn", "Resort"] },
  { name: "Mehendi Artists", subcategories: ["Bridal Mehendi", "Arabic Mehendi"] },
  { name: "Invitation Design", subcategories: ["Digital Invitation", "Print Invitation"] },
  { name: "Flower Decoration", subcategories: ["Fresh Flowers", "Artificial Flowers"] },
  { name: "Sound & Lighting", subcategories: ["Stage Lighting", "Sound Setup"] },
  { name: "Dance Choreography", subcategories: ["Sangeet Choreography", "Group Dance"] },
  { name: "Return Gifts", subcategories: ["Customized Gifts", "Traditional Gifts"] },
];

const SUB_DATA = {
  "Photography": ["Wedding Photography", "Candid Photography", "Cinematic Photography", "Traditional Photography", "Drone Photography", "Pre-Wedding Shoot", "Maternity Photography", "Event Photography"],
  "Catering": ["South Indian Catering", "North Indian Catering", "Chinese Catering", "Buffet Catering", "Live Counters", "Premium Catering"],
  "Decoration": ["Stage Decoration", "Floral Decoration", "Balloon Decoration", "Theme Decoration", "Wedding Decoration", "Birthday Decoration"],
  "DJ & Music": ["DJ Services", "Live Band", "Orchestra", "Sound Systems", "Sangeet DJ"],
  "Entertainment": ["Magic Show", "Dance Performance", "Kids Entertainment", "Anchors", "Celebrity Appearance"],
  "Cakes": ["Birthday Cakes", "Wedding Cakes", "Theme Cakes", "Customized Cakes"],
  "Transportation": ["Luxury Cars", "Wedding Cars", "Buses", "Guest Transportation"],
  "Return Gifts": ["Wedding Gifts", "Birthday Gifts", "Corporate Gifts"]
};

const VENDOR_COUNTS = {
  "Photography": 5,
  "Catering": 5,
  "Decoration": 5,
  "DJ & Music": 3,
  "Entertainment": 3,
  "Cakes": 3,
  "Transportation": 2,
  "Return Gifts": 2
};

const PACKAGE_TEMPLATES = [
  { name: "Basic Package", priceMultiplier: 1, guestMultiplier: 50 },
  { name: "Standard Package", priceMultiplier: 2, guestMultiplier: 100 },
  { name: "Premium Package", priceMultiplier: 3.5, guestMultiplier: 250 },
  { name: "Deluxe Package", priceMultiplier: 5, guestMultiplier: 500 },
  { name: "Luxury Package", priceMultiplier: 10, guestMultiplier: 1000 },
];

const BASE_PRICES = {
  "Photography": 15000,
  "Catering": 350, // Per plate
  "Decoration": 10000,
  "DJ & Music": 8000,
  "Entertainment": 5000,
  "Cakes": 1500,
  "Transportation": 3000,
  "Return Gifts": 100 // Per gift
};

const ADJECTIVES = ["Elite", "Royal", "Sparkle", "Grand", "Magic", "Perfect", "Creative", "Dream", "Classic", "Modern", "Urban", "Pristine", "Golden", "Silver", "Vibrant"];
const NOUNS = ["Events", "Celebrations", "Occasions", "Solutions", "Planners", "Studios", "Kitchen", "Decors", "Sounds", "Vibes", "Delights", "Cakes", "Wheels", "Gifts"];

function getRandom(arr: any[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateBusinessName() {
  return `${getRandom(ADJECTIVES)} ${getRandom(NOUNS)}`;
}

async function main() {
  console.log("🚀 Starting mega seed process...");

  // Clear existing data using raw SQL to bypass foreign key constraints
  console.log("🧹 Clearing old data...");
  const tables = [
    "activitylog", "auditlog", "availability", "booking", "bookingassignment", "bookingitem",
    "bookingstatuslog", "staff", "cart", "cartitem", "category", "conversation",
    "conversationparticipant", "coupon", "dispute", "eventcheckin", "globalsettings",
    "invoice", "locationtrackinglog", "message", "messageattachment", "notification",
    "package", "payment", "payment_split", "payout", "portfolio", "pricingrule",
    "refreshtoken", "refund", "review", "service", "servicetype", "subcategory",
    "transaction", "user", "vendordocument", "vendorprofile", "recurringavailability",
    "vendorscore", "wallet", "webhookevent", "wishlist", "wishlistitem",
    "passwordresettoken", "subscriptionpayment", "subscriptionplan", "vendorsubscription"
  ];

  await prisma.$executeRawUnsafe(`SET session_replication_role = 'replica';`);
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
    } catch (e: any) {
      console.log(`⚠️ Could not truncate ${table}: ${e.message}`);
    }
  }
  await prisma.$executeRawUnsafe(`SET session_replication_role = 'origin';`);

  const hashedPassword = await bcrypt.hash("Password@123", 10);

  // 0. Create Customer Pool for Reviews
  console.log("👤 Creating customer pool...");
  const customerPool = [];
  for (let i = 0; i < 20; i++) {
    const customer = await prisma.user.create({
      data: {
        id: randomUUID(),
        fullName: `Customer ${i + 1}`,
        email: `customer${i}@example.com`,
        password: hashedPassword,
        mobileNumber: `8${Math.floor(100000000 + Math.random() * 900000000)}`,
        role: "CUSTOMER",
        updatedAt: new Date(),
        wallet: { create: { id: randomUUID(), type: "USER", balance: 1000 } }
      }
    });
    customerPool.push(customer);
  }

  // 1. Create Main Categories
  console.log("📁 Creating categories...");

  // Subscription Plans
  console.log("💳 Creating subscription plans...");
  const plans = [
    {
      name: "FREE",
      price: 0,
      durationMonths: 120, // 10 years for free plan
      listingLimit: 3,
      rank: 0,
      features: JSON.stringify([
        "Create Vendor Profile",
        "Basic Marketplace Visibility",
        "Basic Dashboard Access"
      ])
    },
    {
      name: "STARTER",
      price: 499,
      durationMonths: 1,
      listingLimit: 15,
      rank: 1,
      features: JSON.stringify([
        "Better Search Visibility",
        "Customer Inquiries Access",
        "Basic Analytics",
        "WhatsApp Notifications"
      ])
    },
    {
      name: "PRO",
      price: 1499,
      durationMonths: 1,
      listingLimit: -1,
      rank: 2,
      features: JSON.stringify([
        "Unlimited Listings",
        "Featured Listings",
        "Priority Search Ranking",
        "Advanced Analytics",
        "Booking Management",
        "Reviews Management",
        "Vendor Verification Badge"
      ])
    },
    {
      name: "PREMIUM",
      price: 2999,
      durationMonths: 1,
      listingLimit: -1,
      rank: 3,
      features: JSON.stringify([
        "Top Search Priority",
        "Homepage Featured Placement",
        "Unlimited Listings",
        "Complete Analytics",
        "Premium Badge",
        "Lead Priority",
        "Banner Promotions",
        "AI Recommendations"
      ])
    }
  ];

  const planMap: Record<string, any> = {};
  for (const plan of plans) {
    const created = await prisma.subscriptionplan.upsert({
      where: { name: plan.name },
      update: plan,
      create: {
        ...plan,
        id: randomUUID(),
        updatedAt: new Date()
      }
    });
    planMap[plan.name] = created;
  }
  const categoryMap: Record<string, any> = {};
  for (const cat of CATEGORIES) {
    const created = await prisma.category.create({
      data: {
        id: randomUUID(),
        name: cat.name,
        description: `Everything you need for a perfect ${cat.name}.`,
        icon: `/icons/${cat.name.toLowerCase().replace(/\s+/g, "-")}.png`
      }
    });
    categoryMap[cat.name] = created;
  }

  // 2. Create Subcategories and Service Types
  console.log("📂 Creating subcategories and service types...");
  const serviceTypeMap: Record<string, any> = {};

  for (const [subName, types] of Object.entries(SUB_DATA)) {
    const parentCat = CATEGORIES.find(c => c.subcategories.includes(subName)) || CATEGORIES[0];

    const sub = await prisma.subcategory.create({
      data: {
        id: randomUUID(),
        name: subName,
        categoryId: categoryMap[parentCat.name].id
      }
    });

    for (const typeName of (types as string[])) {
      const st = await prisma.servicetype.create({
        data: {
          id: randomUUID(),
          name: typeName,
          subcategoryId: sub.id,
          description: `Professional ${typeName} services for your special event.`
        }
      });
      serviceTypeMap[typeName] = st;
    }
  }

  // 3. Create Vendors, Services, Packages, Reviews, Portfolio
  console.log("🏪 Creating vendors and service data...");

  let totalVendors = 0;
  for (const [subName, count] of Object.entries(VENDOR_COUNTS)) {
    console.log(`   - Generating ${count} vendors for ${subName}...`);

      for (let i = 0; i < count; i++) {
      const city = getRandom(CITIES);
      const businessName = generateBusinessName();
      const userId = randomUUID();
      const vendorProfileId = randomUUID();

      const user = await prisma.user.create({
        data: {
          id: userId,
          email: `vendor${totalVendors}@manaevents.in`,
          password: hashedPassword,
          fullName: `Owner of ${businessName}`,
          mobileNumber: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
          role: "VENDOR",
          updatedAt: new Date(),
          wallet: {
            create: {
              id: randomUUID(),
              type: "VENDOR",
              balance: Math.floor(Math.random() * 50000),
              lifetimeEarnings: Math.floor(Math.random() * 200000)
            }
          }
        }
      });

      const rating = 4.0 + (Math.random() * 1.0);
      const reviewCount = 10 + Math.floor(Math.random() * 40);

      const vendorProfile = await prisma.vendorprofile.create({
        data: {
          id: vendorProfileId,
          userId: user.id,
          businessName: businessName,
          description: `Award-winning ${subName} services based in ${city.name}. We specialize in high-quality, professional delivery for all types of events.`,
          city: city.name,
          state: city.state,
          address: `${100 + i}, Main Road, ${city.name}`,
          zipCode: "500001",
          latitude: city.lat + (Math.random() - 0.5) * 0.05,
          longitude: city.lng + (Math.random() - 0.5) * 0.05,
          serviceRadius: 50,
          gstNumber: `36AAAAA${1000 + totalVendors}A1Z5`,
          verificationStatus: "APPROVED",
          rating: rating,
          reviewCount: reviewCount,
          totalBookings: reviewCount + 5,
          completionRate: 95 + (Math.random() * 5),
          bankDetails: {
            bankName: "HDFC Bank",
            accountNumber: `50100${Math.floor(1000000000 + Math.random() * 9000000000)}`,
            ifscCode: "HDFC0001234",
            accountHolder: businessName
          },
          vendorsubscription: {
            create: {
              id: randomUUID(),
              planId: planMap["FREE"].id,
              startDate: new Date(),
              endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
              status: "ACTIVE",
              updatedAt: new Date()
            }
          }
        }
      });

      await prisma.vendorscore.create({
        data: {
          id: randomUUID(),
          vendorProfileId: vendorProfile.id,
          ratingScore: rating * 20,
          reviewScore: Math.min(reviewCount, 100),
          finalScore: rating * 10,
          updatedAt: new Date()
        }
      });

      const subTypes = SUB_DATA[subName as keyof typeof SUB_DATA];
      for (let s = 0; s < 1; s++) { // 1 service per vendor for speed
        const typeName = getRandom(subTypes);
        const serviceId = randomUUID();
        const basePrice = BASE_PRICES[subName as keyof typeof BASE_PRICES];

        const service = await prisma.service.create({
          data: {
            id: serviceId,
            vendorProfileId: vendorProfile.id,
            serviceTypeId: serviceTypeMap[typeName].id,
            title: `${typeName} - Professional Service`,
            description: `Elite ${typeName} by ${businessName}. Professional team and top-notch equipment.`,
            pricingType: subName === "Catering" ? "PER_GUEST" : "PACKAGE",
            basePrice: basePrice,
            updatedAt: new Date(),
          }
        });

        for (const pkgTemplate of PACKAGE_TEMPLATES) {
          const pkgId = randomUUID();
          const pkgPrice = basePrice * pkgTemplate.priceMultiplier;

          const pkg = await prisma.renamedpackage.create({
            data: {
              id: pkgId,
              serviceId: service.id,
              name: pkgTemplate.name,
              description: `Premium ${pkgTemplate.name} with extra features.`,
              price: pkgPrice,
              inclusions: JSON.stringify(["Equipment", "Staff", "Setup"]),
            }
          });

          if (service.pricingType === "PER_GUEST") {
            await prisma.pricingrule.create({
              data: {
                id: crypto.randomUUID(),
                packageId: pkg.id,
                minGuests: 10,
                maxGuests: pkgTemplate.guestMultiplier,
                pricePerGuest: basePrice,
                flatFee: 1000
              }
            });
          }
        }

        // Portfolio
        for (let p = 0; p < 5; p++) {
          await prisma.portfolio.create({
            data: {
              id: randomUUID(),
              vendorProfileId: vendorProfile.id,
              serviceId: service.id,
              mediaUrl: `https://picsum.photos/seed/${vendorProfileId}-${p}/800/600`,
              mediaType: "IMAGE",
              title: `Portfolio Item ${p + 1}`
            }
          });
        }
      }

      // Reviews
      for (let r = 0; r < 5; r++) { // 5 reviews per vendor for speed
        await prisma.review.create({
          data: {
            id: randomUUID(),
            userId: getRandom(customerPool).id,
            vendorId: vendorProfile.id,
            rating: Math.floor(rating),
            comment: "Excellent service, highly recommended!",
            updatedAt: new Date()
          }
        });
      }

      totalVendors++;
    }
  }

  // Finalize Reviewers and cleanup
  console.log("👤 Creating main customer...");
  await prisma.user.create({
    data: {
      id: randomUUID(),
      fullName: "Main Customer",
      email: "customer@manaevents.in",
      password: hashedPassword,
      mobileNumber: "9876543210",
      role: "CUSTOMER",
      updatedAt: new Date(),
      wallet: { create: { id: randomUUID(), balance: 10000, type: "USER" } }
    }
  });

  console.log("✅ Mega seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
