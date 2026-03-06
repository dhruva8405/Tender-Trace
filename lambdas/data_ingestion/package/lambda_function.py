"""
Lambda: data_ingestion
-----------------------
Triggered by: S3 ObjectCreated event on Tender Trace-processed/
Does: Reads CSVs from S3, builds Neptune graph (nodes + edges)
On March 7: Deploy this to Lambda, attach to S3 event trigger
Locally: Run main() directly with LOCAL_MODE=True
"""

import json
import os
import csv
import io
import boto3

# ─── CONFIG ───────────────────────────────────────────────────────
LOCAL_MODE = os.getenv("LOCAL_MODE", "true").lower() == "true"
S3_BUCKET  = os.getenv("S3_BUCKET", "Tender Trace-processed")
NEPTUNE_ENDPOINT = os.getenv("NEPTUNE_ENDPOINT", "localhost")  # fill on March 7
DATA_DIR   = os.path.join(os.path.dirname(__file__), "../../data")

# ─── NEPTUNE CLIENT (real, used on March 7) ────────────────────────
def get_neptune_client():
    from gremlin_python.structure.graph import Graph
    from gremlin_python.driver.driver_remote_connection import DriverRemoteConnection
    graph = Graph()
    conn = DriverRemoteConnection(
        f"wss://{NEPTUNE_ENDPOINT}:8182/gremlin", "g"
    )
    return graph.traversal().withRemote(conn)

# ─── LOCAL GRAPH (networkx, used for testing pre-March 7) ─────────
def build_local_graph(companies, directors, contracts, politicians):
    import networkx as nx
    G = nx.MultiDiGraph()

    for c in companies:
        G.add_node(c["company_id"], label="Company", **c)

    for d in directors:
        node_id = d["director_id"]
        if node_id not in G:
            G.add_node(node_id, label="Director",
                       name=d["name"], din=d.get("din",""))
        G.add_edge(d["company_id"], node_id, label="HAS_DIRECTOR")

    # Address nodes
    seen_addresses = {}
    for c in companies:
        addr = c["registered_address"]
        if addr not in seen_addresses:
            addr_id = f"ADDR_{len(seen_addresses)}"
            G.add_node(addr_id, label="Address", address=addr)
            seen_addresses[addr] = addr_id
        G.add_edge(c["company_id"], seen_addresses[addr], label="AT_ADDRESS")

    for con in contracts:
        con_id = con["contract_id"]
        G.add_node(con_id, label="Contract", **con)
        G.add_edge(con["company_id"], con_id, label="WON_CONTRACT")

    for p in politicians:
        pol_id = p["politician_id"]
        if pol_id not in G:
            G.add_node(pol_id, label="Politician",
                       name=p["name"], party=p["party"], state=p["state"])
        related_din = p.get("related_din", "").strip()
        if related_din and p["relation"] != "self":
            # Find matching director by DIN
            for node, data in G.nodes(data=True):
                if data.get("label") == "Director" and data.get("din") == related_din:
                    G.add_edge(pol_id, node, label="FAMILY_OF",
                               relation=p["relation"])

    return G

# ─── READ CSVs ─────────────────────────────────────────────────────
def read_csv_local(filename):
    path = os.path.join(DATA_DIR, filename)
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))

def read_csv_s3(s3_client, bucket, key):
    obj = s3_client.get_object(Bucket=bucket, Key=key)
    content = obj["Body"].read().decode("utf-8")
    return list(csv.DictReader(io.StringIO(content)))

# ─── WRITE TO NEPTUNE (March 7 only) ──────────────────────────────
def ingest_to_neptune(g, companies, directors, contracts, politicians):
    """Push all entities into the Neptune graph using Gremlin."""
    for c in companies:
        (g.addV("Company")
          .property("company_id", c["company_id"])
          .property("name", c["name"])
          .property("address", c["registered_address"])
          .property("registration_date", c["registration_date"])
          .property("paid_up_capital", float(c["paid_up_capital"]))
          .next())

    for d in directors:
        # Upsert director vertex
        existing = g.V().has("Director", "din", d["din"]).toList()
        if not existing:
            g.addV("Director") \
             .property("director_id", d["director_id"]) \
             .property("name", d["name"]) \
             .property("din", d.get("din","")) \
             .next()
        # Add edge
        (g.V().has("Company", "company_id", d["company_id"])
          .addE("HAS_DIRECTOR")
          .to(g.V().has("Director", "din", d["din"]))
          .next())

    print(f"[data_ingestion] Ingested {len(companies)} companies, "
          f"{len(directors)} director links to Neptune.")

# ─── LAMBDA HANDLER ───────────────────────────────────────────────
def lambda_handler(event, context):
    if LOCAL_MODE:
        companies   = read_csv_local("companies.csv")
        directors   = read_csv_local("directors.csv")
        contracts   = read_csv_local("contracts.csv")
        politicians = read_csv_local("politicians.csv")
        G = build_local_graph(companies, directors, contracts, politicians)
        print(f"[LOCAL] Graph built: {G.number_of_nodes()} nodes, "
              f"{G.number_of_edges()} edges")
        return G
    else:
        s3 = boto3.client("s3")
        companies   = read_csv_s3(s3, S3_BUCKET, "companies.csv")
        directors   = read_csv_s3(s3, S3_BUCKET, "directors.csv")
        contracts   = read_csv_s3(s3, S3_BUCKET, "contracts.csv")
        politicians = read_csv_s3(s3, S3_BUCKET, "politicians.csv")
        g = get_neptune_client()
        ingest_to_neptune(g, companies, directors, contracts, politicians)
        return {"statusCode": 200, "body": "Ingestion complete"}

# ─── LOCAL ENTRYPOINT ──────────────────────────────────────────────
if __name__ == "__main__":
    result = lambda_handler({}, {})
    print("Graph ready:", result)
