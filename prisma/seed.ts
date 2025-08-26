import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Create admin user
  const adminPassword = await bcrypt.hash("Admin123!@#", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@opensso.com" },
    update: {},
    create: {
      email: "admin@opensso.com",
      password: adminPassword,
      fullName: "System Administrator",
      role: "admin",
      verified: true,
      verifiedAt: new Date(),
      status: "active",
    },
  });

  console.log("✅ Admin user created:", admin.email);

  // Create demo user
  const userPassword = await bcrypt.hash("User123!@#", 12);
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@opensso.com" },
    update: {},
    create: {
      email: "demo@opensso.com",
      password: userPassword,
      fullName: "Demo User",
      role: "user",
      verified: true,
      verifiedAt: new Date(),
      status: "active",
    },
  });

  console.log("✅ Demo user created:", demoUser.email);

  // Create default menus
  const menus = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: "dashboard",
      sortOrder: 1,
      status: "active",
    },
    {
      title: "SSO Applications",
      url: "/sso-applications",
      icon: "apps",
      sortOrder: 2,
      status: "active",
    },
    {
      title: "User Management",
      url: "/users",
      icon: "people",
      sortOrder: 3,
      status: "active",
      permissions: "admin",
    },
    {
      title: "OAuth Connections",
      url: "/oauth-connections",
      icon: "link",
      sortOrder: 4,
      status: "active",
    },
    {
      title: "Webhooks",
      url: "/webhooks",
      icon: "webhook",
      sortOrder: 5,
      status: "active",
    },
    {
      title: "Profile Settings",
      url: "/profile",
      icon: "settings",
      sortOrder: 6,
      status: "active",
    },
  ];

  for (const menu of menus) {
    const existingMenu = await prisma.menu.findFirst({
      where: { title: menu.title },
    });

    if (!existingMenu) {
      await prisma.menu.create({
        data: menu,
      });
    }
  }

  console.log("✅ Default menus created");

  // Create sample FAQs
  const faqs = [
    {
      question: "What is Single Sign-On (SSO)?",
      answer:
        "Single Sign-On (SSO) is an authentication process that allows users to access multiple applications with one set of login credentials.",
      category: "General",
      sortOrder: 1,
      status: "active",
    },
    {
      question: "How do I create a new SSO application?",
      answer:
        'Navigate to SSO Applications in the dashboard, click "Add New Application", and follow the setup wizard to configure your application.',
      category: "Applications",
      sortOrder: 2,
      status: "active",
    },
    {
      question: "How do I enable two-factor authentication?",
      answer:
        "Go to your Profile Settings, find the Security section, and enable Two-Factor Authentication. You will need an authenticator app to complete the setup.",
      category: "Security",
      sortOrder: 3,
      status: "active",
    },
    {
      question: "What OAuth providers are supported?",
      answer:
        "We support Google, GitHub, Facebook, Twitter/X, and Microsoft OAuth providers for social login integration.",
      category: "OAuth",
      sortOrder: 4,
      status: "active",
    },
  ];

  for (const faq of faqs) {
    const existingFaq = await prisma.faq.findFirst({
      where: { question: faq.question },
    });

    if (!existingFaq) {
      await prisma.faq.create({
        data: faq,
      });
    }
  }

  console.log("✅ Sample FAQs created");

  // Create demo SSO application
  const demoApp = await prisma.ssoApplication.upsert({
    where: { clientId: "demo_app_client_id" },
    update: {},
    create: {
      userId: admin.id,
      applicationName: "Demo Application",
      applicationUrl: "https://demo.opensso.com",
      clientId: "demo_app_client_id",
      clientSecret: "demo_app_client_secret_change_this",
      redirectUri: "https://demo.opensso.com/auth/callback",
      scope: "read write profile email",
      status: "active",
      allowedOrigins: "https://demo.opensso.com,http://localhost:3000",
      description: "Demo application for testing SSO integration",
      tokenExpirationTime: 3600,
      refreshTokenEnabled: true,
    },
  });

  console.log("✅ Demo SSO application created:", demoApp.applicationName);

  console.log("🌱 Database seeding completed successfully!");
  console.log("");
  console.log("📝 Default accounts created:");
  console.log("   Admin: admin@opensso.com / Admin123!@#");
  console.log("   Demo User: demo@opensso.com / User123!@#");
  console.log("");
  console.log("🔧 Demo SSO Application:");
  console.log("   Client ID: demo_app_client_id");
  console.log("   Client Secret: demo_app_client_secret_change_this");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
