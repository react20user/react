// @ts-nocheck
'use client';
import { Fragment } from 'react';
import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Bar, Legend
} from 'recharts';
import StackedBarChart from '@components/Graphs/StackedBarChart';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@ui';
import { Box } from '@ui';
import cn from '@lib/cn';

const API_BASE = process.env.NEXT_PUBLIC_API_PATH; // Adjust based on your config
const FILTER_KEYS = ['cycle', 'orgLog', 'orgCd', 'engmtManager', 'acoAnalyst'];
const FILTER_COLORS = {
  cycle: '#ff7300',
  orgLog: '#007bff',
  orgCd: '#28a745',
  engmtManager: '#ffc107',
  acoAnalyst: '#6f42c1',
};

const OrgSetupPerformance = () => {
  const [totalActions, setTotalActions] = useState(0);
  const [uniqueUsers, setUniqueUsers] = useState(0);
  const [lineChartData, setLineChartData] = useState([]);
  const [filterUsageData, setFilterUsageData] = useState([]);
  const [filtersByTimestamp, setFiltersByTimestamp] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch summary
        const summaryRes = await fetch(`${API_BASE}/audit/orgsetup-summary`);
        const summaryData = await summaryRes.json();
        setTotalActions(summaryData.total_actions);
        setUniqueUsers(summaryData.unique_users);
        setLineChartData(summaryData.actions_per_minute);

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

        // Compute filter usage for stacked bar
        const filterUsage = FILTER_KEYS.reduce((acc, key) => {
          acc[key] = logs.filter(log => {
            const val = log.filters[key];
            return val !== "null" && val != null && (Array.isArray(val) ? val.length > 0 : val !== "");
          }).length;
          return acc;
        }, {});
        setFilterUsageData([{ name: 'Usage', ...filterUsage }]);
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
              <div className="text-blue title-h3 font-medium">Audit Summary (Total Actions: {totalActions}, Unique Users: {uniqueUsers})</div>
            </AccordionTrigger>
            <AccordionContent>
              <ResponsiveContainer width="100%" height={300}>
                <StackedBarChart data={filterUsageData} type="audit">
                  <CartesianGrid horizontal={true} vertical={false} strokeDasharray="none" className="stroke-black/10" />
                  <XAxis dataKey="name" className="stroke-black/80 stroke-0 leading-4" fontSize={14} fontWeight={400} />
                  <YAxis className="stroke-black/80 stroke-0 leading-4" fontSize={14} fontWeight={400} />
                  <Legend />
                  {FILTER_KEYS.map(key => (
                    <Bar
                      key={key}
                      dataKey={key}
                      stackId="a"
                      fill={FILTER_COLORS[key]}
                      radius={[4, 4, 4, 4]}
                      className={cn('cursor-pointer')}
                    />
                  ))}
                </StackedBarChart>
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