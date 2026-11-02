// Generated from the supplied Django OpenAPI schema. Do not edit by hand.
export type AccessLevelEnum = "view" | "record" | "manage";
export type AnchorEnum =
  "sowing" | "stage_start" | "stage_end" | "previous_item";
export type AreaSourceEnum = "entered" | "drawn";
export interface Asset {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  asset_class?: AssetClassEnum;
  name?: string;
  code?: string;
  description?: string;
  status: AssetStatusEnum;
  acquired_on?: string | null;
  retired_on?: string | null;
  attributes?: unknown;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  home_location?: string | null;
}
export interface AssetCapitalProfile {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  in_service_date: string;
  acquisition_cost?: string;
  capital_additions_total: string;
  salvage_value?: string;
  expected_life_hours?: string;
  expected_life_years?: string;
  notes?: string;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  asset: string;
}
export type AssetClassEnum =
  "space" | "machine" | "person" | "stock" | "living" | "flow";
export interface AssetCostRuleAssignment {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  role?: RoleEnum;
  effective_from: string;
  effective_to?: string | null;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  asset: string;
  cost_rule: string;
}
export interface AssetCostRuleAssignmentRequest {
  role?: RoleEnum;
  effective_from: string;
  effective_to?: string | null;
  asset: string;
  cost_rule: string;
}
export interface AssetDepreciationAssignment {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  effective_from: string;
  effective_to?: string | null;
  base_book_value?: string;
  remaining_life_hours?: string;
  remaining_life_years?: string;
  reason?: string;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  asset: string;
  policy: string;
}
export interface AssetRequest {
  asset_class?: AssetClassEnum;
  name?: string;
  code?: string;
  description?: string;
  acquired_on?: string | null;
  retired_on?: string | null;
  attributes?: unknown;
  home_location?: string | null;
}
export type AssetStatusEnum = "active" | "maintenance" | "retired";
export interface AssetValuation {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  as_of_date: string;
  value?: string;
  basis?: string;
  components?: unknown;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  asset: string;
}
export interface Attachment {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  file: string;
  original_name?: string;
  content_type?: string;
  size?: number;
  kind?: AttachmentKindEnum;
  taken_at?: string | null;
  geotag?: Record<string, unknown> | null;
  target_type?: string;
  target_id: string;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  uploaded_by: string;
}
export type AttachmentKindEnum = "photo" | "bill" | "certificate" | "other";
export interface AuditLog {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  command_name?: string;
  target_type?: string;
  target_id?: string | null;
  payload?: unknown;
  result?: AuditLogResultEnum;
  ip_address?: string;
  user_agent?: string;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  user?: string | null;
}
export type AuditLogResultEnum = "success" | "rejected";
export interface AvailabilityWindow {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  kind?: AvailabilityWindowKindEnum;
  window: Record<string, unknown>;
  capacity_hours?: string;
  recurrence_rule?: string;
  reason?: string;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  asset: string;
}
export type AvailabilityWindowKindEnum =
  "shift" | "downtime" | "leave" | "maintenance";
export interface AvailabilityWindowRequest {
  kind?: AvailabilityWindowKindEnum;
  window: Record<string, unknown>;
  capacity_hours?: string;
  recurrence_rule?: string;
  reason?: string;
  asset: string;
}
export type BasisKindEnum = "hours" | "days" | "area" | "other";
export interface Block {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  code?: string;
  name?: string;
  area_value?: string;
  area_m2: string;
  geometry: Record<string, unknown> | null;
  area_source?: AreaSourceEnum;
  centroid: Record<string, unknown> | null;
  soil_type?: string;
  status?: BlockStatusEnum;
  notes?: string;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  parent?: string | null;
  area_unit: string;
}
export interface BlockAccess {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  access_level?: AccessLevelEnum;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  membership: string;
  block: string;
}
export interface BlockAccessRequest {
  access_level?: AccessLevelEnum;
  membership: string;
  block: string;
}
export interface BlockBoundaryRevision {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  geometry: Record<string, unknown>;
  area_m2: string;
  source?: BlockBoundaryRevisionSourceEnum;
  effective_from: string;
  note?: string;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  block: string;
}
export type BlockBoundaryRevisionSourceEnum = "drawn" | "imported" | "gps";
export interface BlockRequest {
  code?: string;
  name?: string;
  area_value?: string;
  area_source?: AreaSourceEnum;
  soil_type?: string;
  status?: BlockStatusEnum;
  notes?: string;
  parent?: string | null;
  area_unit: string;
}
export type BlockStatusEnum = "active" | "fallow" | "retired";
export type BucketEnum = "operation" | "holding" | "idle" | "overhead";
export interface CalendarTemplate {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  name?: string;
  version_no?: number;
  region_note?: string;
  is_active?: boolean;
  created_by: string | null;
  updated_by: string | null;
  farm: string | null;
  crop: string;
  variety?: string | null;
  stage_model: string;
}
export interface CalendarTemplateItem {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  label?: string;
  anchor?: AnchorEnum;
  offset_days_min?: number;
  offset_days_max?: number;
  repeat_every_days?: number | null;
  repeat_max?: number;
  is_optional?: boolean;
  notes?: string;
  created_by: string | null;
  updated_by: string | null;
  farm: string | null;
  template: string;
  event_type: string;
  stage?: string | null;
}
export interface CalendarTemplateItemRequest {
  label?: string;
  anchor?: AnchorEnum;
  offset_days_min?: number;
  offset_days_max?: number;
  repeat_every_days?: number | null;
  repeat_max?: number;
  is_optional?: boolean;
  notes?: string;
  template: string;
  event_type: string;
  stage?: string | null;
}
export interface CalendarTemplateRequest {
  name?: string;
  version_no?: number;
  region_note?: string;
  is_active?: boolean;
  crop: string;
  variety?: string | null;
  stage_model: string;
}
export type ChannelEnum = "in_app" | "email";
export interface ComplianceCheck {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  check_code?: string;
  result?: ComplianceCheckResultEnum;
  message?: string;
  evaluated_at: string;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  event: string;
  sub_event?: string | null;
}
export type ComplianceCheckResultEnum = "pass" | "warn" | "block";
export interface ComplianceOverride {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  reason?: string;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  compliance_check: string;
  overridden_by: string;
}
export interface ConfigurationHistory {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  target_type?: string;
  target_id: string;
  before?: unknown;
  after?: unknown;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
}
export interface CostAllocation {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  bucket?: BucketEnum;
  share_fraction?: string;
  amount?: string;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  cost_record: string;
  crop_cycle?: string | null;
  purpose_tag?: string | null;
  event_target?: string | null;
}
export type CostBucketEnum = "operation" | "holding" | "overhead" | "none";
export type CostNatureEnum =
  | "consumption"
  | "machine_use"
  | "depreciation"
  | "labour"
  | "flow"
  | "holding"
  | "loss";
