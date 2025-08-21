import { Command } from "commander";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module";
import { TenantService } from "../src/tenant/tenant.service";

const program = new Command();

async function createApplication() {
  const app = await NestFactory.createApplicationContext(AppModule);
  return app;
}

program
  .name("tenant-cli")
  .description("CLI to manage SSO tenants")
  .version("1.0.0");

program
  .command("create")
  .description("Create a new tenant")
  .requiredOption("-k, --key <key>", "Tenant key")
  .requiredOption("-e, --entityId <entityId>", "Entity ID")
  .requiredOption("-l, --loginUrl <loginUrl>", "Login URL")
  .option("-o, --logoutUrl <logoutUrl>", "Logout URL")
  .requiredOption("-c, --cert <cert>", "x509 certificate")
  .option("-m, --metadata <metadata>", "Metadata JSON", "{}")
  .action(async (options) => {
    const app = await createApplication();
    const tenantService = app.get(TenantService);

    try {
      const tenant = await tenantService.create({
        key: options.key,
        entityId: options.entityId,
        loginUrl: options.loginUrl,
        logoutUrl: options.logoutUrl,
        x509cert: options.cert,
        metadata: JSON.parse(options.metadata),
      });

      console.log(`✅ Tenant created successfully!`);
      console.log(`ID: ${tenant.id}`);
      console.log(`UUID: ${tenant.uuid}`);
      console.log(`Key: ${tenant.key}`);
      console.log("");
      console.log("🔗 SAML URLs:");
      console.log(
        `Metadata: ${process.env.APP_URL || "http://localhost:3000"}/saml/${
          tenant.uuid
        }/metadata`
      );
      console.log(
        `ACS URL: ${process.env.APP_URL || "http://localhost:3000"}/saml/${
          tenant.uuid
        }/acs`
      );
      console.log(
        `Login URL: ${process.env.APP_URL || "http://localhost:3000"}/saml/${
          tenant.uuid
        }/login`
      );
      console.log(
        `Logout URL: ${process.env.APP_URL || "http://localhost:3000"}/saml/${
          tenant.uuid
        }/logout`
      );
    } catch (error) {
      console.error("❌ Error creating tenant:", error.message);
    } finally {
      await app.close();
    }
  });

program
  .command("list")
  .description("List all tenants")
  .action(async () => {
    const app = await createApplication();
    const tenantService = app.get(TenantService);

    try {
      const tenants = await tenantService.findAll();

      if (tenants.length === 0) {
        console.log("No tenants found.");
        return;
      }

      console.log("📋 Tenants:");
      console.table(
        tenants.map((t) => ({
          ID: t.id,
          UUID: t.uuid,
          Key: t.key,
          "Entity ID": t.entityId,
          "Login URL": t.loginUrl,
          Active: t.isActive ? "✅" : "❌",
          Created: t.createdAt.toISOString().split("T")[0],
        }))
      );
    } catch (error) {
      console.error("❌ Error listing tenants:", error.message);
    } finally {
      await app.close();
    }
  });

program
  .command("delete")
  .description("Delete a tenant")
  .requiredOption("-i, --id <id>", "Tenant ID")
  .action(async (options) => {
    const app = await createApplication();
    const tenantService = app.get(TenantService);

    try {
      await tenantService.remove(parseInt(options.id));
      console.log(`✅ Tenant ${options.id} deleted successfully!`);
    } catch (error) {
      console.error("❌ Error deleting tenant:", error.message);
    } finally {
      await app.close();
    }
  });

program
  .command("show")
  .description("Show tenant details")
  .requiredOption("-u, --uuid <uuid>", "Tenant UUID")
  .action(async (options) => {
    const app = await createApplication();
    const tenantService = app.get(TenantService);

    try {
      const tenant = await tenantService.findByUuid(options.uuid);

      console.log("🏢 Tenant Details:");
      console.log(`ID: ${tenant.id}`);
      console.log(`UUID: ${tenant.uuid}`);
      console.log(`Key: ${tenant.key}`);
      console.log(`Entity ID: ${tenant.entityId}`);
      console.log(`Login URL: ${tenant.loginUrl}`);
      console.log(`Logout URL: ${tenant.logoutUrl || "Not set"}`);
      console.log(`Active: ${tenant.isActive ? "✅" : "❌"}`);
      console.log(`Created: ${tenant.createdAt}`);
      console.log(`Updated: ${tenant.updatedAt}`);
      console.log("");
      console.log("🔗 SAML URLs:");
      console.log(
        `Metadata: ${process.env.APP_URL || "http://localhost:3000"}/saml/${
          tenant.uuid
        }/metadata`
      );
      console.log(
        `ACS URL: ${process.env.APP_URL || "http://localhost:3000"}/saml/${
          tenant.uuid
        }/acs`
      );
      console.log(
        `Login URL: ${process.env.APP_URL || "http://localhost:3000"}/saml/${
          tenant.uuid
        }/login`
      );
      console.log(
        `Logout URL: ${process.env.APP_URL || "http://localhost:3000"}/saml/${
          tenant.uuid
        }/logout`
      );
    } catch (error) {
      console.error("❌ Error finding tenant:", error.message);
    } finally {
      await app.close();
    }
  });

program.parse(process.argv);
