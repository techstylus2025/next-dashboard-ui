"use client";

import { useEffect, useState } from "react";
import FormModal from "./FormModal";

export type FormContainerProps = {
  table:
    | "teacher"
    | "student"
    | "parent"
    | "subject"
    | "class"
    | "lesson"
    | "exam"
    | "assignment"
    | "result"
    | "attendance"
    | "event"
    | "announcement";
  type: "create" | "update" | "delete";
  data?: any;
  id?: number | string;
};

const FormContainer = ({ table, type, data, id }: FormContainerProps) => {
  const [relatedData, setRelatedData] = useState<any>(null);
  const [loading, setLoading] = useState(type !== "delete");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (type === "delete") {
      setRelatedData({});
      setLoading(false);
      return;
    }

    const fetchRelatedData = async () => {
      try {
        const response = await fetch(`/api/form-related-data?table=${table}`);
        if (!response.ok) {
          throw new Error("Failed to load related data.");
        }
        const payload = await response.json();
        setRelatedData(payload);
      } catch (err) {
        setError("Unable to load form settings. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedData();
  }, [table, type]);

  if (loading) {
    return <div className="p-4 text-sm text-slate-500">Loading form...</div>;
  }

  if (error) {
    return <div className="p-4 text-sm text-red-500">{error}</div>;
  }

  return (
    <FormModal
      table={table}
      type={type}
      data={data}
      id={id}
      relatedData={relatedData}
    />
  );
};

export default FormContainer;