export interface CostRecord {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  cost_nature?: CostNatureEnum;
  basis_qty?: string;
  rate_used?: string;
  amount?: string;
  rule_version_no?: number | null;
  occurred_on: string;
  is_imputed?: boolean;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  sub_event: string;
  event: string;
  basis_unit: string;
  rule?: string | null;
  reversal_of?: string | null;
}
export interface CostRule {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  code?: string;
  name?: string;
  rule_type?: RuleTypeEnum;
  params?: unknown;
  version_no?: number;
  effective_from: string;
  effective_to?: string | null;
  is_active?: boolean;
  created_by: string | null;
  updated_by: string | null;
  farm: string | null;
}
export interface CostRuleRequest {
  code?: string;
  name?: string;
  rule_type?: RuleTypeEnum;
  params?: unknown;
  version_no?: number;
  effective_from: string;
  effective_to?: string | null;
  is_active?: boolean;
}
export interface Counterparty {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  name?: string;
  kind?: CounterpartyKindEnum;
  phone?: string;
  address?: string;
  notes?: string;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
}
export type CounterpartyKindEnum =
  | "supplier"
  | "buyer"
  | "landlord"
  | "lender"
  | "labour_contractor"
  | "government"
  | "other";
export interface CounterpartyRequest {
  name?: string;
  kind?: CounterpartyKindEnum;
  phone?: string;
  address?: string;
  notes?: string;
}
export interface Crop {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  name?: string;
  scientific_name?: string;
  category?: string;
  lifecycle?: LifecycleEnum;
  is_active?: boolean;
  created_by: string | null;
  updated_by: string | null;
  farm: string | null;
  default_yield_unit: string;
}
export interface CropCycle {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  code?: string;
  name?: string;
  status: CropCycleStatusEnum;
  planned_sowing_date: string;
  actual_sowing_date?: string | null;
  expected_harvest_start?: string | null;
  expected_harvest_end: string;
  actual_harvest_end?: string | null;
  expected_yield_qty?: string;
  expected_price_per_unit?: string;
  notes?: string;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  season: string;
  crop: string;
  variety?: string | null;
  expected_yield_unit: string;
}
export interface CropCycleBlock {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  area_value?: string;
  area_m2: string;
  is_intercrop?: boolean;
  geometry: Record<string, unknown> | null;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  crop_cycle: string;
  block: string;
  area_unit: string;
}
export interface CropCycleCalendar {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  template_version_no?: number;
  anchor_date: string;
  generated_at: string;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  crop_cycle: string;
  template: string;
}
export interface CropCycleCostSummary {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  as_of_date: string;
  operation_cost?: string;
  holding_cost?: string;
  revenue?: string;
  margin?: string;
  cost_per_area?: string;
  margin_per_area?: string;
  labour_hours?: string;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  crop_cycle: string;
}
export type CropCycleStatusEnum =
  "draft" | "planned" | "active" | "harvesting" | "closed" | "abandoned";
export interface CropRequest {
  name?: string;
  scientific_name?: string;
  category?: string;
  lifecycle?: LifecycleEnum;
  is_active?: boolean;
  default_yield_unit: string;
}
export interface CropStage {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  code?: string;
  name?: string;
  order_no?: number;
  start_threshold?: string;
  end_threshold?: string;
  is_critical?: boolean;
  created_by: string | null;
  updated_by: string | null;
  farm: string | null;
  stage_model: string;
}
export interface CropStageModel {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  name?: string;
  basis?: CropStageModelBasisEnum;
  base_temp_c?: string;
  upper_temp_c?: string | null;
  created_by: string | null;
  updated_by: string | null;
  farm: string | null;
  crop: string;
  variety?: string | null;
}
export type CropStageModelBasisEnum = "days" | "gdd";
export interface CropStageModelRequest {
  name?: string;
  basis?: CropStageModelBasisEnum;
  base_temp_c?: string;
  upper_temp_c?: string | null;
  crop: string;
  variety?: string | null;
}
export interface CropStageRecord {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  observed_on: string;
  basis?: CropStageRecordBasisEnum;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  crop_cycle: string;
  stage: string;
  source_event: string;
}
export type CropStageRecordBasisEnum = "estimated" | "observed";
export interface CropStageRequest {
  code?: string;
  name?: string;
  order_no?: number;
  start_threshold?: string;
  end_threshold?: string;
  is_critical?: boolean;
  stage_model: string;
}
export interface DecisionJournal {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  decided_on: string;
  title?: string;
  decision_text?: string;
  reason?: string;
  assumptions?: unknown;
  expected?: unknown;
  review_on?: string | null;
  outcome_text?: string;
  outcome_logged_at?: string | null;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  decided_by: string;
  scenario?: string | null;
  crop_cycle?: string | null;
  event?: string | null;
}
export interface DecisionJournalRequest {
  decided_on: string;
  title?: string;
  decision_text?: string;
  reason?: string;
  assumptions?: unknown;
  expected?: unknown;
  review_on?: string | null;
  outcome_text?: string;
  outcome_logged_at?: string | null;
  decided_by: string;
  scenario?: string | null;
  crop_cycle?: string | null;
  event?: string | null;
}
export interface DepreciationEntry {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  entry_date: string;
  amount?: string;
  basis_kind?: BasisKindEnum;
  basis_qty?: string;
  strategy_code?: string;
  policy_version_no?: number;
  book_value_after?: string;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  asset: string;
  assignment: string;
  source_sub_event?: string | null;
  cost_record: string;
  reversal_of?: string | null;
}
export interface DepreciationPolicy {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  code?: string;
  name?: string;
  strategy_code?: StrategyCodeEnum;
  params?: unknown;
  version_no?: number;
  is_active?: boolean;
  created_by: string | null;
  updated_by: string | null;
  farm: string | null;
}
export interface DepreciationPolicyRequest {
  code?: string;
  name?: string;
  strategy_code?: StrategyCodeEnum;
  params?: unknown;
  version_no?: number;
  is_active?: boolean;
}
export type DimensionEnum =
  "mass" | "volume" | "area" | "time" | "count" | "length" | "energy";
export type DirectionEnum = "in" | "out";
export interface Event {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  title?: string;
  status?: EventStatusEnum;
  planned_start: string;
  planned_end: string;
  actual_start?: string | null;
  actual_end?: string | null;
  trigger_kind?: TriggerKindEnum;
  calendar_item_ref?: string | null;
  scenario_ref?: string | null;
  sequence_in_cycle?: number;
  planned_cost_total?: string;
  actual_cost_total?: string;
  notes?: string;
  client_uuid: string;
  submitted_at?: string | null;
  confirmed_at?: string | null;
  request_hash?: string;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  event_type: string;
  event_type_version: string;
  trigger_event?: string | null;
  submitted_by?: string | null;
  confirmed_by?: string | null;
  reversal_of?: string | null;
}
export interface EventCategory {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  code?: string;
  name?: string;
  is_system: boolean;
  sort_order?: number;
  allowed_sub_event_kinds?: unknown;
  requires_crop_target?: boolean;
  requires_safety_record?: boolean;
  creates_stock?: boolean;
  involves_cash?: boolean;
  cost_bucket?: CostBucketEnum;
  created_by: string | null;
  updated_by: string | null;
  farm: string | null;
  maps_to?: string | null;
}
export interface EventCostSummary {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  planned_total?: string;
  actual_total?: string;
  cost_per_area?: string;
  variance?: string;
  breakdown?: unknown;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  event: string;
}
export interface EventExecution {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  weather_note?: string;
  wind_note?: string;
  rain_flag?: boolean;
  equipment_note?: string;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  event: string;
  operator?: string | null;
}
export type EventStatusEnum =
  "draft" | "planned" | "in_progress" | "done" | "cancelled";
