import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Mail, Phone, ArrowLeft, MapPin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  Button,
  Snackbar,
  Alert,
  Tooltip as MuiTooltip,
} from '@mui/material';
import {
  useGetClientDetailQuery,
  useGetClientSubmissionsQuery,
  useGetClientSubmissionDetailQuery,
} from '../../store/api/clientApi';
import {
  useCreateQuestionResponsesMutation,
  useDeleteSubmissionMutation,
  useUpdateQuestionResponsesForSubmittedMutation,
} from '../../store/api/user/quoteApi';
import QuestionsForm from '../../components/user/forms/QuestionsForm';
import { transformSubmissionData } from '../../utils/transformSubmissionData';
import { transformQuestionAnswersToAPIFormat } from '../../utils/transformQuestionAnswersToAPIFormat';
import { QuoteDetailsModal } from './QuoteDetailsModal';

const STATUS_COLORS = {
  submitted: 'success',
  draft: 'warning',
  responses_completed: 'info',
  declined: 'error',
  packages_selected: 'secondary',
  expired: 'default',
  approved: 'success',
};

const getServiceIcon = (name) => {
  const n = (name || '').toLowerCase();
  if (n.includes('first') || n.includes('residential')) return '🏠';
  if (n.includes('window')) return '🪟';
  if (n.includes('carpet')) return '🧹';
  if (n.includes('garage')) return '🚗';
  if (n.includes('commercial')) return '🏢';
  return '🧹';
};

const shortenServiceName = (name) => {
  if (!name) return '';
  let s = name.replace(/^(residential|commercial):\s*/i, '').trim();
  if (s === 'Window Cleaning') return 'Window';
  if (s === 'Carpet Cleaning') return 'Carpet';
  if (s === 'Garage Clean-up') return 'Garage';
  if (s === 'First Cleaning') return 'First Cleaning';
  return s.length > 18 ? s.slice(0, 16) + '…' : s;
};

