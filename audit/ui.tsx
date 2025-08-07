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

  useEffect(() => {
    const fetchAuditSummary = async () => {
      const res = await fetch(`${API_BASE}/audit/orgsetup-summary`);
      const data = await res.json();
      setSummaryData([
        { name: 'Total Actions', value: data.total_actions },
        { name: 'Unique Users', value: data.unique_users }
      ]);
      setLineChartData(data.actions_per_second); // Pre-sorted from backend
    };
    fetchAuditSummary();
  }, []);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      const res = await fetch(`${API_BASE}/audit/orgsetup-filters`);
      const logs = await res.json();
      const filtersByTimestamp = logs.reduce((acc, log) => {
        const timestamp = new Date(log.timestamp).toISOString().split('.')[0];
        if (!acc[timestamp]) acc[timestamp] = [];
        acc[timestamp].push(log.filters);
        return acc;
      }, {});
      setFiltersByTimestamp(filtersByTimestamp);
    };
    fetchAuditLogs();
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const filters = filtersByTimestamp[label] || [];
      return (
        <div className="bg-white p-4 border border-gray-300 rounded shadow">
          <p className="text-blue-500 font-bold">{`Timestamp: ${label}`}</p>
          <p className="text-blue-500">{`Actions: ${payload[0].value}`}</p>
          <p className="text-blue-500 font-bold">Filters:</p>
          <ul className="list-disc pl-4">
            {filters.map((f, i) => (
              <li key={i} className="text-blue-600">
                {`Action ${i + 1}: ${Object.entries(f)
                  .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
                  .join(', ')}`}
              </li>
            ))}
          </ul>
        </div>
      );
    }
    return null;
  };

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