export interface EventTarget {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  area_value?: string;
  area_m2: string;
  share_fraction?: string;
  covered_geometry?: Record<string, unknown> | null;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  event: string;
  crop_cycle?: string | null;
  block?: string | null;
  asset?: string | null;
  area_unit?: string | null;
}
export interface EventType {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  code?: string;
  name?: string;
  is_active?: boolean;
  target_kind?: TargetKindEnum;
  allows_multiple_targets?: boolean;
  default_duration_minutes?: number;
  min_interval_days?: number;
  max_repeats_per_cycle?: number | null;
  current_version_no?: number;
  created_by: string | null;
  updated_by: string | null;
  farm: string | null;
  category: string;
}
export interface EventTypeLine {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  line_no?: number;
  sub_event_kind?: string;
  asset_class?: string;
  quantity_basis?: QuantityBasisEnum;
  default_qty?: string;
  is_required?: boolean;
  is_locked?: boolean;
  created_by: string | null;
  updated_by: string | null;
  farm: string | null;
  event_type_version: string;
  default_asset?: string | null;
  product_category?: string | null;
  purpose_tag?: string | null;
  qty_unit: string;
}
export interface EventTypeVersion {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  version_no?: number;
  is_current?: boolean;
  created_by: string | null;
  updated_by: string | null;
  farm: string | null;
  event_type: string;
}
export interface FlowDetail {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  flow_type?: FlowTypeEnum;
  source_description?: string;
  rated_capacity?: string;
  is_metered?: boolean;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  asset: string;
  unit: string;
}
export interface FlowDetailRequest {
  flow_type?: FlowTypeEnum;
  source_description?: string;
  rated_capacity?: string;
  is_metered?: boolean;
  asset: string;
  unit: string;
}
export type FlowTypeEnum = "water" | "electricity" | "diesel_feed" | "solar";
export interface GddDaily {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  date: string;
  gdd?: string;
  cumulative_gdd?: string;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  crop_cycle: string;
}
export interface HoldingAccrualRun {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  accrual_date: string;
  status?: HoldingAccrualRunStatusEnum;
  started_at: string;
  finished_at?: string | null;
  rows_created?: number;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
}
export type HoldingAccrualRunStatusEnum = "running" | "done";
export interface InvestmentAnalysis {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  name?: string;
  option_kind?: OptionKindEnum;
  asset_class?: string;
  inputs?: unknown;
  results: unknown;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  decision?: string | null;
}
export interface InvestmentAnalysisRequest {
  name?: string;
  option_kind?: OptionKindEnum;
  asset_class?: string;
  inputs?: unknown;
  decision?: string | null;
}
export interface Invitation {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  email?: string;
  expires_at: string;
  accepted_at?: string | null;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  role: string;
  invited_by: string;
}
export type KeyEnum =
  "price_multiplier" | "yield_multiplier" | "wage_rate" | "fuel_price" | "rent";
export interface LedgerAccount {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  kind?: LedgerAccountKindEnum;
  name?: string;
  opening_balance?: string;
  opening_date: string;
  is_active?: boolean;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  counterparty?: string | null;
}
export type LedgerAccountKindEnum =
  | "cash"
  | "bank"
  | "mobile_wallet"
  | "loan_payable"
  | "supplier_credit_payable"
  | "buyer_credit_receivable"
  | "advance";
export interface LedgerAccountRequest {
  kind?: LedgerAccountKindEnum;
  name?: string;
  opening_balance?: string;
  opening_date: string;
  is_active?: boolean;
  counterparty?: string | null;
}
export interface LedgerCategory {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  code?: string;
  name?: string;
  kind?: LedgerCategoryKindEnum;
  created_by: string | null;
  updated_by: string | null;
  farm: string | null;
  parent?: string | null;
}
export type LedgerCategoryKindEnum =
  | "asset_purchase"
  | "operating_payment"
  | "loan_principal"
  | "interest"
  | "sales_receipt"
  | "subsidy"
  | "other_income"
  | "transfer";
export interface LedgerCategoryRequest {
  code?: string;
  name?: string;
  kind?: LedgerCategoryKindEnum;
  parent?: string | null;
}
export interface LedgerEntry {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  entry_date: string;
  direction?: DirectionEnum;
  amount?: string;
  reference_no?: string;
  status?: LedgerEntryStatusEnum;
  due_date?: string | null;
  memo?: string;
  transfer_group?: string | null;
  client_uuid: string;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  account: string;
  category: string;
  counterparty?: string | null;
  sub_event?: string | null;
  event: string;
  reversal_of?: string | null;
}
export type LedgerEntryStatusEnum = "pending" | "cleared";
export type LifecycleEnum = "annual" | "biennial" | "perennial";
export interface LivingDetail {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  living_type?: LivingTypeEnum;
  species?: string;
  head_count: string;
  start_date: string;
  lifecycle_stage?: string;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  asset: string;
  block?: string | null;
}
export interface LivingDetailRequest {
  living_type?: LivingTypeEnum;
  species?: string;
  start_date: string;
  lifecycle_stage?: string;
  asset: string;
  block?: string | null;
}
export interface LivingEntry {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  delta_count?: string;
  reason?: string;
  occurred_at: string;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  sub_event: string;
  living_asset: string;
  reversal_of?: string | null;
}
export type LivingTypeEnum =
  "animal_group" | "single_animal" | "orchard" | "tree_block";
