from fastapi import APIRouter, HTTPException
from cachetools import TTLCache
import logging
from typing import List
from ..services.bigquery_service import execute_query
from ..utils.status_codes import StatusCode  # Assuming this exists; adjust if not

filters_router = APIRouter(prefix="/api/filters", tags=["Filters"])

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cache: max 100 items, TTL = 86400 seconds (24 hours)
local_cache = TTLCache(maxsize=100, ttl=86400)

@filters_router.get("/cycle")
async def get_cycle_filters() -> List[int]:
    cache_key = "cycle_filters"
    if cache_key in local_cache:
        logger.info("Fetched cycle filters from cache")
        return local_cache[cache_key]

    query = "SELECT DISTINCT dx_cycle FROM anbc-hcb-dev.vbc_dtxp_hcb_dev.vbc_parm_dtxp_hist_v"
    try:
        results = execute_query(query)
        filtered = [row["dx_cycle"] for row in results if row["dx_cycle"] is not None]
        local_cache[cache_key] = filtered
        logger.info("Fetched cycle filters from DB and cached")
        return filtered
    except Exception as e:
        logger.error(f"Failed to execute basic query: {str(e)}")
        raise HTTPException(
            status_code=StatusCode.INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute basic query: {str(e)}",
        )

@filters_router.get("/org-log")
async def get_org_log_filters() -> List[str]:
    cache_key = "org_log_filters"
    if cache_key in local_cache:
        logger.info("Fetched org_log filters from cache")
        return local_cache[cache_key]

    query = "SELECT DISTINCT org_log FROM anbc-hcb-dev.vbc_dtxp_hcb_dev.vbc_parm_dtxp_hist_v"
    try:
        results = execute_query(query)
        filtered = [row["org_log"] for row in results if row["org_log"] is not None]
        local_cache[cache_key] = filtered
        logger.info("Fetched org_log filters from DB and cached")
        return filtered
    except Exception as e:
        logger.error(f"Failed to execute basic query: {str(e)}")
        raise HTTPException(
            status_code=StatusCode.INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute basic query: {str(e)}",
        )

@filters_router.get("/org-cd")
async def get_org_cd_filters() -> List[str]:
    cache_key = "org_cd_filters"
    if cache_key in local_cache:
        logger.info("Fetched org_cd filters from cache")
        return local_cache[cache_key]

    query = "SELECT DISTINCT org_cd FROM anbc-hcb-dev.vbc_dtxp_hcb_dev.vbc_parm_dtxp_hist_v"
    try:
        results = execute_query(query)
        filtered = [row["org_cd"] for row in results if row["org_cd"] is not None]
        local_cache[cache_key] = filtered
        logger.info("Fetched org_cd filters from DB and cached")
        return filtered
    except Exception as e:
        logger.error(f"Failed to execute basic query: {str(e)}")
        raise HTTPException(
            status_code=StatusCode.INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute basic query: {str(e)}",
        )

@filters_router.get("/engmt-manager")
async def get_engmt_manager_filters() -> List[str]:
    cache_key = "engmt_manager_filters"
    if cache_key in local_cache:
        logger.info("Fetched engmt_manager filters from cache")
        return local_cache[cache_key]

    query = "SELECT DISTINCT engmt_manager FROM anbc-hcb-dev.vbc_dtxp_hcb_dev.vbc_parm_dtxp_hist_v"
    try:
        results = execute_query(query)
        filtered = [row["engmt_manager"] for row in results if row["engmt_manager"] is not None]
        local_cache[cache_key] = filtered
        logger.info("Fetched engmt_manager filters from DB and cached")
        return filtered
    except Exception as e:
        logger.error(f"Failed to execute basic query: {str(e)}")
        raise HTTPException(
            status_code=StatusCode.INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute basic query: {str(e)}",
        )

@filters_router.get("/aco-analyst")
async def get_aco_analyst_filters() -> List[str]:
    cache_key = "aco_analyst_filters"
    if cache_key in local_cache:
        logger.info("Fetched aco_analyst filters from cache")
        return local_cache[cache_key]

    query = "SELECT DISTINCT aco_analyst FROM anbc-hcb-dev.vbc_dtxp_hcb_dev.vbc_parm_dtxp_hist_v"
    try:
        results = execute_query(query)
        filtered = [row["aco_analyst"] for row in results if row["aco_analyst"] is not None]
        local_cache[cache_key] = filtered
        logger.info("Fetched aco_analyst filters from DB and cached")
        return filtered
    except Exception as e:
        logger.error(f"Failed to execute basic query: {str(e)}")
        raise HTTPException(
            status_code=StatusCode.INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute basic query: {str(e)}",
        )