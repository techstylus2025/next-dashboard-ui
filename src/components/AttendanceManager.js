"use client";
"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("react");
var navigation_1 = require("next/navigation");
var react_toastify_1 = require("react-toastify");
var actions_1 = require("@/lib/actions");
var AttendanceCalendar_1 = require("./AttendanceCalendar");
var AttendanceManager = function (_a) {
    var _b, _c;
    var role = _a.role, records = _a.records, _d = _a.students, students = _d === void 0 ? [] : _d, _e = _a.teachers, teachers = _e === void 0 ? [] : _e;
    var router = (0, navigation_1.useRouter)();
    var _f = (0, react_1.useState)("student"), recordType = _f[0], setRecordType = _f[1];
    var _g = (0, react_1.useState)(((_b = students[0]) === null || _b === void 0 ? void 0 : _b.id) || ""), selectedStudentId = _g[0], setSelectedStudentId = _g[1];
    var _h = (0, react_1.useState)([]), selectedStudentIds = _h[0], setSelectedStudentIds = _h[1];
    var _j = (0, react_1.useState)(((_c = teachers[0]) === null || _c === void 0 ? void 0 : _c.id) || ""), selectedTeacherId = _j[0], setSelectedTeacherId = _j[1];
    var _k = (0, react_1.useState)(selectedDate), date = _k[0], setDate = _k[1];
    (0, react_1.useEffect)(function () {
        setDate(selectedDate);
    }, [selectedDate]);
    var _l = (0, react_1.useState)("true"), present = _l[0], setPresent = _l[1];
    var _m = (0, react_1.useState)(""), searchTerm = _m[0], setSearchTerm = _m[1];
    var _o = (0, react_1.useState)("all"), filterType = _o[0], setFilterType = _o[1];
    var _p = (0, react_1.useState)("all"), filterStatus = _p[0], setFilterStatus = _p[1];
    var _q = (0, react_1.useState)("date"), sortKey = _q[0], setSortKey = _q[1];
    var _r = (0, react_1.useState)("desc"), sortDirection = _r[0], setSortDirection = _r[1];
    var _s = (0, react_2.useActionState)(actions_1.createAttendance, {
        success: false,
        error: false,
    }), state = _s[0], createAttendanceAction = _s[1];
    var onSubmit = function (event) {
        event.preventDefault();
        var payload = {
            type: recordType,
            date: date,
            present: present,
            studentIds: role === "teacher" && recordType === "student"
                ? selectedStudentIds
                : undefined,
            studentId: role !== "teacher" && recordType === "student"
                ? selectedStudentId
                : undefined,
            teacherId: recordType === "teacher" ? selectedTeacherId : undefined,
        };
        (0, react_1.startTransition)(function () {
            createAttendanceAction(payload);
        });
    };
    (0, react_1.useEffect)(function () {
        if (state.success) {
            (0, react_toastify_1.toast)("Attendance record saved.");
            router.refresh();
        }
        if (state.error) {
            react_toastify_1.toast.error("Unable to save attendance. Check the selection and try again.");
        }
    }, [state, router]);
    var studentOptions = (0, react_1.useMemo)(function () { return __spreadArray([], students, true).sort(function (a, b) {
        return "".concat(a.name, " ").concat(a.surname).localeCompare("".concat(b.name, " ").concat(b.surname));
    }); }, [students]);
    var teacherOptions = (0, react_1.useMemo)(function () { return __spreadArray([], teachers, true).sort(function (a, b) {
        return "".concat(a.name, " ").concat(a.surname).localeCompare("".concat(b.name, " ").concat(b.surname));
    }); }, [teachers]);
    var hasRecordPermission = role === "admin" || (role === "teacher" && students.length > 0);
    var allStudentOptions = studentOptions;
    var allTeacherOptions = teacherOptions;
    var filteredRecords = (0, react_1.useMemo)(function () {
        var lowerSearch = searchTerm.trim().toLowerCase();
        return __spreadArray([], records, true).filter(function (record) {
            var _a;
            if (filterType !== "all" && record.recordType !== filterType) {
                return false;
            }
            if (filterStatus !== "all") {
                var isPresent = record.present;
                if (filterStatus === "present" && !isPresent)
                    return false;
                if (filterStatus === "absent" && isPresent)
                    return false;
            }
            if (!lowerSearch) {
                return true;
            }
            return [record.personName, (_a = record.className) !== null && _a !== void 0 ? _a : "", record.date, record.recordType]
                .some(function (value) { return value.toLowerCase().includes(lowerSearch); });
        })
            .sort(function (a, b) {
            if (sortKey === "person") {
                var result = a.personName.localeCompare(b.personName);
                return sortDirection === "asc" ? result : -result;
            }
            var dateResult = a.date.localeCompare(b.date);
            return sortDirection === "asc" ? dateResult : -dateResult;
        });
    }, [records, searchTerm, filterType, filterStatus, sortKey, sortDirection]);
    // moved to testable helpers in lib; keep fallback implementations for safety
    var getInitials = function (name) {
        try {
            var parts = name.trim().split(" ");
            if (parts.length === 0)
                return "";
            if (parts.length === 1)
                return parts[0].slice(0, 2).toUpperCase();
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        catch (_a) {
            return "";
        }
    };
    var avatarColor = function (name) {
        try {
            var code = name.split("").reduce(function (acc, ch) { return acc + ch.charCodeAt(0); }, 0);
            var colors = ["bg-sky-500", "bg-indigo-500", "bg-emerald-500", "bg-rose-500", "bg-yellow-500", "bg-violet-500"];
            return colors[code % colors.length];
        }
        catch (_a) {
            return "bg-sky-500";
        }
    };
    return (<div className="space-y-6">
      <section className="bg-white dark:bg-slate-950 shadow-lg rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-sky-500">
              Attendance
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
              Attendance Records
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Manage daily attendance quickly — modern, clear controls for
              teachers and administrators.
            </p>
          </div>
          <div className="flex w-full gap-3 sm:w-auto">
            <div className="flex-1 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 p-4 text-white shadow-md transform transition-transform hover:-translate-y-1">
              <p className="text-xs opacity-90">Total records</p>
              <p className="mt-2 text-2xl font-semibold">{records.length}</p>
            </div>
            <div className="rounded-2xl bg-white dark:bg-slate-950 p-4 shadow-md border border-slate-100 dark:border-slate-800 transform transition hover:shadow-lg focus-within:shadow-lg">
              <p className="text-xs text-slate-500">Present</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {records.filter(function (record) { return record.present; }).length}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-md border border-slate-100 transform transition hover:shadow-lg focus-within:shadow-lg">
              <p className="text-xs text-slate-500">Attendance rate</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {records.length > 0
            ? "".concat(Math.round((records.filter(function (record) { return record.present; }).length /
                records.length) *
                100), "%")
            : "-"}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_0.9fr]">
          <div className="rounded-2xl bg-slate-50 p-5 shadow-sm border border-slate-200">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Showing attendance for
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {selectedDate}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Select a different date on the calendar to view past records.
            </p>
          </div>
          <AttendanceCalendar_1.default selectedDate={selectedDate}/>
        </div>
      </section>

      {hasRecordPermission && (<section className="bg-white shadow-sm ring-1 ring-slate-200 rounded-xl p-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Record attendance
              </h2>
              <p className="text-sm text-slate-500">
                Create a new attendance entry for a student or teacher.
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Type
                </label>
                <div className="inline-flex rounded-full bg-slate-100 p-1">
                  <button type="button" onClick={function () { return setRecordType("student"); }} className={"px-4 py-2 rounded-full text-sm font-medium transition ".concat(recordType === "student"
                ? "bg-white shadow text-slate-900"
                : "text-slate-700")}>
                    Student
                  </button>
                  {role === "admin" && (<button type="button" onClick={function () { return setRecordType("teacher"); }} className={"ml-1 px-4 py-2 rounded-full text-sm font-medium transition ".concat(recordType === "teacher"
                    ? "bg-white shadow text-slate-900"
                    : "text-slate-700")}>
                      Teacher
                    </button>)}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Date</label>
                <input type="date" name="date" value={date} onChange={function (event) { return setDate(event.target.value); }} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-sky-500/10 transition focus:border-sky-300 focus:ring"/>
              </div>
            </div>

            {recordType === "student" && (<div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Student
                  </label>
                  <select name={role === "teacher" ? "studentIds" : "studentId"} value={role === "teacher" ? selectedStudentIds : selectedStudentId} onChange={function (event) {
                    if (role === "teacher") {
                        var values = Array.from(event.target.selectedOptions, function (option) { return option.value; });
                        setSelectedStudentIds(values);
                    }
                    else {
                        setSelectedStudentId(event.target.value);
                    }
                }} multiple={role === "teacher"} className={"min-h-[180px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-sky-500/10 ".concat(role === "teacher" ? "resize-none" : "")}>
                    {role !== "teacher" && <option value="">Select student</option>}
                    {studentOptions.map(function (student) { return (<option key={student.id} value={student.id}>
                        {student.name} {student.surname}
                        {student.className ? " \u2014 ".concat(student.className) : ""}
                      </option>); })}
                  </select>
                  {role === "teacher" && (<p className="text-xs text-slate-500">
                      {selectedStudentIds.length === 0
                        ? "Choose one or more students to mark attendance."
                        : "".concat(selectedStudentIds.length, " student").concat(selectedStudentIds.length > 1 ? "s" : "", " selected.")}
                    </p>)}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Attendance
                  </label>
                  <div className="inline-flex rounded-full bg-slate-100 p-1">
                    <button type="button" onClick={function () { return setPresent("true"); }} className={"px-4 py-2 rounded-full text-sm font-medium transition ".concat(present === "true"
                    ? "bg-emerald-600 text-white shadow"
                    : "text-slate-700")}>
                      Present
                    </button>
                    <button type="button" onClick={function () { return setPresent("false"); }} className={"ml-1 px-4 py-2 rounded-full text-sm font-medium transition ".concat(present === "false"
                    ? "bg-rose-600 text-white shadow"
                    : "text-slate-700")}>
                      Absent
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-1"/>
              </div>)}

            {recordType === "teacher" && (<div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Teacher
                  </label>
                  <select name="teacherId" value={selectedTeacherId} onChange={function (event) { return setSelectedTeacherId(event.target.value); }} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-sky-500/10">
                    <option value="">Select teacher</option>
                    {teacherOptions.map(function (teacher) { return (<option key={teacher.id} value={teacher.id}>
                        {teacher.name} {teacher.surname}
                      </option>); })}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Attendance
                  </label>
                  <div className="inline-flex rounded-full bg-slate-100 p-1">
                    <button type="button" onClick={function () { return setPresent("true"); }} className={"px-4 py-2 rounded-full text-sm font-medium transition ".concat(present === "true"
                    ? "bg-emerald-600 text-white shadow"
                    : "text-slate-700")}>
                      Present
                    </button>
                    <button type="button" onClick={function () { return setPresent("false"); }} className={"ml-1 px-4 py-2 rounded-full text-sm font-medium transition ".concat(present === "false"
                    ? "bg-rose-600 text-white shadow"
                    : "text-slate-700")}>
                      Absent
                    </button>
                  </div>
                  <input type="hidden" name="present" value={present}/>
                </div>

                <div className="sm:col-span-1"/>
              </div>)}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button type="submit" disabled={(recordType === "student" &&
                (role === "teacher"
                    ? selectedStudentIds.length === 0
                    : !selectedStudentId)) ||
                (recordType === "teacher" && !selectedTeacherId)} className="inline-flex items-center gap-2 justify-center rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition transform hover:-translate-y-0.5 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:cursor-not-allowed disabled:bg-slate-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016.803 4H3.197a2 2 0 00-1.194.884z"/>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
                Save attendance
              </button>
              <p className="text-sm text-slate-500">
                Records created here are visible to all authorized users.
              </p>
            </div>
          </form>
        </section>)}

      <section className="bg-white shadow-sm ring-1 ring-slate-200 rounded-xl p-6 overflow-x-auto">
        <div className="mb-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Recent attendance history
              </h2>
              <p className="text-sm text-slate-500">
                Search, filter, and sort the attendance records shown below.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input type="search" value={searchTerm} onChange={function (event) { return setSearchTerm(event.target.value); }} placeholder="Search name, class, date, type" className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"/>
              <button type="button" onClick={function () {
            if (sortKey === "date") {
                setSortDirection(sortDirection === "asc" ? "desc" : "asc");
            }
            else {
                setSortKey("date");
                setSortDirection("desc");
            }
        }} className={"rounded-full border px-4 py-2 text-sm font-medium transition ".concat(sortKey === "date"
            ? "border-sky-500 bg-sky-50 text-sky-700"
            : "border-slate-200 bg-white text-slate-700")}>
                Date {sortKey === "date" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
              </button>
              <button type="button" onClick={function () {
            if (sortKey === "person") {
                setSortDirection(sortDirection === "asc" ? "desc" : "asc");
            }
            else {
                setSortKey("person");
                setSortDirection("asc");
            }
        }} className={"rounded-full border px-4 py-2 text-sm font-medium transition ".concat(sortKey === "person"
            ? "border-sky-500 bg-sky-50 text-sky-700"
            : "border-slate-200 bg-white text-slate-700")}>
                Name {sortKey === "person" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
              </button>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <div className="flex flex-wrap items-center gap-2">
              {["all", "student", "teacher"].map(function (typeOption) { return (<button key={typeOption} type="button" onClick={function () { return setFilterType(typeOption); }} className={"rounded-full px-4 py-2 text-sm font-medium transition ".concat(filterType === typeOption
                ? "bg-sky-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200")}>
                  {typeOption === "all" ? "All types" : typeOption.charAt(0).toUpperCase() + typeOption.slice(1)}
                </button>); })}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {["all", "present", "absent"].map(function (statusOption) { return (<button key={statusOption} type="button" onClick={function () { return setFilterStatus(statusOption); }} className={"rounded-full px-4 py-2 text-sm font-medium transition ".concat(filterStatus === statusOption
                ? "bg-sky-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200")}>
                  {statusOption === "all"
                ? "All status"
                : statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
                </button>); })}
            </div>
          </div>
        </div>
        <div className="min-w-full overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Person</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredRecords.length === 0 ? (<tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    No attendance records match your filters.
                  </td>
                </tr>) : (filteredRecords.map(function (record) {
            var _a;
            return (<tr key={record.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 text-slate-700">{record.date}</td>
                    <td className="px-4 py-4 uppercase tracking-[0.16em] text-slate-500">
                      {record.recordType}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      <div className="flex items-center gap-3">
                        <div className={"flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white ".concat(avatarColor(record.personName))}>
                          {getInitials(record.personName)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">{record.personName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {(_a = record.className) !== null && _a !== void 0 ? _a : (record.recordType === "teacher" ? "Staff" : "-")}
                    </td>
                    <td className="px-4 py-4">
                      <span className={"inline-flex rounded-full px-3 py-1 text-xs font-semibold ".concat(record.present
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-700")}>
                        {record.present ? "Present" : "Absent"}
                      </span>
                    </td>
                  </tr>);
        }))}
            </tbody>
          </table>
        </div>
      </section>
    </div>);
};
exports.default = AttendanceManager;
