import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useGetDashboardDataQuery, useGetSubmissionsQuery } from '../../store/api/dashboardApi';
import DashboardSkeleton from '../../components/skeletons/DashboardSkeleton';
import SubmissionsSkeleton from '../../components/skeletons/SubmissionsSkeleton';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const STATUS_COLORS = {
  submitted: 'success',
  draft: 'warning',
  responses_completed: 'info',
  declined: 'error',
  packages_selected: 'secondary',
  expired: 'default',
};

const Dashboard = () => {
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [page, setPage] = useState(1);

  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useGetDashboardDataQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const {
    data: submissionData,
    isLoading: submissionsLoading,
    isFetching: submissionsFetching,
    error: submissionsError,
    refetch: refetchSubmissions,
  } = useGetSubmissionsQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    page,
    pageSize: 10,
  });

  if (dashboardLoading || !dashboardData) {
    return <DashboardSkeleton />;
  }

  if (dashboardError) {
    return (
      <div style={{ padding: '32px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
        <div style={{ border: '1px solid #fecaca', borderLeft: '4px solid #ef4444', borderRadius: '8px', padding: '16px', backgroundColor: '#fef2f2' }}>
          <p style={{ color: '#991b1b', fontWeight: 600, margin: 0, fontSize: '14px' }}>Error loading dashboard</p>
        </div>
      </div>
    );
  }

  const { statistics = {}, charts = {} } = dashboardData;
  const submissions = submissionData || {};

  // Enhanced metrics with all data
  const metrics = [
    {
      label: 'Total Revenue',
      value: `$${(statistics.total_worth || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      color: '#3b82f6',
      subtitle: 'from all submissions',
    },
    {
      label: 'Total Submissions',
      value: statistics.total_submissions || 0,
      color: '#10b981',
      subtitle: `${statistics.submitted_count || 0} submitted`,
    },
    {
      label: 'Conversion Rate',
      value: `${(statistics.conversion_rate || 0).toFixed(1)}%`,
      color: '#f59e0b',
      subtitle: 'success rate',
    },
    {
      label: 'Avg Order Value',
      value: `$${(statistics.average_order_value || 0).toFixed(0)}`,
      color: '#8b5cf6',
      subtitle: 'per order',
    },
  ];

  // Calculate pagination range
  const pageSize = 10;
  const totalPages = Math.ceil((submissions.count || 0) / pageSize);
  const maxPagesToShow = 7;
  let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
  if (endPage - startPage < maxPagesToShow - 1) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  return (
    <div style={{ padding: '32px', backgroundColor: '#f9fafb', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#111827', margin: '0 0 8px 0' }}>
          Dashboard
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
          Welcome back! Here's what's happening with your business today.
        </p>
      </div>

      {/* Date Filter Card */}
      <div style={{ marginBottom: '32px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#fff', padding: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
          />
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
          />
          <button
            onClick={() => {
              setPage(1);
              refetch();
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 500,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
          >
            Apply Filter
          </button>
          <button
            onClick={() => {
              setDateRange({ startDate: '', endDate: '' });
              setPage(1);
              refetch();
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#fff',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontWeight: 500,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {metrics.map((metric, idx) => (
          <div
            key={idx}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: '#fff',
              padding: '20px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#d1d5db';
              e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 12px 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {metric.label}
            </p>
            <p style={{ fontSize: '26px', fontWeight: 700, color: '#111827', margin: '0 0 12px 0' }}>
              {metric.value}
            </p>
            {/* <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
              {metric.subtitle}
            </p> */}
            {/* <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: metric.color, marginTop: '8px' }} /> */}
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '32px' }}>
        {/* Status Breakdown */}
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#fff', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 16px 0', color: '#111827' }}>Order Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {statistics.status_breakdown?.map((status, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', color: '#374151', textTransform: 'capitalize' }}>
                    {status.status.replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                    {status.count}
                  </span>
                </div>
                <div style={{ height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${(status.count / statistics.total_submissions) * 100}%`,
                      backgroundColor: COLORS[idx % COLORS.length],
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Property Type Breakdown */}
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#fff', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 16px 0', color: '#111827' }}>Revenue by Property Type</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={charts.property_type_breakdown || []}
                dataKey="revenue"
                nameKey="type"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ type, revenue }) => `${type}: $${(revenue / 1000).toFixed(1)}k`}
              >
                {charts.property_type_breakdown?.map((_, idx) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val) => `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Performance */}
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#fff', padding: '20px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 16px 0', color: '#111827' }}>Monthly Performance</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={charts.monthly_sales_trend || []}>
            <CartesianGrid strokeDasharray="0" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="month_name" stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <YAxis yAxisId="left" stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#fff' }} />
            <Legend wrapperStyle={{ paddingTop: '16px' }} />
            <Bar yAxisId="left" dataKey="total_submissions" fill="#3b82f6" name="Submissions" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="left" dataKey="submitted_orders" fill="#8b5cf6" name="Submitted" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="revenue" fill="#10b981" name="Revenue ($)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Daily Activity */}
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#fff', padding: '20px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 16px 0', color: '#111827' }}>Daily Activity</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={charts.daily_trend || []}>
            <CartesianGrid strokeDasharray="0" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <YAxis yAxisId="left" stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#fff' }} />
            <Legend wrapperStyle={{ paddingTop: '16px' }} />
            <Line yAxisId="left" type="monotone" dataKey="submissions" stroke="#3b82f6" strokeWidth={2} dot={false} name="Submissions" />
            <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} name="Revenue ($)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Lead Sources Table */}
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#fff', padding: '20px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 16px 0', color: '#111827' }}>Lead Source Performance</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '12px 0', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Source</th>
                <th style={{ padding: '12px 0', textAlign: 'right', fontWeight: 600, color: '#6b7280', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</th>
                <th style={{ padding: '12px 0', textAlign: 'right', fontWeight: 600, color: '#6b7280', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Submitted</th>
                <th style={{ padding: '12px 0', textAlign: 'right', fontWeight: 600, color: '#6b7280', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Draft</th>
                <th style={{ padding: '12px 0', textAlign: 'right', fontWeight: 600, color: '#6b7280', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Completed</th>
                <th style={{ padding: '12px 0', textAlign: 'right', fontWeight: 600, color: '#6b7280', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {charts.heard_about_us?.map((source, idx) => (
                <tr
                  key={idx}
                  style={{ borderBottom: '1px solid #f3f4f6', transition: 'background-color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '12px 0', color: '#374151', fontWeight: 500 }}>{source.source}</td>
                  <td style={{ padding: '12px 0', textAlign: 'right', color: '#374151' }}>{source.total}</td>
                  <td style={{ padding: '12px 0', textAlign: 'right', color: '#374151' }}>{source.submitted}</td>
                  <td style={{ padding: '12px 0', textAlign: 'right', color: '#374151' }}>{source.draft}</td>
                  <td style={{ padding: '12px 0', textAlign: 'right', color: '#374151' }}>{source.responses_completed}</td>
                  <td style={{ padding: '12px 0', textAlign: 'right', color: '#10b981', fontWeight: 600 }}>
                    ${source.total_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Submissions Table */}
      {submissionsFetching? (
        <SubmissionsSkeleton />
      ) : (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#fff', padding: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 4px 0', color: '#111827' }}>All Submissions</h3>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Total {submissions.count || 0} submissions</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '12px 0', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customer</th>
                  <th style={{ padding: '12px 0', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact</th>
                  <th style={{ padding: '12px 0', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Property</th>
                  <th style={{ padding: '12px 0', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                  <th style={{ padding: '12px 0', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount</th>
                  <th style={{ padding: '12px 0', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {submissions.results?.map((sub) => (
                  <tr
                    key={sub.id}
                    style={{ borderBottom: '1px solid #f3f4f6', transition: 'background-color 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '12px 0', color: '#111827', fontWeight: 500 }}>
                      <div>{sub.customer_name}</div>
                      {sub.company_name && <div style={{ fontSize: '12px', color: '#9ca3af' }}>{sub.company_name}</div>}
                    </td>
                    <td style={{ padding: '12px 0', color: '#374151' }}>
                      <div style={{ fontSize: '13px' }}>{sub.customer_email}</div>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>{sub.customer_phone}</div>
                    </td>
                    <td style={{ padding: '12px 0', color: '#374151' }}>{sub.property_type_display}</td>
                    <td style={{ padding: '12px 0' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: STATUS_COLORS[sub.status],
                      //   color: '#fff',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}>
                        {sub.status_display}
                      </span>
                    </td>
                    <td style={{ padding: '12px 0', color: '#111827', fontWeight: 600 }}>
                      ${parseFloat(sub.final_total).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '12px 0', color: '#6b7280', fontSize: '12px' }}>
                      {new Date(sub.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                style={{
                  padding: '6px 10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  backgroundColor: '#fff',
                  color: '#374151',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: page === 1 ? 'default' : 'pointer',
                  opacity: page === 1 ? 0.5 : 1,
                }}
              >
                ← Prev
              </button>
              {startPage > 1 && (
                <>
                  <button
                    onClick={() => setPage(1)}
                    style={{
                      padding: '6px 10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      backgroundColor: '#fff',
                      color: '#374151',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    1
                  </button>
                  {startPage > 2 && <span style={{ padding: '6px 4px', color: '#9ca3af' }}>...</span>}
                </>
              )}
              {Array.from({ length: endPage - startPage + 1 }).map((_, idx) => {
                const pageNum = startPage + idx;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    style={{
                      padding: '6px 10px',
                      border: pageNum === page ? 'none' : '1px solid #d1d5db',
                      borderRadius: '4px',
                      backgroundColor: pageNum === page ? '#3b82f6' : '#fff',
                      color: pageNum === page ? '#fff' : '#374151',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {endPage < totalPages && (
                <>
                  {endPage < totalPages - 1 && <span style={{ padding: '6px 4px', color: '#9ca3af' }}>...</span>}
                  <button
                    onClick={() => setPage(totalPages)}
                    style={{
                      padding: '6px 10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      backgroundColor: '#fff',
                      color: '#374151',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    {totalPages}
                  </button>
                </>
              )}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '6px 10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  backgroundColor: '#fff',
                  color: '#374151',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: page === totalPages ? 'default' : 'pointer',
                  opacity: page === totalPages ? 0.5 : 1,
                }}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;