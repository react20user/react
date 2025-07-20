import { useState, useEffect, useCallback } from 'react';
import {
  ColumnFilter,
  ColumnFiltersState,
  PaginationState,
  SortingState,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import useOrgSetupData from '@/hooks/useOrgSetupData'; // Adjust path
import { orgSetupColumns } from '@/components/OrgSetup/Columns'; // Adjust path
import constants from '@/constants'; // Adjust path
// Assume other imports as in original (e.g., types, stores)

export type OrgSetupHook = () => {
  membersDataHookData: GetOrgSetupFinalOutput | undefined;
  table: Table<GetOrgSetupOutput>;
};

export interface GetOrgSetupDataHookParams {
  search: string;
  limit: number;
  bgRowLimit: number;
  cycle: string[];
  orgLog: string[];
  orgCd: string[];
  engmtManager: string[];
  acoAnalyst: string[];
  sortBy: string;
  sortType: 'ASC' | 'DESC';
  lastCursor: { last_dx_cycle?: string; last_org_log?: string };
}

export const useOrgSetup: OrgSetupHook = () => {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: constants.DEFAULT_PAGE, // 1 (1-based)
    pageSize: constants.DEFAULT_LIMIT_FOR_ORGSETUP,
  });

  const [sorting, setSorting] = useState<SortingState>([
    { id: 'cycle', desc: true },
  ]);

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const [allData, setAllData] = useState<GetOrgSetupOutput[]>([]);

  const [lastCursor, setLastCursor] = useState<{ last_dx_cycle?: string; last_org_log?: string }>({});

  const [totalRecords, setTotalRecords] = useState(0);

  // Reset on filter or sorting change
  useEffect(() => {
    setAllData([]);
    setLastCursor({});
    setPagination((prev) => ({ ...prev, pageIndex: 1 }));
    setTotalRecords(0);
  }, [JSON.stringify(columnFilters), JSON.stringify(sorting)]);

  const membersParams = useMemo<GetOrgSetupDataHookParams>(() => {
    const colFilters = columnFilters.reduce((acc, { id, value }) => {
      const valArray = typeof value === 'string' && Array.isArray(value) ? value : (value ? [value] : []);
      switch (id) {
        case 'cycle': return { ...acc, cycle: valArray };
        case 'orgLog': return { ...acc, orgLog: valArray };
        case 'orgCd': return { ...acc, orgCd: valArray };
        case 'engmtManager': return { ...acc, engmtManager: valArray };
        case 'acoAnalyst': return { ...acc, acoAnalyst: valArray };
        default: return acc;
      }
    }, {
      cycle: [],
      orgLog: [],
      orgCd: [],
      engmtManager: [],
      acoAnalyst: [],
    });

    const { id: sortBy = 'cycle', desc = true } = sorting[0] || {};

    return {
      search: '',
      limit: pagination.pageSize,
      bgRowLimit: 0,
      ...colFilters,
      sortBy,
      sortType: desc ? 'DESC' : 'ASC',
      lastCursor,
    };
  }, [columnFilters, sorting, pagination.pageSize, lastCursor]);

  const membersDataHookData = useOrgSetupData(membersParams);

  // Set or append
  useEffect(() => {
    if (membersDataHookData.data) {
      const { data: newData, total } = membersDataHookData.data;
      setTotalRecords(total);
      if (Object.keys(lastCursor).length === 0) {
        setAllData(newData);
      } else {
        setAllData((prev) => [...prev, ...newData]);
      }
    }
  }, [membersDataHookData.data]);

  // Trigger load more if needed for current page (handles jumps)
  useEffect(() => {
    const start = (pagination.pageIndex - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;

    if (
      end > allData.length &&
      allData.length < totalRecords &&
      !membersDataHookData.isLoading &&
      allData.length > 0
    ) {
      const lastRecord = allData[allData.length - 1];
      const newCursor = {
        last_dx_cycle: lastRecord.cycle,
        last_org_log: lastRecord.orgLog,
      };

      // Avoid redundant set
      if (
        newCursor.last_dx_cycle !== lastCursor.last_dx_cycle ||
        newCursor.last_org_log !== lastCursor.last_org_log
      ) {
        setLastCursor(newCursor);
      }
    }
  }, [allData, pagination, totalRecords, membersDataHookData.isLoading]);

  const tableRows = useMemo(() => {
    const start = (pagination.pageIndex - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return allData.slice(start, end);
  }, [allData, pagination]);

  const table = useReactTable({
    data: tablerows ?? [],
    columns: orgSetupColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    rowCount: Math.ceil(totalRecords / pagination.pageSize), // Use total for pagination UI
    manualSorting: true,
    onSortingChange: setSorting,
    manualPagination: true,
    onPaginationChange: setPagination,
    manualFiltering: true,
    onColumnFiltersChange: setColumnFilters,
    state: {
      pagination: {
        ...pagination,
        pageIndex: pagination.pageIndex - 1, // Convert to 0-based for table
      },
      columnFilters,
      sorting,
    },
  });

  return { membersDataHookData: membersDataHookData, table };
};