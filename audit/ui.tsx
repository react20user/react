// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Legend
} from 'recharts';

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
        // Fetch summary first
        const summaryRes = await fetch(`${API_BASE}/audit/orgsetup-summary`);
        const summaryData = await summaryRes.json();
        setSummaryData([
          { name: 'Total Actions', value: summaryData.total_actions },
          { name: 'Unique Users', value: summaryData.unique_users }
        ]);
        setLineChartData(summaryData.actions_per_second);

        // Fetch logs and populate filters
        const logsRes = await fetch(`${API_BASE}/audit/orgsetup-filters`);
        const logs = await logsRes.json();
        const filtersByTimestamp = logs.reduce((acc, log) => {
          const timestamp = new Date(log.timestamp).toISOString().split('.')[0];
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
      console.log('Tooltip Label:', label); // Debug log
      console.log('Filters by Timestamp:', filtersByTimestamp[label] || 'No filters');
      const filters = filtersByTimestamp[label] || [];
      return (
        <div className="bg-white p-4 border border-gray-300 rounded shadow">
          <p className="text-blue-500 font-bold">{`Timestamp: ${label}`}</p>
          <p className="text-blue-500">{`Actions: ${payload[0].value}`}</p>
          <p className="text-blue-500 font-bold">Filters:</p>
          <ul className="list-disc pl-4">
            {filters.length === 0 ? (
              <li className="text-blue-600">No filters applied</li>
            ) : (
              filters.map((f, i) => (
                <li key={i} className="text-blue-600">
                  {`Action ${i + 1}: ${Object.entries(f)
                    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v || 'null'}`)
                    .join(', ')}`}
                </li>
              ))
            )}
          </ul>
        </div>
      );
    }
    return null;
  };

  if (loading) return <div className="text-blue-500">Loading...</div>;

  return (
    <div>
      <h3 className="text-blue-500">Audit Summary</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={summaryData}>
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#60a5fa" /> {/* blue-400 */}
        </BarChart>
      </ResponsiveContainer>
      <h3 className="text-blue-500">Actions Per Second</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={lineChartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" />
          <YAxis allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="count" stroke="#3b82f6" /> {/* blue-500 */}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OrgSetupPerformance;