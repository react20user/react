// src/hooks > TS useOrgSetup.ts > © GetOrgSetupDataHookParams > sortType
// use-client
import { useCallback, useMemo, useState, useEffect } from 'react';
import { getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table';
import membersColumns from '@components/Opportunities/MembersList/Columns';
import constants, { filterTypes, leadStatuses, sortTypes } from '@constants';
import { useMembersData } from '@features/members/useMembersData';
import { useDebounce } from '@hooks/useDebounce';
import { useUpdateEffect } from '@hooks/useUpdateEffect';
import { useStore } from '@store';
import type { PaginatedOutput } from '@types/axios.type';
import type { FilterType } from '@types/constants.type';
import type { UseQueryResult } from '@tanstack/react-query';
import type { ColumnFilter, PaginationState, SortingState, Table } from '@tanstack/react-table';
import type { GetMembersExpandedOutput, GetOrgSetupFinalOutput, GetOrgSetupOutput, GetOrgSetupDataHookParams } from '@features/members/members.type';
import { table } from 'console';
import { all } from 'axios';
import { FilterData, useFilterStore } from '@store/useFilterStore';

export interface GetOrgSetupOutput {
  cycle: string | null;
  orgLog: string | null;
  orgCd: string | null;
  file: string | null;
  cadence: string | null;
  refresh: string | null;
  file_type: string | null;
  has_header: string | null;
  delimiter: string | null;
  custom_logic: string | null;
  engmtManager: string | null;
  acoAnalyst: string | null;
}

export interface OrgSetupHookOutput {
  membersDataHookData: UseQueryResult<PaginatedOutput<GetOrgSetupFinalOutput> | undefined>;
  table: Table<GetOrgSetupOutput>;
}

export type OrgSetupHook = () => OrgSetupHookOutput;

export const useOrgSetup: OrgSetupHook = () => {
  const [allData, setAllData] = useState<GetOrgSetupOutput[]>([]);
  const [lastCursor, setLastCursor] = useState<{ last_dx_cycle: string; last_org_log: string; } | undefined>(undefined);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'cycle', desc: true }]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: constants.DEFAULT_LIMIT_FOR_ORGSETUP,
  });

  const { currentFiltersApplied, updateCurrentFilters, fetchFilteredFilesCount, totalFilesBeingShown, totalFiles } = useFilterStore();

  const derivedColumnFilters = useMemo<ColumnFilter[]>(() => {
    return Object.entries(currentFiltersApplied).map(([id, value]) => ({
      id,
      value: value || [],
    }));
  }, [currentFiltersApplied]);

  useUpdateEffect(() => {
    const areFiltersDifferent = Object.entries(currentFiltersApplied).some(([key, value]) => value.length > 0);
    if (areFiltersDifferent || allFiltersEmpty) {
      fetchFilteredFilesCount(currentFiltersApplied);
    }
  }, [currentFiltersApplied]);

  useEffect(() => {
    if (newData?.length > 0) {
      setAllData((prev) => [...prev, ...newData]);
    }
  }, [membersDataHookData.data?.data]);

  useUpdateEffect(() => {
    useFilterStore.setState({ totalFilesBeingShown: allData.length });
  }, [allData]);

  const handlePaginationData = useCallback(() => {
    const start = pagination.pageIndex * pagination.pageSize;
    const end = start + pagination.pageSize;
    return allData.slice(start, end);
  }, [pagination, allData]);

  const tablerows = useMemo(() => handlePaginationData(), [handlePaginationData]);

  const rowCount = allData.length;

  const table = useReactTable({
    data: tablerows ?? [],
    columns: orgSetupColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      columnFilters: derivedColumnFilters,
      pagination,
    },
    manualSorting: true,
    onSortingChange: setSorting,
    manualFiltering: true,
    onColumnFiltersChange: (updater) => {
      let newFiltersArray: ColumnFilter[];
      if (typeof updater === 'function') {
        newFiltersArray = updater(derivedColumnFilters);
      } else {
        newFiltersArray = updater;
      }
      const newFiltersObject = newFiltersArray.reduce<Partial<FilterData>>((acc, filter) => {
        acc[filter.id as keyof FilterData] = filter.value as string[];
        return acc;
      }, {});
      updateCurrentFilters(newFiltersObject);
    },
    manualPagination: true,
    onPaginationChange: setPagination,
    rowCount: rowCount,
  });

  useEffect(() => {
    handlePaginationData();
  }, [pagination]);

  useEffect(() => {
    if (end > allData.length && allData.length < totalFiles) {
      setPagination((prev) => ({ ...prev, pageIndex: prev.pageIndex + 1 }));
    }
  }, [pagination, allData, totalFiles]);

  return { membersDataHookData, table };
};