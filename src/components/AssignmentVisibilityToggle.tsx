"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const AssignmentVisibilityToggle = ({ id, isArchived }: { id: number | string; isArchived: boolean }) => {
  const [loading, setLoading] = useState(false);
  const [archived, setArchived] = useState(Boolean(isArchived));
  const router = useRouter();

  const toggle = async () => {
    const assignmentId = String(id).trim();
    if (!assignmentId) {
      alert("Invalid assignment id");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/assignments/${encodeURIComponent(assignmentId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: assignmentId, isArchived: !archived }),
      });
      let result: any = null;
      try {
        result = await res.json();
      } catch (parseErr) {
        const txt = await res.text().catch(() => null);
        console.error("Failed to parse response JSON:", parseErr, txt);
        alert(`Update failed (${res.status})`);
        return;
      }

      if (!res.ok) {
        console.error("Visibility update failed:", res.status, result);
        alert(result?.error || `Update failed (${res.status})`);
      } else if (result.success) {
        setArchived(!archived);
        router.refresh();
      } else {
        console.error("Visibility update returned failure:", result);
        alert(result.error || "Update failed");
      }
    } catch (err) {
      console.error(err);
      alert("Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`px-3 py-1 rounded-full text-sm font-medium ${archived ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
      {archived ? 'Hidden' : 'Visible'}
    </button>
  );
};

export default AssignmentVisibilityToggle;
