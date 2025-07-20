// @ts-nocheck
'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import { getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table';
import { orgSetupColumns } from '@/components/OrgSetup/Columns';  // Adjusted based on screenshots; update if needed
import constants, { sortTypes } from '@/constants';
import { useOrgSetupData } from '@/features/orgsetup/useOrgSetupData';  // Assuming this is the query hook
import type { PaginationState, SortingState, ColumnFilter, Table } from '@tanstack/react-table';
import type { PaginatedOutput } from '@/types/axios.types';
import type { UseQueryResult } from '@tanstack/react-query';
import { useFilterStore } from '@/store/useFilterStore';  // Assuming from screenshots

// Interfaces from screenshots
export interface GetOrgSetupDataHookParams {
  page?: number;
  limit: number;
  bgRowLimit?: number;
  cycle: string[];
  orgLog: string[];
  orgCd: string[];
  engmtManager: string[];
  acoAnalyst: string[];
  sortBy: string;
  sortType: string;
  lastCursor?: { dx_cycle?: string; last_org_log?: string };
}

interface GetOrgSetupOutput {
  cycle: string | null;
  orgLog: string | null;
  orgCd: string | null;
  engmtManager: string | null;
  acoAnalyst: string | null;
  file?: string | null;
  refresh?: string | null;
  file_type?: string | null;
  has_header?: string | null | boolean; // or boolean if needed
  delimiter?: string | null;
  custom_logic?: string | null;
}

interface GetOrgSetupFinalOutput {
  data: GetOrgSetupOutput[];
  total: number;
  limit: number;
}

export type OrgSetupHookOutput {
  membersDataHookData: UseQueryResult<PaginatedOutput<GetOrgSetupFinalOutput>>;
  table: Table<GetOrgSetupOutput>;
}

export type OrgSetupHook = () => OrgSetupHookOutput;

export const useOrgSetup: OrgSetupHook = () => {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: constants.DEFAULT_PAGE,
    pageSize: 200, // Updated default to 200
  });

  const [sorting, setSorting] = useState<SortingState>([
    { id: 'cycle', desc: true },
  ]);

  const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([]);

  const [allData, setAllData] = useState<GetOrgSetupOutput[]>([]);
  const [lastCursor, setLastCursor] = useState<{ dx_cycle?: string; last_org_log?: string } | undefined>(undefined);
  const [totalRecords, setTotalRecords] = useState(0);

  // OPTIMIZE: Memoize initial state
  const colFiltersInitialState = useMemo(() => ({
    cycle: [],
    orgLog: [],
    orgCd: [],
    engmtManager: [],
    acoAnalyst: [],
  }), []);

  const membersParams = useMemo(() => {
    const colFilters = columnFilters.reduce((acc, val) => {
      const id = val.id;
      const value = val.value as string | string[];
      const valueArrayType = Array.isArray(value) ? value : (value ? [value] : []);
      switch (id) {
        case 'cycle':
          acc.cycle = valueArrayType;
          break;
        case 'orgLog':
          acc.orgLog = valueArrayType;
          break;
        case 'orgCd':
          acc.orgCd = valueArrayType;
          break;
        case 'engmtManager':
          acc.engmtManager = valueArrayType;
          break;
        case 'acoAnalyst':
          acc.acoAnalyst = valueArrayType;
          break;
        default:
          break;
      }
      return acc;
    }, { ...colFiltersInitialState });

    const { id, desc } = sorting[0] ?? { id: 'cycle', desc: true };

    return {
      limit: pagination.pageSize,
      ...colFilters,
      sortBy: id,
      sortType: desc ? sortTypes.DESC : sortTypes.ASC,
      ...(lastCursor ? { lastCursor } : {}), // FIX: Only include lastCursor if defined to avoid undefined in query params
    };
  }, [columnFilters, sorting, pagination.pageSize, lastCursor, colFiltersInitialState]);

  const membersDataHookData = useOrgSetupData(membersParams);

  // FIX: Reset allData, lastCursor, and totalRecords on filter or sorting changes
  useEffect(() => {
    setAllData([]);
    setLastCursor(undefined);
    setTotalRecords(0);
  }, [columnFilters, sorting]);

  // FIX: Extend dependency to sorting so page resets on sort change
  useEffect(() => {
    setPagination({
      pageIndex: constants.DEFAULT_PAGE,
      pageSize: 200, // Updated default to 200
    });
  }, [columnFilters, sorting]);

  // Update totalRecords from fetch
  useEffect(() => {
    if (membersDataHookData.data?.total) {
      setTotalRecords(membersDataHookData.data.total);
    }
  }, [membersDataHookData.data?.total]);

  // FIX/OPTIMIZE: Append only if data is present
  useEffect(() => {
    const newData = membersDataHookData?.data?.data ?? [];
    if (newData.length > 0) {
      setAllData((prev) => lastCursor ? [...prev, ...newData] : newData); // FIX: replace if no lastCursor
    }
  }, [membersDataHookData.data, lastCursor]);

  const handlePaginationData = useCallback(() => {
    const start = (pagination.pageIndex - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    if (end > allData.length && allData.length < totalRecords) {
      const lastRecord = allData[allData.length - 1];
      if (lastRecord) {
        setLastCursor({
          dx_cycle: lastRecord.cycle,
          last_org_log: lastRecord.orgLog,
        });
      }
    }
  }, [pagination, allData, totalRecords]);

  useEffect(() => {
    handlePaginationData();
  }, [handlePaginationData]);

  const tableRows = useMemo(() => {
    const start = (pagination.pageIndex - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return allData.slice(start, end);
  }, [allData, pagination]);

  const table = useReactTable({
    data: tableRows,
    columns: orgSetupColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    rowCount: allData.length, // Updated: use allData.length for rowCount
    manualSorting: true,
    onSortingChange: setSorting,
    manualPagination: true,
    onPaginationChange: setPagination,
    manualFiltering: true,
    onColumnFiltersChange: setColumnFilters,
    state: {
      pagination: {
        ...pagination,
        pageIndex: pagination.pageIndex - 1,  // 0-based for table
      },
      columnFilters,
      sorting,
    },
  });

  // Update filter store if needed
  useEffect(() => {
    useFilterStore.setState({ totalFilesBeingShown: allData.length });
  }, [allData.length]);

  return { membersDataHookData, table };
};