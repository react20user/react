import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { dataTableFilterVariants } from '@/constants';
import { Text } from '@/ui'; // Assuming this is your custom Text component; adjust if needed
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/Popover'; // Adjust path based on your ui folder structure

// Other imports (e.g., filterVariant, meta, etc.) remain the same...

import type { GetOrgSetupOutput } from '@/features/org-setup/useOrgSetup'; // Adjust path as needed

const orgSetupColumns: ColumnDef<GetOrgSetupOutput>[] = [
  // ... All your previous columns here (e.g., Refresh, File Type, Has Header, Delimiter, Custom Logic, Cycle, Org Log, etc.) ...

  {
    header: 'Change Log / Revision Notes',
    accessorKey: 'notifyChanges',
    cell: ({ row }) => {
      const fullText = row.getValue('notifyChanges') as string || 'No changes';
      const maxLength = 100; // Adjust this truncation length as needed
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
    size: 211,
    enableColumnFilter: true,
    enableSorting: true,
    meta: {
      filterVariant: dataTableFilterVariants.MULTI_SELECT_DROPDOWN,
    },
  },

  // ... Any remaining columns ...
];

export default orgSetupColumns;