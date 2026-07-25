"use client";

import {
  deleteClass,
  deleteExam,
  deleteParent,
  deleteStudent,
  deleteSubject,
  deleteTeacher,
  deleteAttendance,
  deleteAssignment,
} from "@/lib/actions";
import { deleteEvent } from "@/lib/eventActions";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Dispatch,
  SetStateAction,
  useActionState,
  useEffect,
  useState,
} from "react";
import { toast } from "react-toastify";
import { FormContainerProps } from "./FormContainer";

const deleteActionMap = {
  subject: deleteSubject,
  class: deleteClass,
  teacher: deleteTeacher,
  student: deleteStudent,
  exam: deleteExam,
  // TODO: OTHER DELETE ACTIONS
  parent: deleteParent,
  lesson: deleteSubject,
  assignment: deleteAssignment,
  result: deleteSubject,
  attendance: deleteAttendance,
  event: deleteEvent,
  announcement: deleteSubject,
};

// USE LAZY LOADING

// import TeacherForm from "./forms/TeacherForm";
// import StudentForm from "./forms/StudentForm";

const TeacherForm = dynamic(
  () => import("./forms/TeacherForm.js").then((mod) => mod.default as any),
  {
    loading: () => <h1>Loading...</h1>,
  }
) as any;
const StudentForm = dynamic(
  () => import("./forms/StudentForm.js").then((mod) => mod.default as any),
  {
    loading: () => <h1>Loading...</h1>,
  }
) as any;
const SubjectForm = dynamic(
  () => import("./forms/SubjectForm.js").then((mod) => mod.default as any),
  {
    loading: () => <h1>Loading...</h1>,
  }
) as any;
const ClassForm = dynamic(
  () => import("./forms/ClassForm.js").then((mod) => mod.default as any),
  {
    loading: () => <h1>Loading...</h1>,
  }
) as any;
const ExamForm = dynamic(
  () => import("./forms/ExamForm.js").then((mod) => mod.default as any),
  {
    loading: () => <h1>Loading...</h1>,
  }
) as any;
const AttendanceForm = dynamic(
  () => import("./forms/AttendanceForm.js").then((mod) => mod.default as any),
  {
    loading: () => <h1>Loading...</h1>,
  }
) as any;
const ParentForm = dynamic(
  () => import("./forms/ParentForm.js").then((mod) => mod.default as any),
  {
    loading: () => <h1>Loading...</h1>,
  }
) as any;
const EventForm = dynamic(
  () => import("./forms/EventForm.js").then((mod) => mod.default as any),
  {
    loading: () => <h1>Loading...</h1>,
  }
) as any;
const AssignmentForm = dynamic(
  () => import("./forms/AssignmentForm.js").then((mod) => mod.default as any),
  {
    loading: () => <h1>Loading...</h1>,
  }
) as any;

const forms: {
  [key: string]: (
    setOpen: Dispatch<SetStateAction<boolean>>,
    type: "create" | "update",
    data?: any,
    relatedData?: any
  ) => JSX.Element;
} = {
  subject: (setOpen, type, data, relatedData) => (
    <SubjectForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  class: (setOpen, type, data, relatedData) => (
    <ClassForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  teacher: (setOpen, type, data, relatedData) => (
    <TeacherForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  student: (setOpen, type, data, relatedData) => (
    <StudentForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  exam: (setOpen, type, data, relatedData) => (
    <ExamForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  attendance: (setOpen, type, data, relatedData) => (
    <AttendanceForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  event: (setOpen, type, data, relatedData) => (
    <EventForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
  assignment: (setOpen, type, data, relatedData) => (
    <AssignmentForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
  parent: (setOpen, type, data) => (
    <ParentForm type={type} data={data} setOpen={setOpen} />
  ),
};

const FormModal = ({
  table,
  type,
  data,
  id,
  relatedData,
}: FormContainerProps & { relatedData?: any }) => {
  const size = type === "create" ? "w-8 h-8" : "w-7 h-7";
  const bgColor =
    type === "create"
      ? "bg-lamaYellow"
      : type === "update"
      ? "bg-lamaSky"
      : "bg-red-500";

  const [open, setOpen] = useState(false);

  const Form = () => {
    const [state, formAction] = useActionState(deleteActionMap[table] as any, {
      success: false,
      error: false,
    });

    const router = useRouter();

    useEffect(() => {
      if (state.success) {
        toast(`${table} has been deleted!`);
        setOpen(false);
        router.refresh();
      }
    }, [state, router]);

    return type === "delete" && id ? (
      <form action={formAction as any} className="p-4 flex flex-col gap-4">
        <input type="text | number" name="id" value={id} hidden />
        <span className="text-center font-medium">
          All data will be lost. Are you sure you want to delete this {table}?
        </span>
        <button className="btn-delete self-center">
          Delete
        </button>
      </form>
    ) : type === "create" || type === "update" ? (
      forms[table] ? forms[table](setOpen, type, data, relatedData) : (
        <p className="p-4 text-sm text-slate-600">Form not available for {table}.</p>
      )
    ) : (
      "Form not found!"
    );
  };

  const iconSrc = type === "update" ? "/edit.svg" : type === "delete" ? "/delete.svg" : `/${type}.png`;

  return (
    <>
      <button
        type="button"
        className={`${size} flex items-center justify-center rounded-full ${bgColor}`}
        onClick={() => setOpen(true)}
      >
        <Image src={iconSrc} alt="" width={16} height={16} />
      </button>
      {open && (
        <div className="w-screen h-screen absolute left-0 top-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-4 rounded-md relative w-full max-w-2xl md:w-[95%] lg:w-[85%] xl:w-[75%] 2xl:w-[65%] max-h-[85vh] overflow-y-auto">
            <Form />
            <button
              type="button"
              className="absolute top-4 right-4 cursor-pointer"
              onClick={() => setOpen(false)}
            >
              <Image src="/close.png" alt="" width={14} height={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FormModal;