const ClientDetail = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [status, setStatus] = useState('');

  const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedData, setEditedData] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [editSnackbar, setEditSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState(null);

  const { data: client, isLoading: clientLoading, error: clientError } = useGetClientDetailQuery(clientId);
  const {
    data: submissionsData,
    isLoading: submissionsLoading,
    isFetching: submissionsFetching,
    refetch: refetchSubmissions,
  } = useGetClientSubmissionsQuery({ clientId, page, pageSize, status });

  const {
    data: submissionDetail,
    isFetching: detailFetching,
    isSuccess: detailSuccess,
  } = useGetClientSubmissionDetailQuery(
    { clientId, submissionId: selectedSubmissionId },
    { skip: !selectedSubmissionId, refetchOnMountOrArgChange: true }
  );

  const [updateQuestionResponses] = useCreateQuestionResponsesMutation();
  const [updateQuestionResponsesForSubmitted] = useUpdateQuestionResponsesForSubmittedMutation();
  const [deleteSubmission, { isLoading: isDeletingSubmission }] = useDeleteSubmissionMutation();

  useEffect(() => {
    if (detailSuccess && submissionDetail?.status === 'approved') {
      setIsSubmitted(true);
    } else {
      setIsSubmitted(false);
    }
  }, [submissionDetail, detailSuccess]);

  const handleViewSubmission = (submissionId) => {
    setSelectedSubmissionId(submissionId);
    setIsModalOpen(true);
    setIsEditMode(false);
    setIsSubmitted(false);
  };

  const handleDeleteClick = (submission) => {
    setSubmissionToDelete(submission);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!submissionToDelete) return;
    try {
      await deleteSubmission({ submissionId: submissionToDelete.id }).unwrap();
      setDeleteDialogOpen(false);
      setSubmissionToDelete(null);
      if (selectedSubmissionId === submissionToDelete.id) {
        setIsModalOpen(false);
        setSelectedSubmissionId(null);
        setIsEditMode(false);
        setEditedData(null);
        setIsSubmitted(false);
      }
      refetchSubmissions();
      setEditSnackbar({ open: true, message: 'Submission deleted successfully.', severity: 'success' });
    } catch (error) {
      setEditSnackbar({
        open: true,
        message: error?.data?.detail || error?.data?.message || error?.message || 'Failed to delete submission.',
        severity: 'error',
      });
    }
  };

  const handleEdit = () => {
    setIsEditMode(true);
    setEditedData(transformSubmissionData(submissionDetail));
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedData(null);
    setIsSubmitted(false);
  };

  const handleUpdate = (updatedAnswers) => {
    setEditedData((prev) => ({ ...prev, ...updatedAnswers }));
  };

  const handleSaveEdit = async () => {
    const { submission_id, selectedServices, questionAnswers } = editedData;
    try {
      const serviceResponses = transformQuestionAnswersToAPIFormat(
        questionAnswers,
        selectedServices.map((ss) => ({ id: ss.id }))
      );

      const responsePromises = selectedServices.map(async (service) => {
        const responses = serviceResponses[service.id] || [];
        if (responses.length === 0) return;

        const payload = { responses };
        if (isSubmitted) {
          return updateQuestionResponsesForSubmitted({
            submissionId: submission_id,
            serviceId: service.id,
            payload,
          }).unwrap();
        }
        return updateQuestionResponses({
          submissionId: submission_id,
          serviceId: service.id,
          payload,
        }).unwrap();
      });

      await Promise.all(responsePromises);
      refetchSubmissions();
      setEditSnackbar({ open: true, message: 'Quote updated successfully!', severity: 'success' });
      setIsEditMode(false);
      setEditedData(null);
      setIsSubmitted(false);
    } catch (error) {
      setEditSnackbar({
        open: true,
        message: error?.message || 'Failed to update quote. Please try again.',
        severity: 'error',
      });
    }
  };

  if (clientError) {
    return (
      <div style={{ padding: '32px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
        <div style={{ border: '1px solid #fecaca', borderLeft: '4px solid #ef4444', borderRadius: '8px', padding: '16px', backgroundColor: '#fef2f2' }}>
          <p style={{ color: '#991b1b', fontWeight: 600, margin: 0, fontSize: '14px' }}>Error loading client</p>
        </div>
      </div>
    );
  }

  const submissions = submissionsData || {};
  const totalPages = Math.ceil((submissions.count || 0) / pageSize);
  const maxPagesToShow = 7;
  let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
  if (endPage - startPage < maxPagesToShow - 1) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  const profile = client?.profile;

  return (
    <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <button
        onClick={() => navigate('/admin/clients')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 0',
          background: 'none',
          border: 'none',
          color: '#3b82f6',
          cursor: 'pointer',
          fontSize: '14px',
          marginBottom: '16px',
        }}
      >
        <ArrowLeft size={16} />
        Back to Clients
      </button>

      {clientLoading ? (
        <div style={{ color: '#6b7280', padding: '20px' }}>Loading client...</div>
      ) : (
        <>
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ color: '#111827', margin: '0 0 8px 0' }} className="font-normal text-4xl">
              {profile?.full_name || 'Client'}
            </h1>
            {profile?.company_name && (
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>{profile.company_name}</p>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#fff', padding: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 16px 0', color: '#111827' }}>Contact Info</h3>
              {profile?.email && (
                <div style={{ fontSize: '13px', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Mail size={14} />
                  {profile.email}
                  {profile.allow_email === false && <span style={{ fontSize: '11px', color: '#ef4444' }}>(no email)</span>}
                </div>
              )}
              {profile?.phone && (
                <div style={{ fontSize: '13px', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Phone size={14} />
                  {profile.phone}
                  {profile.allow_sms === false && <span style={{ fontSize: '11px', color: '#ef4444' }}>(no SMS)</span>}
                </div>
              )}
              {(profile?.street_address || profile?.city) && (
                <div style={{ fontSize: '13px', color: '#374151', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <MapPin size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span>
                    {[profile.street_address, profile.city, profile.postal_code].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              {profile?.ghl_contact_id && (
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '12px' }}>
                  GHL ID: {profile.ghl_contact_id}
                </div>
              )}
            </div>

            <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#fff', padding: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 16px 0', color: '#111827' }}>Stats</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div>
                  <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Submissions</p>
                  <p style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: 0 }}>{client?.stats?.submission_count ?? 0}</p>
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Approved</p>
                  <p style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: 0 }}>{client?.stats?.approved_count ?? 0}</p>
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Revenue</p>
                  <p style={{ fontSize: '22px', fontWeight: 700, color: '#10b981', margin: 0 }}>
                    ${Number(client?.stats?.total_revenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#fff', padding: '20px' }}>
        <div className="flex justify-between" style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 4px 0', color: '#111827' }}>Submissions</h3>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Total {submissions.count || 0} submissions</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="approved">Approved</option>
              <option value="submitted">Submitted</option>
            </select>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>

        {submissionsLoading || submissionsFetching ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>Loading submissions...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  {['Property', 'Address', 'Services', 'Status', 'Amount', 'Date', 'Actions'].map((col) => (
                    <th key={col} style={{ padding: '12px 0', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {submissions.results?.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280', fontSize: '14px' }}>
                      No submissions found.
                    </td>
                  </tr>
                ) : (
                  submissions.results?.map((sub) => (
                    <tr
                      key={sub.id}
                      style={{ borderBottom: '1px solid #f3f4f6', transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <td style={{ padding: '12px 0', color: '#374151' }}>{sub.property_type_display}</td>
                      <td style={{ padding: '12px 0', color: '#374151', maxWidth: '140px' }}>
                        {(sub.street_address || sub.city) ? (
                          <MuiTooltip title={[sub.street_address, sub.city].filter(Boolean).join(', ')} placement="top" arrow>
                            <div style={{ cursor: 'help' }}>
                              {sub.street_address && (
                                <div style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '130px' }}>
                                  {sub.street_address.length > 22 ? sub.street_address.slice(0, 20) + '…' : sub.street_address}
                                </div>
                              )}
                              {sub.city && <div style={{ fontSize: '12px', color: '#6b7280' }}>{sub.city}</div>}
                            </div>
                          </MuiTooltip>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '12px 0', maxWidth: '180px' }}>
                        {sub.selected_services?.length ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
                            {sub.selected_services.slice(0, 3).map((svc, i) => (
                              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#f3f4f6', fontSize: '11px', color: '#374151' }}>
                                {getServiceIcon(svc)}{shortenServiceName(svc)}
                              </span>
                            ))}
                            {sub.selected_services.length > 3 && (
                              <span style={{ fontSize: '11px', color: '#6b7280' }}>+{sub.selected_services.length - 3} more</span>
                            )}
                          </div>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '12px 0' }}>
                        <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '4px', backgroundColor: STATUS_COLORS[sub.status], fontSize: '11px', fontWeight: 600 }}>
                          {sub.status_display}
                        </span>
                      </td>
                      <td style={{ padding: '12px 0', color: '#111827', fontWeight: 600 }}>
                        ${parseFloat(sub.final_total).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '12px 0', color: '#6b7280', fontSize: '12px' }}>
                        {new Date(sub.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px 0' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleViewSubmission(sub.id)}
                            style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteClick(sub)}
                            style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            Delete
                          </button>
                        </div>
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
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff', color: '#374151', fontSize: '12px', fontWeight: 500, cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>
              ← Prev
            </button>
            {Array.from({ length: endPage - startPage + 1 }).map((_, idx) => {
              const pageNum = startPage + idx;
              return (
                <button key={pageNum} onClick={() => setPage(pageNum)} style={{ padding: '6px 10px', border: pageNum === page ? 'none' : '1px solid #d1d5db', borderRadius: '4px', backgroundColor: pageNum === page ? '#3b82f6' : '#fff', color: pageNum === page ? '#fff' : '#374151', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
                  {pageNum}
                </button>
              );
            })}
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff', color: '#374151', fontSize: '12px', fontWeight: 500, cursor: page === totalPages ? 'default' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}>
              Next →
            </button>
          </div>
        )}
      </div>

      {!isEditMode ? (
        <QuoteDetailsModal
          open={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setIsEditMode(false);
            setEditedData(null);
            setSelectedSubmissionId(null);
            setIsSubmitted(false);
            refetchSubmissions();
          }}
          data={submissionDetail}
          isLoading={detailFetching}
          onEdit={handleEdit}
          isSubmitted={isSubmitted}
        />
      ) : (
        <Dialog
          open={isModalOpen}
          onClose={() => { setIsModalOpen(false); setIsEditMode(false); setEditedData(null); }}
          fullWidth
          maxWidth="md"
          scroll="paper"
        >
          <DialogContent dividers>
            <div className="space-y-4">
              <QuestionsForm data={editedData} onUpdate={(updates) => handleUpdate(updates)} />
              <div style={{ display: 'flex', justifyContent: 'end', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleCancelEdit} style={{ padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
                    Cancel
                  </button>
                  <button onClick={handleSaveEdit} style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Snackbar open={editSnackbar.open} autoHideDuration={6000} onClose={() => setEditSnackbar((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={() => setEditSnackbar((s) => ({ ...s, open: false }))} severity={editSnackbar.severity} sx={{ width: '100%' }}>
          {editSnackbar.message}
        </Alert>
      </Snackbar>

      <Dialog open={deleteDialogOpen} onClose={() => !isDeletingSubmission && setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Submission</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this submission? This action cannot be undone.
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={isDeletingSubmission}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={isDeletingSubmission}>
            {isDeletingSubmission ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ClientDetail;
