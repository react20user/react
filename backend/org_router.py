# app/routers/org_setup.py

from fastapi import APIRouter, Query, Depends, HTTPException
from typing import Optional, List
from pydantic import BaseModel
from ..schemas.org_setup import OrgSetupResponse, PaginatedOrgSetupResponse
from ..services.bigquery_service import execute_query
from ..services.org_setup_service import get_org_setup_files
from ..dependencies import get_bigquery_client  # Optional if service handles it

org_setup_router = APIRouter(prefix="/api/org-setup", tags=["Org Setup"])

@org_setup_router.get("/", responses={404: {"description": "Not found"}, 500: {"description": "Internal server error"}})
async def get_org_setup(
    cycle: Optional[List[str]] = Query(None),
    org_log: Optional[List[str]] = Query(None),
    org_cd: Optional[List[str]] = Query(None),
    engmt_manager: Optional[List[str]] = Query(None),
    aco_analyst: Optional[List[str]] = Query(None),
    limit: Optional[int] = Query(500, ge=1, le=800),
    last_dx_cycle: Optional[int] = Query(None),
    last_org_log: Optional[str] = Query(None),
):
    """Fetch paginated org setup details using keyset pagination.
    Ordered by dx_cycle DESC, org_log ASC.
    """
    base_query = "SELECT * FROM `anbc-hcb-dev.vbc_dtxp_hcb_dev.vbc_parm_dtxp_hist_v`"
    filters = []

    if org_log:
        org_log_values = ", ".join(f"'{val}'" for val in org_log)
        filters.append(f"org_log IN ({org_log_values})")

    if org_cd:
        org_cd_conditions = " OR ".join(f"org_cd LIKE '%{val}%'" for val in org_cd)
        filters.append(f"({org_cd_conditions})")

    if cycle:
        cycle_values = ", ".join(str(int(c)) for c in cycle)
        filters.append(f"dx_cycle IN ({cycle_values})")

    if engmt_manager:
        engmt_manager_values = ", ".join(f"'{val}'" for val in engmt_manager)
        filters.append(f"engmt_manager IN ({engmt_manager_values})")

    if aco_analyst:
        aco_analyst_values = ", ".join(f"'{val}'" for val in aco_analyst)
        filters.append(f"aco_analyst IN ({aco_analyst_values})")

    # Keyset pagination condition
    if last_dx_cycle is not None and last_org_log is not None:
        filters.append(f"(dx_cycle < {last_dx_cycle} OR (dx_cycle = {last_dx_cycle} AND org_log > '{last_org_log}'))")

    if filters:
        base_query += f" WHERE {' AND '.join(filters)}"

    base_query += " ORDER BY dx_cycle DESC, org_log ASC"
    base_query += f" LIMIT {limit}"

    print("Executing query:", base_query)

    try:
        results = execute_query(base_query)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to execute query: {str(e)}",
        )

    if not results:
        raise HTTPException(status_code=404, detail="No org setups found")

    # Flatten and convert to OrgSetupResponse
    all_org_setup_responses = []
    for item in results:
        org_setup_responses = [
            OrgSetupResponse(**response)
            for response in get_org_setup_files(item)
        ]
        all_org_setup_responses.extend(org_setup_responses)

    return PaginatedOrgSetupResponse(
        data=all_org_setup_responses,
        total=len(all_org_setup_responses),  # Or fetch total separately for efficiency
        limit=limit,
    )

@org_setup_router.get("/total-files-count")
async def get_org_setup_total_files():
    return 150000  # Static from code; make dynamic if needed




# app/services/org_setup_service.py

from typing import Dict, List, Any

