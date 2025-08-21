import { Injectable } from "@nestjs/common";
import { TenantService } from "../tenant/tenant.service";
import { UserService } from "../user/user.service";
import { Tenant, User } from "@prisma/client";

export interface SamlUser {
  nameID: string;
  sessionIndex: string;
  attributes: any;
}

@Injectable()
export class SamlService {
  constructor(
    private tenantService: TenantService,
    private userService: UserService
  ) {}

  async getLoginUrl(tenant: Tenant): Promise<string> {
    // For now, return a simple login URL that redirects to the IdP
    const returnUrl = encodeURIComponent(
      `${process.env.APP_URL || "http://localhost:3000"}/saml/${
        tenant.uuid
      }/acs`
    );
    return `${tenant.loginUrl}?RelayState=${returnUrl}`;
  }

  async getLogoutUrl(tenant: Tenant): Promise<string> {
    // Simple logout URL
    if (tenant.logoutUrl) {
      return tenant.logoutUrl;
    }
    return `${process.env.APP_URL || "http://localhost:3000"}/auth/logout`;
  }

  async createOrUpdateUser(samlUser: SamlUser): Promise<User> {
    // Try to find existing user by SAML user ID
    let user = await this.userService.findBySamlUserId(samlUser.nameID);

    if (!user) {
      // Try to find by email attribute
      const email =
        samlUser.attributes.email ||
        samlUser.attributes[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
        ];
      if (email) {
        user = await this.userService.findByEmail(email);
      }
    }

    const userData = {
      email:
        samlUser.attributes.email ||
        samlUser.attributes[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
        ] ||
        samlUser.nameID,
      firstName:
        samlUser.attributes.firstName ||
        samlUser.attributes[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"
        ],
      lastName:
        samlUser.attributes.lastName ||
        samlUser.attributes[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"
        ],
      samlUserId: samlUser.nameID,
      samlAttributes: samlUser.attributes,
    };

    if (user) {
      // Update existing user
      return this.userService.update(user.id, userData);
    } else {
      // Create new user
      return this.userService.create(userData);
    }
  }

  generateMetadata(tenant: Tenant): string {
    const entityID = `${process.env.APP_URL || "http://localhost:3000"}/saml/${
      tenant.uuid
    }/metadata`;
    const acsUrl = `${process.env.APP_URL || "http://localhost:3000"}/saml/${
      tenant.uuid
    }/acs`;
    const slsUrl = `${process.env.APP_URL || "http://localhost:3000"}/saml/${
      tenant.uuid
    }/sls`;

    return `<?xml version="1.0"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"
                     entityID="${entityID}">
  <md:SPSSODescriptor AuthnRequestsSigned="false" WantAssertionsSigned="false"
                      protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified</md:NameIDFormat>
    <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                                 Location="${acsUrl}"
                                 index="1" />
    <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                           Location="${slsUrl}" />
  </md:SPSSODescriptor>
</md:EntityDescriptor>`;
  }
}
