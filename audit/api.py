from fastapi import APIRouter
from collections import Counter
from datetime import datetime
from .utils import access_cache

audit_router = APIRouter(prefix="/api/audit", tags=["Audit"])

@audit_router.get("/orgsetup-summary")
async def get_audit_summary():
    logs = access_cache.get("orgsetup", [])
    total_actions = len(logs)
    unique_users = len(set(log["user_id"] for log in logs))
    actions_per_minute = Counter(
        datetime.fromisoformat(log["timestamp"]).replace(second=0, microsecond=0).isoformat()
        for log in logs
    )
    # Return sorted list for timeseries
    actions_per_minute_list = sorted(
        [{"timestamp": ts, "count": cnt} for ts, cnt in actions_per_minute.items()],
        key=lambda x: x["timestamp"]
    )
    return {
        "total_actions": total_actions,
        "unique_users": unique_users,
        "actions_per_minute": actions_per_minute_list
    }

@audit_router.get("/orgsetup-filters")
async def get_audit_log():
    logs = access_cache.get("orgsetup", [])
    # Sort logs by timestamp for consistent ordering
    sorted_logs = sorted(logs, key=lambda x: x["timestamp"])
    return sorted_logs