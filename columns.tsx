import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/navigation'; // Next.js router
import { useOrgSetupStore } from '@/store/orgSetupStore'; // Adjust path
import { dataTableFilterVariants } from '@/constants';
import { Button, Flex } from '@/ui'; // Adjust paths
import type { GetOrgSetupOutput } from '@/features/org-setup/useOrgSetup';

const orgSetupColumns: ColumnDef<GetOrgSetupOutput>[] = [
  // ... All your existing columns (e.g., Refresh, File Type, ..., notifyChanges) ...

  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const router = useRouter();
      const setSelectedRow = useOrgSetupStore((state) => state.setSelectedRow);
      const rowData = row.original;

      const handleSFTPClick = () => {
        setSelectedRow(rowData);
        router.push('/sftp-status');
      };

      const handleDataAnalysisClick = () => {
        setSelectedRow(rowData);
        router.push('/data-analysis');
      };

      return (
        <Flex direction="row" gap={2} className="justify-center">
          <Button variant="primary" size="sm" onClick={handleSFTPClick}>
            SFTP Status
          </Button>
          <Button variant="primary" size="sm" onClick={handleDataAnalysisClick}>
            Data Analysis
          </Button>
        </Flex>
      );
    },
    size: 250, // Adjust width to fit buttons
    enableColumnFilter: false,
    enableSorting: false,
  },
];

export default orgSetupColumns;