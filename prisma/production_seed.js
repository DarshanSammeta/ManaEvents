const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

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

const CATEGORIES_DATA = [
  {
    name: "Photography",
    subcategories: ["Wedding Photography", "Candid Photography", "Pre-Wedding Shoot", "Maternity Shoot", "Event Coverage", "Fashion Photography", "Drone Photography", "Traditional Photography"],
    icon: "camera"
  },
  {
    name: "Videography",
    subcategories: ["Cinematic Wedding Film", "Event Highlights", "Live Streaming", "Corporate Videos", "Teaser & Promos", "YouTube Content", "Documentary Films"],
    icon: "video"
  },
  {
    name: "Catering",
    subcategories: ["South Indian Buffet", "North Indian Special", "Continental Fusion", "Live Food Counters", "Dessert Bars", "Beverage Service", "Executive Lunch", "Wedding Feast"],
    icon: "utensils"
  },
  {
    name: "Decoration",
    subcategories: ["Flower Decoration", "Stage Backdrop", "Theme Decor", "Balloon Art", "Entrance Decor", "Lighting & Ambiance", "Mandap Design", "Seating Arrangements"],
    icon: "palette"
  },
  {
    name: "DJ & Music",
    subcategories: ["Professional DJ", "Live Band", "Classical Music", "Sangeet Orchestra", "Sound & Lighting", "Celebrity DJ", "Unplugged Artists"],
    icon: "music"
  },
  {
    name: "Mehendi",
    subcategories: ["Bridal Mehendi", "Arabic Designs", "Family Mehendi", "Traditional Henna", "Tattoo Style", "Organic Mehendi"],
    icon: "hand"
  },
  {
    name: "Makeup Artist",
    subcategories: ["Bridal Makeup", "Party Makeup", "HD Makeup", "Airbrush Makeup", "Hairstyling", "Saree Draping", "Engagement Look"],
    icon: "sparkles"
  },
  {
    name: "Wedding Planner",
    subcategories: ["Full Wedding Planning", "Partial Coordination", "Destination Wedding", "Budget Management", "Vendor Coordination", "Guest Management"],
    icon: "clipboard-list"
  },
  {
    name: "Event Host",
    subcategories: ["Professional Emcee", "Corporate Host", "Anchor & MC", "Comedian", "Game Coordinator"],
    icon: "mic"
  },
  {
    name: "Venue Booking",
    subcategories: ["Banquet Halls", "Convention Centers", "Garden Venues", "Luxury Hotels", "Outdoor Lawns", "Temple Halls", "Resort Venues"],
    icon: "building"
  }
];

