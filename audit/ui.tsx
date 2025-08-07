// @ts-nocheck
'use client';
import { Fragment } from 'react';
import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Legend
} from 'recharts';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@ui';
import { Box } from '@ui';
import cn from '@lib/cn';

const API_BASE = process.env.NEXT_PUBLIC_API_PATH; // Adjust based on your config

const OrgSetupPerformance = () => {
  const [summaryData, setSummaryData] = useState([]);
  const [lineChartData, setLineChartData] = useState([]);
  const [filtersByTimestamp, setFiltersByTimestamp] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch summary
        const summaryRes = await fetch(`${API_BASE}/audit/orgsetup-summary`);
        const summaryDataRes = await summaryRes.json();
        setSummaryData([
          { name: 'Total Actions', value: summaryDataRes.total_actions },
          { name: 'Unique Users', value: summaryDataRes.unique_users }
        ]);
        setLineChartData(summaryDataRes.actions_per_minute);

        // Fetch logs and process
        const logsRes = await fetch(`${API_BASE}/audit/orgsetup-filters`);
        const logs = await logsRes.json();

        // Process filters by timestamp (as before)
        const filtersByTimestamp = logs.reduce((acc, log) => {
          const tsWithZ = log.timestamp.endsWith('Z') ? log.timestamp : `${log.timestamp}Z`;
          const dt = new Date(tsWithZ);
          dt.setSeconds(0, 0);
          const timestamp = dt.toISOString().split('.')[0];
          if (!acc[timestamp]) acc[timestamp] = [];
          acc[timestamp].push(log.filters);
          return acc;
        }, {});
        setFiltersByTimestamp(filtersByTimestamp);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const filters = filtersByTimestamp[label] || [];
      return (
        <div className="bg-white p-4 border border-gray-300 rounded shadow">
          <p className="text-blue font-bold">{`Timestamp: ${label}`}</p>
          <p className="text-blue">{`Actions: ${payload[0].value}`}</p>
          <p className="text-blue font-bold">Filters:</p>
          <ul className="list-disc pl-4">
            {filters.length === 0 ? (
              <li className="text-blue">No filters applied</li>
            ) : (
              filters.map((f, i) => {
                const nonNullFilters = Object.entries(f)
                  .filter(([_, v]) => v !== "null" && v != null && (Array.isArray(v) ? v.length > 0 : v !== ""))
                  .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
                return (
                  <li key={i} className="text-blue">
                    {`Action ${i + 1}: ${nonNullFilters.length > 0 ? nonNullFilters.join(', ') : 'No filters applied'}`}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      );
    }
    return null;
  };

  if (loading) return <div className="text-blue">Loading...</div>;

  return (
    <Fragment>
      <Box paddingX={6}>
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="summary" className="mb-4">
            <AccordionTrigger className={cn('flex-1 select-none hover:no-underline')}>
              <div className="text-blue title-h3 font-medium">Audit Summary</div>
            </AccordionTrigger>
            <AccordionContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={summaryData}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#60a5fa" />
                </BarChart>
              </ResponsiveContainer>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="actions-per-minute" className="mb-4">
            <AccordionTrigger className={cn('flex-1 select-none hover:no-underline')}>
              <div className="text-blue title-h3 font-medium">Actions Per Minute</div>
            </AccordionTrigger>
            <AccordionContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" />
                </LineChart>
              </ResponsiveContainer>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Box>
    </Fragment>
  );
};

export default OrgSetupPerformance;