export interface Loan {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  principal?: string;
  interest_rate?: string;
  rate_basis?: RateBasisEnum;
  start_date: string;
  term_months?: number;
  purpose?: string;
  status?: LoanStatusEnum;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  lender: string;
  account: string;
}
export interface LoanRequest {
  principal?: string;
  interest_rate?: string;
  rate_basis?: RateBasisEnum;
  start_date: string;
  term_months?: number;
  purpose?: string;
  status?: LoanStatusEnum;
  lender: string;
  account: string;
}
export interface LoanScheduleRow {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  due_date: string;
  principal_due?: string;
  interest_due?: string;
  status?: LoanScheduleRowStatusEnum;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  loan: string;
  ledger_entry?: string | null;
}
export type LoanScheduleRowStatusEnum = "due" | "paid" | "overdue";
export type LoanStatusEnum = "active" | "closed";
export interface MachineDetail {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  machine_type?: string;
  make?: string;
  model?: string;
  year?: number | null;
  meter_hours: string;
  fuel_rate_per_hour?: string;
  capacity_note?: string;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  asset: string;
  fuel_stock_item?: string | null;
}
export interface MachineDetailRequest {
  machine_type?: string;
  make?: string;
  model?: string;
  year?: number | null;
  fuel_rate_per_hour?: string;
  capacity_note?: string;
  asset: string;
  fuel_stock_item?: string | null;
}
export interface Membership {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  status?: MembershipStatusEnum;
  joined_at?: string | null;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  user: string;
  role: string;
}
export type MembershipStatusEnum = "invited" | "active" | "suspended";
export interface MeterEntry {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  delta_hours?: string;
  reading_after?: string;
  occurred_at: string;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  sub_event: string;
  machine: string;
  reversal_of?: string | null;
}
export type ModeEnum = "exclusive" | "shared" | "capacity_share";
export type MovementTypeEnum = "in" | "out" | "adjust_in" | "adjust_out";
export interface Notification {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  kind?: string;
  title?: string;
  body?: string;
  related_type?: string;
  related_id?: string | null;
  due_at?: string | null;
  read_at?: string | null;
  status?: NotificationStatusEnum;
  channel?: ChannelEnum;
  dedupe_key?: string;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  recipient: string;
}
export type NotificationStatusEnum = "pending" | "sent" | "dismissed";
export interface ObservationDetail {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  observation_kind?: ObservationKindEnum;
  severity?: number;
  metric_name?: string;
  metric_value?: string | null;
  metric_unit?: string;
  stage_code?: string;
  location_note?: string;
  geotag?: Record<string, unknown> | null;
  client_uuid: string;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  event: string;
  follow_up_of?: string | null;
}
export type ObservationKindEnum =
  | "growth_stage"
  | "pest"
  | "disease"
  | "weed"
  | "soil_moisture"
  | "nutrient_deficiency"
  | "weather_damage"
  | "general";
