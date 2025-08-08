// useOrgSetup.ts

import { useCallback, useMemo, useState, useEffect } from 'react';
import { getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table';
import { orgSetupColumns } from '@components/OrgSetup/Columns'; // Assuming this is the import for columns
import constants from '@constants';
import { useUpdateEffect } from 'react-use'; // Assuming this is the library for useUpdateEffect
import { useFilterStore, type FilterData } from '@store/useFilterStore'; // Import the store
import type { GetOrgSetupDataHookParams, GetOrgSetupOutput, OrgSetupHookOutput } from '@features/orgSetup/orgSetup.types'; // Assuming types file
import { useOrgSetupData } from '@hooks/useOrgSetupData'; // Assuming this is for data fetching, but from snippets it's inline

// Other necessary imports...
import { useNoCheck } from '@ts-nocheck'; // If needed from snippets

export const useOrgSetup: OrgSetupHook = () => {
  const { currentFiltersApplied, updateCurrentFilters, fetchFilteredFilesCount } = useFilterStore();

  const derivedColumnFilters = useMemo(
    () =>
      Object.entries(currentFiltersApplied).map(([id, value]) => ({
        id,
        value: value || [],
      })),
    [currentFiltersApplied]
  );

  const [allData, setAllData] = useState<GetOrgSetupFinalOutput[]>([]);
  const [lastCursor, setLastCursor] = useState<{ last_dx_cycle?: string; last_org_log?: string } | undefined>(undefined);
  const [totalFiles, setTotalFiles] = useState<number>(0);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: constants.DEFAULT_PAGE,
    pageSize: constants.DEFAULT_LIMIT_FOR_ORGSETUP,
  });

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: 'cycle',
      desc: true,
    },
  ]);

  const membersParams = useMemo<GetOrgSetupDataHookParams>(
    () => ({
      cycle: [],
      orgLog: [],
      orgCd: [],
      engmtManager: [],
      acoAnalyst: [],
    } as Pick<GetOrgSetupDataHookParams, 'cycle' | 'orgLog' | 'orgCd' | 'engmtManager' | 'acoAnalyst'>),
    []
  );

  const handlePaginationData = useCallback(() => {
    const start = (pagination.pageIndex - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return allData.slice(start, end);
  }, [allData, pagination]);

  useEffect(() => {
    // Fetch initial total files count
    const fetchTotal = async () => {
      try {
        const res = await fetch(`${API_BASE}/org-setup/total-files-count`);
        const data = await res.json();
        if (data.count) {
          setTotalFiles(data.count);
        }
      } catch (err) {
        console.warn('Failed to fetch total files count');
      }
    };
    fetchTotal();
  }, []);

  useUpdateEffect(() => {
    // Trigger fetchFilteredFilesCount when filters change
    if (Object.values(currentFiltersApplied).some((v) => v.length > 0)) {
      fetchFilteredFilesCount(currentFiltersApplied);
    } else {
      // Reset to total if no filters
      useFilterStore.getState().set({ filteredFilesCount: totalFiles });
    }
  }, [currentFiltersApplied, totalFiles]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let url = new URLSearchParams();
        // Build query from currentFiltersApplied and pagination/lastCursor/sorting
        Object.entries(currentFiltersApplied).forEach(([key, value]) => {
          value.forEach((v) => url.append(key, v));
        });
        if (lastCursor) {
          url.append('last_dx_cycle', lastCursor.last_dx_cycle || '');
          url.append('last_org_log', lastCursor.last_org_log || '');
        }
        if (sorting[0]) {
          url.append('sortBy', sorting[0].id);
          url.append('sortType', sorting[0].desc ? 'DESC' : 'ASC');
        }

        const res = await fetch(`${API_BASE}/org-setup?${url.toString()}&limit=${pagination.pageSize}`);
        const newData: PaginatedOutput<GetOrgSetupOutput> = await res.json();

        if (newData.data?.length) {
          setAllData((prev) => [...prev, ...newData.data]);
          setLastCursor({
            last_dx_cycle: newData.lastRecord?.cycle,
            last_org_log: newData.lastRecord?.orgLog,
          });
        }
      } catch (err) {
        console.error('Failed to fetch data', err);
      }
    };

    if (allData.length < totalFiles) {
      fetchData();
    }
  }, [pagination, sorting, currentFiltersApplied, allData.length, totalFiles]); // Dependencies

  const tablerows = useMemo(() => handlePaginationData(), [handlePaginationData]);

  const table = useReactTable<GetOrgSetupOutput>({
    data: tablerows ?? [],
    columns: orgSetupColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    rowCount: totalFiles,
    manualSorting: true,
    manualPagination: true,
    manualFiltering: true,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnFiltersChange: (updater) => {
      const newFiltersArray =
        typeof updater === 'function' ? updater(derivedColumnFilters) : updater;
      const newFiltersObject = newFiltersArray.reduce<Partial<FilterData>>(
        (acc, { id, value }) => {
          acc[id as keyof FilterData] = value as string[];
          return acc;
        },
        {}
      );
      updateCurrentFilters(newFiltersObject);
    },
    state: {
      pagination,
      sorting,
      columnFilters: derivedColumnFilters,
    },
  });

  const membersDataHookData = useMemo<UseQueryResult<PaginatedOutput<GetOrgSetupFinalOutput>> | undefined>(
    () => ({
      data: { data: allData, table },
    }),
    [allData, table]
  );

  return { membersDataHookData, table };
};