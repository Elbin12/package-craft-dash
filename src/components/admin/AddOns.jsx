import React, { useMemo, useState } from 'react';
import { Plus, Edit, Trash2, Save, X, FileText, Tag } from 'lucide-react';
import { useCreateAddOnMutation, useDeleteAddOnMutation, useGetAllAddOnsQuery, useUpdateAddOnMutation } from '../../store/api/addOnServicesApi';
import { useGetServicesQuery } from '../../store/api/servicesApi';

const AddOns = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddOn, setEditingAddOn] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_price: '',
    services: [],
  });

  const { data: addOns, isLoading, error, refetch } = useGetAllAddOnsQuery();
  const { data: services = [] } = useGetServicesQuery();
  const [createAddOn, { isLoading: isCreating }] = useCreateAddOnMutation();
  const [updateAddOn, { isLoading: isUpdating }] = useUpdateAddOnMutation();
  const [deleteAddOn, { isLoading: isDeleting }] = useDeleteAddOnMutation();

  const serviceNameById = useMemo(() => {
    const map = {};
    services.forEach((service) => {
      map[service.id] = service.name;
    });
    return map;
  }, [services]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      base_price: '',
      services: [],
    });
    setEditingAddOn(null);
  };

  const handleOpenModal = (addOn = null) => {
    if (addOn) {
      setEditingAddOn(addOn);
      setFormData({
        name: addOn.name,
        description: addOn.description,
        base_price: addOn.base_price,
        services: addOn.is_global ? [] : (addOn.services || []),
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleServiceToggle = (serviceId) => {
    setFormData(prev => {
      const isSelected = prev.services.includes(serviceId);
      return {
        ...prev,
        services: isSelected
          ? prev.services.filter(id => id !== serviceId)
          : [...prev.services, serviceId],
      };
    });
  };

  const getAvailabilityLabel = (addOn) => {
    if (addOn.is_global) return 'All services';
    const names = (addOn.services || [])
      .map(id => serviceNameById[id])
      .filter(Boolean);
    return names.length > 0 ? names.join(', ') : 'Specific services';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      description: formData.description,
      base_price: formData.base_price,
      services: formData.services,
    };
    try {
      if (editingAddOn) {
        await updateAddOn({
          id: editingAddOn.id,
          ...payload,
        }).unwrap();
      } else {
        await createAddOn(payload).unwrap();
      }
      handleCloseModal();
    } catch (err) {
      console.error('Error saving add-on:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this add-on service?')) {
      try {
        await deleteAddOn(id).unwrap();
      } catch (err) {
        console.error('Error deleting add-on:', err);
      }
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(price));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
        <p className="text-red-800">Error loading add-on services. Please try again.</p>
        <button
          onClick={() => refetch()}
          className="mt-2 text-red-600 hover:text-red-800 font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Add-on Services</h1>
          <p className="text-gray-600 mt-2">Manage additional services that customers can add to their bookings</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Add New Service
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {addOns?.map((addOn) => (
          <div key={addOn.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <Tag className="text-blue-600" size={20} />
                  <h3 className="text-xl font-semibold text-gray-900">{addOn.name}</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal(addOn)}
                    className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(addOn.id)}
                    className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition-colors"
                    disabled={isDeleting}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <FileText className="text-gray-400 mt-1" size={16} />
                  <p className="text-gray-700 text-sm leading-relaxed">{addOn.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-green-600">
                    {formatPrice(addOn.base_price)}
                  </span>
                </div>

                <div className="pt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    addOn.is_global
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {addOn.is_global ? 'All services' : 'Service-specific'}
                  </span>
                  {!addOn.is_global && (
                    <p className="text-sm text-gray-600 mt-1.5">
                      {getAvailabilityLabel(addOn)}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>Created: {formatDate(addOn.created_at)}</p>
                    <p>Updated: {formatDate(addOn.updated_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {(!addOns || addOns.length === 0) && (
          <div className="col-span-full text-center py-12">
            <Tag className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No add-on services yet</h3>
            <p className="text-gray-500 mb-4">Create your first add-on service to get started</p>
            <button
              onClick={() => handleOpenModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              Add First Service
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingAddOn ? 'Edit Add-on Service' : 'Create New Add-on Service'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Service Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Extended Warranty"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe what this service includes..."
                />
              </div>

              <div>
                <label htmlFor="base_price" className="block text-sm font-medium text-gray-700 mb-2">
                  Base Price ($) *
                </label>
                <input
                  type="number"
                  id="base_price"
                  name="base_price"
                  value={formData.base_price}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available for services
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Leave all unchecked for &quot;Available for all services&quot;
                </p>
                <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-gray-100">
                  {services.length === 0 ? (
                    <p className="p-3 text-sm text-gray-500">No services found</p>
                  ) : (
                    services.map((service) => (
                      <label
                        key={service.id}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.services.includes(service.id)}
                          onChange={() => handleServiceToggle(service.id)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-800">{service.name}</span>
                      </label>
                    ))
                  )}
                </div>
                {formData.services.length === 0 && (
                  <p className="text-xs text-green-700 mt-2 font-medium">Available for all services</p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isCreating || isUpdating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Save size={16} />
                  {(isCreating || isUpdating) ? 'Saving...' : (editingAddOn ? 'Update Service' : 'Create Service')}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddOns;