def get_org_setup_files(record: Dict[str, Any]) -> List[Dict[str, Any]]:
    files: List[Dict[str, Any]] = []

    # Claims
    if 'claims' in record:
        file_info_base = file_info.copy()
        # Add additional shared fields
        file_info_base.update({
            'cadence': 'Monthly',
            'refresh': get_refresh(record['incremental'] if value in ['Y', 'O'] else 'No'),
            'has_header': 'Yes' if value in ['H', 'S'] else 'No',
            'cycle': record.get('dx_cycle'),
            'org_log': record.get('org_log'),
            'org_cd': record.get('org_cd'),
            'engmt_manager': record.get('engmt_manager'),
            'aco_analyst': record.get('aco_analyst'),
        })
        files.append(file_info_base)

    # Enroll
    elif 'enroll' in record:
        file_info_base = file_info.copy()
        file_info_base.update({
            'cadence': 'Monthly',
            'refresh': 'Full',
            'file': 'Enrollment / COE6',
            'delimiter': record.get('enroll_del', 'NA'),
            'cycle': record.get('dx_cycle'),
            'org_log': record.get('org_log'),
            'org_cd': record.get('org_cd'),
            'engmt_manager': record.get('engmt_manager'),
            'aco_analyst': record.get('aco_analyst'),
        })
        files.append(file_info_base)

    # Rx
    elif 'rx' in record:
        file_info_base = file_info.copy()
        if value in ['Y', 'H', 'S']:
            file_info_base['cadence'] = 'Monthly'
            file_info_base['refresh'] = get_refresh(value)
        elif value in ['W', 'WS']:
            file_info_base['cadence'] = 'Weekly'
            file_info_base['refresh'] = get_refresh(value)
        elif value in ['DHI', 'DHF']:
            file_info_base['cadence'] = 'Daily'
            file_info_base['refresh'] = 'Incremental'
        else:
            file_info_base['cadence'] = 'Monthly'
            file_info_base['refresh'] = 'Incremental'
        file_info_base['has_header'] = 'Yes' if value in ['H', 'S', 'HS', 'DHI', 'DHF'] else 'No'
        file_info_base.update({
            'cycle': record.get('dx_cycle'),
            'org_log': record.get('org_log'),
            'org_cd': record.get('org_cd'),
            'engmt_manager': record.get('engmt_manager'),
            'aco_analyst': record.get('aco_analyst'),
        })
        files.append(file_info_base)

    # Lab
    elif 'lab' in record:
        file_info_base = file_info.copy()
        if value in ['Y', 'H', 'S']:
            file_info_base['cadence'] = 'Monthly'
            file_info_base['refresh'] = get_refresh(value)
        elif value in ['DHI', 'DHF']:
            file_info_base['cadence'] = 'Daily'
            file_info_base['refresh'] = 'Incremental'
        else:
            file_info_base['cadence'] = 'Monthly'
            file_info_base['refresh'] = 'Incremental'
        file_info_base['has_header'] = 'Yes' if value in ['H', 'S', 'DHI', 'DHF'] else 'No'
        file_info_base.update({
            'cycle': record.get('dx_cycle'),
            'org_log': record.get('org_log'),
            'org_cd': record.get('org_cd'),
            'engmt_manager': record.get('engmt_manager'),
            'aco_analyst': record.get('aco_analyst'),
        })
        files.append(file_info_base)

    # Case
    elif 'case' in record:
        file_info_base = file_info.copy()
        file_info_base['file'] = 'Medical Case'
        file_info_base['has_header'] = 'Yes' if value in ['H'] else 'No'
        file_info_base['cadence'] = 'Monthly'
        file_info_base['refresh'] = 'Full'
        file_info_base.update({
            'cycle': record.get('dx_cycle'),
            'org_log': record.get('org_log'),
            'org_cd': record.get('org_cd'),
            'engmt_manager': record.get('engmt_manager'),
            'aco_analyst': record.get('aco_analyst'),
        })
        files.append(file_info_base)

    # Elig6
    elif 'elig6' in record:
        file_info_base = file_info.copy()
        if value in ['Y', 'T', 'X', 'Z', 'TZ']:
            file_info_base['has_header'] = 'Yes'
        else:
            file_info_base['has_header'] = 'No'
        if value in ['WX', 'WT', 'WY']:
            file_info_base['has_header'] = 'No'
        file_info_base['cadence'] = 'Weekly'
        file_info_base['refresh'] = 'Full'
        file_info_base.update({
            'cycle': record.get('dx_cycle'),
            'org_log': record.get('org_log'),
            'org_cd': record.get('org_cd'),
            'engmt_manager': record.get('engmt_manager'),
            'aco_analyst': record.get('aco_analyst'),
        })
        files.append(file_info_base)

    # Cap
    elif 'cap' in record:
        file_info_base = file_info.copy()
        file_info_base['has_header'] = 'No'
        file_info_base['cadence'] = 'Monthly'
        file_info_base['refresh'] = get_refresh(value)
        file_info_base.update({
            'cycle': record.get('dx_cycle'),
            'org_log': record.get('org_log'),
            'org_cd': record.get('org_cd'),
            'engmt_manager': record.get('engmt_manager'),
            'aco_analyst': record.get('aco_analyst'),
        })
        files.append(file_info_base)

    # Claims Xwalk
    elif 'claims_xwalk' in record:
        file_info_base = file_info.copy()
        file_info_base['has_header'] = 'Yes' if value == 'H' else 'No'
        file_info_base['cadence'] = 'Monthly'
        file_info_base['refresh'] = get_refresh(value)
        file_info_base.update({
            'cycle': record.get('dx_cycle'),
            'org_log': record.get('org_log'),
            'org_cd': record.get('org_cd'),
            'engmt_manager': record.get('engmt_manager'),
            'aco_analyst': record.get('aco_analyst'),
        })
        files.append(file_info_base)

    # GIC
    elif 'gic' in record:
        file_info_base = file_info.copy()
        file_info_base['file'] = 'Commercial Gaps in Care'
        file_info_base['cadence'] = 'Monthly'
        file_info_base['has_header'] = 'No'
        file_info_base['refresh'] = 'Full'
        # Check elig_ftp_tag for special conditions
        elig_ftp_tag = record.get('elig_ftp_tag')
        if elig_ftp_tag not in ['', None, 'null']:
            file_info_base['file'] = 'Clinical Reporting Package'
        file_info_base.update({
            'cycle': record.get('dx_cycle'),
            'org_log': record.get('org_log'),
            'org_cd': record.get('org_cd'),
            'engmt_manager': record.get('engmt_manager'),
            'aco_analyst': record.get('aco_analyst'),
        })
        files.append(file_info_base)

    # DNS
    elif 'dns' in record:
        file_info_base = file_info.copy()
        file_info_base['file'] = 'Premium / MNR'
        file_info_base['has_header'] = 'Yes'
        file_info_base['cadence'] = 'Monthly'
        file_info_base['refresh'] = 'Full'
        file_info_base.update({
            'cycle': record.get('dx_cycle'),
            'org_log': record.get('org_log'),
            'org_cd': record.get('org_cd'),
            'engmt_manager': record.get('engmt_manager'),
            'aco_analyst': record.get('aco_analyst'),
        })
        files.append(file_info_base)

    # Provider
    elif 'provider' in record:
        file_info_base = file_info.copy()
        file_info_base['file'] = 'Provider'
        file_info_base['has_header'] = 'Yes' if value in ['Y', 'P'] else 'No'
        file_info_base['cadence'] = 'Monthly'
        file_info_base['refresh'] = 'Full'
        file_info_base.update({
            'cycle': record.get('dx_cycle'),
            'org_log': record.get('org_log'),
            'org_cd': record.get('org_cd'),
            'engmt_manager': record.get('engmt_manager'),
            'aco_analyst': record.get('aco_analyst'),
        })
        files.append(file_info_base)

    # Code
    elif 'code' in record:
        file_info_base = file_info.copy()
        file_info_base = file_info.copy()

    # Use mapping for file names if needed
    file_map = {
        'D': 'MORS-D',
        'E': 'MORS-E-G',
        'J': 'MORS-J',
        'M': 'MORS-M',
        'W': 'MORS-W',
        'L': 'MORS-L',
        'A': 'NAOA'
    }
    # Apply similar logic for other columns as per images...

    return files

def get_refresh(default='Incremental'):
    # Helper to determine refresh based on logic
    return default  # Expand as per code