const ADJECTIVES = ["Elite", "Royal", "Sparkle", "Grand", "Magic", "Perfect", "Creative", "Dream", "Classic", "Modern", "Urban", "Pristine", "Golden", "Silver", "Vibrant", "Luxe"];
const NOUNS = ["Events", "Celebrations", "Occasions", "Solutions", "Planners", "Studios", "Kitchen", "Decors", "Sounds", "Vibes", "Delights", "Cakes", "Wheels", "Gifts", "Masters"];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log("🚀 Starting Production Database Reset and Seed...");

  // 1. Preserve Admins
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
  console.log(`🛡️ Found ${admins.length} Admin accounts to preserve.`);

  // 2. Clear Dummy Data (excluding Admins)
  console.log("🧹 Clearing existing test data...");

  await prisma.$executeRawUnsafe("SET session_replication_role = 'replica';");

  const tables = [
    "transaction", "wallet", "payout", "staff", "bookingstatuslog", "bookingitem", "booking",
    "pricingrule", "package", "portfolio", "review", "service", "vendorscore", "vendordocument",
    "recurringavailability", "availability", "vendorSubscription", "subscriptionPlan", "vendorprofile",
    "auditlog", "activitylog", "servicetype", "subcategory", "category", "payment", "payment_split",
    "subscriptionPayment", "cartitem", "cart", "wishlistitem", "wishlist", "messageattachment", "message", "conversationparticipant", "conversation", "notification"
  ];

  for (const table of tables) {
    try {
      if (table === "wallet") {
        const adminIds = admins.map(a => a.id);
        await prisma.wallet.deleteMany({ where: { userId: { notIn: adminIds } } });
      } else {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
      }
    } catch (e) {
      console.log(`⚠️ Skip/Error on ${table}: ${e.message}`);
    }
  }

  // Delete users that are not admins
  const adminEmails = admins.map(a => a.email);
  await prisma.user.deleteMany({ where: { email: { notIn: adminEmails } } });

  await prisma.$executeRawUnsafe("SET session_replication_role = 'origin';");

  const hashedPassword = await bcrypt.hash("Password@123", 10);

  // 3. Seed Catalog
  console.log("📁 Seeding Production Categories and Subcategories...");
  const categoryMap = new Map();
  const serviceTypeMap = new Map();

  for (const catData of CATEGORIES_DATA) {
    const category = await prisma.category.create({
      data: {
        id: uuidv4(),
        name: catData.name,
        description: `Premium ${catData.name} services for all your event needs.`,
        icon: catData.icon
      }
    });
    categoryMap.set(catData.name, category);

    for (const subName of catData.subcategories) {
      const sub = await prisma.subcategory.create({
        data: {
          id: uuidv4(),
          name: subName,
          categoryId: category.id
        }
      });

      const st = await prisma.servicetype.create({
        data: {
          id: uuidv4(),
          name: subName,
          subcategoryId: sub.id,
          description: `Standard ${subName} service type.`
        }
      });
      serviceTypeMap.set(subName, st);
    }
  }

  // 4. Seed Subscription Plans
  console.log("💳 Seeding Subscription Plans...");
  const plans = [
    { name: "FREE", price: 0, listingLimit: 3, rank: 0 },
    { name: "STARTER", price: 999, listingLimit: 10, rank: 1 },
    { name: "PRO", price: 2499, listingLimit: 25, rank: 2 },
    { name: "PREMIUM", price: 4999, listingLimit: -1, rank: 3 }
  ];

  const planObjects = {};
  for (const p of plans) {
    planObjects[p.name] = await prisma.subscriptionPlan.create({
      data: {
        id: uuidv4(),
        name: p.name,
        price: p.price,
        durationMonths: 1,
        features: JSON.stringify(["Basic Support", "Dashboard Access"]),
        rank: p.rank,
        updatedAt: new Date()
      }
    });
  }

  // 5. Seed Customers
  console.log("👤 Creating Customer Pool...");
  const customers = [];
  for (let i = 0; i < 30; i++) {
    const c = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: `customer${i}@manaevents.in`,
        password: hashedPassword,
        fullName: `Customer ${i + 1}`,
        mobileNumber: `88800010${i.toString().padStart(2, '0')}`,
        role: 'CUSTOMER',
        updatedAt: new Date(),
        wallet: { create: { id: uuidv4(), balance: 5000, type: 'USER' } }
      }
    });
    customers.push(c);
  }

  // 6. Seed Vendors (50)
  console.log("🏪 Creating 50 Production Vendors...");
  const vendors = [];
  const subscriptionAllocation = [
    { name: "FREE", count: 20 },
    { name: "STARTER", count: 15 },
    { name: "PRO", count: 10 },
    { name: "PREMIUM", count: 5 }
  ];

  let vendorIndex = 0;
  for (const alloc of subscriptionAllocation) {
    for (let i = 0; i < alloc.count; i++) {
      const city = getRandom(CITIES);
      const categoryName = getRandom(CATEGORIES_DATA).name;
      const bizName = `${getRandom(ADJECTIVES)} ${getRandom(NOUNS)}`;

      const user = await prisma.user.create({
        data: {
          id: uuidv4(),
          email: `vendor${vendorIndex}@manaevents.in`,
          password: hashedPassword,
          fullName: `Owner of ${bizName}`,
          mobileNumber: `99900020${vendorIndex.toString().padStart(2, '0')}`,
          role: 'VENDOR',
          updatedAt: new Date(),
          wallet: { create: { id: uuidv4(), balance: 0, type: 'VENDOR' } }
        }
      });

      const profile = await prisma.vendorprofile.create({
        data: {
          id: uuidv4(),
          userId: user.id,
          businessName: bizName,
          description: `Top-rated ${categoryName} expert in ${city.name}. We provide professional services for weddings, corporate events, and parties.`,
          city: city.name,
          state: city.state,
          address: `${10 + i}, MG Road, ${city.name}`,
          zipCode: "500001",
          latitude: city.lat + (Math.random() - 0.5) * 0.1,
          longitude: city.lng + (Math.random() - 0.5) * 0.1,
          verificationStatus: 'APPROVED',
          rating: 0,
          reviewCount: 0,
          subscription: {
            create: {
              id: uuidv4(),
              planId: planObjects[alloc.name].id,
              startDate: new Date(),
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              status: 'ACTIVE',
              updatedAt: new Date()
            }
          }
        }
      });
      vendors.push(profile);

      // 7. Create Services for each vendor (5-15)
      const serviceCount = 5 + Math.floor(Math.random() * 5); // Reduced count for performance
      const catData = CATEGORIES_DATA.find(c => c.name === categoryName);

      for (let s = 0; s < serviceCount; s++) {
        const subName = getRandom(catData.subcategories);
        const st = serviceTypeMap.get(subName);

        const service = await prisma.service.create({
          data: {
            id: uuidv4(),
            vendorProfileId: profile.id,
            serviceTypeId: st.id,
            title: `${subName} by ${bizName}`,
            description: `High quality ${subName} service with experienced professionals.`,
            basePrice: 5000 + Math.floor(Math.random() * 20000),
            updatedAt: new Date(),
          }
        });

        await prisma.renamedpackage.create({
            data: {
                id: uuidv4(),
                serviceId: service.id,
                name: "Standard Package",
                price: parseFloat(service.basePrice) + 5000,
                description: "Complete service package with setup and coordination.",
                inclusions: JSON.stringify(["Equipment", "Staff", "Consultation"])
            }
        });

        await prisma.portfolio.create({
          data: {
            id: uuidv4(),
            vendorProfileId: profile.id,
            serviceId: service.id,
            mediaUrl: `https://picsum.photos/seed/${service.id}/800/600`,
            mediaType: "IMAGE",
            title: "Gallery Image"
          }
        });
      }
      vendorIndex++;
    }
  }

  // 8. Create Reviews (250)
  console.log("⭐ Generating 250 Reviews...");
  for (let i = 0; i < 250; i++) {
    const vendor = getRandom(vendors);
    const customer = getRandom(customers);
    const rating = 3 + Math.floor(Math.random() * 3);

    await prisma.review.create({
      data: {
        id: uuidv4(),
        userId: customer.id,
        vendorId: vendor.id,
        rating: rating,
        comment: getRandom(["Excellent service!", "Very professional team.", "Highly recommended for weddings.", "On time and great quality.", "Satisfied with the results.", "Decent experience, could be better.", "Amazing attention to detail.", "The best in the city!"]),
        updatedAt: new Date()
      }
    });
  }

  // Update vendor ratings
  console.log("📈 Updating Vendor Ratings...");
  for (const v of vendors) {
    const reviews = await prisma.review.findMany({ where: { vendorId: v.id } });
    if (reviews.length > 0) {
      const avg = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
      await prisma.vendorprofile.update({
        where: { id: v.id },
        data: { rating: avg, reviewCount: reviews.length }
      });
    }
  }

  // 9. Create Bookings (100 Completed, 50 Pending, 25 Cancelled)
  console.log("📅 Generating 175 Sample Bookings...");
  const bookingConfigs = [
    { status: 'EVENT_COMPLETED', count: 100, paymentStatus: 'SUCCESS' },
    { status: 'PENDING', count: 50, paymentStatus: 'PENDING' },
    { status: 'CANCELLED', count: 25, paymentStatus: 'FAILED' }
  ];

  let bNum = 5000;
  for (const config of bookingConfigs) {
    for (let i = 0; i < config.count; i++) {
      const vendor = getRandom(vendors);
      const customer = getRandom(customers);
      const amount = 10000 + Math.floor(Math.random() * 50000);

      await prisma.booking.create({
        data: {
          id: uuidv4(),
          bookingNumber: `ME${bNum++}`,
          customerId: customer.id,
          vendorId: vendor.id,
          status: config.status,
          totalAmount: amount,
          eventDate: new Date(Date.now() + (Math.random() * 60 * 24 * 60 * 60 * 1000)),
          eventLocation: "City Events Center, Main Plaza",
          guestCount: 50 + Math.floor(Math.random() * 500),
          updatedAt: new Date(),
          payment: {
            create: {
              id: uuidv4(),
              amount: amount,
              status: config.paymentStatus,
              updatedAt: new Date(),
              currency: "INR"
            }
          }
        }
      });
    }
  }

  console.log("✅ Production Seed Complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
