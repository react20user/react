import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import { useOrgSetupStore } from '@/store/orgSetupStore';
import { dataTableFilterVariants } from '@/constants';
import { Button, Flex, Text, Popover, PopoverContent, PopoverTrigger } from '@/ui';
import type { GetOrgSetupOutput } from '@/features/org-setup/useOrgSetup';

const orgSetupColumns: ColumnDef<GetOrgSetupOutput>[] = [
  // ... All your previous columns here ...

  {
    header: 'Revision Notes',
    accessorKey: 'notifyChanges',
    cell: ({ row }) => {
      const fullText = row.getValue('notifyChanges') as string || 'No changes';
      const maxLength = 50; // Adjust this truncation length as needed
      const truncatedText = fullText.length > maxLength ? `${fullText.substring(0, maxLength)}...` : fullText;

      return (
        <Popover>
          <PopoverTrigger asChild>
            <Text
              className="h-10 overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer text-blue-600 underline"
            >
              {truncatedText}
            </Text>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-4"> {/* Adjust width/padding if needed for longer texts */}
            <Text>{fullText}</Text>
          </PopoverContent>
        </Popover>
      );
    },
    size: 350, // Increased from 211 to provide more room for notes and prevent overflow into next column
    minSize: 350, // Enforce minimum to avoid shrinking/overlap
    enableColumnFilter: true,
    enableSorting: true,
    meta: {
      filterVariant: dataTableFilterVariants.MULTI_SELECT_DROPDOWN,
    },
  },

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
    size: 300, // Slightly increased from 250 to ensure buttons fit without crowding the previous column
    minSize: 300, // Enforce minimum to avoid shrinking/overlap
    enableColumnFilter: false,
    enableSorting: false,
  },
];

export default orgSetupColumns;