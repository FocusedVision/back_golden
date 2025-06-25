import logger from "../utils/logger";
import { BigQuery } from "@google-cloud/bigquery";

import {
  Unit as PrismaUnit,
  Payment as PrismaPayment,
  CustomerTouch as PrismaCustomerTouch,
  BookEntry as PrismaBookEntry,
  Contact as PrismaContact,
  GaEvent as PrismaGaEvent,
  Lead as PrismaLead,
  Lease as PrismaLease,
  Manager as PrismaManager,
  PricingGroup as PrismaPricingGroup,
  SpacesHistorical as PrismaSpacesHistorical,
  UnitTurnover as PrismaUnitTurnover,
} from "@prisma/client";
import Unit from "../models/unit";
import Payment from "../models/payment";
import CustomerTouch from "../models/customerTouch";
import { Decimal } from "@prisma/client/runtime/library";
import BookEntry from "../models/bookEntry";
import Contact from "../models/contact";
import GaEvent from "../models/gaEvent";
import Lead from "../models/lead";
import Lease from "../models/lease";
import Manager from "../models/manager";
import PricingGroup from "../models/pricing";
import SpacesHistorical from "../models/space";
import UnitTurnover from "../models/unitTurnover";

const processDateField = (row: any, field: string): Date | null => {
  if (row[field] && typeof row[field] === "object" && row[field].value) {
    return new Date(row[field].value);
  }
  if (row[field]) {
    return new Date(row[field]);
  }
  return null;
};

const processDecimalField = (row: any, field: string): Decimal | null => {
  if (row[field] !== null && row[field] !== undefined) {
    let value;
    if (typeof row[field] === "object" && row[field].value !== undefined) {
      value = row[field].value;
    } else {
      value = row[field];
    }
    try {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        logger.warn(`Invalid numeric value for field ${field}: ${value}`);
        return null;
      }
      // Round to 2 decimal places and ensure proper decimal point formatting
      const roundedValue = Math.round(numValue * 100) / 100;
      // Convert to string with proper decimal point (not comma) and force US locale
      const formattedValue = roundedValue.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: false,
      });
      return new Decimal(formattedValue);
    } catch (error) {
      logger.warn(
        `Failed to process decimal field ${field} with value ${value}:`,
        error,
      );
      return null;
    }
  }
  return null;
};

const processIntegerField = (row: any, field: string): number | null => {
  if (row[field] !== null && row[field] !== undefined) {
    return parseInt(row[field], 10);
  }
  return null;
};

export class BigQuerySyncService {
  private bigquery: BigQuery;
  private datasetName: string;
  private batchSize: number;

  constructor() {
    if (
      !process.env["BIGQUERY_APPLICATION_CREDENTIALS"] ||
      !process.env["BIGQUERY_PROJECT"]
    ) {
      throw new Error(
        "Required environment variables BIGQUERY_APPLICATION_CREDENTIALS and BIGQUERY_PROJECT must be set",
      );
    }

    this.bigquery = new BigQuery({
      projectId: process.env["BIGQUERY_PROJECT"]!,
      keyFilename: process.env["BIGQUERY_APPLICATION_CREDENTIALS"],
    });
    this.datasetName = "authorized_views";
    this.batchSize = parseInt(
      process.env["BIGQUERY_SYNC_BATCH_SIZE"] || "1000",
      10,
    );
    logger.info("BigQuerySync initialized successfully");
  }

