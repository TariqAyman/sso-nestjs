import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Create default organization
  const organization = await prisma.organization.upsert({
    where: { name: "Default Organization" },
    update: {},
    create: {
      name: "Default Organization",
      url: "https://default.opensso.com",
      sharedUserApplications: false,
      settings: {},
    },
  });

  console.log("✅ Default organization created:", organization.name);

  // Create admin user
  const adminPassword = await bcrypt.hash("Admin123!@#", 12);
  const admin = await prisma.user.upsert({
    where: {
      organizationId_email: {
        organizationId: organization.id,
        email: "admin@opensso.com",
      },
    },
    update: {},
    create: {
      email: "admin@opensso.com",
      password: adminPassword,
      fullName: "System Administrator",
      role: 1, // 1 = admin
      type: 1, // 1 = system user
      emailVerifiedAt: new Date(),
      status: 1, // 1 = active
      organizationId: organization.id,
    },
  });

  console.log("✅ Admin user created:", admin.email);

  // Create demo user
  const userPassword = await bcrypt.hash("User123!@#", 12);
  const demoUser = await prisma.user.upsert({
    where: {
      organizationId_email: {
        organizationId: organization.id,
        email: "demo@opensso.com",
      },
    },
    update: {},
    create: {
      email: "demo@opensso.com",
      password: userPassword,
      fullName: "Demo User",
      role: 0, // 0 = regular user
      type: 0, // 0 = regular user
      emailVerifiedAt: new Date(),
      status: 1, // 1 = active
      organizationId: organization.id,
    },
  });

  console.log("✅ Demo user created:", demoUser.email);

  // Create default menus
  const menus = [
    {
      id: "dashboard",
      title: "Dashboard",
      url: "/dashboard",
      icon: "dashboard",
      position: 1,
      status: "active" as const,
    },
    {
      id: "sso-applications",
      title: "SSO Applications",
      url: "/sso-applications",
      icon: "apps",
      position: 2,
      status: "active" as const,
    },
    {
      id: "user-management",
      title: "User Management",
      url: "/users",
      icon: "people",
      position: 3,
      status: "active" as const,
      permissions: "admin",
    },
    {
      id: "oauth-connections",
      title: "OAuth Connections",
      url: "/oauth-connections",
      icon: "link",
      position: 4,
      status: "active" as const,
    },
    {
      id: "webhooks",
      title: "Webhooks",
      url: "/webhooks",
      icon: "webhook",
      position: 5,
      status: "active" as const,
    },
    {
      id: "profile-settings",
      title: "Profile Settings",
      url: "/profile",
      icon: "settings",
      position: 6,
      status: "active" as const,
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

  // Create demo SSO application
  const demoApp = await prisma.ssoApplication.upsert({
    where: { clientId: "demo_app_client_id" },
    update: {},
    create: {
      organizationId: organization.id,
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
