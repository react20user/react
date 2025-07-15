from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException

org_setup_router = APIRouter()

def escape_sql_string(value: str) -> str:
    """Escape single quotes for SQL string literals by doubling them."""
    return value.replace("'", "''")

@org_setup_router.get("/")
async def get_org_setup(
    cycle: Optional[List[str]] = Query(None),
    orgLog: Optional[List[str]] = Query(None),
    orgCd: Optional[List[str]] = Query(None),
    engmtManager: Optional[List[str]] = Query(None),
    acoAnalyst: Optional[List[str]] = Query(None),
    limit: int = Query(500, ge=1, le=800),
    last_dx_cycle: Optional[int] = Query(None),
    last_org_log: Optional[str] = Query(None),
):
    """
    Fetch paginated org setup details using keyset pagination.
    Ordered by dx_cycle DESC, org_log ASC.
    """
    base_query = "SELECT * FROM `anbc-hcb-dev.vbc_dtxp.hcb_dev.vbc_parm_dtxp_hist_v`"
    
    filters = []
    
    if orgLog:
        orgLog_values = ', '.join(f"'{escape_sql_string(val)}'" for val in orgLog)
        filters.append(f"org_log IN ({orgLog_values})")
    
    if orgCd:
        orgCd_conditions = ' OR '.join(f"org_in LIKE '%{escape_sql_string(val)}%'" for val in orgCd)
        filters.append(f"({orgCd_conditions})")
    
    if cycle:
        try:
            cycle_values = ', '.join(str(int(c)) for c in cycle)
            filters.append(f"dx_cycle IN ({cycle_values})")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid cycle value. Must be integers.")
    
    if engmtManager:
        engmt_values = ', '.join(f"'{escape_sql_string(val)}'" for val in engmtManager)
        filters.append(f"engmt_manager IN ({engmt_values})")
    
    if acoAnalyst:
        analyst_values = ', '.join(f"'{escape_sql_string(val)}'" for val in acoAnalyst)
        filters.append(f"aco_analyst IN ({analyst_values})")
    
    # Keyset pagination condition
    if last_dx_cycle is not None and last_org_log is not None:
        escaped_last_org_log = escape_sql_string(last_org_log)
        filters.append(
            f"(dx_cycle < {last_dx_cycle} OR (dx_cycle = {last_dx_cycle} AND org_log > '{escaped_last_org_log}'))"
        )
    
    if filters:
        base_query += " WHERE " + " AND ".join(filters)
    
    base_query += " ORDER BY dx_cycle DESC, org_log ASC"
    base_query += f" LIMIT {limit}"
    
    # TODO: Execute the query using BigQuery client and return results
    # For example:
    # from google.cloud import bigquery
    # client = bigquery.Client()
    # query_job = client.query(base_query)
    # results = query_job.result()
    # return [dict(row) for row in results]
    
    # For now, returning the built query for demonstration
    return {"query": base_query}