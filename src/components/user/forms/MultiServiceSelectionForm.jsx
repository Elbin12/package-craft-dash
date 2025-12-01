import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import axios from "axios";
import { useGetServicesQuery } from "../../../store/api/user/priceApi";

const MultiServiceSelectionForm = ({ data, onUpdate }) => {
  const { projectType } = data?.userInfo || {}
  console.log("Project Type:", projectType);
  const queryArgs = projectType === "residential"
    ? { is_residential: true }
    : projectType === "commercial"
      ? { is_commercial: true }
      : {}
  const { data: servicesData, error, isLoading } = useGetServicesQuery(queryArgs,
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );

  console.log("queryArgs:", queryArgs);

  const services = servicesData || [];

  useEffect(() => {
    if (services) {
      onUpdate?.({
        availableLocations: services.locations,
        availableSizes: services.size_ranges,
      });
    }
  }, [services, onUpdate]);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error fetching services</p>;

  // Handle no services available for the project type
  if (!services || services.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-4">Select Services</h2>
        <p className="text-gray-600">
          No services available for {projectType} projects at the moment.
        </p>
      </div>
    );
  }

  const toggleService = (service) => {
    const existing = data.selectedServices || [];
    const isSelected = existing.find((s) => s.id === service.id);
    const updatedServices = isSelected
      ? existing.filter((s) => s.id !== service.id)
      : [...existing, service];

    onUpdate({ selectedServices: updatedServices });
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Select Services</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => {
          const checked = data.selectedServices?.some((s) => s.id === service.id);
          return (
            <Card
              key={service.id}
              className={`cursor-pointer ${checked ? "border-blue-500 bg-blue-50" : ""}`}
              onClick={() => toggleService(service)}
            >
              <CardContent className="flex items-center space-x-3 px-5 py-2">
                <Checkbox checked={checked} onChange={() => toggleService(service)} />
                <div>
                  <p className="font-semibold">{service.name}</p>
                  {/* <p className="text-sm text-gray-600">{service.description}</p> */}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MultiServiceSelectionForm;
