"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var navigation_1 = require("next/navigation");
var react_calendar_1 = require("react-calendar");
require("react-calendar/dist/Calendar.css");
var AttendanceCalendar = function (_a) {
    var selectedDate = _a.selectedDate;
    var _b = (0, react_1.useState)(function () { return new Date(selectedDate); }), value = _b[0], setValue = _b[1];
    var router = (0, navigation_1.useRouter)();
    (0, react_1.useEffect)(function () {
        var parsed = new Date(selectedDate);
        if (!Number.isNaN(parsed.getTime())) {
            setValue(parsed);
        }
    }, [selectedDate]);
    (0, react_1.useEffect)(function () {
        if (!(value instanceof Date))
            return;
        var currentDateKey = value.toISOString().slice(0, 10);
        if (currentDateKey === selectedDate)
            return;
        var searchParams = new URLSearchParams(window.location.search);
        searchParams.set("date", currentDateKey);
        router.push("".concat(window.location.pathname, "?").concat(searchParams.toString()));
    }, [value, selectedDate, router]);
    return (<div className="rounded-3xl border border-slate-200 bg-white dark:bg-slate-950 dark:border-slate-700 p-4 shadow-sm">
      <p className="mb-3 text-sm font-semibold text-slate-700">Attendance calendar</p>
      <react_calendar_1.default onChange={function (nextValue) {
            if (Array.isArray(nextValue) || nextValue === null)
                return;
            setValue(nextValue);
        }} value={value} prevLabel="‹" nextLabel="›"/>
    </div>);
};
exports.default = AttendanceCalendar;
