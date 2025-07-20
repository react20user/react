
export interface GetOrgSetupFinalOutput {
  data: GetOrgSetupOutput;
  total: number;
  limit: number;
}

interface OrgSetupHookOutput {
  membersDataHookData: UseQueryResult<PaginatedOutput<GetOrgSetupFinalOutput> | undefined>;
  table: Table<GetOrgSetupOutput>;
}

export type OrgSetupHook = () => OrgSetupHookOutput;

export const useOrgSetup: OrgSetupHook = () => {
  const membersParams = useMemo(() => {
    const colFilters = columnFilters.reduce((acc, val) => {
      const { id, value } = val;
      const valueArrayType = value as string[];
      return {
        ...acc,
        ...(id === 'cycle' ? { cycle: valueArrayType } : null),
        ...(id === 'orgLog' ? { orgLog: valueArrayType } : null),
        ...(id === 'orgCd' ? { orgCd: valueArrayType } : null),
        ...(id === 'engmtManager' ? { engmtManager: valueArrayType } : null),
        ...(id === 'acoAnalyst' ? { acoAnalyst: valueArrayType } : null),
      };
    }, {});

    const allFiltersEmpty = Object.values(colFilters).every((arr: string[]) => arr.length === 0);

    const { id, desc } = sorting[0] ?? {};

    return {
      ...colFilters,
      ...(allFiltersEmpty ? { limit: 100 } : {}),
      ...lastCursor,
      sortBy: id,
      sortType: desc === undefined ? sortTypes.DESC : desc ? sortTypes.DESC : sortTypes.ASC,
    };
  }, [columnFilters, lastCursor, sorting]);

  const membersDataHookData = useOrgSetupData({ ...membersParams });
  const { data: fetchedData } = membersDataHookData; // Assuming fetchedData = { data: array, total: number }

  const [allData, setAllData] = useState<GetOrgSetupOutput[]>([]);
  const [lastCursor, setLastCursor] = useState<{ last_dx_cycle?: string; last_org_log?: string }>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([]);
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: 'cycle',
      desc: true,
    },
  ]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: constants.DEFAULT_PAGE,
    pageSize: constants.DEFAULT_LIMIT_FOR_ORGSETUP,
  });

  const totalFiles = useFilterStore((state) => state.totalFiles);

  // Update totalFiles from fetch (assuming server returns total)
  useEffect(() => {
    if (fetchedData?.total) {
      useFilterStore.setState({ totalFiles: fetchedData.total });
    }
  }, [fetchedData?.total]);

  // Append new data on fetch completion
  useEffect(() => {
    if (fetchedData?.data) {
      setAllData((prev) => [...prev, ...fetchedData.data]);
    }
  }, [fetchedData?.data]);

  // Reset allData, lastCursor, and pagination on filters or sorting change
  useEffect(() => {
    setAllData([]);
    setLastCursor({});
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [columnFilters, sorting]);

  // Trigger fetch more if current page needs data (chains if needed)
  useEffect(() => {
    const start = pagination.pageIndex * pagination.pageSize;
    const end = start + pagination.pageSize;
    if (end > allData.length && allData.length < totalFiles) {
      const lastRecord = allData[allData.length - 1] || {};
      const newCursor = {
        last_dx_cycle: lastRecord.cycle,
        last_org_log: lastRecord.orgLog,
      };
      // Avoid setting if same (optimization)
      if (
        newCursor.last_dx_cycle !== lastCursor.last_dx_cycle ||
        newCursor.last_org_log !== lastCursor.last_org_log
      ) {
        setLastCursor(newCursor);
      }
    }
  }, [pagination, allData, totalFiles, lastCursor]); // Depends on allData to chain fetches

  // Table rows: slice from accumulated data
  const tableRows = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize;
    const end = start + pagination.pageSize;
    return allData.slice(start, end);
  }, [allData, pagination]);

  // Use totalFiles for rowCount to enable full pagination
  const rowCount = totalFiles;

  const table = useReactTable({
    data: tableRows ?? [],
    columns: orgSetupColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    rowCount,
    manualSorting: true,
    onSortingChange: setSorting,
    manualPagination: true,
    onPaginationChange: setPagination,
    manualFiltering: true,
    onColumnFiltersChange: setColumnFilters,
    state: {
      pagination,
      columnFilters,
      sorting,
    },
  });

  return { membersDataHookData, table };
};