  async executeQuery(operationName: string, queryConfig: any) {
    const startTime = Date.now();
    logger.debug(`Executing ${operationName} query`);

    try {
      const [rows] = await this.bigquery.query(queryConfig);
      const duration = Date.now() - startTime;
      logger.debug(
        `Successfully executed ${operationName} query in ${duration}ms`,
      );
      return rows;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Failed to execute ${operationName} query:`, {
        error: (error as Error).message,
        duration,
        query: queryConfig.query,
      });
      throw new Error(`Query execution failed: ${(error as Error).message}`);
    }
  }

  async saveToDatabase<T>(
    modelName: string,
    modelInstance: any,
    data: T[],
  ): Promise<void> {
    if (!data || data.length === 0) {
      logger.debug(`No ${modelName} data to save`);
      return;
    }

    logger.debug(`Saving ${data.length} ${modelName} to database`);
    try {
      await modelInstance.upsertMany(data);
      logger.info(`Successfully saved ${data.length} ${modelName} to database`);
    } catch (error) {
      logger.error(`Failed to save ${modelName} to database:`, {
        error: (error as Error).message,
        count: data.length,
      });
      throw new Error(`Database save failed: ${(error as Error).message}`);
    }
  }

  async getUnits(): Promise<
    Omit<PrismaUnit, "id" | "createdAt" | "updatedAt">[]
  > {
    const params: any = {};
    const conditions: any[] = [];

    const query = `
            SELECT *
            FROM \`${this.datasetName}.units\`
            ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
        `;

    const rows = await this.executeQuery("getUnits", { query, params });

    // Map BigQuery field names to Prisma schema field names
    const processedRows = rows.map(
      (row: any): Omit<PrismaUnit, "id" | "createdAt" | "updatedAt"> => ({
        facilityId: row.facility_id || null,
        facilityName: row.facility_name || null,
        unitId: row.unit_id,
        unitName: row.unit_name || null,
        unitType: row.unit_type || null,
        unitFeatures: row.unit_features || null,
        pgId: row.pg_id || null,
        pricingGroup: row.pricing_group || null,
        rateManaged: processDecimalField(row, "rate_managed"),
        unitFloorNum: processIntegerField(row, "unit_floor_num"),
        unitBuildingName: row.unit_building_name || null,
        unitWidth: processDecimalField(row, "unit_width"),
        unitDepth: processDecimalField(row, "unit_depth"),
        unitHeight: processDecimalField(row, "unit_height"),
        isLeased: processIntegerField(row, "is_leased"),
        isInsurable: processIntegerField(row, "is_insurable"),
        isRentable: processIntegerField(row, "is_rentable"),
        isOverlocked: processIntegerField(row, "is_overlocked"),
        unitUnrentableReason: row.unit_unrentable_reason || null,
        unitUnrentableNote: row.unit_unrentable_note || null,
        unitKeypadZone: processIntegerField(row, "unit_keypad_zone"),
        unitTimeZone: processIntegerField(row, "unit_time_zone"),
        webRateOverride: processIntegerField(row, "web_rate_override"),
        strikethroughPriceOverride: processIntegerField(
          row,
          "strikethrough_price_override",
        ),
        walkInRateOverride: processIntegerField(row, "walk_in_rate_override"),
      }),
    );

    await this.saveToDatabase("units", Unit, processedRows);
    return processedRows;
  }

  async getPayments(): Promise<
    Omit<PrismaPayment, "id" | "createdAt" | "updatedAt">[]
  > {
    const params: any = {};
    const conditions: any[] = [];

    const query = `
            SELECT *
            FROM \`${this.datasetName}.payments\`
            ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
        `;

    const rows = await this.executeQuery("getPayments", { query, params });
    // Map BigQuery field names to Prisma schema field names
    const processedRows = rows.map(
      (row: any): Omit<PrismaPayment, "id" | "createdAt" | "updatedAt"> => ({
        facilityId: row.facility_id || null,
        facilityName: row.facility_name || null,
        orgId: row.org_id || null,
        contactId: row.contact_id || null,
        contactName: row.contact_name || null,
        paymentDate: processDateField(row, "payment_date"),
        paymentDatetime: processDateField(row, "payment_datetime"),
        paymentAmount: processDecimalField(row, "payment_amount"),
        paymentType: row.payment_type || null,
        paymentStatus: row.payment_status || null,
        paymentMethod: row.payment_method || null,
        paymentCardBrand: row.payment_card_brand || null,
        paymentCardLastFour: row.payment_card_last_four || null,
        paymentCheckNumber: row.payment_check_number || null,
        paymentChannel: row.payment_channel || null,
      }),
    );

    await this.saveToDatabase("payments", Payment, processedRows);
    return processedRows;
  }

  async getCustomerTouches() {
    const params: any = {};
    const conditions: string[] = [];

    const query = `
        SELECT *
        FROM \`${this.datasetName}.customer_touches\`
        ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
        ORDER BY created_at DESC
    `;

    const rows = await this.executeQuery("getCustomerTouches", {
      query,
      params,
    });

    const processedRows = rows.map(
      (row: any): Omit<PrismaCustomerTouch, "id" | "updatedAt"> => ({
        gaSession: row.ga_session || null,
        source: row.source || null,
        gclid: row.gclid || null,
        action: row.action || null,
        createdAt: processDateField(row, "created_at"),
        contactId: row.contact_id || null,
        leaseId: row.lease_id || null,
        leadId: row.lead_id || null,
        orgId: row.org_id || null,
      }),
    );

    await this.saveToDatabase("customer touches", CustomerTouch, processedRows);
    return processedRows;
  }

  async getBookEntries() {
    const params: any = {};
    const conditions: string[] = [];

    const query = `
        SELECT *
        FROM \`${this.datasetName}.book_entries\`
        ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
        ORDER BY entry_date_time DESC
    `;

    const rows = await this.executeQuery("getBookEntries", {
      query,
      params,
    });

    const processedRows = rows.map(
      (row: any): Omit<PrismaBookEntry, "id" | "updatedAt"> => ({
        facility: row.facility || null,
        orgId: row.org_id || null,
        entryDateTime: processDateField(row, "entry_date_time") || new Date(),
        txnId: row.txn_id || null,
        type: row.type || null,
        amount: processDecimalField(row, "amount"),
        book: row.book || null,
        leaseId: row.lease_id || null,
        unit: row.unit || null,
        unitId: row.unit_id || null,
        contactId: row.contact_id || null,
        contactName: row.contact_name || null,
        accrualStart: processDateField(row, "accrual_start"),
        explanationText: row.explanation_text || null,
        entryNum: row.entry_num || null,
        appliesTo: row.applies_to || null,
        arEntryCategory: row.ar_entry_category || null,
        explanation: row.explanation || null,
        taxCategory: row.tax_category || null,
        taxExempt: row.tax_exempt || null,
        amtRevenue: processDecimalField(row, "amt_revenue"),
        amtPayment: processDecimalField(row, "amt_payment"),
        amtAsset: processDecimalField(row, "amt_asset"),
        amtLiability: processDecimalField(row, "amt_liability"),
        amtTransfer: processDecimalField(row, "amt_transfer"),
        createdAt: processDateField(row, "created_at") || new Date(),
      }),
    );

    await this.saveToDatabase("book entries", BookEntry, processedRows);
    return processedRows;
  }

  async getContacts() {
    const params: any = {};
    const conditions: string[] = [];

    const query = `
    SELECT *
    FROM \`${this.datasetName}.contact\`
    ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
`;

    const rows = await this.executeQuery("getContacts", { query, params });

    const processedRows = rows.map(
      (row: any): Omit<PrismaContact, "id" | "updatedAt"> => ({
        contactId: row.contact_id || null,
        orgId: row.org_id || null,
        name: row.name || null,
        address: row.address || null,
        address2: row.address2 || null,
        companyName: row.company_name || null,
        city: row.city || null,
        state: row.state || null,
        country: row.country || null,
        zip: row.zip || null,
        email: row.email || null,
        phone: row.phone || null,
        createdAt: processDateField(row, "created_at") || new Date(),
        dateOfBirth: processDateField(row, "date_of_birth") || null,
        leadId: row.lead_id || null,
        leadSource: row.lead_source || null,
      }),
    );

    await this.saveToDatabase("contacts", Contact, processedRows);
    return processedRows;
  }

  async getGAEvents() {
    const params: any = {};
    const conditions: string[] = [];

    const query = `
      SELECT *
      FROM \`${this.datasetName}.ga_events\`
      ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
    `;

    const rows = await this.executeQuery("getGAEvents", { query, params });

    const processedRows = rows.map(
      (row: any): Omit<PrismaGaEvent, "id" | "createdAt" | "updatedAt"> => ({
        orgId: row.org_id || null,
        gaSessionId: row.ga_session_id || null,
        eventDate: processDateField(row, "event_date") || new Date(),
        eventName: row.event_name || null,
        eventTimestamp: row.event_timestamp || null,
        hostname: row.host_name || null,
        deviceCategory: row.device_category || null,
        geoCity: row.geo_city || null,
        geoCountry: row.geo_country || null,
        geoContinent: row.geo_continent || null,
        geoRegion: row.geo_region || null,
        geoMetro: row.geo_metro || null,
        trafficSourceName: row.traffic_source_name || null,
        trafficSourceSource: row.traffic_source_source || null,
        trafficSourceMedium: row.traffic_source_medium || null,
        ecommerceTransactionId: row.ecommerce_transaction_id || null,
        ecommercePurchaseRevenue: row.ecommerce_purchase_revenue || null,
      }),
    );

    await this.saveToDatabase("GA events", GaEvent, processedRows);
    return processedRows;
  }

  async getLeads() {
    const params: any = {};
    const conditions: string[] = [];

    const query = `
      SELECT *
      FROM \`${this.datasetName}.leads\`
      ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
    `;

    const rows = await this.executeQuery("getLeads", { query, params });

    const processedRows = rows.map(
      (row: any): Omit<PrismaLead, "id" | "createdAt" | "updatedAt"> => ({
        leadId: row.lead_id || null,
        ageOfLeadMinutes: processIntegerField(row, "age_of_lead_minutes"),
        status: row.status || null,
        contactId: row.contact_id || null,
        contactName: row.contact_name || null,
        facilityId: row.facility_id || null,
        facilityName: row.facility_name || null,
        pgId: row.pg_id || null,
        pgName: row.pg_name || null,
        pgFeatures: row.pg_features || null,
        createdBy: row.created_by || null,
        orgId: row.org_id || null,
        convertedBy: row.converted_by || null,
        convertedDatetime: processDateField(row, "converted_datetime") || null,
        timeToConvert: processIntegerField(row, "time_to_convert"),
        timeToUnqualified: processIntegerField(row, "time_to_unqualified"),
        convertedLeaseId: row.converted_lease_id || null,
        leadSource: row.lead_source || null,
        firstTouchSource: row.first_touch_source || null,
        gaSource: row.ga_source || null,
        source: row.source || null,
        firstTouchAction: row.first_touch_action || null,
        gaSession: row.ga_session || null,
        gaSessionId: row.ga_session_id || null,
      }),
    );

    await this.saveToDatabase("leads", Lead, processedRows);
    return processedRows;
  }

  async getLeases() {
    const params: any = {};
    const conditions: string[] = [];

    const query = `
    SELECT *
    FROM \`${this.datasetName}.leases\`
    ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
  `;

    const rows = await this.executeQuery("getLeases", { query, params });

    const processedRows = rows.map(
      (row: any): Omit<PrismaLease, "id" | "createdAt" | "updatedAt"> => ({
        facilityId: row.facility_id || null,
        facilityName: row.facility_name || null,
        orgId: row.org_id || null,
        leaseId: row.lease_id || null,
        unitName: row.unit_name || null,
        unitId: row.unit_id || null,
        isActive: row.is_active || null,
        leaseCreatedBy: row.lease_created_by || null,
        leaseStarted: processDateField(row, "lease_started") || null,
        leaseEnded: processDateField(row, "lease_ended") || null,
        leaseRentOriginal: processDecimalField(row, "lease_rent_original"),
        leaseRentCurrent: processDecimalField(row, "lease_rent_current"),
        leaseRentNext: processDecimalField(row, "lease_rent_next"),
        leaseRentNextChgDate:
          processDateField(row, "lease_rent_next_chg_date") || null,
        leaseRentLastChgDate:
          processDateField(row, "lease_rent_last_chg_date") || null,
        leaseAllDiscounts: row.lease_all_discounts || null,
        isLeasePaid: row.is_lease_paid || null,
        statusLateSinceDate:
          processDateField(row, "status_late_since_date") || null,
        statusPaidThroughDate:
          processDateField(row, "status_paid_through_date") || null,
        statusPaidOnDate: processDateField(row, "status_paid_on_date") || null,
        isNeedsOverlock: row.is_needs_overlock || null,
        isInAuction: row.is_in_auction || null,
        isAutopayEnabled: row.is_autopay_enabled || null,
        insPremium: processDecimalField(row, "ins_premium"),
        insCoverageLevel:
          processDecimalField(row, "ins_coverage_level") || null,
        accessCode: row.access_code || null,
        isAccessCodeEnabled: row.is_access_code_enabled || null,
        contactId: row.contact_id || null,
        contactPinnedNote: row.contact_pinned_note || null,
        isMilitary: row.is_military || null,
        contactName: row.contact_name || null,
        contactCompanyName: row.contact_company_name || null,
        contactEmail: row.contact_email || null,
        contactPhone: row.contact_phone || null,
        contactAddress1: row.contact_address_1 || null,
        contactAddress2: row.contact_address_2 || null,
        contactCity: row.contact_city || null,
        contactState: row.contact_state || null,
        contactZip: row.contact_zip || null,
        leaseLifetimePayments: processDecimalField(
          row,
          "lease_lifetime_payments",
        ),
        balanceAr: processDecimalField(row, "balance_ar"),
        balanceDeposit: processDecimalField(row, "balance_deposit"),
        balancePrepaid: processDecimalField(row, "balance_prepaid"),
      }),
    );

    await this.saveToDatabase("leases", Lease, processedRows);
    return processedRows;
  }

  async getManagers() {
    const params: any = {};
    const conditions: string[] = [];

    const query = `
    SELECT *
    FROM \`${this.datasetName}.managers\`
    ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
  `;

    const rows = await this.executeQuery("getManagers", { query, params });

    const processedRows = rows.map(
      (row: any): Omit<PrismaManager, "id" | "createdAt" | "updatedAt"> => ({
        managerId: row.manager_id || null,
        managerName: row.manager_name || null,
        managerUsername: row.manager_username || null,
        managerEmail: row.manager_email || null,
        managerPhone: row.manager_phone || null,
        managerPermissions: row.manager_permissions || null,
      }),
    );

    await this.saveToDatabase("managers", Manager, processedRows);
    return processedRows;
  }

  async getPricingGroups() {
    const params: any = {};
    const conditions: string[] = [];

    const query = `
            SELECT *
            FROM \`${this.datasetName}.pricing_group\`
            ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
        `;

    const rows = await this.executeQuery("getPricingGroups", { query, params });

    const processedRows = rows.map(
      (row: any): Omit<PrismaPricingGroup, "id" | "createdAt" | "updatedAt"> => ({
        pgId: row.pg_id || null,
        name: row.name || null,
        price: processDecimalField(row, "price"),
        facilityId: row.facility_id || null,
        width: processDecimalField(row, "width"),
        height: processDecimalField(row, "height"),
        depth: processDecimalField(row, "depth"),
        features: row.features || null,
      }),
    );

    await this.saveToDatabase("pricing_group", PricingGroup, processedRows);
    return processedRows;
  }

  async getSpacesHistorical() {
    const params: any = {};
    const conditions: string[] = [];

    const query = `
            SELECT *
            FROM \`${this.datasetName}.spaces_historical\`
            ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
        `;

    const rows = await this.executeQuery("getSpacesHistorical", { query, params });

    const processedRows = rows.map(
      (row: any): Omit<PrismaSpacesHistorical, "id" | "createdAt" | "updatedAt"> => ({
        date: processDateField(row, "date") || new Date(),
        orgId: row.org_id || null,
        unitId: row.unit_id || null,
        unitName: row.unit_name || null,
        unitDescription: row.unit_description || null,
        facilityName: row.facility_name || null,
        facilityId: row.facility_id || null,
        facilityAddress: row.facility_address || null,
        buildingName: row.building_name || null,
        isOccupied: processIntegerField(row, "is_occupied"),
        isUnrentable: row.is_unrentable || null,
        unrentableReason: row.unrentable_reason || null,
        unrentableReasonNote: row.unrentable_reason_note || null,
        width: processDecimalField(row, "width"),
        height: processDecimalField(row, "height"),
        depth: processDecimalField(row, "depth"),
        isOverlocked: row.is_overlocked || null,
        pricingGroupName: row.pricing_group_name || null,
        streetRate: processDecimalField(row, "street_rate"),
        pgId: row.pg_id || null,
        leaseId: row.lease_id || null,
        occRate: processDecimalField(row, "occ_rate"),
        occStartDt: processDateField(row, "occ_start_dt") || null,
        occTenantId: row.occ_tenant_id || null,
        occTenantName: row.occ_tenant_name || null,
        isAutopayEnabled: row.is_autopay_enabled || null,
        isInsuranceActive: row.is_insurance_active || null,
        contactId: row.contact_id || null,
      }),
    );

    await this.saveToDatabase("spaces_historical", SpacesHistorical, processedRows);
    return processedRows;
  }

  async getUnitTurnover() {
    const params: any = {};
    const conditions: string[] = [];

    const query = `
            SELECT *
            FROM \`${this.datasetName}.unit_turnover\`
            ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
        `;

    const rows = await this.executeQuery("getUnitTurnover", { query, params });

    const processedRows = rows.map(
      (row: any): Omit<PrismaUnitTurnover, "id" | "createdAt" | "updatedAt"> => ({
        moveType: row.move_type || null,
        moveDate: processDateField(row, "move_date") || new Date(),
        facilityId: row.facility_id || null,
        facilityName: row.facility_name || null,
        unitId: row.unit_id || null,
        unitName: row.unit_name || null,
        unitType: row.unit_type || null,
        unitFeatures: row.unit_features || null,
        unitFloorNum: processIntegerField(row, "unit_floor_num"),
        unitBuildingName: row.unit_building_name || null,
        unitWidth: processDecimalField(row, "unit_width"),
        unitDepth: processDecimalField(row, "unit_depth"),
        unitHeight: processDecimalField(row, "unit_height"),
        leaseId: row.lease_id || null,
        leaseCreatedBy: row.lease_created_by || null,
        leaseRent: processDecimalField(row, "lease_rent"),
        leaseStartDate: processDateField(row, "lease_start_date") || null,
        leaseEndDate: processDateField(row, "lease_end_date") || null,
        leaseCreatedByTransfer: row.lease_created_by_transfer || null,
        leaseTerminatedByTransfer: typeof row.lease_terminated_by_transfer === 'boolean' 
          ? row.lease_terminated_by_transfer.toString() 
          : row.lease_terminated_by_transfer || null,
        leaseDaysRented: processIntegerField(row, "lease_days_rented"),
        leaseDiscountsApplied: row.lease_discounts_applied || null,
        insPremium: processDecimalField(row, "ins_premium"),
        insCoverageLevel: processDecimalField(row, "ins_coverage_level"),
        contactId: row.contact_id || null,
        contactName: row.contact_name || null,
        contactEmail: row.contact_email || null,
        contactPhone: row.contact_phone || null,
        pgId: row.pg_id || null,
        pgName: row.pg_name || null,
        pgStandardRate: processDecimalField(row, "pg_standard_rate"),
      }),
    );

    await this.saveToDatabase("unit_turnover", UnitTurnover, processedRows);
    return processedRows;
  }
}
