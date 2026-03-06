"""
Lambda: data_ingestion
-----------------------
Triggered by: Manual invoke or S3 event
Does: Reads CSVs from S3 bucket, writes records to DynamoDB tables

Environment variables:
  S3_BUCKET    = tender-trace-data
  S3_PREFIX    = raw/            (set to "" if files are at bucket root)
  TABLE_PREFIX = tender-trace-
"""

import json
import os
import csv
import io
import boto3
from decimal import Decimal

# ─── CONFIG ───────────────────────────────────────────────────────────
S3_BUCKET    = os.getenv("S3_BUCKET", "tender-trace-data")
S3_PREFIX    = os.getenv("S3_PREFIX", "raw/")
TABLE_PREFIX = os.getenv("TABLE_PREFIX", "tender-trace-")

s3_client = boto3.client("s3")
dynamodb   = boto3.resource("dynamodb")

# ─── TABLE KEY DEFINITIONS ────────────────────────────────────────────
# Maps table name → list of required key fields (PK, and SK if composite)
TABLE_KEYS = {
    "companies":   ["company_id"],
    "directors":   ["director_id"],
    "contracts":   ["contract_id"],
    "politicians": ["politician_id"],
    "edges":       ["from_id", "to_id_type"],
}

# ─── S3 CSV READER ────────────────────────────────────────────────────

def read_csv_from_s3(filename):
    """Read a CSV file from S3 and return list of dicts."""
    key = f"{S3_PREFIX}{filename}"
    print(f"[S3] Reading s3://{S3_BUCKET}/{key}")
    obj     = s3_client.get_object(Bucket=S3_BUCKET, Key=key)
    content = obj["Body"].read().decode("utf-8")
    rows    = list(csv.DictReader(io.StringIO(content)))
    print(f"[S3] Got {len(rows)} rows from {filename}")
    # Log first row headers for debugging
    if rows:
        print(f"[S3] Column names: {list(rows[0].keys())}")
        print(f"[S3] Sample row: {rows[0]}")
    return rows

# ─── DEDUPLICATION ────────────────────────────────────────────────────

def deduplicate(items, key):
    """Remove duplicate items by a single primary key field."""
    seen = set()
    unique = []
    for item in items:
        k = item.get(key, "").strip()
        if not k:
            continue
        if k not in seen:
            seen.add(k)
            unique.append(item)
    dupes = len(items) - len(unique)
    if dupes > 0:
        print(f"[Dedup] Removed {dupes} duplicates by '{key}' (kept {len(unique)})")
    return unique

def deduplicate_composite(items, key1, key2):
    """Remove duplicate items by composite key (PK + SK)."""
    seen = set()
    unique = []
    for item in items:
        k = (item.get(key1, ""), item.get(key2, ""))
        if not k[0] or not k[1]:
            continue
        if k not in seen:
            seen.add(k)
            unique.append(item)
    dupes = len(items) - len(unique)
    if dupes > 0:
        print(f"[Dedup] Removed {dupes} composite duplicates by '{key1}+{key2}'")
    return unique

# ─── DYNAMODB WRITER ──────────────────────────────────────────────────

def clean_item(raw_item):
    """Convert CSV row dict to DynamoDB-safe item.
    - Removes empty/None values (DynamoDB rejects empty strings as keys)
    - Converts numeric strings to int/Decimal
    """
    clean = {}
    for k, v in raw_item.items():
        if v is None or v.strip() == "":
            continue
        v = v.strip()
        # Try int first, then Decimal for floats
        try:
            if "." in v:
                clean[k] = Decimal(v)
            elif v.lstrip("-").isdigit():
                clean[k] = int(v)
            else:
                clean[k] = v
        except (ValueError, ArithmeticError):
            clean[k] = v
    return clean

def write_to_dynamodb(table_name, items):
    """Batch write items to a DynamoDB table with key validation."""
    full_table_name = f"{TABLE_PREFIX}{table_name}"
    table = dynamodb.Table(full_table_name)
    required_keys = TABLE_KEYS.get(table_name, [])

    print(f"[DynamoDB] Writing to {full_table_name} (required keys: {required_keys})")

    written = 0
    skipped = 0

    with table.batch_writer() as batch:
        for raw_item in items:
            item = clean_item(raw_item)

            # Validate: all required key fields must exist and be non-empty
            missing = [k for k in required_keys if not item.get(k)]
            if missing:
                skipped += 1
                if skipped <= 3:  # Log first 3 skips only
                    print(f"[DynamoDB] SKIP: missing keys {missing} in item: {item}")
                continue

            batch.put_item(Item=item)
            written += 1

    print(f"[DynamoDB] {full_table_name}: wrote {written}, skipped {skipped}")
    return written