export type OperatorEnum = "gt" | "gte" | "lt" | "lte" | "eq";
export type OptionKindEnum = "buy" | "lease" | "hire" | "skip";
export interface PaginatedAssetCapitalProfileList {
  next?: string | null;
  previous?: string | null;
  results: AssetCapitalProfile[];
}
export interface PaginatedAssetCostRuleAssignmentList {
  next?: string | null;
  previous?: string | null;
  results: AssetCostRuleAssignment[];
}
export interface PaginatedAssetDepreciationAssignmentList {
  next?: string | null;
  previous?: string | null;
  results: AssetDepreciationAssignment[];
}
export interface PaginatedAssetList {
  next?: string | null;
  previous?: string | null;
  results: Asset[];
}
export interface PaginatedAssetValuationList {
  next?: string | null;
  previous?: string | null;
  results: AssetValuation[];
}
export interface PaginatedAttachmentList {
  next?: string | null;
  previous?: string | null;
  results: Attachment[];
}
export interface PaginatedAuditLogList {
  next?: string | null;
  previous?: string | null;
  results: AuditLog[];
}
export interface PaginatedAvailabilityWindowList {
  next?: string | null;
  previous?: string | null;
  results: AvailabilityWindow[];
}
export interface PaginatedBlockAccessList {
  next?: string | null;
  previous?: string | null;
  results: BlockAccess[];
}
export interface PaginatedBlockBoundaryRevisionList {
  next?: string | null;
  previous?: string | null;
  results: BlockBoundaryRevision[];
}
export interface PaginatedBlockList {
  next?: string | null;
  previous?: string | null;
  results: Block[];
}
export interface PaginatedCalendarTemplateItemList {
  next?: string | null;
  previous?: string | null;
  results: CalendarTemplateItem[];
}
export interface PaginatedCalendarTemplateList {
  next?: string | null;
  previous?: string | null;
  results: CalendarTemplate[];
}
export interface PaginatedComplianceCheckList {
  next?: string | null;
  previous?: string | null;
  results: ComplianceCheck[];
}
export interface PaginatedComplianceOverrideList {
  next?: string | null;
  previous?: string | null;
  results: ComplianceOverride[];
}
export interface PaginatedConfigurationHistoryList {
  next?: string | null;
  previous?: string | null;
  results: ConfigurationHistory[];
}
export interface PaginatedCostAllocationList {
  next?: string | null;
  previous?: string | null;
  results: CostAllocation[];
}
export interface PaginatedCostRecordList {
  next?: string | null;
  previous?: string | null;
  results: CostRecord[];
}
export interface PaginatedCostRuleList {
  next?: string | null;
  previous?: string | null;
  results: CostRule[];
}
export interface PaginatedCounterpartyList {
  next?: string | null;
  previous?: string | null;
  results: Counterparty[];
}
export interface PaginatedCropCycleBlockList {
  next?: string | null;
  previous?: string | null;
  results: CropCycleBlock[];
}
export interface PaginatedCropCycleCalendarList {
  next?: string | null;
  previous?: string | null;
  results: CropCycleCalendar[];
}
export interface PaginatedCropCycleCostSummaryList {
  next?: string | null;
  previous?: string | null;
  results: CropCycleCostSummary[];
}
export interface PaginatedCropCycleList {
  next?: string | null;
  previous?: string | null;
  results: CropCycle[];
}
export interface PaginatedCropList {
  next?: string | null;
  previous?: string | null;
  results: Crop[];
}
export interface PaginatedCropStageList {
  next?: string | null;
  previous?: string | null;
  results: CropStage[];
}
export interface PaginatedCropStageModelList {
  next?: string | null;
  previous?: string | null;
  results: CropStageModel[];
}
export interface PaginatedCropStageRecordList {
  next?: string | null;
  previous?: string | null;
  results: CropStageRecord[];
}
export interface PaginatedDecisionJournalList {
  next?: string | null;
  previous?: string | null;
  results: DecisionJournal[];
}
export interface PaginatedDepreciationEntryList {
  next?: string | null;
  previous?: string | null;
  results: DepreciationEntry[];
}
export interface PaginatedDepreciationPolicyList {
  next?: string | null;
  previous?: string | null;
  results: DepreciationPolicy[];
}
export interface PaginatedEventCategoryList {
  next?: string | null;
  previous?: string | null;
  results: EventCategory[];
}
export interface PaginatedEventCostSummaryList {
  next?: string | null;
  previous?: string | null;
  results: EventCostSummary[];
}
export interface PaginatedEventExecutionList {
  next?: string | null;
  previous?: string | null;
  results: EventExecution[];
}
export interface PaginatedEventList {
  next?: string | null;
  previous?: string | null;
  results: Event[];
}
export interface PaginatedEventTargetList {
  next?: string | null;
  previous?: string | null;
  results: EventTarget[];
}
export interface PaginatedEventTypeLineList {
  next?: string | null;
  previous?: string | null;
  results: EventTypeLine[];
}
export interface PaginatedEventTypeList {
  next?: string | null;
  previous?: string | null;
  results: EventType[];
}
export interface PaginatedEventTypeVersionList {
  next?: string | null;
  previous?: string | null;
  results: EventTypeVersion[];
}
export interface PaginatedFlowDetailList {
  next?: string | null;
  previous?: string | null;
  results: FlowDetail[];
}
export interface PaginatedGddDailyList {
  next?: string | null;
  previous?: string | null;
  results: GddDaily[];
}
export interface PaginatedHoldingAccrualRunList {
  next?: string | null;
  previous?: string | null;
  results: HoldingAccrualRun[];
}
export interface PaginatedInvestmentAnalysisList {
  next?: string | null;
  previous?: string | null;
  results: InvestmentAnalysis[];
}
export interface PaginatedInvitationList {
  next?: string | null;
  previous?: string | null;
  results: Invitation[];
}
export interface PaginatedLedgerAccountList {
  next?: string | null;
  previous?: string | null;
  results: LedgerAccount[];
}
export interface PaginatedLedgerCategoryList {
  next?: string | null;
  previous?: string | null;
  results: LedgerCategory[];
}
export interface PaginatedLedgerEntryList {
  next?: string | null;
  previous?: string | null;
  results: LedgerEntry[];
}
export interface PaginatedLivingDetailList {
  next?: string | null;
  previous?: string | null;
  results: LivingDetail[];
}
export interface PaginatedLivingEntryList {
  next?: string | null;
  previous?: string | null;
  results: LivingEntry[];
}
export interface PaginatedLoanList {
  next?: string | null;
  previous?: string | null;
  results: Loan[];
}
export interface PaginatedLoanScheduleRowList {
  next?: string | null;
  previous?: string | null;
  results: LoanScheduleRow[];
}
export interface PaginatedMachineDetailList {
  next?: string | null;
  previous?: string | null;
  results: MachineDetail[];
}
export interface PaginatedMembershipList {
  next?: string | null;
  previous?: string | null;
  results: Membership[];
}
export interface PaginatedMeterEntryList {
  next?: string | null;
  previous?: string | null;
  results: MeterEntry[];
}
export interface PaginatedNotificationList {
  next?: string | null;
  previous?: string | null;
  results: Notification[];
}
export interface PaginatedObservationDetailList {
  next?: string | null;
  previous?: string | null;
  results: ObservationDetail[];
}
export interface PaginatedPersonDetailList {
  next?: string | null;
  previous?: string | null;
  results: PersonDetail[];
}
export interface PaginatedProduceGradeList {
  next?: string | null;
  previous?: string | null;
  results: ProduceGrade[];
}
export interface PaginatedProductCategoryList {
  next?: string | null;
  previous?: string | null;
  results: ProductCategory[];
}
export interface PaginatedProductCropLabelList {
  next?: string | null;
  previous?: string | null;
  results: ProductCropLabel[];
}
export interface PaginatedProductList {
  next?: string | null;
  previous?: string | null;
  results: Product[];
}
export interface PaginatedPurposeTagList {
  next?: string | null;
  previous?: string | null;
  results: PurposeTag[];
}
export interface PaginatedReconciliationRunList {
  next?: string | null;
  previous?: string | null;
  results: ReconciliationRun[];
}
export interface PaginatedReminderRuleList {
  next?: string | null;
  previous?: string | null;
  results: ReminderRule[];
}
export interface PaginatedReservationList {
  next?: string | null;
  previous?: string | null;
  results: Reservation[];
}
export interface PaginatedRestrictionWindowList {
  next?: string | null;
  previous?: string | null;
  results: RestrictionWindow[];
}
export interface PaginatedRoleList {
  next?: string | null;
  previous?: string | null;
  results: Role[];
}
export interface PaginatedScenarioAssumptionList {
  next?: string | null;
  previous?: string | null;
  results: ScenarioAssumption[];
}
export interface PaginatedScenarioCropCycleList {
  next?: string | null;
  previous?: string | null;
  results: ScenarioCropCycle[];
}
export interface PaginatedScenarioList {
  next?: string | null;
  previous?: string | null;
  results: Scenario[];
}
export interface PaginatedScenarioMetricList {
  next?: string | null;
  previous?: string | null;
  results: ScenarioMetric[];
}
export interface PaginatedSeasonList {
  next?: string | null;
  previous?: string | null;
  results: Season[];
}
export interface PaginatedSpaceDetailList {
  next?: string | null;
  previous?: string | null;
  results: SpaceDetail[];
}
export interface PaginatedStockItemList {
  next?: string | null;
  previous?: string | null;
  results: StockItem[];
}
export interface PaginatedStockLotList {
  next?: string | null;
  previous?: string | null;
  results: StockLot[];
}
export interface PaginatedStockMovementList {
  next?: string | null;
  previous?: string | null;
  results: StockMovement[];
}
export interface PaginatedSubEventList {
  next?: string | null;
  previous?: string | null;
  results: SubEvent[];
}
export interface PaginatedSuggestionList {
  next?: string | null;
  previous?: string | null;
  results: Suggestion[];
}
export interface PaginatedTenureList {
  next?: string | null;
  previous?: string | null;
  results: Tenure[];
}
export interface PaginatedThresholdRuleList {
  next?: string | null;
  previous?: string | null;
  results: ThresholdRule[];
}
export interface PaginatedTreatmentRecordList {
  next?: string | null;
  previous?: string | null;
  results: TreatmentRecord[];
}
export interface PaginatedUnitList {
  next?: string | null;
  previous?: string | null;
  results: Unit[];
}
export interface PaginatedVarietyList {
  next?: string | null;
  previous?: string | null;
  results: Variety[];
}
export interface PaginatedWeatherDailyList {
  next?: string | null;
  previous?: string | null;
  results: WeatherDaily[];
}
export interface PatchedAssetCostRuleAssignmentRequest {
  role?: RoleEnum;
  effective_from?: string;
  effective_to?: string | null;
  asset?: string;
  cost_rule?: string;
}
export interface PatchedAssetRequest {
  asset_class?: AssetClassEnum;
  name?: string;
  code?: string;
  description?: string;
  acquired_on?: string | null;
  retired_on?: string | null;
  attributes?: unknown;
  home_location?: string | null;
}
export interface PatchedAvailabilityWindowRequest {
  kind?: AvailabilityWindowKindEnum;
  window?: Record<string, unknown>;
  capacity_hours?: string;
  recurrence_rule?: string;
  reason?: string;
  asset?: string;
}
export interface PatchedBlockAccessRequest {
  access_level?: AccessLevelEnum;
  membership?: string;
  block?: string;
}
export interface PatchedBlockRequest {
  code?: string;
  name?: string;
  area_value?: string;
  area_source?: AreaSourceEnum;
  soil_type?: string;
  status?: BlockStatusEnum;
  notes?: string;
  parent?: string | null;
  area_unit?: string;
}
export interface PatchedCalendarTemplateItemRequest {
  label?: string;
  anchor?: AnchorEnum;
  offset_days_min?: number;
  offset_days_max?: number;
  repeat_every_days?: number | null;
  repeat_max?: number;
  is_optional?: boolean;
  notes?: string;
  template?: string;
  event_type?: string;
  stage?: string | null;
}
export interface PatchedCalendarTemplateRequest {
  name?: string;
  version_no?: number;
  region_note?: string;
  is_active?: boolean;
  crop?: string;
  variety?: string | null;
  stage_model?: string;
}
export interface PatchedCostRuleRequest {
  code?: string;
  name?: string;
  rule_type?: RuleTypeEnum;
  params?: unknown;
  version_no?: number;
  effective_from?: string;
  effective_to?: string | null;
  is_active?: boolean;
}
export interface PatchedCounterpartyRequest {
  name?: string;
  kind?: CounterpartyKindEnum;
  phone?: string;
  address?: string;
  notes?: string;
}
export interface PatchedCropRequest {
  name?: string;
  scientific_name?: string;
  category?: string;
  lifecycle?: LifecycleEnum;
  is_active?: boolean;
  default_yield_unit?: string;
}
export interface PatchedCropStageModelRequest {
  name?: string;
  basis?: CropStageModelBasisEnum;
  base_temp_c?: string;
  upper_temp_c?: string | null;
  crop?: string;
  variety?: string | null;
}
export interface PatchedCropStageRequest {
  code?: string;
  name?: string;
  order_no?: number;
  start_threshold?: string;
  end_threshold?: string;
  is_critical?: boolean;
  stage_model?: string;
}
export interface PatchedDecisionJournalRequest {
  decided_on?: string;
  title?: string;
  decision_text?: string;
  reason?: string;
  assumptions?: unknown;
  expected?: unknown;
  review_on?: string | null;
  outcome_text?: string;
  outcome_logged_at?: string | null;
  decided_by?: string;
  scenario?: string | null;
  crop_cycle?: string | null;
  event?: string | null;
}
export interface PatchedDepreciationPolicyRequest {
  code?: string;
  name?: string;
  strategy_code?: StrategyCodeEnum;
  params?: unknown;
  version_no?: number;
  is_active?: boolean;
}
export interface PatchedFlowDetailRequest {
  flow_type?: FlowTypeEnum;
  source_description?: string;
  rated_capacity?: string;
  is_metered?: boolean;
  asset?: string;
  unit?: string;
}
export interface PatchedInvestmentAnalysisRequest {
  name?: string;
  option_kind?: OptionKindEnum;
  asset_class?: string;
  inputs?: unknown;
  decision?: string | null;
}
export interface PatchedLedgerAccountRequest {
  kind?: LedgerAccountKindEnum;
  name?: string;
  opening_balance?: string;
  opening_date?: string;
  is_active?: boolean;
  counterparty?: string | null;
}
export interface PatchedLedgerCategoryRequest {
  code?: string;
  name?: string;
  kind?: LedgerCategoryKindEnum;
  parent?: string | null;
}
export interface PatchedLivingDetailRequest {
  living_type?: LivingTypeEnum;
  species?: string;
  start_date?: string;
  lifecycle_stage?: string;
  asset?: string;
  block?: string | null;
}
export interface PatchedLoanRequest {
  principal?: string;
  interest_rate?: string;
  rate_basis?: RateBasisEnum;
  start_date?: string;
  term_months?: number;
  purpose?: string;
  status?: LoanStatusEnum;
  lender?: string;
  account?: string;
}
export interface PatchedMachineDetailRequest {
  machine_type?: string;
  make?: string;
  model?: string;
  year?: number | null;
  fuel_rate_per_hour?: string;
  capacity_note?: string;
  asset?: string;
  fuel_stock_item?: string | null;
}
export interface PatchedPersonDetailRequest {
  person_type?: PersonTypeEnum;
  skills?: unknown;
  phone?: string;
  wage_basis?: WageBasisEnum;
  is_paid?: boolean;
  asset?: string;
  user?: string | null;
}
export interface PatchedProduceGradeRequest {
  code?: string;
  name?: string;
  sort_order?: number;
  crop?: string;
}
export interface PatchedProductCategoryRequest {
  code?: string;
  name?: string;
  is_regulated?: boolean;
  default_purpose_tag?: string | null;
}
export interface PatchedProductCropLabelRequest {
  dose_min?: string;
  dose_max?: string;
  waiting_period_days?: number;
  reentry_hours?: string;
  max_applications_per_cycle?: number | null;
  min_interval_days?: number;
  product?: string;
  crop?: string;
  dose_unit?: string;
  per_area_unit?: string;
}
export interface PatchedProductRequest {
  name?: string;
  manufacturer?: string;
  active_ingredient?: string;
  formulation?: string;
  mode_of_action_group?: string;
  registration_no?: string;
  notes?: string;
  is_active?: boolean;
  category?: string;
  default_unit?: string;
}
export interface PatchedPurposeTagRequest {
  code?: string;
  name?: string;
  sort_order?: number;
}
export interface PatchedReminderRuleRequest {
  kind?: string;
  lead_time?: number;
  channel?: ChannelEnum;
  is_active?: boolean;
}
export interface PatchedScenarioAssumptionRequest {
  key?: KeyEnum;
  value?: string;
  scenario?: string;
  crop?: string | null;
}
export interface PatchedScenarioCropCycleRequest {
  scenario?: string;
  crop_cycle?: string;
}
export interface PatchedScenarioRequest {
  name?: string;
  description?: string;
  adopted_at?: string | null;
  season?: string;
  based_on?: string | null;
}
export interface PatchedSeasonRequest {
  name?: string;
  kind?: string;
  start_date?: string;
  end_date?: string;
  status?: SeasonStatusEnum;
}
export interface PatchedSpaceDetailRequest {
  space_type?: SpaceTypeEnum;
  capacity_value?: string;
  location?: Record<string, unknown> | null;
  asset?: string;
  block?: string | null;
  capacity_unit?: string | null;
}
export interface PatchedStockItemRequest {
  stock_kind?: StockKindEnum;
  valuation_method?: ValuationMethodEnum;
  reorder_level?: string;
  shelf_life_days?: number | null;
  asset?: string;
  product?: string | null;
  crop?: string | null;
  base_unit?: string;
}
export interface PatchedTenureRequest {
  tenure_kind?: TenureKindEnum;
  start_date?: string;
  end_date?: string | null;
  rent_amount?: string;
  rent_period?: RentPeriodEnum;
  payment_terms?: string;
  notes?: string;
  asset?: string;
  owner_party?: string | null;
  holder_party?: string | null;
  user_party?: string | null;
}
export interface PatchedThresholdRuleRequest {
  observation_kind?: string;
  metric_name?: string;
  operator?: OperatorEnum;
  threshold_value?: string;
  severity_min?: number;
  message?: string;
  is_active?: boolean;
  crop?: string;
  recommended_event_type?: string;
}
export interface PatchedUnitRequest {
  code?: string;
  name?: string;
  dimension?: DimensionEnum;
  to_base_factor?: string;
}
export interface PatchedVarietyRequest {
  name?: string;
  typical_duration_days?: number;
  attributes?: unknown;
  crop?: string;
}
export interface PatchedWeatherDailyRequest {
  date?: string;
  tmin_c?: string;
  tmax_c?: string;
  rain_mm?: string;
  source?: WeatherDailySourceEnum;
  is_forecast?: boolean;
  block?: string | null;
}
export interface PersonDetail {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  person_type?: PersonTypeEnum;
  skills?: unknown;
  phone?: string;
  wage_basis?: WageBasisEnum;
  is_paid?: boolean;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  asset: string;
  user?: string | null;
}
export interface PersonDetailRequest {
  person_type?: PersonTypeEnum;
  skills?: unknown;
  phone?: string;
  wage_basis?: WageBasisEnum;
  is_paid?: boolean;
  asset: string;
  user?: string | null;
}
export type PersonTypeEnum = "family" | "permanent" | "seasonal" | "contract";
export interface ProduceGrade {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  code?: string;
  name?: string;
  sort_order?: number;
  created_by: string | null;
  updated_by: string | null;
  farm: string | null;
  crop: string;
}
export interface ProduceGradeRequest {
  code?: string;
  name?: string;
  sort_order?: number;
  crop: string;
}
export interface Product {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  name?: string;
  manufacturer?: string;
  active_ingredient?: string;
  formulation?: string;
  mode_of_action_group?: string;
  registration_no?: string;
  notes?: string;
  is_active?: boolean;
  created_by: string | null;
  updated_by: string | null;
  farm: string | null;
  category: string;
  default_unit: string;
}
export interface ProductCategory {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  code?: string;
  name?: string;
  is_regulated?: boolean;
  created_by: string | null;
  updated_by: string | null;
  farm: string | null;
  default_purpose_tag?: string | null;
}
export interface ProductCategoryRequest {
  code?: string;
  name?: string;
  is_regulated?: boolean;
  default_purpose_tag?: string | null;
}
export interface ProductCropLabel {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  dose_min?: string;
  dose_max?: string;
  waiting_period_days?: number;
  reentry_hours?: string;
  max_applications_per_cycle?: number | null;
  min_interval_days?: number;
  created_by: string | null;
  updated_by: string | null;
  farm: string | null;
  product: string;
  crop: string;
  dose_unit: string;
  per_area_unit: string;
}
export interface ProductCropLabelRequest {
  dose_min?: string;
  dose_max?: string;
  waiting_period_days?: number;
  reentry_hours?: string;
  max_applications_per_cycle?: number | null;
  min_interval_days?: number;
  product: string;
  crop: string;
  dose_unit: string;
  per_area_unit: string;
}
export interface ProductRequest {
  name?: string;
  manufacturer?: string;
  active_ingredient?: string;
  formulation?: string;
  mode_of_action_group?: string;
  registration_no?: string;
  notes?: string;
  is_active?: boolean;
  category: string;
  default_unit: string;
}
export interface PurposeTag {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  code?: string;
  name?: string;
  sort_order?: number;
  created_by: string | null;
  updated_by: string | null;
  farm: string | null;
}
export interface PurposeTagRequest {
  code?: string;
  name?: string;
  sort_order?: number;
}
export type QuantityBasisEnum =
  "per_area" | "per_machine_hour" | "fixed" | "per_head" | "derived";
