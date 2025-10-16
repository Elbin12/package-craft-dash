import React from 'react';
import Skeleton from './Skeleton';

const DashboardSkeleton = () => (
  <div style={{ padding: '32px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
    {/* Header */}
    <Skeleton height="24px" width="180px" style={{ marginBottom: '12px' }} />
    <Skeleton height="16px" width="300px" style={{ marginBottom: '32px' }} />

    {/* Date Filter */}
    <div style={{ marginBottom: '32px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      <Skeleton width="120px" height="36px" />
      <Skeleton width="120px" height="36px" />
      <Skeleton width="100px" height="36px" />
      <Skeleton width="80px" height="36px" />
    </div>

    {/* Metric Cards */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px' }}>
      {Array(4).fill(0).map((_, i) => (
        <div key={i} style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <Skeleton height="12px" width="60%" style={{ marginBottom: '12px' }} />
          <Skeleton height="24px" width="80%" style={{ marginBottom: '12px' }} />
          <Skeleton height="12px" width="50%" />
        </div>
      ))}
    </div>

    {/* Charts */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '32px' }}>
      <Skeleton height="240px" />
      <Skeleton height="240px" />
    </div>

    <Skeleton height="320px" style={{ marginBottom: '32px' }} /> {/* Monthly Performance */}
    <Skeleton height="260px" style={{ marginBottom: '32px' }} /> {/* Daily Activity */}
    <Skeleton height="260px" style={{ marginBottom: '32px' }} /> {/* Lead Source */}
    <Skeleton height="400px" /> {/* Submissions Table */}
  </div>
);

export default DashboardSkeleton;
