import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';
import { useGetClientsQuery } from '../../store/api/clientApi';
import { useDebounce } from '../../hooks/useDebounce';

const Clients = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, isFetching, error } = useGetClientsQuery({
    page,
    pageSize,
    search: debouncedSearch,
  });

  const clients = data || {};
  const totalPages = Math.ceil((clients.count || 0) / pageSize);
  const maxPagesToShow = 7;
  let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
  if (endPage - startPage < maxPagesToShow - 1) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  if (error) {
    return (
      <div style={{ padding: '32px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
        <div style={{ border: '1px solid #fecaca', borderLeft: '4px solid #ef4444', borderRadius: '8px', padding: '16px', backgroundColor: '#fef2f2' }}>
          <p style={{ color: '#991b1b', fontWeight: 600, margin: 0, fontSize: '14px' }}>
            Error loading clients
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ color: '#111827', margin: '0 0 8px 0' }} className="font-normal text-4xl">
          Clients
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
          View all clients and their submission history.
        </p>
      </div>

      <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#fff', padding: '20px' }}>
        <div className="flex justify-between" style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 4px 0', color: '#111827' }}>
              All Clients
            </h3>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
              Total {clients.count || 0} clients
            </p>
          </div>
          <div className="space-x-3" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search name, email, phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
                fontFamily: 'inherit',
                minWidth: '220px',
              }}
            />
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
                fontFamily: 'inherit',
              }}
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>

        {isLoading || isFetching ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>Loading clients...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  {['Client', 'Contact', 'Submissions', 'Approved', 'Revenue', 'Latest Activity', 'Actions'].map((col) => (
                    <th
                      key={col}
                      style={{
                        padding: '12px 0',
                        textAlign: 'left',
                        fontWeight: 600,
                        color: '#6b7280',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.results?.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280', fontSize: '14px' }}>
                      No clients found.
                    </td>
                  </tr>
                ) : (
                  clients.results?.map((client) => (
                    <tr
                      key={client.client_id}
                      style={{ borderBottom: '1px solid #f3f4f6', transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <td style={{ padding: '12px 0' }}>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>
                          {client.full_name || '—'}
                        </div>
                        {client.company_name && (
                          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{client.company_name}</div>
                        )}
                      </td>
                      <td style={{ padding: '12px 0' }}>
                        {client.email && (
                          <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Mail size={12} style={{ flexShrink: 0 }} />
                            {client.email}
                          </div>
                        )}
                        {client.phone && (
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Phone size={12} style={{ flexShrink: 0 }} />
                            {client.phone}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 0', color: '#374151', fontWeight: 500 }}>{client.submission_count}</td>
                      <td style={{ padding: '12px 0', color: '#374151' }}>{client.approved_count}</td>
                      <td style={{ padding: '12px 0', color: '#10b981', fontWeight: 600 }}>
                        ${Number(client.total_revenue || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '12px 0', color: '#6b7280', fontSize: '12px' }}>
                        {client.latest_submission_at
                          ? new Date(client.latest_submission_at).toLocaleDateString()
                          : '—'}
                      </td>
                      <td style={{ padding: '12px 0' }}>
                        <button
                          onClick={() => navigate(`/admin/clients/${client.client_id}`)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

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
                <button onClick={() => setPage(1)} style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff', color: '#374151', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
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
                <button onClick={() => setPage(totalPages)} style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff', color: '#374151', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
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
    </div>
  );
};

export default Clients;