export type RateBasisEnum = "flat" | "reducing";
export interface ReconciliationRun {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  period_start: string;
  period_end: string;
  cash_spent_on_assets?: string;
  change_in_register_value?: string;
  cost_recognised?: string;
  difference?: string;
  status?: ReconciliationRunStatusEnum;
  tolerance?: string;
  details?: unknown;
  run_at: string;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
}
export type ReconciliationRunStatusEnum = "balanced" | "off";
export interface ReminderRule {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  kind?: string;
  lead_time?: number;
  channel?: ChannelEnum;
  is_active?: boolean;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
}
export interface ReminderRuleRequest {
  kind?: string;
  lead_time?: number;
  channel?: ChannelEnum;
  is_active?: boolean;
}
export type RentPeriodEnum = "day" | "month" | "year" | "season";
export interface Reservation {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  mode?: ModeEnum;
  window: Record<string, unknown>;
  qty_reserved?: string;
  status?: ReservationStatusEnum;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  sub_event: string;
  asset: string;
}
export type ReservationStatusEnum =
  "active" | "released" | "converted" | "cancelled";
export type RestrictionKindEnum = "reentry" | "no_spray" | "no_harvest";
export interface RestrictionWindow {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  window: Record<string, unknown>;
  restriction_kind?: RestrictionKindEnum;
  source_type?: string;
  source_id?: string | null;
  reason?: string;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  block?: string | null;
  asset?: string | null;
}
export interface Role {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  code?: string;
  name?: string;
  description?: string;
  is_system: boolean;
  created_by: string | null;
  updated_by: string | null;
  farm: string | null;
}
export type RoleEnum = "use" | "holding";
export type RuleTypeEnum =
  | "hourly_rate"
  | "daily_rent"
  | "wage_per_hour"
  | "imputed_labour"
  | "stock_average"
  | "flow_estimate"
  | "fixed_per_event";
