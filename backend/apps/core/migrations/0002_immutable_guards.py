from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("events", "0005_subevent_capital_terms"),
        ("files", "0002_initial"),
        ("land", "0001_initial"),
        ("compliance", "0002_initial"),
        ("workbench", "0001_initial"),
        ("assets", "0003_stockitem_stock_on_hand_nonnegative_and_more"),
        ("identity", "0001_initial"),
        ("costing", "0005_prepaidentry"),
        ("core", "0002_initial"),
        ("catalogue", "0002_initial"),
        ("notifications", "0001_initial"),
        ("cropscience", "0002_initial"),
        ("scheduling", "0001_initial"),
        ("audit", "0002_initial"),
        ("ledger", "0002_ledgerentry_ledger_amount_positive"),
    ]
    operations = [
        migrations.RunSQL(
            "\nCREATE OR REPLACE FUNCTION farm_reject_mutation() RETURNS trigger LANGUAGE plpgsql AS $$\nBEGIN\n RAISE EXCEPTION 'Immutable business record; write a reversal instead' USING ERRCODE='55000';\nEND; $$;\nCREATE OR REPLACE FUNCTION farm_reject_confirmed_mutation() RETURNS trigger LANGUAGE plpgsql AS $$\nBEGIN\n IF OLD.status = 'done' THEN\n  RAISE EXCEPTION 'Confirmed events are immutable' USING ERRCODE='55000';\n END IF;\n IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;\n RETURN NEW;\nEND; $$;\nCREATE TRIGGER protect_confirmed_event BEFORE UPDATE OR DELETE ON events_event FOR EACH ROW EXECUTE FUNCTION farm_reject_confirmed_mutation();\nCREATE TRIGGER protect_confirmed_sub_event BEFORE UPDATE OR DELETE ON events_subevent FOR EACH ROW EXECUTE FUNCTION farm_reject_confirmed_mutation();\nCREATE TRIGGER immutable_guard BEFORE UPDATE OR DELETE ON events_stockmovement FOR EACH ROW EXECUTE FUNCTION farm_reject_mutation();\nCREATE TRIGGER immutable_guard BEFORE UPDATE OR DELETE ON events_meterentry FOR EACH ROW EXECUTE FUNCTION farm_reject_mutation();\nCREATE TRIGGER immutable_guard BEFORE UPDATE OR DELETE ON events_livingentry FOR EACH ROW EXECUTE FUNCTION farm_reject_mutation();\nCREATE TRIGGER immutable_guard BEFORE UPDATE OR DELETE ON costing_costrecord FOR EACH ROW EXECUTE FUNCTION farm_reject_mutation();\nCREATE TRIGGER immutable_guard BEFORE UPDATE OR DELETE ON costing_costallocation FOR EACH ROW EXECUTE FUNCTION farm_reject_mutation();\nCREATE TRIGGER immutable_guard BEFORE UPDATE OR DELETE ON costing_depreciationentry FOR EACH ROW EXECUTE FUNCTION farm_reject_mutation();\nCREATE TRIGGER immutable_guard BEFORE UPDATE OR DELETE ON costing_prepaidentry FOR EACH ROW EXECUTE FUNCTION farm_reject_mutation();\nCREATE TRIGGER immutable_guard BEFORE UPDATE OR DELETE ON ledger_ledgerentry FOR EACH ROW EXECUTE FUNCTION farm_reject_mutation();\nCREATE TRIGGER immutable_guard BEFORE UPDATE OR DELETE ON compliance_treatmentrecord FOR EACH ROW EXECUTE FUNCTION farm_reject_mutation();\nCREATE TRIGGER immutable_guard BEFORE UPDATE OR DELETE ON compliance_compliancecheck FOR EACH ROW EXECUTE FUNCTION farm_reject_mutation();\nCREATE TRIGGER immutable_guard BEFORE UPDATE OR DELETE ON compliance_complianceoverride FOR EACH ROW EXECUTE FUNCTION farm_reject_mutation();\nCREATE TRIGGER immutable_guard BEFORE UPDATE OR DELETE ON audit_auditlog FOR EACH ROW EXECUTE FUNCTION farm_reject_mutation();\nCREATE TRIGGER immutable_guard BEFORE UPDATE OR DELETE ON audit_configurationhistory FOR EACH ROW EXECUTE FUNCTION farm_reject_mutation();\nCREATE TRIGGER immutable_guard BEFORE UPDATE OR DELETE ON land_blockboundaryrevision FOR EACH ROW EXECUTE FUNCTION farm_reject_mutation();\n",
            "DROP TRIGGER IF EXISTS immutable_guard ON events_stockmovement;\nDROP TRIGGER IF EXISTS immutable_guard ON events_meterentry;\nDROP TRIGGER IF EXISTS immutable_guard ON events_livingentry;\nDROP TRIGGER IF EXISTS immutable_guard ON costing_costrecord;\nDROP TRIGGER IF EXISTS immutable_guard ON costing_costallocation;\nDROP TRIGGER IF EXISTS immutable_guard ON costing_depreciationentry;\nDROP TRIGGER IF EXISTS immutable_guard ON costing_prepaidentry;\nDROP TRIGGER IF EXISTS immutable_guard ON ledger_ledgerentry;\nDROP TRIGGER IF EXISTS immutable_guard ON compliance_treatmentrecord;\nDROP TRIGGER IF EXISTS immutable_guard ON compliance_compliancecheck;\nDROP TRIGGER IF EXISTS immutable_guard ON compliance_complianceoverride;\nDROP TRIGGER IF EXISTS immutable_guard ON audit_auditlog;\nDROP TRIGGER IF EXISTS immutable_guard ON audit_configurationhistory;\nDROP TRIGGER IF EXISTS immutable_guard ON land_blockboundaryrevision;\nDROP TRIGGER IF EXISTS protect_confirmed_event ON events_event;\nDROP TRIGGER IF EXISTS protect_confirmed_sub_event ON events_subevent;\nDROP FUNCTION farm_reject_mutation();\nDROP FUNCTION farm_reject_confirmed_mutation();",
        )
    ]