# ─── BUILD EDGES ──────────────────────────────────────────────────────

def build_edges(companies, directors, politicians):
    """Build edge records for adjacency-list graph model in DynamoDB."""
    edges = []

    # COMPANY → ADDRESS edges (for FLAG_SHARED_ADDRESS detection)
    for c in companies:
        addr = c.get("registered_address", "").strip()
        if c.get("company_id") and addr:
            edges.append({
                "from_id":     c["company_id"],
                "to_id_type":  f"ADDR#{addr}",
                "edge_type":   "AT_ADDRESS",
                "address":     addr,
            })

    # COMPANY → DIRECTOR edges (for FLAG_SHARED_DIRECTOR detection)
    for d in directors:
        cid = d.get("company_id", "").strip()
        did = d.get("director_id", "").strip()
        if cid and did:
            edges.append({
                "from_id":        cid,
                "to_id_type":     f"DIR#{did}",
                "edge_type":      "HAS_DIRECTOR",
                "director_name":  d.get("name", ""),
                "din":            d.get("din", ""),
            })

    # POLITICIAN → DIRECTOR edges (for FLAG_POLITICAL_LINK detection)
    for p in politicians:
        related_din = p.get("related_din", "").strip()
        pid = p.get("politician_id", "").strip()
        if related_din and pid and p.get("relation", "") != "self":
            edges.append({
                "from_id":          f"POL#{pid}",
                "to_id_type":       f"DIN#{related_din}",
                "edge_type":        "FAMILY_OF",
                "politician_name":  p.get("name", ""),
                "relation":         p.get("relation", ""),
                "party":            p.get("party", ""),
                "constituency":     p.get("constituency", ""),
            })

    print(f"[Edges] Built {len(edges)} edge records")
    return edges

# ─── LAMBDA HANDLER ───────────────────────────────────────────────────

def lambda_handler(event, context):
    print("=" * 60)
    print("[data_ingestion] Starting S3 CSV → DynamoDB ingestion")
    print(f"[config] S3_BUCKET={S3_BUCKET}")
    print(f"[config] S3_PREFIX={S3_PREFIX}")
    print(f"[config] TABLE_PREFIX={TABLE_PREFIX}")
    print("=" * 60)

    results = {}

    try:
        # Step 1: Read all CSVs from S3
        print("\n--- STEP 1: Reading CSVs from S3 ---")
        companies   = read_csv_from_s3("companies.csv")
        directors   = read_csv_from_s3("directors.csv")
        contracts   = read_csv_from_s3("contracts.csv")
        politicians = read_csv_from_s3("politicians.csv")

        # Step 2: Deduplicate (directors appear in multiple companies, etc.)
        print("\n--- STEP 2: Deduplicating records ---")
        companies   = deduplicate(companies,   "company_id")
        directors   = deduplicate(directors,   "director_id")
        contracts   = deduplicate(contracts,   "contract_id")
        politicians = deduplicate(politicians, "politician_id")

        # Step 3: Write entity tables
        print("\n--- STEP 3: Writing to DynamoDB tables ---")
        results["companies"]   = write_to_dynamodb("companies",   companies)
        results["directors"]   = write_to_dynamodb("directors",   directors)
        results["contracts"]   = write_to_dynamodb("contracts",   contracts)
        results["politicians"] = write_to_dynamodb("politicians", politicians)

        # Step 4: Build, deduplicate, and write graph edges
        print("\n--- STEP 4: Building and writing edge records ---")
        edges = build_edges(companies, directors, politicians)
        edges = deduplicate_composite(edges, "from_id", "to_id_type")
        results["edges"] = write_to_dynamodb("edges", edges)

        total = sum(results.values())
        print("\n" + "=" * 60)
        print(f"[data_ingestion] COMPLETE: {total} total records across 5 tables")
        print(f"[breakdown] {results}")
        print("=" * 60)

        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Ingestion complete",
                "records_written": results,
                "total": total,
            }),
        }

    except Exception as e:
        print(f"\n[data_ingestion] FATAL ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "statusCode": 500,
            "body": json.dumps({
                "error": str(e),
                "hint": "Check CloudWatch logs for full traceback",
            }),
        }