export interface Scenario {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  name?: string;
  description?: string;
  status: ScenarioStatusEnum;
  adopted_at?: string | null;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  season: string;
  based_on?: string | null;
}
export interface ScenarioAssumption {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  key?: KeyEnum;
  value?: string;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  scenario: string;
  crop?: string | null;
}
export interface ScenarioAssumptionRequest {
  key?: KeyEnum;
  value?: string;
  scenario: string;
  crop?: string | null;
}
export interface ScenarioCropCycle {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  scenario: string;
  crop_cycle: string;
}
export interface ScenarioCropCycleRequest {
  scenario: string;
  crop_cycle: string;
}
export interface ScenarioMetric {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  metric_code?: string;
  value?: string;
  computed_at: string;
  assumptions_hash?: string;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  scenario: string;
  crop_cycle?: string | null;
}
export interface ScenarioRequest {
  name?: string;
  description?: string;
  adopted_at?: string | null;
  season: string;
  based_on?: string | null;
}
export type ScenarioStatusEnum = "draft" | "compared" | "adopted" | "archived";
export interface Season {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  name?: string;
  kind?: string;
  start_date: string;
  end_date: string;
  status?: SeasonStatusEnum;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
}
export interface SeasonRequest {
  name?: string;
  kind?: string;
  start_date: string;
  end_date: string;
  status?: SeasonStatusEnum;
}
export type SeasonStatusEnum = "planned" | "active" | "closed";
export interface SpaceDetail {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  space_type?: SpaceTypeEnum;
  capacity_value?: string;
  location?: Record<string, unknown> | null;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  asset: string;
  block?: string | null;
  capacity_unit?: string | null;
}
export interface SpaceDetailRequest {
  space_type?: SpaceTypeEnum;
  capacity_value?: string;
  location?: Record<string, unknown> | null;
  asset: string;
  block?: string | null;
  capacity_unit?: string | null;
}
export type SpaceTypeEnum =
  "land" | "shed" | "store" | "cold_store" | "well" | "pond" | "other";
