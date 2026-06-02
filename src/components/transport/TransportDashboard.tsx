"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type TransportRole = "admin" | "teacher" | "parent" | "student" | undefined;

type ParentStudent = {
  id: string;
  name: string;
  surname: string;
  classId: number;
  className: string;
};

type AdminStudentChoice = {
  id: string;
  name: string;
  surname: string;
  classId: number;
  className: string;
  parentName: string;
  parentPhone: string;
};

type BusLocation = {
  latitude: number;
  longitude: number;
  reportedAt: string;
};

type BusItem = {
  id: number;
  name: string;
  plateNumber: string;
  driverName: string;
  route: string;
  latestLocation: BusLocation | null;
};

type BusRegistration = {
  id: number;
  busName: string;
  studentName: string;
  className: string;
  parentName: string;
  parentPhone: string;
  location: string;
  createdAt: string;
};

type TransportRequest = {
  id: number;
  parentName: string;
  studentName: string;
  className: string;
  routine: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

const normalize = (value: number, min: number, max: number) => {
  if (max === min) return 0.5;
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
};

const formatDateTime = (value: string) => new Date(value).toLocaleString(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  month: "short",
  day: "numeric",
});

const TransportDashboard = ({
  role,
  userId,
  parentName,
  parentStudents,
  adminStudentChoices,
}: {
  role: TransportRole;
  userId: string | null;
  parentName?: string;
  parentStudents: ParentStudent[];
  adminStudentChoices: AdminStudentChoice[];
}) => {
  const [buses, setBuses] = useState<BusItem[]>([]);
  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [registrations, setRegistrations] = useState<BusRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [busForm, setBusForm] = useState({
    name: "",
    plateNumber: "",
    driverName: "",
    route: "",
  });
  const [busMessage, setBusMessage] = useState<string | null>(null);
  const [editBusId, setEditBusId] = useState<number | null>(null);
  const [editBusForm, setEditBusForm] = useState({
    name: "",
    plateNumber: "",
    driverName: "",
    route: "",
  });
  const [editBusMessage, setEditBusMessage] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [requestForm, setRequestForm] = useState({
    studentId: parentStudents[0]?.id ?? "",
    routine: "REGULAR",
  });
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState<string | null>(null);
  const [registrationForm, setRegistrationForm] = useState({
    studentId: adminStudentChoices[0]?.id ?? "",
    busId: "",
    location: "",
  });
  const [selectedBusId, setSelectedBusId] = useState<number | null>(null);
  const [sharing, setSharing] = useState(false);
  const [sharingStatus, setSharingStatus] = useState<string | null>(null);
  const [lastSharedAt, setLastSharedAt] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const loadBuses = async () => {
    try {
      const res = await fetch("/api/transport/buses", { cache: "no-store", credentials: "same-origin" });
      if (!res.ok) return;
      const data = (await res.json()) as { buses: BusItem[] };
      setBuses(data.buses);
      if (!selectedBusId && data.buses.length > 0) {
        setSelectedBusId(data.buses[0].id);
      }
    } catch (error) {
      console.error("Unable to load transport buses", error);
    }
  };

  const loadRequests = async () => {
    if (role !== "admin" && role !== "parent") return;
    try {
      const res = await fetch("/api/transport/requests", { cache: "no-store", credentials: "same-origin" });
      if (!res.ok) return;
      const data = (await res.json()) as { requests: TransportRequest[] };
      setRequests(data.requests);
    } catch (error) {
      console.error("Unable to load transport requests", error);
    }
  };

  const loadRegistrations = async () => {
    if (role !== "admin") return;
    try {
      const res = await fetch("/api/transport/registrations", { cache: "no-store", credentials: "same-origin" });
      if (!res.ok) return;
      const data = (await res.json()) as { registrations: BusRegistration[] };
      setRegistrations(data.registrations);
    } catch (error) {
      console.error("Unable to load transport registrations", error);
    }
  };

  useEffect(() => {
    loadBuses();
    loadRequests();
    loadRegistrations();
    const interval = window.setInterval(loadBuses, 10000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (parentStudents.length > 0) {
      setRequestForm((current) => ({
        ...current,
        studentId: current.studentId || parentStudents[0].id,
      }));
    }
  }, [parentStudents]);

  useEffect(() => {
    if (adminStudentChoices.length > 0) {
      setRegistrationForm((current) => ({
        ...current,
        studentId: current.studentId || adminStudentChoices[0].id,
      }));
    }
  }, [adminStudentChoices]);

  useEffect(() => {
    if (buses.length > 0 && !registrationForm.busId) {
      setRegistrationForm((current) => ({
        ...current,
        busId: buses[0].id.toString(),
      }));
    }
  }, [buses, registrationForm.busId]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const locationBounds = useMemo(() => {
    const locations = buses
      .map((bus) => bus.latestLocation)
      .filter((location): location is BusLocation => location !== null);
    if (locations.length === 0) {
      return null;
    }
    const minLat = Math.min(...locations.map((item) => item.latitude));
    const maxLat = Math.max(...locations.map((item) => item.latitude));
    const minLng = Math.min(...locations.map((item) => item.longitude));
    const maxLng = Math.max(...locations.map((item) => item.longitude));
    return { minLat, maxLat, minLng, maxLng };
  }, [buses]);

  const markerPosition = (location: BusLocation | null) => {
    if (!location || !locationBounds) {
      return { left: "50%", top: "50%" };
    }
    const x = normalize(location.longitude, locationBounds.minLng, locationBounds.maxLng);
    const y = 1 - normalize(location.latitude, locationBounds.minLat, locationBounds.maxLat);
    return { left: `${Math.round(x * 100)}%`, top: `${Math.round(y * 100)}%` };
  };

  const handleCreateBus = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusMessage(null);
    if (!busForm.name.trim() || !busForm.route.trim()) {
      setBusMessage("Name and route are required.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/transport/buses", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(busForm),
      });
      const result = await res.json();
      if (!res.ok) {
        setBusMessage(result.error || "Unable to create bus.");
        return;
      }
      setBusForm({ name: "", plateNumber: "", driverName: "", route: "" });
      setBusMessage("Bus created.");
      loadBuses();
      loadRegistrations();
      if (result.bus?.id) {
        setSelectedBusId(result.bus.id);
      }
    } catch (error) {
      console.error(error);
      setBusMessage("Unable to create bus.");
    } finally {
      setIsLoading(false);
    }
  };

  const startEditBus = (bus: BusItem) => {
    setEditBusId(bus.id);
    setEditBusForm({
      name: bus.name,
      plateNumber: bus.plateNumber,
      driverName: bus.driverName,
      route: bus.route,
    });
    setEditBusMessage(null);
  };

  const cancelEditBus = () => {
    setEditBusId(null);
    setEditBusForm({ name: "", plateNumber: "", driverName: "", route: "" });
    setEditBusMessage(null);
  };

  const handleUpdateBus = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editBusId) return;
    if (!editBusForm.name.trim() || !editBusForm.route.trim()) {
      setEditBusMessage("Name and route are required.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/transport/buses/${editBusId}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editBusForm),
      });
      const result = await res.json();
      if (!res.ok) {
        setEditBusMessage(result.error || "Unable to update bus.");
        return;
      }
      setEditBusMessage("Bus updated.");
      setEditBusId(null);
      setEditBusForm({ name: "", plateNumber: "", driverName: "", route: "" });
      loadBuses();
      loadRegistrations();
    } catch (error) {
      console.error(error);
      setEditBusMessage("Unable to update bus.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBus = async (busId: number) => {
    if (!window.confirm("Delete this bus? This action cannot be undone.")) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/transport/buses/${busId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const result = await res.json();
      if (!res.ok) {
        setBusMessage(result.error || "Unable to delete bus.");
        return;
      }
      setBusMessage("Bus deleted.");
      loadBuses();
      loadRegistrations();
    } catch (error) {
      console.error(error);
      setBusMessage("Unable to delete bus.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRegistrationMessage(null);
    if (!registrationForm.studentId || !registrationForm.busId || !registrationForm.location.trim()) {
      setRegistrationMessage("Student, bus and location are required.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/transport/registrations", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationForm),
      });
      const result = await res.json();
      if (!res.ok) {
        setRegistrationMessage(result.error || "Unable to register student.");
        return;
      }
      setRegistrationMessage("Student registered successfully.");
      setRegistrationModalOpen(false);
      setRegistrationForm((current) => ({ ...current, location: "" }));
      loadRegistrations();
    } catch (error) {
      console.error(error);
      setRegistrationMessage("Unable to register student.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRegistration = async (registrationId: number) => {
    if (!window.confirm("Remove this bus registration?")) {
      return;
    }

    try {
      const res = await fetch(`/api/transport/registrations/${registrationId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const result = await res.json();
      if (!res.ok) {
        console.error(result.error || "Unable to remove registration.");
        return;
      }
      loadRegistrations();
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmitRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRequestMessage(null);
    if (!requestForm.studentId || !requestForm.routine) {
      setRequestMessage("Please select a student and routine.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/transport/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestForm),
      });
      const result = await res.json();
      if (!res.ok) {
        setRequestMessage(result.error || "Unable to send request.");
        return;
      }
      setRequestMessage("Request submitted to admin for approval.");
      loadRequests();
    } catch (error) {
      console.error(error);
      setRequestMessage("Unable to send request.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestStatus = async (requestId: number, newStatus: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch("/api/transport/requests/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, status: newStatus }),
      });
      const result = await res.json();
      if (!res.ok) {
        console.error(result.error || "Unable to update status.");
        return;
      }
      loadRequests();
    } catch (error) {
      console.error(error);
    }
  };

  const sendLocationUpdate = async (busId: number, latitude: number, longitude: number) => {
    try {
      const res = await fetch("/api/transport/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ busId, latitude, longitude }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSharingStatus(data.error || "Unable to send location.");
        return;
      }
      setLastSharedAt(new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setSharingStatus("Location shared.");
      loadBuses();
    } catch (error) {
      console.error(error);
      setSharingStatus("Unable to send location.");
    }
  };

  const toggleLocationSharing = () => {
    if (sharing) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setSharing(false);
      setSharingStatus("Location sharing stopped.");
      return;
    }

    if (!selectedBusId) {
      setSharingStatus("Select a bus before sharing location.");
      return;
    }
    if (!navigator.geolocation) {
      setSharingStatus("Geolocation is not available in your browser.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        sendLocationUpdate(selectedBusId, position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        setSharingStatus(error.message || "Unable to read geolocation.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );

    watchIdRef.current = watchId;
    setSharing(true);
    setSharingStatus("Sharing location now.");
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.8fr_1.2fr]">
        <section className="rounded-3xl bg-slate-950/80 p-5 shadow-lg ring-1 ring-white/10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Live transport map</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Bus location tracker</h2>
            </div>
            <p className="text-sm text-slate-400">Updates every 10 seconds</p>
          </div>

          <div className="mt-6 grid gap-4">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900 px-4 py-4">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_30%)]" />
              <div className="relative h-[360px] overflow-hidden rounded-3xl bg-slate-800/70">
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:80px_80px]" />
                {buses.some((bus) => bus.latestLocation) ? (
                  buses.map((bus) => {
                    const { left, top } = markerPosition(bus.latestLocation);
                    return (
                      <div
                        key={bus.id}
                        className="absolute z-10 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-cyan-400/95 px-3 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-cyan-500/20"
                        style={{ left, top }}
                      >
                        <span className="block h-2.5 w-2.5 rounded-full bg-slate-950" />
                        <span>{bus.name}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-slate-500">
                    No live bus positions yet.
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {buses.map((bus) => (
                <div
                  key={bus.id}
                  className="rounded-3xl border border-white/10 bg-slate-950/80 p-4"
                >
                  {editBusId === bus.id ? (
                    <form onSubmit={handleUpdateBus} className="space-y-4">
                      <label className="block text-sm text-slate-300">
                        Bus name
                        <input
                          value={editBusForm.name}
                          onChange={(event) => setEditBusForm({ ...editBusForm, name: event.target.value })}
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none focus:border-cyan-400"
                        />
                      </label>
                      <label className="block text-sm text-slate-300">
                        Plate number
                        <input
                          value={editBusForm.plateNumber}
                          onChange={(event) => setEditBusForm({ ...editBusForm, plateNumber: event.target.value })}
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none focus:border-cyan-400"
                        />
                      </label>
                      <label className="block text-sm text-slate-300">
                        Driver name
                        <input
                          value={editBusForm.driverName}
                          onChange={(event) => setEditBusForm({ ...editBusForm, driverName: event.target.value })}
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none focus:border-cyan-400"
                        />
                      </label>
                      <label className="block text-sm text-slate-300">
                        Route description
                        <textarea
                          value={editBusForm.route}
                          onChange={(event) => setEditBusForm({ ...editBusForm, route: event.target.value })}
                          rows={3}
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none focus:border-cyan-400"
                        />
                      </label>
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                          disabled={isLoading}
                        >
                          Save changes
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditBus}
                          className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:border-cyan-400"
                        >
                          Cancel
                        </button>
                      </div>
                      {editBusMessage ? <p className="text-sm text-amber-300">{editBusMessage}</p> : null}
                    </form>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm text-slate-300">{bus.name}</p>
                          <p className="text-xs text-slate-500">{bus.plateNumber}</p>
                        </div>
                        <span className="rounded-full bg-white/5 px-2 py-1 text-[11px] uppercase tracking-[0.24em] text-slate-300">
                          {bus.driverName || "No driver"}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-2 text-sm text-slate-400">
                        <div>
                          <span className="font-medium text-slate-200">Route:</span> {bus.route}
                        </div>
                        <div>
                          <span className="font-medium text-slate-200">Latest update:</span>{" "}
                          {bus.latestLocation ? formatDateTime(bus.latestLocation.reportedAt) : "None"}
                        </div>
                        <div>
                          <span className="font-medium text-slate-200">Position:</span>{" "}
                          {bus.latestLocation
                            ? `${bus.latestLocation.latitude.toFixed(5)}, ${bus.latestLocation.longitude.toFixed(5)}`
                            : "Not shared"}
                        </div>
                      </div>
                      {role === "admin" ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => startEditBus(bus)}
                            className="rounded-2xl bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBus(bus.id)}
                            className="rounded-2xl bg-rose-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-rose-400"
                          >
                            Delete
                          </button>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          {(role === "admin" || role === "teacher") && (
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5 shadow-lg">
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Driver live location</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Share bus position</h3>
              <div className="mt-4 space-y-4">
                <label className="block text-sm text-slate-300">
                  Select bus
                  <select
                    value={selectedBusId ?? ""}
                    onChange={(event) => setSelectedBusId(Number(event.target.value))}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
                  >
                    <option value="" disabled>
                      Choose a bus
                    </option>
                    {buses.map((bus) => (
                      <option key={bus.id} value={bus.id}>
                        {bus.name} — {bus.plateNumber}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  onClick={toggleLocationSharing}
                  className="inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                >
                  {sharing ? "Stop sharing" : "Start sharing"}
                </button>

                <p className="text-sm text-slate-400">
                  {sharingStatus || "Enable browser location access to share the bus position."}
                </p>
                {lastSharedAt ? (
                  <p className="text-sm text-slate-400">Last shared at {lastSharedAt}</p>
                ) : null}
              </div>
            </div>
          )}

          {role === "admin" && (
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5 shadow-lg">
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Admin bus input</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Register a new bus</h3>
              <form onSubmit={handleCreateBus} className="mt-4 space-y-4">
                <label className="block text-sm text-slate-300">
                  Bus name
                  <input
                    value={busForm.name}
                    onChange={(event) => setBusForm({ ...busForm, name: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none focus:border-cyan-400"
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  Plate number
                  <input
                    value={busForm.plateNumber}
                    onChange={(event) => setBusForm({ ...busForm, plateNumber: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none focus:border-cyan-400"
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  Driver name
                  <input
                    value={busForm.driverName}
                    onChange={(event) => setBusForm({ ...busForm, driverName: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none focus:border-cyan-400"
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  Route description
                  <textarea
                    value={busForm.route}
                    onChange={(event) => setBusForm({ ...busForm, route: event.target.value })}
                    rows={3}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none focus:border-cyan-400"
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Save bus"}
                </button>
                {busMessage ? <p className="text-sm text-amber-300">{busMessage}</p> : null}
              </form>
            </div>
          )}
        </section>
      </div>

      {role === "admin" && (
        <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-5 shadow-lg">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Bus transport registrations</p>
              <h3 className="mt-1 text-2xl font-semibold text-white">Registered students for bus transport</h3>
            </div>
            <button
              type="button"
              onClick={() => setRegistrationModalOpen(true)}
              className="rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Register student
            </button>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-sm text-left text-slate-300">
              <thead>
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Parent</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Bus</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Registered</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {registrations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                      No bus transport registrations yet.
                    </td>
                  </tr>
                ) : (
                  registrations.map((registration) => (
                    <tr key={registration.id} className="border-t border-white/5">
                      <td className="px-4 py-4 font-medium text-white">{registration.studentName}</td>
                      <td className="px-4 py-4">{registration.className}</td>
                      <td className="px-4 py-4">{registration.parentName}</td>
                      <td className="px-4 py-4">{registration.parentPhone}</td>
                      <td className="px-4 py-4">{registration.busName}</td>
                      <td className="px-4 py-4">{registration.location}</td>
                      <td className="px-4 py-4">{formatDateTime(registration.createdAt)}</td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => handleDeleteRegistration(registration.id)}
                          className="rounded-2xl bg-rose-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-rose-400"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {registrationModalOpen ? (
            <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 px-4 py-6">
              <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Register student</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">Bus transport registration</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRegistrationModalOpen(false)}
                    className="rounded-full border border-white/10 bg-slate-950/90 px-3 py-2 text-sm text-slate-300 transition hover:border-cyan-400"
                  >
                    Close
                  </button>
                </div>

                <form onSubmit={handleCreateRegistration} className="mt-6 space-y-4">
                  <label className="block text-sm text-slate-300">
                    Student
                    <select
                      value={registrationForm.studentId}
                      onChange={(event) => setRegistrationForm({ ...registrationForm, studentId: event.target.value })}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none focus:border-cyan-400"
                    >
                      <option value="" disabled>
                        Select a student
                      </option>
                      {adminStudentChoices.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.name} {student.surname} — {student.className} ({student.parentName})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm text-slate-300">
                    Bus
                    <select
                      value={registrationForm.busId}
                      onChange={(event) => setRegistrationForm({ ...registrationForm, busId: event.target.value })}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none focus:border-cyan-400"
                    >
                      <option value="" disabled>
                        Select a bus
                      </option>
                      {buses.map((bus) => (
                        <option key={bus.id} value={bus.id}>
                          {bus.name} — {bus.plateNumber}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm text-slate-300">
                    Pickup location
                    <input
                      value={registrationForm.location}
                      onChange={(event) => setRegistrationForm({ ...registrationForm, location: event.target.value })}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none focus:border-cyan-400"
                    />
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                      disabled={isLoading}
                    >
                      {isLoading ? "Registering..." : "Register student"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegistrationModalOpen(false)}
                      className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:border-cyan-400"
                    >
                      Cancel
                    </button>
                  </div>
                  {registrationMessage ? <p className="text-sm text-amber-300">{registrationMessage}</p> : null}
                </form>
              </div>
            </div>
          ) : null}
        </section>
      )}

      {(role === "parent" || role === "admin") && (
        <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-5 shadow-lg">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">
                Parent transport requests
              </p>
              <h3 className="mt-1 text-2xl font-semibold text-white">Request and approvals</h3>
            </div>
            <span className="rounded-2xl bg-white/5 px-3 py-1 text-sm text-slate-300">{requests.length} request(s)</span>
          </div>

          {role === "parent" ? (
            <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-5">
                <form onSubmit={handleSubmitRequest} className="space-y-4">
                  <label className="block text-sm text-slate-300">
                    Parent
                    <input
                      value={parentName ?? "Parent"}
                      disabled
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-slate-400 outline-none"
                    />
                  </label>
                  <label className="block text-sm text-slate-300">
                    Student
                    <select
                      value={requestForm.studentId}
                      onChange={(event) => setRequestForm({ ...requestForm, studentId: event.target.value })}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none focus:border-cyan-400"
                    >
                      {parentStudents.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.name} {student.surname} — {student.className}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm text-slate-300">
                    Transport routine
                    <select
                      value={requestForm.routine}
                      onChange={(event) => setRequestForm({ ...requestForm, routine: event.target.value })}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none focus:border-cyan-400"
                    >
                      <option value="REGULAR">Regular</option>
                      <option value="RANDOM_DAYS">Random days</option>
                    </select>
                  </label>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                    disabled={isLoading}
                  >
                    Submit request
                  </button>
                  {requestMessage ? <p className="text-sm text-amber-300">{requestMessage}</p> : null}
                </form>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-5">
                <p className="text-sm text-slate-300">Request status</p>
                <div className="mt-4 space-y-3">
                  {requests.length === 0 ? (
                    <p className="text-slate-500">You have not sent any transport requests yet.</p>
                  ) : (
                    requests.map((request) => (
                      <div key={request.id} className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-white">{request.studentName}</p>
                          <span className="rounded-full bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-300">
                            {request.status}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-400">Routine: {request.routine.replace("_", " ")}</p>
                        <p className="mt-1 text-sm text-slate-500">Updated: {formatDateTime(request.updatedAt)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/90 p-5">
              {requests.length === 0 ? (
                <p className="text-slate-500">No transport requests have been submitted yet.</p>
              ) : (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <div key={request.id} className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{request.studentName}</p>
                          <p className="text-xs text-slate-500">Parent: {request.parentName}</p>
                        </div>
                        <span className="rounded-full bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-300">
                          {request.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-400">Routine: {request.routine.replace("_", " ")}</p>
                      <p className="mt-1 text-sm text-slate-500">Requested: {formatDateTime(request.createdAt)}</p>
                      {role === "admin" && request.status === "PENDING" ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleRequestStatus(request.id, "APPROVED")}
                            className="rounded-2xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRequestStatus(request.id, "REJECTED")}
                            className="rounded-2xl bg-rose-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-rose-400"
                          >
                            Reject
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default TransportDashboard;
