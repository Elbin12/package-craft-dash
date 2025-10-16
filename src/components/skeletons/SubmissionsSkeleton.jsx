import React from 'react';
import Skeleton from './Skeleton';

const SubmissionsSkeleton = () => {
  const rows = 10; // number of fake rows
  const columns = 6; // Customer, Contact, Property, Status, Amount, Date

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#fff', padding: '20px' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
              {Array.from({ length: columns }).map((_, idx) => (
                <th key={idx} style={{ padding: '12px 0', textAlign: 'left' }}>
                  <Skeleton height="12px" width="80px" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <tr key={rowIdx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                {Array.from({ length: columns }).map((_, colIdx) => (
                  <td key={colIdx} style={{ padding: '12px 0' }}>
                    <Skeleton height="12px" width={`${60 + Math.random() * 40}px`} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubmissionsSkeleton;