export interface StockItem {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  stock_kind?: StockKindEnum;
  valuation_method?: ValuationMethodEnum;
  on_hand_qty: string;
  avg_unit_cost: string;
  reorder_level?: string;
  shelf_life_days?: number | null;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  asset: string;
  product?: string | null;
  crop?: string | null;
  base_unit: string;
}
export interface StockItemRequest {
  stock_kind?: StockKindEnum;
  valuation_method?: ValuationMethodEnum;
  reorder_level?: string;
  shelf_life_days?: number | null;
  asset: string;
  product?: string | null;
  crop?: string | null;
  base_unit: string;
}
export type StockKindEnum =
  "input" | "produce" | "by_product" | "consumable" | "packaging";
export interface StockLot {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  lot_code?: string;
  received_on: string;
  expiry_date?: string | null;
  initial_qty?: string;
  remaining_qty: string;
  unit_cost?: string;
  source_sub_event_id?: string | null;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  stock_item: string;
  supplier?: string | null;
  storage_location?: string | null;
  grade?: string | null;
}
export interface StockMovement {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  movement_type?: MovementTypeEnum;
  qty_canonical?: string;
  unit_cost?: string;
  value?: string;
  occurred_at: string;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  sub_event: string;
  stock_item: string;
  lot?: string | null;
  reversal_of?: string | null;
}
export type StrategyCodeEnum =
  "units_of_production_hours" | "straight_line_daily";
export interface SubEvent {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  line_no?: number;
  kind?: SubEventKindEnum;
  status?: SubEventStatusEnum;
  planned_qty?: string;
  actual_qty?: string | null;
  qty_canonical?: string;
  planned_start: string;
  planned_end: string;
  actual_start?: string | null;
  actual_end?: string | null;
  unit_price?: string;
  amount?: string;
  notes?: string;
  client_uuid: string;
  account_id?: string | null;
  ledger_category_id?: string | null;
  expiry_date?: string | null;
  is_locked?: boolean;
  is_required?: boolean;
  capital_terms?: unknown;
  new_asset_status?: string;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  event: string;
  asset: string;
  purpose_tag?: string | null;
  qty_unit: string;
  counterparty?: string | null;
  stock_lot?: string | null;
  capitalize_to_asset?: string | null;
  operator?: string | null;
  destination?: string | null;
  grade?: string | null;
}
export type SubEventKindEnum =
  | "use_machine"
  | "use_labour"
  | "consume_stock"
  | "occupy_space"
  | "produce_stock"
  | "transfer_stock"
  | "adjust_stock"
  | "living_gain"
  | "living_loss"
  | "pay"
  | "receive"
  | "accrue"
  | "acquire_stock"
  | "asset_status";
export type SubEventStatusEnum =
  "planned" | "reserved" | "in_use" | "done" | "cancelled" | "void";
export interface Suggestion {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  status?: SuggestionStatusEnum;
  decided_at?: string | null;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  crop_cycle: string;
  source_event: string;
  rule: string;
  recommended_event_type: string;
  decided_by?: string | null;
  resulting_event?: string | null;
}
export type SuggestionStatusEnum = "open" | "accepted" | "dismissed";
export type TargetKindEnum = "crop_cycle" | "block" | "asset" | "none";
export interface Tenure {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  tenure_kind?: TenureKindEnum;
  start_date: string;
  end_date?: string | null;
  rent_amount?: string;
  rent_period?: RentPeriodEnum;
  payment_terms?: string;
  notes?: string;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  asset: string;
  owner_party?: string | null;
  holder_party?: string | null;
  user_party?: string | null;
}
export type TenureKindEnum =
  "owned" | "leased_in" | "leased_out" | "shared_crop" | "borrowed" | "hired";
export interface TenureRequest {
  tenure_kind?: TenureKindEnum;
  start_date: string;
  end_date?: string | null;
  rent_amount?: string;
  rent_period?: RentPeriodEnum;
  payment_terms?: string;
  notes?: string;
  asset: string;
  owner_party?: string | null;
  holder_party?: string | null;
  user_party?: string | null;
}
export interface ThresholdRule {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  observation_kind?: string;
  metric_name?: string;
  operator?: OperatorEnum;
  threshold_value?: string;
  severity_min?: number;
  message?: string;
  is_active?: boolean;
  created_by: string | null;
  updated_by: string | null;
  farm: string | null;
  crop: string;
  recommended_event_type: string;
}
export interface ThresholdRuleRequest {
  observation_kind?: string;
  metric_name?: string;
  operator?: OperatorEnum;
  threshold_value?: string;
  severity_min?: number;
  message?: string;
  is_active?: boolean;
  crop: string;
  recommended_event_type: string;
}
export interface TokenObtainPair {
  access: string;
  refresh: string;
}
export interface TokenObtainPairRequest {
  email: string;
  password: string;
}
export interface TokenRefresh {
  access: string;
  refresh: string;
}
export interface TokenRefreshRequest {
  refresh: string;
}
export interface TreatmentRecord {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  qty_applied?: string;
  area_covered_m2?: string;
  dose_per_area?: string;
  applied_at: string;
  weather_note?: string;
  mode_of_action_group?: string;
  waiting_period_ends_on: string;
  reentry_ends_at: string;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  event: string;
  crop_cycle: string;
  block: string;
  product: string;
  stock_lot?: string | null;
  qty_unit: string;
  operator?: string | null;
  reversal_of?: string | null;
}
export type TriggerKindEnum =
  "calendar" | "observation" | "manual" | "system" | "scenario";
export interface Unit {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  code?: string;
  name?: string;
  dimension?: DimensionEnum;
  to_base_factor?: string;
  is_system: boolean;
  created_by: string | null;
  updated_by: string | null;
  farm: string | null;
}
export interface UnitRequest {
  code?: string;
  name?: string;
  dimension?: DimensionEnum;
  to_base_factor?: string;
}
export type ValuationMethodEnum = "weighted_average" | "FIFO";
export interface Variety {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  name?: string;
  typical_duration_days?: number;
  attributes?: unknown;
  created_by: string | null;
  updated_by: string | null;
  farm: string | null;
  crop: string;
}
export interface VarietyRequest {
  name?: string;
  typical_duration_days?: number;
  attributes?: unknown;
  crop: string;
}
export type WageBasisEnum = "hourly" | "daily" | "monthly";
export interface WeatherDaily {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
  date: string;
  tmin_c?: string;
  tmax_c?: string;
  rain_mm?: string;
  source?: WeatherDailySourceEnum;
  is_forecast?: boolean;
  created_by: string | null;
  updated_by: string | null;
  farm: string;
  block?: string | null;
}
export interface WeatherDailyRequest {
  date: string;
  tmin_c?: string;
  tmax_c?: string;
  rain_mm?: string;
  source?: WeatherDailySourceEnum;
  is_forecast?: boolean;
  block?: string | null;
}
export type WeatherDailySourceEnum = "manual" | "service";
