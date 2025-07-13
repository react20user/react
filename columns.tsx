import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/router';
import { dataTableFilterVariants } from '@/constants';
import { Text, Button, Flex } from '@/ui'; // Adjust paths
import type { GetOrgSetupOutput } from '@/features/org-setup/useOrgSetup';

const orgSetupColumns: ColumnDef<GetOrgSetupOutput>[] = [
  // ... All your existing columns (e.g., Refresh, File Type, ..., notifyChanges) ...

  {
    id: 'actions', // Custom ID for actions column
    header: 'Actions',
    cell: ({ row }) => {
      const router = useRouter();
      const rowData = row.original; // Full row data

      const handleNavigate = (path: string) => {
        const serializedData = encodeURIComponent(JSON.stringify(rowData));
        router.push(`${path}?data=${serializedData}`);
      };

      return (
        <Flex direction="row" gap={2} className="justify-center">
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => handleNavigate('/sftp-status')}
          >
            SFTP Status
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => handleNavigate('/data-analysis')}
          >
            Data Analysis
          </Button>
        </Flex>
      );
    },
    size: 250, // Fixed width to fit buttons
    enableColumnFilter: false,
    enableSorting: false,
  },
];

export default orgSetupColumns;