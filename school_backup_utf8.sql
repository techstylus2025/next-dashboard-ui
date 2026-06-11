--
-- PostgreSQL database dump
--

\restrict 7qAbJub8QyzIxqx91I1nr6fI1sLGV5egbZLHbSADmxHSjTdUopaNG9eM3rQgEha

-- Dumped from database version 18.3 (Debian 18.3-1.pgdg13+1)
-- Dumped by pg_dump version 18.3 (Debian 18.3-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: techstylus
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO techstylus;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: techstylus
--

COMMENT ON SCHEMA public IS '';


--
-- Name: BookOrderStatus; Type: TYPE; Schema: public; Owner: techstylus
--

CREATE TYPE public."BookOrderStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'CANCELLED'
);


ALTER TYPE public."BookOrderStatus" OWNER TO techstylus;

--
-- Name: Day; Type: TYPE; Schema: public; Owner: techstylus
--

CREATE TYPE public."Day" AS ENUM (
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY'
);


ALTER TYPE public."Day" OWNER TO techstylus;

--
-- Name: Department; Type: TYPE; Schema: public; Owner: techstylus
--

CREATE TYPE public."Department" AS ENUM (
    'PRESCHOOL',
    'PRIMARY',
    'JHS'
);


ALTER TYPE public."Department" OWNER TO techstylus;

--
-- Name: ExamQuestionUploadStatus; Type: TYPE; Schema: public; Owner: techstylus
--

CREATE TYPE public."ExamQuestionUploadStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."ExamQuestionUploadStatus" OWNER TO techstylus;

--
-- Name: FeeTerm; Type: TYPE; Schema: public; Owner: techstylus
--

CREATE TYPE public."FeeTerm" AS ENUM (
    'TERM_1',
    'TERM_2',
    'TERM_3'
);


ALTER TYPE public."FeeTerm" OWNER TO techstylus;

--
-- Name: GradingLevel; Type: TYPE; Schema: public; Owner: techstylus
--

CREATE TYPE public."GradingLevel" AS ENUM (
    'CRECHE',
    'KINDERGARTEN',
    'PRIMARY',
    'JHS'
);


ALTER TYPE public."GradingLevel" OWNER TO techstylus;

--
-- Name: MessageType; Type: TYPE; Schema: public; Owner: techstylus
--

CREATE TYPE public."MessageType" AS ENUM (
    'MESSAGE',
    'COMPLAINT'
);


ALTER TYPE public."MessageType" OWNER TO techstylus;

--
-- Name: PasswordChangeStatus; Type: TYPE; Schema: public; Owner: techstylus
--

CREATE TYPE public."PasswordChangeStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."PasswordChangeStatus" OWNER TO techstylus;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: techstylus
--

CREATE TYPE public."UserRole" AS ENUM (
    'ADMIN',
    'TEACHER',
    'PARENT',
    'STUDENT'
);


ALTER TYPE public."UserRole" OWNER TO techstylus;

--
-- Name: UserSex; Type: TYPE; Schema: public; Owner: techstylus
--

CREATE TYPE public."UserSex" AS ENUM (
    'MALE',
    'FEMALE'
);


ALTER TYPE public."UserSex" OWNER TO techstylus;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AcademicTerm; Type: TABLE; Schema: public; Owner: techstylus
--

CREATE TABLE public."AcademicTerm" (
    id integer NOT NULL,
    "academicYearId" integer NOT NULL,
    "termNumber" integer NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    days integer NOT NULL,
    weeks integer NOT NULL
);


ALTER TABLE public."AcademicTerm" OWNER TO techstylus;

--
-- Name: AcademicTerm_id_seq; Type: SEQUENCE; Schema: public; Owner: techstylus
--

CREATE SEQUENCE public."AcademicTerm_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."AcademicTerm_id_seq" OWNER TO techstylus;

--
-- Name: AcademicTerm_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: techstylus
--

ALTER SEQUENCE public."AcademicTerm_id_seq" OWNED BY public."AcademicTerm".id;


--
-- Name: AcademicYear; Type: TABLE; Schema: public; Owner: techstylus
--

CREATE TABLE public."AcademicYear" (
    id integer NOT NULL,
    label text NOT NULL,
    "numberOfTerms" integer NOT NULL,
    "isActive" boolean DEFAULT false NOT NULL,
    "isArchived" boolean DEFAULT false NOT NULL,
    "archivedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AcademicYear" OWNER TO techstylus;

--
-- Name: AcademicYear_id_seq; Type: SEQUENCE; Schema: public; Owner: techstylus
--

CREATE SEQUENCE public."AcademicYear_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."AcademicYear_id_seq" OWNER TO techstylus;

--
-- Name: AcademicYear_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: techstylus
--

ALTER SEQUENCE public."AcademicYear_id_seq" OWNED BY public."AcademicYear".id;


--
-- Name: Admin; Type: TABLE; Schema: public; Owner: techstylus
--

CREATE TABLE public."Admin" (
    id text NOT NULL,
    username text NOT NULL
);


ALTER TABLE public."Admin" OWNER TO techstylus;

--
-- Name: Announcement; Type: TABLE; Schema: public; Owner: techstylus
--

CREATE TABLE public."Announcement" (
    id integer NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "classId" integer,
    "isArchived" boolean DEFAULT false NOT NULL,
    search_vector tsvector
);


ALTER TABLE public."Announcement" OWNER TO techstylus;

--
-- Name: Announcement_id_seq; Type: SEQUENCE; Schema: public; Owner: techstylus
--

CREATE SEQUENCE public."Announcement_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Announcement_id_seq" OWNER TO techstylus;

--
-- Name: Announcement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: techstylus
--

ALTER SEQUENCE public."Announcement_id_seq" OWNED BY public."Announcement".id;


--
-- Name: Assignment; Type: TABLE; Schema: public; Owner: techstylus
--

CREATE TABLE public."Assignment" (
    id integer NOT NULL,
    title text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "dueDate" timestamp(3) without time zone NOT NULL,
    "lessonId" integer NOT NULL,
    "isArchived" boolean DEFAULT false NOT NULL,
    questions text
);


ALTER TABLE public."Assignment" OWNER TO techstylus;

--
-- Name: Assignment_id_seq; Type: SEQUENCE; Schema: public; Owner: techstylus
--

CREATE SEQUENCE public."Assignment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Assignment_id_seq" OWNER TO techstylus;

--
-- Name: Assignment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: techstylus
--

ALTER SEQUENCE public."Assignment_id_seq" OWNED BY public."Assignment".id;


--
-- Name: Attendance; Type: TABLE; Schema: public; Owner: techstylus
--

CREATE TABLE public."Attendance" (
    id integer NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    present boolean NOT NULL,
    "studentId" text,
    "isArchived" boolean DEFAULT false NOT NULL,
    "teacherId" text
);


ALTER TABLE public."Attendance" OWNER TO techstylus;

--
-- Name: Attendance_id_seq; Type: SEQUENCE; Schema: public; Owner: techstylus
--

CREATE SEQUENCE public."Attendance_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Attendance_id_seq" OWNER TO techstylus;

--
-- Name: Attendance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: techstylus
--

ALTER SEQUENCE public."Attendance_id_seq" OWNED BY public."Attendance".id;


--
-- Name: Book; Type: TABLE; Schema: public; Owner: techstylus
--

CREATE TABLE public."Book" (
    id integer NOT NULL,
    title text NOT NULL,
    "classId" integer NOT NULL,
    "priceCedis" numeric(12,2) NOT NULL,
    quantity integer NOT NULL,
    "supplierName" text NOT NULL,
    "supplierContact" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    search_vector tsvector
);


ALTER TABLE public."Book" OWNER TO techstylus;

--
-- Name: BookOrder; Type: TABLE; Schema: public; Owner: techstylus
--

CREATE TABLE public."BookOrder" (
    id integer NOT NULL,
    "parentId" text NOT NULL,
    status public."BookOrderStatus" DEFAULT 'PENDING'::public."BookOrderStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."BookOrder" OWNER TO techstylus;

--
-- Name: BookOrderItem; Type: TABLE; Schema: public; Owner: techstylus
--

CREATE TABLE public."BookOrderItem" (
    id integer NOT NULL,
    "orderId" integer NOT NULL,
    "bookId" integer NOT NULL,
    quantity integer NOT NULL
);


ALTER TABLE public."BookOrderItem" OWNER TO techstylus;

--
-- Name: BookOrderItem_id_seq; Type: SEQUENCE; Schema: public; Owner: techstylus
--

CREATE SEQUENCE public."BookOrderItem_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."BookOrderItem_id_seq" OWNER TO techstylus;

--
-- Name: BookOrderItem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: techstylus
--

ALTER SEQUENCE public."BookOrderItem_id_seq" OWNED BY public."BookOrderItem".id;


--
-- Name: BookOrder_id_seq; Type: SEQUENCE; Schema: public; Owner: techstylus
--

CREATE SEQUENCE public."BookOrder_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."BookOrder_id_seq" OWNER TO techstylus;

--
-- Name: BookOrder_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: techstylus
--

ALTER SEQUENCE public."BookOrder_id_seq" OWNED BY public."BookOrder".id;


--
-- Name: Book_id_seq; Type: SEQUENCE; Schema: public; Owner: techstylus
--

CREATE SEQUENCE public."Book_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Book_id_seq" OWNER TO techstylus;

--
-- Name: Book_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: techstylus
--

ALTER SEQUENCE public."Book_id_seq" OWNED BY public."Book".id;


--
-- Name: Bus; Type: TABLE; Schema: public; Owner: techstylus
--

CREATE TABLE public."Bus" (
    id integer NOT NULL,
    name text NOT NULL,
    "plateNumber" text,
    "driverName" text,
    route text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Bus" OWNER TO techstylus;

--
-- Name: BusLocation; Type: TABLE; Schema: public; Owner: techstylus
--

CREATE TABLE public."BusLocation" (
    id integer NOT NULL,
    "busId" integer NOT NULL,
    "driverId" text,
    latitude numeric(10,7) NOT NULL,
    longitude numeric(10,7) NOT NULL,
    "reportedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."BusLocation" OWNER TO techstylus;

--
-- Name: BusLocation_id_seq; Type: SEQUENCE; Schema: public; Owner: techstylus
--

CREATE SEQUENCE public."BusLocation_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."BusLocation_id_seq" OWNER TO techstylus;

--
-- Name: BusLocation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: techstylus
--

ALTER SEQUENCE public."BusLocation_id_seq" OWNED BY public."BusLocation".id;


--
-- Name: BusRegistration; Type: TABLE; Schema: public; Owner: techstylus
--

CREATE TABLE public."BusRegistration" (
    id integer NOT NULL,
    "busId" integer NOT NULL,
    "studentId" text NOT NULL,
    "parentId" text NOT NULL,
    "classId" integer NOT NULL,
    location text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."BusRegistration" OWNER TO techstylus;

--
-- Name: BusRegistration_id_seq; Type: SEQUENCE; Schema: public; Owner: techstylus
--

CREATE SEQUENCE public."BusRegistration_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."BusRegistration_id_seq" OWNER TO techstylus;

--
-- Name: BusRegistration_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: techstylus
--

ALTER SEQUENCE public."BusRegistration_id_seq" OWNED BY public."BusRegistration".id;


--
-- Name: Bus_id_seq; Type: SEQUENCE; Schema: public; Owner: techstylus
--

CREATE SEQUENCE public."Bus_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Bus_id_seq" OWNER TO techstylus;

--
-- Name: Bus_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: techstylus
--

ALTER SEQUENCE public."Bus_id_seq" OWNED BY public."Bus".id;


--
-- Name: Class; Type: TABLE; Schema: public; Owner: techstylus
--

CREATE TABLE public."Class" (
    id integer NOT NULL,
    name text NOT NULL,
    capacity integer NOT NULL,
    "supervisorId" text,
    "gradeId" integer NOT NULL,
    "gradingLevel" public."GradingLevel" DEFAULT 'PRIMARY'::public."GradingLevel" NOT NULL,
    search_vector tsvector
);


ALTER TABLE public."Class" OWNER TO techstylus;

--
-- Name: Class_id_seq; Type: SEQUENCE; Schema: public; Owner: techstylus
--

CREATE SEQUENCE public."Class_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Class_id_seq" OWNER TO techstylus;

--
-- Name: Class_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: techstylus
--

ALTER SEQUENCE public."Class_id_seq" OWNED BY public."Class".id;


--
-- Name: Event; Type: TABLE; Schema: public; Owner: techstylus
--

CREATE TABLE public."Event" (
    id integer NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    "startTime" timestamp(3) without time zone NOT NULL,
    "endTime" timestamp(3) without time zone NOT NULL,
    "classId" integer,
    "isArchived" boolean DEFAULT false NOT NULL,
    search_vector tsvector
);


ALTER TABLE public."Event" OWNER TO techstylus;

--
-- Name: Event_id_seq; Type: SEQUENCE; Schema: public; Owner: techstylus
--

CREATE SEQUENCE public."Event_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Event_id_seq" OWNER TO techstylus;

--
-- Name: Event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: techstylus
--

ALTER SEQUENCE public."Event_id_seq" OWNED BY public."Event".id;


--
-- Name: Exam; Type: TABLE; Schema: public; Owner: techstylus
--

CREATE TABLE public."Exam" (
    id integer NOT NULL,
    title text NOT NULL,
    "startTime" timestamp(3) without time zone NOT NULL,
    "endTime" timestamp(3) without time zone NOT NULL,
    "lessonId" integer NOT NULL,
    "isArchived" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."Exam" OWNER TO techstylus;

--
-- Name: ExamQuestionUpload; Type: TABLE; Schema: public; Owner: techstylus
--

CREATE TABLE public."ExamQuestionUpload" (
    id integer NOT NULL,
    title text NOT NULL,
    "fileName" text NOT NULL,
    "fileUrl" text NOT NULL,
    status public."ExamQuestionUploadStatus" DEFAULT 'PENDING'::public."ExamQuestionUploadStatus" NOT NULL,
    "lessonId" integer NOT NULL,
    "uploadedById" text NOT NULL,
    "approvedBy" text,
    "approvedAt" timestamp(3) without time zone,
    "academicYearLabel" text NOT NULL,
    "termNumber" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "weekNumber" integer DEFAULT 1 NOT NULL
);


ALTER TABLE public."ExamQuestionUpload" OWNER TO techstylus;

--
-- Name: ExamQuestionUpload_id_seq; Type: SEQUENCE; Schema: public; Owner: techstylus
--

CREATE SEQUENCE public."ExamQuestionUpload_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ExamQuestionUpload_id_seq" OWNER TO techstylus;

--
-- Name: ExamQuestionUpload_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: techstylus
--

ALTER SEQUENCE public."ExamQuestionUpload_id_seq" OWNED BY public."ExamQuestionUpload".id;


--
-- Name: Exam_id_seq; Type: SEQUENCE; Schema: public; Owner: techstylus
--

CREATE SEQUENCE public."Exam_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Exam_id_seq" OWNER TO techstylus;

--
-- Name: Exam_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: techstylus
--

ALTER SEQUENCE public."Exam_id_seq" OWNED BY public."Exam".id;


--
-- Name: FeePayment; Type: TABLE; Schema: public; Owner: techstylus
--

CREATE TABLE public."FeePayment" (
    id integer NOT NULL,
    "studentFeeAssignmentId" integer NOT NULL,
    "amountCedis" numeric(12,2) NOT NULL,
    "paidAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "methodDetails" text,
    "paymentMethod" text DEFAULT 'cash'::text NOT NULL
);


ALTER TABLE public."FeePayment" OWNER TO techstylus;

--
-- Name: FeePayment_id_seq; Type: SEQUENCE; Schema: public; Owner: techstylus
--

CREATE SEQUENCE public."FeePayment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."FeePayment_id_seq" OWNER TO techstylus;

--
-- Name: FeePayment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: techstylus
--

ALTER SEQUENCE public."FeePayment_id_seq" OWNED BY public."FeePayment".id;


--
-- Name: FeeSchedule; Type: TABLE; Schema: public; Owner: techstylus
--

CREATE TABLE public."FeeSchedule" (
    id integer NOT NULL,
    "classId" integer NOT NULL,
    "academicYear" text NOT NULL,
    term public."FeeTerm" NOT NULL,
    "totalBillCedis" numeric(12,2) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isArchived" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."FeeSchedule" OWNER TO techstylus;

--
-- Name: FeeSchedule_id_seq; Type: SEQUENCE; Schema: public; Owner: techstylus
--

CREATE SEQUENCE public."FeeSchedule_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."FeeSchedule_id_seq" OWNER TO techstylus;

--
-- Name: FeeSchedule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: techstylus
--

ALTER SEQUENCE public."FeeSchedule_id_seq" OWNED BY public."FeeSchedule".id;


--
-- Name: Grade; Type: TABLE; Schema: public; Owner: techstylus
--

CREATE TABLE public."Grade" (
    id integer NOT NULL,
    level integer NOT NULL
);


ALTER TABLE public."Grade" OWNER TO techstylus;

--
-- Name: Grade_id_seq; Type: SEQUENCE; Schema: public; Owner: techstylus
--

CREATE SEQUENCE public."Grade_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Grade_id_seq" OWNER TO techstylus;

--
-- Name: Grade_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: techstylus
--

ALTER SEQUENCE public."Grade_id_seq" OWNED BY public."Grade".id;


--
-- Name: GradingScaleEntry; Type: TABLE; Schema: public; Owner: techstylus
--

CREATE TABLE public."GradingScaleEntry" (
    id integer NOT NULL,
    level public."GradingLevel" NOT NULL,
    "minScore" integer NOT NULL,
    "maxScore" integer NOT NULL,
    grade text NOT NULL,
    remark text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."GradingScaleEntry" OWNER TO techstylus;

--
-- Name: GradingScaleEntry_id_seq; Type: SEQUENCE; Schema: public; Owner: techstylus
--

CREATE SEQUENCE public."GradingScaleEntry_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."GradingScaleEntry_id_seq" OWNER TO techstylus;

--
-- Name: GradingScaleEntry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: techstylus
--

ALTER SEQUENCE public."GradingScaleEntry_id_seq" OWNED BY public."GradingScaleEntry".id;


--
-- Name: Lesson; Type: TABLE; Schema: public; Owner: techstylus
--

CREATE TABLE public."Lesson" (
    id integer NOT NULL,
    name text NOT NULL,
    day public."Day" NOT NULL,
    "startTime" timestamp(3) without time zone NOT NULL,
    "endTime" timestamp(3) without time zone NOT NULL,
    "subjectId" integer NOT NULL,
    "classId" integer NOT NULL,
    "teacherId" text NOT NULL
);


ALTER TABLE public."Lesson" OWNER TO techstylus;

--
-- Name: Lesson_id_seq; Type: SEQUENCE; Schema: public; Owner: techstylus
--

CREATE SEQUENCE public."Lesson_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Lesson_id_seq" OWNER TO techstylus;

--
-- Name: Lesson_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: techstylus
--

ALTER SEQUENCE public."Lesson_id_seq" OWNED BY public."Lesson".id;


--
-- Name: Message; Type: TABLE; Schema: public; Owner: techstylus
--

CREATE TABLE public."Message" (
    id integer NOT NULL,
    "senderId" text NOT NULL,
    "senderRole" public."UserRole" NOT NULL,
    "recipientId" text NOT NULL,
    "recipientRole" public."UserRole" NOT NULL,
    text text NOT NULL,
    type public."MessageType" DEFAULT 'MESSAGE'::public."MessageType" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "readAt" timestamp(3) without time zone,
    search_vector tsvector
);


ALTER TABLE public."Message" OWNER TO techstylus;

--
-- Name: Message_id_seq; Type: SEQUENCE; Schema: public; Owner: techstylus
--

CREATE SEQUENCE public."Message_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Message_id_seq" OWNER TO techstylus;

--
-- Name: Message_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: techstylus
--

ALTER SEQUENCE public."Message_id_seq" OWNED BY public."Message".id;


--
-- Name: Parent; Type: TABLE; Schema: public; Owner: techstylus
--

CREATE TABLE public."Parent" (
    id text NOT NULL,
    username text NOT NULL,
    name text NOT NULL,
    surname text NOT NULL,
    email text,
    phone text NOT NULL,
    address text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    search_vector tsvector,
    occupation text,
    "isArchived" boolean DEFAULT false NOT NULL,
    "archivedAt" timestamp(3) without time zone
);


ALTER TABLE public."Parent" OWNER TO techstylus;

--
-- Name: PasswordChangeRequest; Type: TABLE; Schema: public; Owner: techstylus
--

CREATE TABLE public."PasswordChangeRequest" (
    id integer NOT NULL,
    "requestedById" text NOT NULL,
    "requestedByRole" public."UserRole" NOT NULL,
    "requestedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "newPassword" text NOT NULL,
    status public."PasswordChangeStatus" DEFAULT 'PENDING'::public."PasswordChangeStatus" NOT NULL,
    "reviewedAt" timestamp(3) without time zone,
    "reviewedById" text,
    "reviewComment" text
);


ALTER TABLE public."PasswordChangeRequest" OWNER TO techstylus;

--
-- Name: PasswordChangeRequest_id_seq; Type: SEQUENCE; Schema: public; Owner: techstylus
--

CREATE SEQUENCE public."PasswordChangeRequest_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PasswordChangeRequest_id_seq" OWNER TO techstylus;

--
-- Name: PasswordChangeRequest_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: techstylus
--

ALTER SEQUENCE public."PasswordChangeRequest_id_seq" OWNED BY public."PasswordChangeRequest".id;


--
-- Name: Result; Type: TABLE; Schema: public; Owner: techstylus
--

CREATE TABLE public."Result" (
    id integer NOT NULL,
    score integer NOT NULL,
    "examId" integer,
    "assignmentId" integer,
    "studentId" text NOT NULL,
    "isArchived" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."Result" OWNER TO techstylus;

--
-- Name: Result_id_seq; Type: SEQUENCE; Schema: public; Owner: techstylus
--

CREATE SEQUENCE public."Result_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Result_id_seq" OWNER TO techstylus;

--
-- Name: Result_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: techstylus
--

ALTER SEQUENCE public."Result_id_seq" OWNED BY public."Result".id;


--
-- Name: SchoolSetting; Type: TABLE; Schema: public; Owner: techstylus
--

CREATE TABLE public."SchoolSetting" (
    id integer NOT NULL,
    name text NOT NULL,
    address text NOT NULL,
    telephone text NOT NULL,
    location text NOT NULL,
    email text NOT NULL,
    "logoUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SchoolSetting" OWNER TO techstylus;

--
-- Name: SchoolSetting_id_seq; Type: SEQUENCE; Schema: public; Owner: techstylus
--

CREATE SEQUENCE public."SchoolSetting_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."SchoolSetting_id_seq" OWNER TO techstylus;

--
-- Name: SchoolSetting_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: techstylus
--

ALTER SEQUENCE public."SchoolSetting_id_seq" OWNED BY public."SchoolSetting".id;


--
-- Name: Student; Type: TABLE; Schema: public; Owner: techstylus
--

CREATE TABLE public."Student" (
    id text NOT NULL,
    username text NOT NULL,
    name text NOT NULL,
    surname text NOT NULL,
    email text,
    phone text,
    address text NOT NULL,
    img text,
    "bloodType" text NOT NULL,
    sex public."UserSex" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "parentId" text NOT NULL,
    "classId" integer NOT NULL,
    "gradeId" integer NOT NULL,
    birthday timestamp(3) without time zone NOT NULL,
    search_vector tsvector,
    "isArchived" boolean DEFAULT false NOT NULL,
    "archivedAt" timestamp(3) without time zone,
    "allergyDetails" text,
    "alternativeEmergencyContactNumber" text,
    "alternativeEmergencyContactPerson" text,
    "correctiveGlassesDetails" text,
    "declarationDate" timestamp(3) without time zone,
    "declarationName" text,
    department public."Department",
    "emergencyContactNumber" text,
    "emergencyContactPerson" text,
    "fitnessDetails" text,
    "gpsAddress" text,
    "hasAllergies" boolean DEFAULT false NOT NULL,
    "hasHearingDifficulties" boolean DEFAULT false NOT NULL,
    "hearingDetails" text,
    "knownMedicalConditions" text,
    "languagesSpoken" text,
    nationality text,
    "otherIssues" text,
    "otherNames" text,
    "physicallyFitForSports" boolean DEFAULT true NOT NULL,
    "previousClass" text,
    "previousSchoolName" text,
    "reasonForTransfer" text,
    religion text,
    "wearsCorrectiveGlasses" boolean DEFAULT false NOT NULL,
    "yearsAttended" integer
);


ALTER TABLE public."Student" OWNER TO techstylus;

--
-- Name: StudentFeeAssignment; Type: TABLE; Schema: public; Owner: techstylus
--

CREATE TABLE public."StudentFeeAssignment" (
    id integer NOT NULL,
    "studentId" text NOT NULL,
    "feeScheduleId" integer NOT NULL,
    "totalBillCedis" numeric(12,2) NOT NULL
);


ALTER TABLE public."StudentFeeAssignment" OWNER TO techstylus;

--
-- Name: StudentFeeAssignment_id_seq; Type: SEQUENCE; Schema: public; Owner: techstylus
--

CREATE SEQUENCE public."StudentFeeAssignment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."StudentFeeAssignment_id_seq" OWNER TO techstylus;

--
-- Name: StudentFeeAssignment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: techstylus
--

ALTER SEQUENCE public."StudentFeeAssignment_id_seq" OWNED BY public."StudentFeeAssignment".id;


--
-- Name: Subject; Type: TABLE; Schema: public; Owner: techstylus
--

CREATE TABLE public."Subject" (
    id integer NOT NULL,
    name text NOT NULL
);


ALTER TABLE public."Subject" OWNER TO techstylus;

--
-- Name: Subject_id_seq; Type: SEQUENCE; Schema: public; Owner: techstylus
--

CREATE SEQUENCE public."Subject_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Subject_id_seq" OWNER TO techstylus;

--
-- Name: Subject_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: techstylus
--

ALTER SEQUENCE public."Subject_id_seq" OWNED BY public."Subject".id;


--
-- Name: Teacher; Type: TABLE; Schema: public; Owner: techstylus
--

CREATE TABLE public."Teacher" (
    id text NOT NULL,
    username text NOT NULL,
    name text NOT NULL,
    surname text NOT NULL,
    email text,
    phone text,
    address text NOT NULL,
    img text,
    "bloodType" text NOT NULL,
    sex public."UserSex" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    birthday timestamp(3) without time zone NOT NULL,
    search_vector tsvector,
    "isArchived" boolean DEFAULT false NOT NULL,
    "archivedAt" timestamp(3) without time zone
);


ALTER TABLE public."Teacher" OWNER TO techstylus;

--
-- Name: TermlyReport; Type: TABLE; Schema: public; Owner: techstylus
--

CREATE TABLE public."TermlyReport" (
    id integer NOT NULL,
    "studentId" text NOT NULL,
    "classId" integer NOT NULL,
    "academicYearId" integer NOT NULL,
    "termNumber" integer NOT NULL,
    "positionOnRoll" integer,
    "totalOnRoll" integer NOT NULL,
    "totalAttendance" integer DEFAULT 0 NOT NULL,
    "vacationDate" timestamp(3) without time zone,
    "reopeningDate" timestamp(3) without time zone,
    "overallPercentage" double precision,
    "overallGrade" text,
    "overallRemark" text,
    interest text,
    conduct text,
    "resultStatus" text,
    "supervisorRemarks" text,
    "supervisorSignature" text,
    "headteacherRemarks" text,
    "headteacherSignature" text,
    "createdById" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."TermlyReport" OWNER TO techstylus;

--
-- Name: TermlyReportSubjectLine; Type: TABLE; Schema: public; Owner: techstylus
--

CREATE TABLE public."TermlyReportSubjectLine" (
    id integer NOT NULL,
    "termlyReportId" integer NOT NULL,
    "subjectId" integer NOT NULL,
    "classScore" integer DEFAULT 0 NOT NULL,
    "examScore" integer DEFAULT 0 NOT NULL,
    "totalMarks" integer DEFAULT 0 NOT NULL,
    grade text,
    remark text,
    "lastEditedById" text
);


ALTER TABLE public."TermlyReportSubjectLine" OWNER TO techstylus;

--
-- Name: TermlyReportSubjectLine_id_seq; Type: SEQUENCE; Schema: public; Owner: techstylus
--

CREATE SEQUENCE public."TermlyReportSubjectLine_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."TermlyReportSubjectLine_id_seq" OWNER TO techstylus;

--
-- Name: TermlyReportSubjectLine_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: techstylus
--

ALTER SEQUENCE public."TermlyReportSubjectLine_id_seq" OWNED BY public."TermlyReportSubjectLine".id;


--
-- Name: TermlyReport_id_seq; Type: SEQUENCE; Schema: public; Owner: techstylus
--

CREATE SEQUENCE public."TermlyReport_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."TermlyReport_id_seq" OWNER TO techstylus;

--
-- Name: TermlyReport_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: techstylus
--

ALTER SEQUENCE public."TermlyReport_id_seq" OWNED BY public."TermlyReport".id;


--
-- Name: TransportRequest; Type: TABLE; Schema: public; Owner: techstylus
--

CREATE TABLE public."TransportRequest" (
    id integer NOT NULL,
    "parentId" text NOT NULL,
    "studentId" text NOT NULL,
    "classId" integer NOT NULL,
    routine text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."TransportRequest" OWNER TO techstylus;

--
-- Name: TransportRequest_id_seq; Type: SEQUENCE; Schema: public; Owner: techstylus
--

CREATE SEQUENCE public."TransportRequest_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."TransportRequest_id_seq" OWNER TO techstylus;

--
-- Name: TransportRequest_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: techstylus
--

ALTER SEQUENCE public."TransportRequest_id_seq" OWNED BY public."TransportRequest".id;


--
-- Name: _SubjectToTeacher; Type: TABLE; Schema: public; Owner: techstylus
--

CREATE TABLE public."_SubjectToTeacher" (
    "A" integer NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE public."_SubjectToTeacher" OWNER TO techstylus;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: techstylus
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO techstylus;

--
-- Name: AcademicTerm id; Type: DEFAULT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."AcademicTerm" ALTER COLUMN id SET DEFAULT nextval('public."AcademicTerm_id_seq"'::regclass);


--
-- Name: AcademicYear id; Type: DEFAULT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."AcademicYear" ALTER COLUMN id SET DEFAULT nextval('public."AcademicYear_id_seq"'::regclass);


--
-- Name: Announcement id; Type: DEFAULT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Announcement" ALTER COLUMN id SET DEFAULT nextval('public."Announcement_id_seq"'::regclass);


--
-- Name: Assignment id; Type: DEFAULT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Assignment" ALTER COLUMN id SET DEFAULT nextval('public."Assignment_id_seq"'::regclass);


--
-- Name: Attendance id; Type: DEFAULT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Attendance" ALTER COLUMN id SET DEFAULT nextval('public."Attendance_id_seq"'::regclass);


--
-- Name: Book id; Type: DEFAULT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Book" ALTER COLUMN id SET DEFAULT nextval('public."Book_id_seq"'::regclass);


--
-- Name: BookOrder id; Type: DEFAULT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."BookOrder" ALTER COLUMN id SET DEFAULT nextval('public."BookOrder_id_seq"'::regclass);


--
-- Name: BookOrderItem id; Type: DEFAULT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."BookOrderItem" ALTER COLUMN id SET DEFAULT nextval('public."BookOrderItem_id_seq"'::regclass);


--
-- Name: Bus id; Type: DEFAULT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Bus" ALTER COLUMN id SET DEFAULT nextval('public."Bus_id_seq"'::regclass);


--
-- Name: BusLocation id; Type: DEFAULT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."BusLocation" ALTER COLUMN id SET DEFAULT nextval('public."BusLocation_id_seq"'::regclass);


--
-- Name: BusRegistration id; Type: DEFAULT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."BusRegistration" ALTER COLUMN id SET DEFAULT nextval('public."BusRegistration_id_seq"'::regclass);


--
-- Name: Class id; Type: DEFAULT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Class" ALTER COLUMN id SET DEFAULT nextval('public."Class_id_seq"'::regclass);


--
-- Name: Event id; Type: DEFAULT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Event" ALTER COLUMN id SET DEFAULT nextval('public."Event_id_seq"'::regclass);


--
-- Name: Exam id; Type: DEFAULT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Exam" ALTER COLUMN id SET DEFAULT nextval('public."Exam_id_seq"'::regclass);


--
-- Name: ExamQuestionUpload id; Type: DEFAULT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."ExamQuestionUpload" ALTER COLUMN id SET DEFAULT nextval('public."ExamQuestionUpload_id_seq"'::regclass);


--
-- Name: FeePayment id; Type: DEFAULT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."FeePayment" ALTER COLUMN id SET DEFAULT nextval('public."FeePayment_id_seq"'::regclass);


--
-- Name: FeeSchedule id; Type: DEFAULT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."FeeSchedule" ALTER COLUMN id SET DEFAULT nextval('public."FeeSchedule_id_seq"'::regclass);


--
-- Name: Grade id; Type: DEFAULT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Grade" ALTER COLUMN id SET DEFAULT nextval('public."Grade_id_seq"'::regclass);


--
-- Name: GradingScaleEntry id; Type: DEFAULT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."GradingScaleEntry" ALTER COLUMN id SET DEFAULT nextval('public."GradingScaleEntry_id_seq"'::regclass);


--
-- Name: Lesson id; Type: DEFAULT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Lesson" ALTER COLUMN id SET DEFAULT nextval('public."Lesson_id_seq"'::regclass);


--
-- Name: Message id; Type: DEFAULT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Message" ALTER COLUMN id SET DEFAULT nextval('public."Message_id_seq"'::regclass);


--
-- Name: PasswordChangeRequest id; Type: DEFAULT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."PasswordChangeRequest" ALTER COLUMN id SET DEFAULT nextval('public."PasswordChangeRequest_id_seq"'::regclass);


--
-- Name: Result id; Type: DEFAULT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Result" ALTER COLUMN id SET DEFAULT nextval('public."Result_id_seq"'::regclass);


--
-- Name: SchoolSetting id; Type: DEFAULT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."SchoolSetting" ALTER COLUMN id SET DEFAULT nextval('public."SchoolSetting_id_seq"'::regclass);


--
-- Name: StudentFeeAssignment id; Type: DEFAULT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."StudentFeeAssignment" ALTER COLUMN id SET DEFAULT nextval('public."StudentFeeAssignment_id_seq"'::regclass);


--
-- Name: Subject id; Type: DEFAULT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Subject" ALTER COLUMN id SET DEFAULT nextval('public."Subject_id_seq"'::regclass);


--
-- Name: TermlyReport id; Type: DEFAULT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."TermlyReport" ALTER COLUMN id SET DEFAULT nextval('public."TermlyReport_id_seq"'::regclass);


--
-- Name: TermlyReportSubjectLine id; Type: DEFAULT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."TermlyReportSubjectLine" ALTER COLUMN id SET DEFAULT nextval('public."TermlyReportSubjectLine_id_seq"'::regclass);


--
-- Name: TransportRequest id; Type: DEFAULT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."TransportRequest" ALTER COLUMN id SET DEFAULT nextval('public."TransportRequest_id_seq"'::regclass);


--
-- Data for Name: AcademicTerm; Type: TABLE DATA; Schema: public; Owner: techstylus
--

COPY public."AcademicTerm" (id, "academicYearId", "termNumber", "startDate", "endDate", days, weeks) FROM stdin;
1	1	1	2025-09-02 00:00:00	2025-12-19 23:59:59	90	12
2	1	2	2026-01-06 00:00:00	2026-04-02 23:59:59	90	12
3	1	3	2026-04-21 00:00:00	2026-07-24 23:59:59	90	12
\.


--
-- Data for Name: AcademicYear; Type: TABLE DATA; Schema: public; Owner: techstylus
--

COPY public."AcademicYear" (id, label, "numberOfTerms", "isActive", "isArchived", "archivedAt", "createdAt", "updatedAt") FROM stdin;
1	2025-2026	3	t	f	\N	2026-06-08 20:00:23.931	2026-06-08 20:00:23.931
\.


--
-- Data for Name: Admin; Type: TABLE DATA; Schema: public; Owner: techstylus
--

COPY public."Admin" (id, username) FROM stdin;
admin1	admin1
admin2	admin2
\.


--
-- Data for Name: Announcement; Type: TABLE DATA; Schema: public; Owner: techstylus
--

COPY public."Announcement" (id, title, description, date, "classId", "isArchived", search_vector) FROM stdin;
1	Announcement 1	Description for Announcement 1	2026-06-06 19:24:07.481	2	f	'1':2,6 'announc':1,5 'descript':3
2	Announcement 2	Description for Announcement 2	2026-06-06 19:24:07.576	3	f	'2':2,6 'announc':1,5 'descript':3
3	Announcement 3	Description for Announcement 3	2026-06-06 19:24:07.597	4	f	'3':2,6 'announc':1,5 'descript':3
4	Announcement 4	Description for Announcement 4	2026-06-06 19:24:07.619	5	f	'4':2,6 'announc':1,5 'descript':3
5	Announcement 5	Description for Announcement 5	2026-06-06 19:24:07.662	1	f	'5':2,6 'announc':1,5 'descript':3
\.


--
-- Data for Name: Assignment; Type: TABLE DATA; Schema: public; Owner: techstylus
--

COPY public."Assignment" (id, title, "startDate", "dueDate", "lessonId", "isArchived", questions) FROM stdin;
1	Assignment 1	2026-06-06 20:24:05.976	2026-06-07 20:24:05.976	2	f	\N
2	Assignment 2	2026-06-06 20:24:06.009	2026-06-07 20:24:06.009	3	f	\N
3	Assignment 3	2026-06-06 20:24:06.044	2026-06-07 20:24:06.044	4	f	\N
4	Assignment 4	2026-06-06 20:24:06.062	2026-06-07 20:24:06.062	5	f	\N
5	Assignment 5	2026-06-06 20:24:06.081	2026-06-07 20:24:06.081	6	f	\N
6	Assignment 6	2026-06-06 20:24:06.097	2026-06-07 20:24:06.097	7	f	\N
7	Assignment 7	2026-06-06 20:24:06.111	2026-06-07 20:24:06.111	8	f	\N
8	Assignment 8	2026-06-06 20:24:06.139	2026-06-07 20:24:06.139	9	f	\N
9	Assignment 9	2026-06-06 20:24:06.155	2026-06-07 20:24:06.155	10	f	\N
10	Assignment 10	2026-06-06 20:24:06.19	2026-06-07 20:24:06.19	11	f	\N
\.


--
-- Data for Name: Attendance; Type: TABLE DATA; Schema: public; Owner: techstylus
--

COPY public."Attendance" (id, date, present, "studentId", "isArchived", "teacherId") FROM stdin;
4	2026-06-06 19:24:07.018	t	student4	f	\N
5	2026-06-06 19:24:07.032	t	student5	f	\N
6	2026-06-06 19:24:07.049	t	student6	f	\N
7	2026-06-06 19:24:07.138	t	student7	f	\N
8	2026-06-06 19:24:07.193	t	student8	f	\N
9	2026-06-06 19:24:07.22	t	student9	f	\N
10	2026-06-06 19:24:07.232	t	student10	f	\N
118	2026-06-10 00:00:00	t	student32	f	\N
119	2026-06-10 00:00:00	t	student33	f	\N
1	2026-06-06 19:24:06.826	t	student1	f	\N
2	2026-06-06 19:24:06.912	t	student2	f	\N
120	2026-06-10 00:00:00	t	student34	f	\N
3	2026-06-06 19:24:06.965	t	student3	f	\N
11	2026-06-09 00:00:00	t	student1	f	\N
12	2026-06-09 00:00:00	t	student10	f	\N
13	2026-06-09 00:00:00	t	student11	f	\N
14	2026-06-09 00:00:00	t	student12	f	\N
15	2026-06-09 00:00:00	t	student13	f	\N
16	2026-06-09 00:00:00	f	student14	f	\N
17	2026-06-09 00:00:00	f	student15	f	\N
18	2026-06-09 00:00:00	t	student16	f	\N
19	2026-06-09 00:00:00	t	student17	f	\N
20	2026-06-09 00:00:00	f	student18	f	\N
21	2026-06-09 00:00:00	t	student19	f	\N
22	2026-06-09 00:00:00	t	student2	f	\N
23	2026-06-09 00:00:00	f	student20	f	\N
24	2026-06-09 00:00:00	t	student21	f	\N
25	2026-06-09 00:00:00	t	student22	f	\N
26	2026-06-09 00:00:00	t	student23	f	\N
27	2026-06-09 00:00:00	f	student25	f	\N
28	2026-06-09 00:00:00	f	student26	f	\N
29	2026-06-09 00:00:00	t	student27	f	\N
30	2026-06-09 00:00:00	t	student28	f	\N
31	2026-06-09 00:00:00	t	student29	f	\N
32	2026-06-09 00:00:00	t	student3	f	\N
33	2026-06-09 00:00:00	t	student30	f	\N
34	2026-06-09 00:00:00	f	student31	f	\N
35	2026-06-09 00:00:00	f	student32	f	\N
36	2026-06-09 00:00:00	f	student33	f	\N
37	2026-06-09 00:00:00	t	student34	f	\N
38	2026-06-09 00:00:00	t	student35	f	\N
39	2026-06-09 00:00:00	t	student36	f	\N
40	2026-06-09 00:00:00	t	student37	f	\N
41	2026-06-09 00:00:00	t	student38	f	\N
42	2026-06-09 00:00:00	t	student39	f	\N
43	2026-06-09 00:00:00	t	student4	f	\N
44	2026-06-09 00:00:00	t	student40	f	\N
45	2026-06-09 00:00:00	f	student41	f	\N
46	2026-06-09 00:00:00	f	student42	f	\N
47	2026-06-09 00:00:00	f	student43	f	\N
48	2026-06-09 00:00:00	f	student44	f	\N
49	2026-06-09 00:00:00	t	student45	f	\N
50	2026-06-09 00:00:00	t	student46	f	\N
51	2026-06-09 00:00:00	t	student47	f	\N
52	2026-06-09 00:00:00	t	student48	f	\N
53	2026-06-09 00:00:00	t	student49	f	\N
54	2026-06-09 00:00:00	t	student5	f	\N
55	2026-06-09 00:00:00	f	student50	f	\N
56	2026-06-09 00:00:00	f	student6	f	\N
57	2026-06-09 00:00:00	t	student7	f	\N
58	2026-06-09 00:00:00	t	student8	f	\N
59	2026-06-09 00:00:00	t	student9	f	\N
60	2026-06-09 00:00:00	t	\N	f	teacher1
61	2026-06-09 00:00:00	t	\N	f	teacher10
62	2026-06-09 00:00:00	t	\N	f	teacher12
63	2026-06-09 00:00:00	t	\N	f	teacher13
64	2026-06-09 00:00:00	t	\N	f	teacher14
65	2026-06-09 00:00:00	t	\N	f	teacher15
66	2026-06-09 00:00:00	t	\N	f	teacher2
67	2026-06-09 00:00:00	t	\N	f	teacher2
68	2026-06-09 00:00:00	t	\N	f	teacher3
69	2026-06-09 00:00:00	t	\N	f	teacher4
70	2026-06-09 00:00:00	t	\N	f	teacher5
71	2026-06-09 00:00:00	t	\N	f	teacher6
72	2026-06-09 00:00:00	t	\N	f	teacher7
73	2026-06-09 00:00:00	t	\N	f	teacher8
74	2026-06-09 00:00:00	t	\N	f	teacher9
75	2026-06-09 00:00:00	f	\N	f	teacher9
76	2026-06-10 00:00:00	t	\N	f	teacher1
77	2026-06-10 00:00:00	t	\N	f	teacher10
78	2026-06-10 00:00:00	f	\N	f	teacher11
79	2026-06-10 00:00:00	f	\N	f	teacher11
80	2026-06-10 00:00:00	f	\N	f	teacher11
81	2026-06-10 00:00:00	f	\N	f	teacher12
82	2026-06-10 00:00:00	t	\N	f	teacher13
83	2026-06-10 00:00:00	t	\N	f	teacher14
84	2026-06-10 00:00:00	t	\N	f	teacher15
85	2026-06-10 00:00:00	t	\N	f	teacher2
86	2026-06-10 00:00:00	t	\N	f	teacher3
87	2026-06-10 00:00:00	t	\N	f	teacher4
88	2026-06-10 00:00:00	t	\N	f	teacher5
89	2026-06-10 00:00:00	t	\N	f	teacher6
90	2026-06-10 00:00:00	t	\N	f	teacher7
91	2026-06-10 00:00:00	t	\N	f	teacher8
92	2026-06-10 00:00:00	t	\N	f	teacher9
93	2026-06-10 00:00:00	t	student1	f	\N
94	2026-06-10 00:00:00	t	student10	f	\N
95	2026-06-10 00:00:00	t	student11	f	\N
96	2026-06-10 00:00:00	t	student12	f	\N
97	2026-06-10 00:00:00	t	student13	f	\N
98	2026-06-10 00:00:00	t	student14	f	\N
99	2026-06-10 00:00:00	t	student15	f	\N
100	2026-06-10 00:00:00	t	student16	f	\N
101	2026-06-10 00:00:00	t	student17	f	\N
102	2026-06-10 00:00:00	t	student18	f	\N
103	2026-06-10 00:00:00	t	student19	f	\N
104	2026-06-10 00:00:00	t	student2	f	\N
105	2026-06-10 00:00:00	t	student20	f	\N
106	2026-06-10 00:00:00	t	student21	f	\N
107	2026-06-10 00:00:00	t	student22	f	\N
108	2026-06-10 00:00:00	t	student23	f	\N
109	2026-06-10 00:00:00	t	student24	f	\N
110	2026-06-10 00:00:00	t	student25	f	\N
111	2026-06-10 00:00:00	t	student26	f	\N
112	2026-06-10 00:00:00	t	student27	f	\N
113	2026-06-10 00:00:00	f	student28	f	\N
114	2026-06-10 00:00:00	f	student29	f	\N
115	2026-06-10 00:00:00	t	student3	f	\N
116	2026-06-10 00:00:00	t	student30	f	\N
117	2026-06-10 00:00:00	t	student31	f	\N
121	2026-06-10 00:00:00	f	student35	f	\N
122	2026-06-10 00:00:00	t	student36	f	\N
123	2026-06-10 00:00:00	t	student37	f	\N
124	2026-06-10 00:00:00	t	student38	f	\N
125	2026-06-10 00:00:00	t	student39	f	\N
126	2026-06-10 00:00:00	t	student4	f	\N
127	2026-06-10 00:00:00	t	student40	f	\N
128	2026-06-10 00:00:00	f	student41	f	\N
129	2026-06-10 00:00:00	t	student42	f	\N
130	2026-06-10 00:00:00	t	student43	f	\N
131	2026-06-10 00:00:00	t	student44	f	\N
132	2026-06-10 00:00:00	t	student45	f	\N
133	2026-06-10 00:00:00	t	student46	f	\N
134	2026-06-10 00:00:00	t	student47	f	\N
135	2026-06-10 00:00:00	t	student48	f	\N
136	2026-06-10 00:00:00	t	student49	f	\N
137	2026-06-10 00:00:00	t	student5	f	\N
138	2026-06-10 00:00:00	t	student50	f	\N
139	2026-06-10 00:00:00	t	student6	f	\N
140	2026-06-10 00:00:00	t	student7	f	\N
141	2026-06-10 00:00:00	t	student8	f	\N
142	2026-06-10 00:00:00	t	student9	f	\N
\.


--
-- Data for Name: Book; Type: TABLE DATA; Schema: public; Owner: techstylus
--

COPY public."Book" (id, title, "classId", "priceCedis", quantity, "supplierName", "supplierContact", "createdAt", "updatedAt", search_vector) FROM stdin;
\.


--
-- Data for Name: BookOrder; Type: TABLE DATA; Schema: public; Owner: techstylus
--

COPY public."BookOrder" (id, "parentId", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: BookOrderItem; Type: TABLE DATA; Schema: public; Owner: techstylus
--

COPY public."BookOrderItem" (id, "orderId", "bookId", quantity) FROM stdin;
\.


--
-- Data for Name: Bus; Type: TABLE DATA; Schema: public; Owner: techstylus
--

COPY public."Bus" (id, name, "plateNumber", "driverName", route, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: BusLocation; Type: TABLE DATA; Schema: public; Owner: techstylus
--

COPY public."BusLocation" (id, "busId", "driverId", latitude, longitude, "reportedAt") FROM stdin;
\.


--
-- Data for Name: BusRegistration; Type: TABLE DATA; Schema: public; Owner: techstylus
--

COPY public."BusRegistration" (id, "busId", "studentId", "parentId", "classId", location, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Class; Type: TABLE DATA; Schema: public; Owner: techstylus
--

COPY public."Class" (id, name, capacity, "supervisorId", "gradeId", "gradingLevel", search_vector) FROM stdin;
5	5A	17	teacher10	5	PRIMARY	'5a':1
6	6A	18	teacher11	6	PRIMARY	'6a':1
1	1A	19	teacher12	1	PRIMARY	'1a':1
2	2A	15	teacher13	2	PRIMARY	'2a':1
3	3A	19	teacher14	3	PRIMARY	'3a':1
4	4A	17	teacher15	4	PRIMARY	'4a':1
\.


--
-- Data for Name: Event; Type: TABLE DATA; Schema: public; Owner: techstylus
--

COPY public."Event" (id, title, description, "startTime", "endTime", "classId", "isArchived", search_vector) FROM stdin;
1	Event 1	Description for Event 1	2026-06-06 20:24:07.257	2026-06-06 21:24:07.257	2	f	'1':2,6 'descript':3 'event':1,5
2	Event 2	Description for Event 2	2026-06-06 20:24:07.322	2026-06-06 21:24:07.322	3	f	'2':2,6 'descript':3 'event':1,5
3	Event 3	Description for Event 3	2026-06-06 20:24:07.379	2026-06-06 21:24:07.379	4	f	'3':2,6 'descript':3 'event':1,5
4	Event 4	Description for Event 4	2026-06-06 20:24:07.404	2026-06-06 21:24:07.404	5	f	'4':2,6 'descript':3 'event':1,5
5	Event 5	Description for Event 5	2026-06-06 20:24:07.43	2026-06-06 21:24:07.43	1	f	'5':2,6 'descript':3 'event':1,5
6	Weekly activity	This week is Drama and Literature week.	2026-06-12 13:00:00	2026-06-12 15:00:00	\N	f	'activ':2 'drama':6 'literatur':8 'week':1,4,9
\.


--
-- Data for Name: Exam; Type: TABLE DATA; Schema: public; Owner: techstylus
--

COPY public."Exam" (id, title, "startTime", "endTime", "lessonId", "isArchived") FROM stdin;
1	Exam 1	2026-06-06 20:24:05.697	2026-06-06 21:24:05.697	2	f
2	Exam 2	2026-06-06 20:24:05.742	2026-06-06 21:24:05.742	3	f
3	Exam 3	2026-06-06 20:24:05.755	2026-06-06 21:24:05.755	4	f
4	Exam 4	2026-06-06 20:24:05.793	2026-06-06 21:24:05.793	5	f
5	Exam 5	2026-06-06 20:24:05.806	2026-06-06 21:24:05.806	6	f
6	Exam 6	2026-06-06 20:24:05.849	2026-06-06 21:24:05.849	7	f
7	Exam 7	2026-06-06 20:24:05.872	2026-06-06 21:24:05.872	8	f
8	Exam 8	2026-06-06 20:24:05.895	2026-06-06 21:24:05.895	9	f
9	Exam 9	2026-06-06 20:24:05.905	2026-06-06 21:24:05.905	10	f
10	Exam 10	2026-06-06 20:24:05.965	2026-06-06 21:24:05.965	11	f
\.


--
-- Data for Name: ExamQuestionUpload; Type: TABLE DATA; Schema: public; Owner: techstylus
--

COPY public."ExamQuestionUpload" (id, title, "fileName", "fileUrl", status, "lessonId", "uploadedById", "approvedBy", "approvedAt", "academicYearLabel", "termNumber", "createdAt", "updatedAt", "weekNumber") FROM stdin;
\.


--
-- Data for Name: FeePayment; Type: TABLE DATA; Schema: public; Owner: techstylus
--

COPY public."FeePayment" (id, "studentFeeAssignmentId", "amountCedis", "paidAt", "createdAt", "updatedAt", "methodDetails", "paymentMethod") FROM stdin;
1	2	600.00	2026-06-09 12:00:00	2026-06-09 09:24:55.376	2026-06-09 09:24:55.376	\N	cash
2	4	1000.00	2026-06-09 12:00:00	2026-06-09 09:27:58.319	2026-06-09 09:27:58.319	MTN Momo - Boakye Yiadom	mobile_money
3	6	750.00	2026-06-09 12:00:00	2026-06-09 09:30:19.418	2026-06-09 09:30:19.418	Cheque	other
4	2	550.00	2026-06-09 12:00:00	2026-06-09 09:31:40.372	2026-06-09 09:31:40.372	MTN Momo - Abeam Danso	mobile_money
\.


--
-- Data for Name: FeeSchedule; Type: TABLE DATA; Schema: public; Owner: techstylus
--

COPY public."FeeSchedule" (id, "classId", "academicYear", term, "totalBillCedis", "createdAt", "updatedAt", "isArchived") FROM stdin;
1	1	2025-2025	TERM_3	1150.00	2026-06-09 09:23:15.093	2026-06-09 09:23:15.093	f
\.


--
-- Data for Name: Grade; Type: TABLE DATA; Schema: public; Owner: techstylus
--

COPY public."Grade" (id, level) FROM stdin;
1	1
2	2
3	3
4	4
5	5
6	6
\.


--
-- Data for Name: GradingScaleEntry; Type: TABLE DATA; Schema: public; Owner: techstylus
--

COPY public."GradingScaleEntry" (id, level, "minScore", "maxScore", grade, remark, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Lesson; Type: TABLE DATA; Schema: public; Owner: techstylus
--

COPY public."Lesson" (id, name, day, "startTime", "endTime", "subjectId", "classId", "teacherId") FROM stdin;
1	Lesson1	TUESDAY	2026-06-06 20:24:00.064	2026-06-06 22:24:00.064	2	2	teacher2
2	Lesson2	MONDAY	2026-06-06 20:24:00.272	2026-06-06 22:24:00.272	3	3	teacher3
3	Lesson3	THURSDAY	2026-06-06 20:24:00.345	2026-06-06 22:24:00.345	4	4	teacher4
4	Lesson4	WEDNESDAY	2026-06-06 20:24:00.389	2026-06-06 22:24:00.389	5	5	teacher5
5	Lesson5	TUESDAY	2026-06-06 20:24:00.489	2026-06-06 22:24:00.489	6	6	teacher6
6	Lesson6	MONDAY	2026-06-06 20:24:00.521	2026-06-06 22:24:00.521	7	1	teacher7
7	Lesson7	WEDNESDAY	2026-06-06 20:24:00.537	2026-06-06 22:24:00.537	8	2	teacher8
8	Lesson8	WEDNESDAY	2026-06-06 20:24:00.589	2026-06-06 22:24:00.589	9	3	teacher9
9	Lesson9	WEDNESDAY	2026-06-06 20:24:00.659	2026-06-06 22:24:00.659	10	4	teacher10
10	Lesson10	FRIDAY	2026-06-06 20:24:00.685	2026-06-06 22:24:00.685	1	5	teacher11
11	Lesson11	WEDNESDAY	2026-06-06 20:24:00.704	2026-06-06 22:24:00.704	2	6	teacher12
12	Lesson12	MONDAY	2026-06-06 20:24:00.739	2026-06-06 22:24:00.739	3	1	teacher13
13	Lesson13	FRIDAY	2026-06-06 20:24:00.752	2026-06-06 22:24:00.752	4	2	teacher14
14	Lesson14	MONDAY	2026-06-06 20:24:00.802	2026-06-06 22:24:00.802	5	3	teacher15
15	Lesson15	THURSDAY	2026-06-06 20:24:00.833	2026-06-06 22:24:00.833	6	4	teacher1
16	Lesson16	WEDNESDAY	2026-06-06 20:24:00.878	2026-06-06 22:24:00.878	7	5	teacher2
17	Lesson17	THURSDAY	2026-06-06 20:24:00.906	2026-06-06 22:24:00.906	8	6	teacher3
18	Lesson18	TUESDAY	2026-06-06 20:24:00.965	2026-06-06 22:24:00.965	9	1	teacher4
19	Lesson19	WEDNESDAY	2026-06-06 20:24:00.992	2026-06-06 22:24:00.992	10	2	teacher5
20	Lesson20	THURSDAY	2026-06-06 20:24:01.071	2026-06-06 22:24:01.071	1	3	teacher6
21	Lesson21	TUESDAY	2026-06-06 20:24:01.148	2026-06-06 22:24:01.148	2	4	teacher7
22	Lesson22	TUESDAY	2026-06-06 20:24:01.184	2026-06-06 22:24:01.184	3	5	teacher8
23	Lesson23	FRIDAY	2026-06-06 20:24:01.28	2026-06-06 22:24:01.28	4	6	teacher9
24	Lesson24	WEDNESDAY	2026-06-06 20:24:01.489	2026-06-06 22:24:01.489	5	1	teacher10
25	Lesson25	WEDNESDAY	2026-06-06 20:24:01.505	2026-06-06 22:24:01.505	6	2	teacher11
26	Lesson26	WEDNESDAY	2026-06-06 20:24:01.616	2026-06-06 22:24:01.616	7	3	teacher12
27	Lesson27	MONDAY	2026-06-06 20:24:01.644	2026-06-06 22:24:01.644	8	4	teacher13
28	Lesson28	THURSDAY	2026-06-06 20:24:01.794	2026-06-06 22:24:01.794	9	5	teacher14
29	Lesson29	MONDAY	2026-06-06 20:24:01.834	2026-06-06 22:24:01.834	10	6	teacher15
30	Lesson30	WEDNESDAY	2026-06-06 20:24:01.883	2026-06-06 22:24:01.883	1	1	teacher1
\.


--
-- Data for Name: Message; Type: TABLE DATA; Schema: public; Owner: techstylus
--

COPY public."Message" (id, "senderId", "senderRole", "recipientId", "recipientRole", text, type, "createdAt", "readAt", search_vector) FROM stdin;
\.


--
-- Data for Name: Parent; Type: TABLE DATA; Schema: public; Owner: techstylus
--

COPY public."Parent" (id, username, name, surname, email, phone, address, "createdAt", search_vector, occupation, "isArchived", "archivedAt") FROM stdin;
parentId2	parentId2	PName 2	PSurname 2	parent2@example.com	123-456-7892	Address2	2026-06-06 19:24:02.287	'-456':8 '-7892':9 '123':7 '2':2,4 'parent2@example.com':6 'parentid2':5 'pname':1 'psurnam':3	\N	f	\N
parentId3	parentId3	PName 3	PSurname 3	parent3@example.com	123-456-7893	Address3	2026-06-06 19:24:02.299	'-456':8 '-7893':9 '123':7 '3':2,4 'parent3@example.com':6 'parentid3':5 'pname':1 'psurnam':3	\N	f	\N
parentId4	parentId4	PName 4	PSurname 4	parent4@example.com	123-456-7894	Address4	2026-06-06 19:24:02.312	'-456':8 '-7894':9 '123':7 '4':2,4 'parent4@example.com':6 'parentid4':5 'pname':1 'psurnam':3	\N	f	\N
parentId5	parentId5	PName 5	PSurname 5	parent5@example.com	123-456-7895	Address5	2026-06-06 19:24:02.332	'-456':8 '-7895':9 '123':7 '5':2,4 'parent5@example.com':6 'parentid5':5 'pname':1 'psurnam':3	\N	f	\N
parentId6	parentId6	PName 6	PSurname 6	parent6@example.com	123-456-7896	Address6	2026-06-06 19:24:02.395	'-456':8 '-7896':9 '123':7 '6':2,4 'parent6@example.com':6 'parentid6':5 'pname':1 'psurnam':3	\N	f	\N
parentId7	parentId7	PName 7	PSurname 7	parent7@example.com	123-456-7897	Address7	2026-06-06 19:24:02.402	'-456':8 '-7897':9 '123':7 '7':2,4 'parent7@example.com':6 'parentid7':5 'pname':1 'psurnam':3	\N	f	\N
parentId8	parentId8	PName 8	PSurname 8	parent8@example.com	123-456-7898	Address8	2026-06-06 19:24:02.42	'-456':8 '-7898':9 '123':7 '8':2,4 'parent8@example.com':6 'parentid8':5 'pname':1 'psurnam':3	\N	f	\N
parentId9	parentId9	PName 9	PSurname 9	parent9@example.com	123-456-7899	Address9	2026-06-06 19:24:02.45	'-456':8 '-7899':9 '123':7 '9':2,4 'parent9@example.com':6 'parentid9':5 'pname':1 'psurnam':3	\N	f	\N
parentId10	parentId10	PName 10	PSurname 10	parent10@example.com	123-456-78910	Address10	2026-06-06 19:24:02.462	'-456':8 '-78910':9 '10':2,4 '123':7 'parent10@example.com':6 'parentid10':5 'pname':1 'psurnam':3	\N	f	\N
parentId11	parentId11	PName 11	PSurname 11	parent11@example.com	123-456-78911	Address11	2026-06-06 19:24:02.47	'-456':8 '-78911':9 '11':2,4 '123':7 'parent11@example.com':6 'parentid11':5 'pname':1 'psurnam':3	\N	f	\N
parentId12	parentId12	PName 12	PSurname 12	parent12@example.com	123-456-78912	Address12	2026-06-06 19:24:02.486	'-456':8 '-78912':9 '12':2,4 '123':7 'parent12@example.com':6 'parentid12':5 'pname':1 'psurnam':3	\N	f	\N
parentId13	parentId13	PName 13	PSurname 13	parent13@example.com	123-456-78913	Address13	2026-06-06 19:24:02.504	'-456':8 '-78913':9 '123':7 '13':2,4 'parent13@example.com':6 'parentid13':5 'pname':1 'psurnam':3	\N	f	\N
parentId14	parentId14	PName 14	PSurname 14	parent14@example.com	123-456-78914	Address14	2026-06-06 19:24:02.529	'-456':8 '-78914':9 '123':7 '14':2,4 'parent14@example.com':6 'parentid14':5 'pname':1 'psurnam':3	\N	f	\N
parentId15	parentId15	PName 15	PSurname 15	parent15@example.com	123-456-78915	Address15	2026-06-06 19:24:02.55	'-456':8 '-78915':9 '123':7 '15':2,4 'parent15@example.com':6 'parentid15':5 'pname':1 'psurnam':3	\N	f	\N
parentId16	parentId16	PName 16	PSurname 16	parent16@example.com	123-456-78916	Address16	2026-06-06 19:24:02.582	'-456':8 '-78916':9 '123':7 '16':2,4 'parent16@example.com':6 'parentid16':5 'pname':1 'psurnam':3	\N	f	\N
parentId17	parentId17	PName 17	PSurname 17	parent17@example.com	123-456-78917	Address17	2026-06-06 19:24:02.605	'-456':8 '-78917':9 '123':7 '17':2,4 'parent17@example.com':6 'parentid17':5 'pname':1 'psurnam':3	\N	f	\N
parentId18	parentId18	PName 18	PSurname 18	parent18@example.com	123-456-78918	Address18	2026-06-06 19:24:02.619	'-456':8 '-78918':9 '123':7 '18':2,4 'parent18@example.com':6 'parentid18':5 'pname':1 'psurnam':3	\N	f	\N
parentId19	parentId19	PName 19	PSurname 19	parent19@example.com	123-456-78919	Address19	2026-06-06 19:24:02.651	'-456':8 '-78919':9 '123':7 '19':2,4 'parent19@example.com':6 'parentid19':5 'pname':1 'psurnam':3	\N	f	\N
parentId20	parentId20	PName 20	PSurname 20	parent20@example.com	123-456-78920	Address20	2026-06-06 19:24:02.679	'-456':8 '-78920':9 '123':7 '20':2,4 'parent20@example.com':6 'parentid20':5 'pname':1 'psurnam':3	\N	f	\N
parentId21	parentId21	PName 21	PSurname 21	parent21@example.com	123-456-78921	Address21	2026-06-06 19:24:02.781	'-456':8 '-78921':9 '123':7 '21':2,4 'parent21@example.com':6 'parentid21':5 'pname':1 'psurnam':3	\N	f	\N
parentId22	parentId22	PName 22	PSurname 22	parent22@example.com	123-456-78922	Address22	2026-06-06 19:24:02.812	'-456':8 '-78922':9 '123':7 '22':2,4 'parent22@example.com':6 'parentid22':5 'pname':1 'psurnam':3	\N	f	\N
parentId23	parentId23	PName 23	PSurname 23	parent23@example.com	123-456-78923	Address23	2026-06-06 19:24:02.862	'-456':8 '-78923':9 '123':7 '23':2,4 'parent23@example.com':6 'parentid23':5 'pname':1 'psurnam':3	\N	f	\N
parentId24	parentId24	PName 24	PSurname 24	parent24@example.com	123-456-78924	Address24	2026-06-06 19:24:02.895	'-456':8 '-78924':9 '123':7 '24':2,4 'parent24@example.com':6 'parentid24':5 'pname':1 'psurnam':3	\N	f	\N
parentId25	parentId25	PName 25	PSurname 25	parent25@example.com	123-456-78925	Address25	2026-06-06 19:24:02.912	'-456':8 '-78925':9 '123':7 '25':2,4 'parent25@example.com':6 'parentid25':5 'pname':1 'psurnam':3	\N	f	\N
parentId1	parentId1	PName 1	PSurname 1	parent1@example.com	123-456-7891	Address1	2026-06-06 19:24:01.905	'-456':8 '-7891':9 '1':2,4 '123':7 'parent1@example.com':6 'parentid1':5 'pname':1 'psurnam':3	\N	f	\N
\.


--
-- Data for Name: PasswordChangeRequest; Type: TABLE DATA; Schema: public; Owner: techstylus
--

COPY public."PasswordChangeRequest" (id, "requestedById", "requestedByRole", "requestedAt", "newPassword", status, "reviewedAt", "reviewedById", "reviewComment") FROM stdin;
\.


--
-- Data for Name: Result; Type: TABLE DATA; Schema: public; Owner: techstylus
--

COPY public."Result" (id, score, "examId", "assignmentId", "studentId", "isArchived") FROM stdin;
4	90	4	\N	student4	f
5	90	5	\N	student5	f
6	90	\N	1	student6	f
7	90	\N	2	student7	f
8	90	\N	3	student8	f
9	90	\N	4	student9	f
10	90	\N	5	student10	f
1	90	1	\N	student1	f
2	90	2	\N	student2	f
3	90	3	\N	student3	f
\.


--
-- Data for Name: SchoolSetting; Type: TABLE DATA; Schema: public; Owner: techstylus
--

COPY public."SchoolSetting" (id, name, address, telephone, location, email, "logoUrl", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Student; Type: TABLE DATA; Schema: public; Owner: techstylus
--

COPY public."Student" (id, username, name, surname, email, phone, address, img, "bloodType", sex, "createdAt", "parentId", "classId", "gradeId", birthday, search_vector, "isArchived", "archivedAt", "allergyDetails", "alternativeEmergencyContactNumber", "alternativeEmergencyContactPerson", "correctiveGlassesDetails", "declarationDate", "declarationName", department, "emergencyContactNumber", "emergencyContactPerson", "fitnessDetails", "gpsAddress", "hasAllergies", "hasHearingDifficulties", "hearingDetails", "knownMedicalConditions", "languagesSpoken", nationality, "otherIssues", "otherNames", "physicallyFitForSports", "previousClass", "previousSchoolName", "reasonForTransfer", religion, "wearsCorrectiveGlasses", "yearsAttended") FROM stdin;
student4	student4	SName4	SSurname 4	student4@example.com	987-654-3214	Address4	\N	O-	MALE	2026-06-06 19:24:03.261	parentId2	5	5	2016-06-06 19:24:03.255	'4':3 'sname4':1 'ssurnam':2 'student4':4 'student4@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student5	student5	SName5	SSurname 5	student5@example.com	987-654-3215	Address5	\N	O-	FEMALE	2026-06-06 19:24:03.305	parentId3	6	6	2016-06-06 19:24:03.304	'5':3 'sname5':1 'ssurnam':2 'student5':4 'student5@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student6	student6	SName6	SSurname 6	student6@example.com	987-654-3216	Address6	\N	O-	MALE	2026-06-06 19:24:03.347	parentId3	1	1	2016-06-06 19:24:03.345	'6':3 'sname6':1 'ssurnam':2 'student6':4 'student6@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student7	student7	SName7	SSurname 7	student7@example.com	987-654-3217	Address7	\N	O-	FEMALE	2026-06-06 19:24:03.394	parentId4	2	2	2016-06-06 19:24:03.39	'7':3 'sname7':1 'ssurnam':2 'student7':4 'student7@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student8	student8	SName8	SSurname 8	student8@example.com	987-654-3218	Address8	\N	O-	MALE	2026-06-06 19:24:03.422	parentId4	3	3	2016-06-06 19:24:03.421	'8':3 'sname8':1 'ssurnam':2 'student8':4 'student8@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student9	student9	SName9	SSurname 9	student9@example.com	987-654-3219	Address9	\N	O-	FEMALE	2026-06-06 19:24:03.51	parentId5	4	4	2016-06-06 19:24:03.506	'9':3 'sname9':1 'ssurnam':2 'student9':4 'student9@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student10	student10	SName10	SSurname 10	student10@example.com	987-654-32110	Address10	\N	O-	MALE	2026-06-06 19:24:03.547	parentId5	5	5	2016-06-06 19:24:03.546	'10':3 'sname10':1 'ssurnam':2 'student10':4 'student10@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student11	student11	SName11	SSurname 11	student11@example.com	987-654-32111	Address11	\N	O-	FEMALE	2026-06-06 19:24:03.606	parentId6	6	6	2016-06-06 19:24:03.605	'11':3 'sname11':1 'ssurnam':2 'student11':4 'student11@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student12	student12	SName12	SSurname 12	student12@example.com	987-654-32112	Address12	\N	O-	MALE	2026-06-06 19:24:03.639	parentId6	1	1	2016-06-06 19:24:03.637	'12':3 'sname12':1 'ssurnam':2 'student12':4 'student12@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student13	student13	SName13	SSurname 13	student13@example.com	987-654-32113	Address13	\N	O-	FEMALE	2026-06-06 19:24:03.663	parentId7	2	2	2016-06-06 19:24:03.662	'13':3 'sname13':1 'ssurnam':2 'student13':4 'student13@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student14	student14	SName14	SSurname 14	student14@example.com	987-654-32114	Address14	\N	O-	MALE	2026-06-06 19:24:03.705	parentId7	3	3	2016-06-06 19:24:03.705	'14':3 'sname14':1 'ssurnam':2 'student14':4 'student14@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student15	student15	SName15	SSurname 15	student15@example.com	987-654-32115	Address15	\N	O-	FEMALE	2026-06-06 19:24:03.744	parentId8	4	4	2016-06-06 19:24:03.739	'15':3 'sname15':1 'ssurnam':2 'student15':4 'student15@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student16	student16	SName16	SSurname 16	student16@example.com	987-654-32116	Address16	\N	O-	MALE	2026-06-06 19:24:03.826	parentId8	5	5	2016-06-06 19:24:03.822	'16':3 'sname16':1 'ssurnam':2 'student16':4 'student16@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student17	student17	SName17	SSurname 17	student17@example.com	987-654-32117	Address17	\N	O-	FEMALE	2026-06-06 19:24:03.865	parentId9	6	6	2016-06-06 19:24:03.864	'17':3 'sname17':1 'ssurnam':2 'student17':4 'student17@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student18	student18	SName18	SSurname 18	student18@example.com	987-654-32118	Address18	\N	O-	MALE	2026-06-06 19:24:03.896	parentId9	1	1	2016-06-06 19:24:03.894	'18':3 'sname18':1 'ssurnam':2 'student18':4 'student18@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student19	student19	SName19	SSurname 19	student19@example.com	987-654-32119	Address19	\N	O-	FEMALE	2026-06-06 19:24:03.978	parentId10	2	2	2016-06-06 19:24:03.973	'19':3 'sname19':1 'ssurnam':2 'student19':4 'student19@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student20	student20	SName20	SSurname 20	student20@example.com	987-654-32120	Address20	\N	O-	MALE	2026-06-06 19:24:04.001	parentId10	3	3	2016-06-06 19:24:04	'20':3 'sname20':1 'ssurnam':2 'student20':4 'student20@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student21	student21	SName21	SSurname 21	student21@example.com	987-654-32121	Address21	\N	O-	FEMALE	2026-06-06 19:24:04.061	parentId11	4	4	2016-06-06 19:24:04.055	'21':3 'sname21':1 'ssurnam':2 'student21':4 'student21@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student22	student22	SName22	SSurname 22	student22@example.com	987-654-32122	Address22	\N	O-	MALE	2026-06-06 19:24:04.115	parentId11	5	5	2016-06-06 19:24:04.114	'22':3 'sname22':1 'ssurnam':2 'student22':4 'student22@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student23	student23	SName23	SSurname 23	student23@example.com	987-654-32123	Address23	\N	O-	FEMALE	2026-06-06 19:24:04.138	parentId12	6	6	2016-06-06 19:24:04.137	'23':3 'sname23':1 'ssurnam':2 'student23':4 'student23@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student24	student24	SName24	SSurname 24	student24@example.com	987-654-32124	Address24	\N	O-	MALE	2026-06-06 19:24:04.196	parentId12	1	1	2016-06-06 19:24:04.195	'24':3 'sname24':1 'ssurnam':2 'student24':4 'student24@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student25	student25	SName25	SSurname 25	student25@example.com	987-654-32125	Address25	\N	O-	FEMALE	2026-06-06 19:24:04.252	parentId13	2	2	2016-06-06 19:24:04.251	'25':3 'sname25':1 'ssurnam':2 'student25':4 'student25@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student26	student26	SName26	SSurname 26	student26@example.com	987-654-32126	Address26	\N	O-	MALE	2026-06-06 19:24:04.329	parentId13	3	3	2016-06-06 19:24:04.328	'26':3 'sname26':1 'ssurnam':2 'student26':4 'student26@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student27	student27	SName27	SSurname 27	student27@example.com	987-654-32127	Address27	\N	O-	FEMALE	2026-06-06 19:24:04.368	parentId14	4	4	2016-06-06 19:24:04.367	'27':3 'sname27':1 'ssurnam':2 'student27':4 'student27@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student28	student28	SName28	SSurname 28	student28@example.com	987-654-32128	Address28	\N	O-	MALE	2026-06-06 19:24:04.395	parentId14	5	5	2016-06-06 19:24:04.393	'28':3 'sname28':1 'ssurnam':2 'student28':4 'student28@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student29	student29	SName29	SSurname 29	student29@example.com	987-654-32129	Address29	\N	O-	FEMALE	2026-06-06 19:24:04.455	parentId15	6	6	2016-06-06 19:24:04.454	'29':3 'sname29':1 'ssurnam':2 'student29':4 'student29@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student30	student30	SName30	SSurname 30	student30@example.com	987-654-32130	Address30	\N	O-	MALE	2026-06-06 19:24:04.486	parentId15	1	1	2016-06-06 19:24:04.485	'30':3 'sname30':1 'ssurnam':2 'student30':4 'student30@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student3	student3	SName3	SSurname 3	student3@example.com	987-654-3213	Address3	\N	O-	FEMALE	2026-06-06 19:24:03.214	parentId2	4	4	2016-06-06 19:24:03.213	'3':3 'sname3':1 'ssurnam':2 'student3':4 'student3@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student31	student31	SName31	SSurname 31	student31@example.com	987-654-32131	Address31	\N	O-	FEMALE	2026-06-06 19:24:04.539	parentId16	2	2	2016-06-06 19:24:04.537	'31':3 'sname31':1 'ssurnam':2 'student31':4 'student31@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student32	student32	SName32	SSurname 32	student32@example.com	987-654-32132	Address32	\N	O-	MALE	2026-06-06 19:24:04.645	parentId16	3	3	2016-06-06 19:24:04.645	'32':3 'sname32':1 'ssurnam':2 'student32':4 'student32@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student33	student33	SName33	SSurname 33	student33@example.com	987-654-32133	Address33	\N	O-	FEMALE	2026-06-06 19:24:04.662	parentId17	4	4	2016-06-06 19:24:04.661	'33':3 'sname33':1 'ssurnam':2 'student33':4 'student33@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student34	student34	SName34	SSurname 34	student34@example.com	987-654-32134	Address34	\N	O-	MALE	2026-06-06 19:24:04.839	parentId17	5	5	2016-06-06 19:24:04.838	'34':3 'sname34':1 'ssurnam':2 'student34':4 'student34@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student35	student35	SName35	SSurname 35	student35@example.com	987-654-32135	Address35	\N	O-	FEMALE	2026-06-06 19:24:04.872	parentId18	6	6	2016-06-06 19:24:04.871	'35':3 'sname35':1 'ssurnam':2 'student35':4 'student35@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student36	student36	SName36	SSurname 36	student36@example.com	987-654-32136	Address36	\N	O-	MALE	2026-06-06 19:24:04.919	parentId18	1	1	2016-06-06 19:24:04.918	'36':3 'sname36':1 'ssurnam':2 'student36':4 'student36@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student37	student37	SName37	SSurname 37	student37@example.com	987-654-32137	Address37	\N	O-	FEMALE	2026-06-06 19:24:04.939	parentId19	2	2	2016-06-06 19:24:04.937	'37':3 'sname37':1 'ssurnam':2 'student37':4 'student37@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student38	student38	SName38	SSurname 38	student38@example.com	987-654-32138	Address38	\N	O-	MALE	2026-06-06 19:24:05.122	parentId19	3	3	2016-06-06 19:24:05.122	'38':3 'sname38':1 'ssurnam':2 'student38':4 'student38@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student39	student39	SName39	SSurname 39	student39@example.com	987-654-32139	Address39	\N	O-	FEMALE	2026-06-06 19:24:05.188	parentId20	4	4	2016-06-06 19:24:05.187	'39':3 'sname39':1 'ssurnam':2 'student39':4 'student39@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student40	student40	SName40	SSurname 40	student40@example.com	987-654-32140	Address40	\N	O-	MALE	2026-06-06 19:24:05.231	parentId20	5	5	2016-06-06 19:24:05.23	'40':3 'sname40':1 'ssurnam':2 'student40':4 'student40@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student41	student41	SName41	SSurname 41	student41@example.com	987-654-32141	Address41	\N	O-	FEMALE	2026-06-06 19:24:05.25	parentId21	6	6	2016-06-06 19:24:05.248	'41':3 'sname41':1 'ssurnam':2 'student41':4 'student41@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student42	student42	SName42	SSurname 42	student42@example.com	987-654-32142	Address42	\N	O-	MALE	2026-06-06 19:24:05.31	parentId21	1	1	2016-06-06 19:24:05.306	'42':3 'sname42':1 'ssurnam':2 'student42':4 'student42@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student43	student43	SName43	SSurname 43	student43@example.com	987-654-32143	Address43	\N	O-	FEMALE	2026-06-06 19:24:05.354	parentId22	2	2	2016-06-06 19:24:05.353	'43':3 'sname43':1 'ssurnam':2 'student43':4 'student43@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student44	student44	SName44	SSurname 44	student44@example.com	987-654-32144	Address44	\N	O-	MALE	2026-06-06 19:24:05.433	parentId22	3	3	2016-06-06 19:24:05.432	'44':3 'sname44':1 'ssurnam':2 'student44':4 'student44@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student45	student45	SName45	SSurname 45	student45@example.com	987-654-32145	Address45	\N	O-	FEMALE	2026-06-06 19:24:05.481	parentId23	4	4	2016-06-06 19:24:05.48	'45':3 'sname45':1 'ssurnam':2 'student45':4 'student45@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student46	student46	SName46	SSurname 46	student46@example.com	987-654-32146	Address46	\N	O-	MALE	2026-06-06 19:24:05.573	parentId23	5	5	2016-06-06 19:24:05.571	'46':3 'sname46':1 'ssurnam':2 'student46':4 'student46@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student47	student47	SName47	SSurname 47	student47@example.com	987-654-32147	Address47	\N	O-	FEMALE	2026-06-06 19:24:05.62	parentId24	6	6	2016-06-06 19:24:05.619	'47':3 'sname47':1 'ssurnam':2 'student47':4 'student47@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student48	student48	SName48	SSurname 48	student48@example.com	987-654-32148	Address48	\N	O-	MALE	2026-06-06 19:24:05.644	parentId24	1	1	2016-06-06 19:24:05.639	'48':3 'sname48':1 'ssurnam':2 'student48':4 'student48@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student49	student49	SName49	SSurname 49	student49@example.com	987-654-32149	Address49	\N	O-	FEMALE	2026-06-06 19:24:05.665	parentId25	2	2	2016-06-06 19:24:05.664	'49':3 'sname49':1 'ssurnam':2 'student49':4 'student49@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student50	student50	SName50	SSurname 50	student50@example.com	987-654-32150	Address50	\N	O-	MALE	2026-06-06 19:24:05.683	parentId25	3	3	2016-06-06 19:24:05.682	'50':3 'sname50':1 'ssurnam':2 'student50':4 'student50@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student1	student1	SName1	SSurname 1	student1@example.com	987-654-3211	Address1	\N	O-	FEMALE	2026-06-06 19:24:02.948	parentId1	2	2	2016-06-06 19:24:02.938	'1':3 'sname1':1 'ssurnam':2 'student1':4 'student1@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
student2	student2	SName2	SSurname 2	student2@example.com	987-654-3212	Address2	\N	O-	MALE	2026-06-06 19:24:03.049	parentId1	3	3	2016-06-06 19:24:03.042	'2':3 'sname2':1 'ssurnam':2 'student2':4 'student2@example.com':5	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N
\.


--
-- Data for Name: StudentFeeAssignment; Type: TABLE DATA; Schema: public; Owner: techstylus
--

COPY public."StudentFeeAssignment" (id, "studentId", "feeScheduleId", "totalBillCedis") FROM stdin;
1	student6	1	1150.00
2	student12	1	1150.00
3	student18	1	1150.00
4	student24	1	1150.00
5	student30	1	1150.00
6	student36	1	1150.00
7	student42	1	1150.00
8	student48	1	1150.00
\.


--
-- Data for Name: Subject; Type: TABLE DATA; Schema: public; Owner: techstylus
--

COPY public."Subject" (id, name) FROM stdin;
1	Mathematics
2	Science
3	English
4	History
5	Geography
6	Physics
7	Chemistry
8	Biology
9	Computer Science
10	Art
\.


--
-- Data for Name: Teacher; Type: TABLE DATA; Schema: public; Owner: techstylus
--

COPY public."Teacher" (id, username, name, surname, email, phone, address, img, "bloodType", sex, "createdAt", birthday, search_vector, "isArchived", "archivedAt") FROM stdin;
teacher2	teacher2	TName2	TSurname2	teacher2@example.com	123-456-7892	Address2	\N	A+	MALE	2026-06-06 19:23:57.724	1996-06-06 19:23:57.706	'teacher2':3 'teacher2@example.com':4 'tname2':1 'tsurname2':2	f	\N
teacher3	teacher3	TName3	TSurname3	teacher3@example.com	123-456-7893	Address3	\N	A+	FEMALE	2026-06-06 19:23:58.278	1996-06-06 19:23:58.27	'teacher3':3 'teacher3@example.com':4 'tname3':1 'tsurname3':2	f	\N
teacher4	teacher4	TName4	TSurname4	teacher4@example.com	123-456-7894	Address4	\N	A+	MALE	2026-06-06 19:23:58.333	1996-06-06 19:23:58.329	'teacher4':3 'teacher4@example.com':4 'tname4':1 'tsurname4':2	f	\N
teacher5	teacher5	TName5	TSurname5	teacher5@example.com	123-456-7895	Address5	\N	A+	FEMALE	2026-06-06 19:23:58.469	1996-06-06 19:23:58.465	'teacher5':3 'teacher5@example.com':4 'tname5':1 'tsurname5':2	f	\N
teacher6	teacher6	TName6	TSurname6	teacher6@example.com	123-456-7896	Address6	\N	A+	MALE	2026-06-06 19:23:58.56	1996-06-06 19:23:58.549	'teacher6':3 'teacher6@example.com':4 'tname6':1 'tsurname6':2	f	\N
teacher7	teacher7	TName7	TSurname7	teacher7@example.com	123-456-7897	Address7	\N	A+	FEMALE	2026-06-06 19:23:58.687	1996-06-06 19:23:58.623	'teacher7':3 'teacher7@example.com':4 'tname7':1 'tsurname7':2	f	\N
teacher8	teacher8	TName8	TSurname8	teacher8@example.com	123-456-7898	Address8	\N	A+	MALE	2026-06-06 19:23:58.806	1996-06-06 19:23:58.803	'teacher8':3 'teacher8@example.com':4 'tname8':1 'tsurname8':2	f	\N
teacher9	teacher9	TName9	TSurname9	teacher9@example.com	123-456-7899	Address9	\N	A+	FEMALE	2026-06-06 19:23:59.045	1996-06-06 19:23:59.039	'teacher9':3 'teacher9@example.com':4 'tname9':1 'tsurname9':2	f	\N
teacher10	teacher10	TName10	TSurname10	teacher10@example.com	123-456-78910	Address10	\N	A+	MALE	2026-06-06 19:23:59.144	1996-06-06 19:23:59.136	'teacher10':3 'teacher10@example.com':4 'tname10':1 'tsurname10':2	f	\N
teacher11	teacher11	TName11	TSurname11	teacher11@example.com	123-456-78911	Address11	\N	A+	FEMALE	2026-06-06 19:23:59.232	1996-06-06 19:23:59.223	'teacher11':3 'teacher11@example.com':4 'tname11':1 'tsurname11':2	f	\N
teacher12	teacher12	TName12	TSurname12	teacher12@example.com	123-456-78912	Address12	\N	A+	MALE	2026-06-06 19:23:59.399	1996-06-06 19:23:59.395	'teacher12':3 'teacher12@example.com':4 'tname12':1 'tsurname12':2	f	\N
teacher13	teacher13	TName13	TSurname13	teacher13@example.com	123-456-78913	Address13	\N	A+	FEMALE	2026-06-06 19:23:59.5	1996-06-06 19:23:59.496	'teacher13':3 'teacher13@example.com':4 'tname13':1 'tsurname13':2	f	\N
teacher14	teacher14	TName14	TSurname14	teacher14@example.com	123-456-78914	Address14	\N	A+	MALE	2026-06-06 19:23:59.848	1996-06-06 19:23:59.843	'teacher14':3 'teacher14@example.com':4 'tname14':1 'tsurname14':2	f	\N
teacher15	teacher15	TName15	TSurname15	teacher15@example.com	123-456-78915	Address15	\N	A+	FEMALE	2026-06-06 19:23:59.964	1996-06-06 19:23:59.956	'teacher15':3 'teacher15@example.com':4 'tname15':1 'tsurname15':2	f	\N
teacher1	teacher1	TName1	TSurname1	teacher1@example.com	123-456-7891	Address1	\N	A+	FEMALE	2026-06-06 19:23:55.579	1996-06-06 19:23:54.625	'teacher1':3 'teacher1@example.com':4 'tname1':1 'tsurname1':2	f	\N
\.


--
-- Data for Name: TermlyReport; Type: TABLE DATA; Schema: public; Owner: techstylus
--

COPY public."TermlyReport" (id, "studentId", "classId", "academicYearId", "termNumber", "positionOnRoll", "totalOnRoll", "totalAttendance", "vacationDate", "reopeningDate", "overallPercentage", "overallGrade", "overallRemark", interest, conduct, "resultStatus", "supervisorRemarks", "supervisorSignature", "headteacherRemarks", "headteacherSignature", "createdById", "createdAt", "updatedAt") FROM stdin;
2	student18	1	1	3	2	8	0	2026-07-24 23:59:59	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	user_3DJDlpSBQgNPlAiSL3XyyqmtCt0	2026-06-09 09:37:25.303	2026-06-09 09:37:25.303
3	student24	1	1	3	3	8	0	2026-07-24 23:59:59	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	user_3DJDlpSBQgNPlAiSL3XyyqmtCt0	2026-06-09 09:37:25.444	2026-06-09 09:37:25.444
4	student30	1	1	3	4	8	1	2026-07-24 23:59:59	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	user_3DJDlpSBQgNPlAiSL3XyyqmtCt0	2026-06-09 09:37:25.633	2026-06-09 09:37:25.633
5	student36	1	1	3	5	8	1	2026-07-24 23:59:59	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	user_3DJDlpSBQgNPlAiSL3XyyqmtCt0	2026-06-09 09:37:25.769	2026-06-09 09:37:25.769
6	student42	1	1	3	6	8	0	2026-07-24 23:59:59	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	user_3DJDlpSBQgNPlAiSL3XyyqmtCt0	2026-06-09 09:37:25.904	2026-06-09 09:37:25.904
7	student48	1	1	3	7	8	1	2026-07-24 23:59:59	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	user_3DJDlpSBQgNPlAiSL3XyyqmtCt0	2026-06-09 09:37:26.145	2026-06-09 09:37:26.145
8	student6	1	1	3	8	8	1	2026-07-24 23:59:59	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	user_3DJDlpSBQgNPlAiSL3XyyqmtCt0	2026-06-09 09:37:26.661	2026-06-09 09:37:26.661
1	student12	1	1	3	1	8	1	2026-07-24 00:00:00	2026-09-08 00:00:00	84.8	\N	\N	Reading	Respectful 	Promoted	Excellent performance	Signed	Excellent	Signed	user_3DJDlpSBQgNPlAiSL3XyyqmtCt0	2026-06-09 09:37:24.193	2026-06-09 09:43:19.845
\.


--
-- Data for Name: TermlyReportSubjectLine; Type: TABLE DATA; Schema: public; Owner: techstylus
--

COPY public."TermlyReportSubjectLine" (id, "termlyReportId", "subjectId", "classScore", "examScore", "totalMarks", grade, remark, "lastEditedById") FROM stdin;
6	2	7	0	0	0	\N	\N	\N
7	2	3	0	0	0	\N	\N	\N
8	2	9	0	0	0	\N	\N	\N
9	2	5	0	0	0	\N	\N	\N
10	2	1	0	0	0	\N	\N	\N
11	3	7	0	0	0	\N	\N	\N
12	3	3	0	0	0	\N	\N	\N
13	3	9	0	0	0	\N	\N	\N
14	3	5	0	0	0	\N	\N	\N
15	3	1	0	0	0	\N	\N	\N
16	4	7	0	0	0	\N	\N	\N
17	4	3	0	0	0	\N	\N	\N
18	4	9	0	0	0	\N	\N	\N
19	4	5	0	0	0	\N	\N	\N
20	4	1	0	0	0	\N	\N	\N
21	5	7	0	0	0	\N	\N	\N
22	5	3	0	0	0	\N	\N	\N
23	5	9	0	0	0	\N	\N	\N
24	5	5	0	0	0	\N	\N	\N
25	5	1	0	0	0	\N	\N	\N
26	6	7	0	0	0	\N	\N	\N
27	6	3	0	0	0	\N	\N	\N
28	6	9	0	0	0	\N	\N	\N
29	6	5	0	0	0	\N	\N	\N
30	6	1	0	0	0	\N	\N	\N
31	7	7	0	0	0	\N	\N	\N
32	7	3	0	0	0	\N	\N	\N
33	7	9	0	0	0	\N	\N	\N
34	7	5	0	0	0	\N	\N	\N
35	7	1	0	0	0	\N	\N	\N
36	8	7	0	0	0	\N	\N	\N
37	8	3	0	0	0	\N	\N	\N
38	8	9	0	0	0	\N	\N	\N
39	8	5	0	0	0	\N	\N	\N
40	8	1	0	0	0	\N	\N	\N
1	1	7	40	45	85	\N	\N	user_3DJDlpSBQgNPlAiSL3XyyqmtCt0
3	1	9	48	30	78	\N	\N	user_3DJDlpSBQgNPlAiSL3XyyqmtCt0
2	1	3	39	45	84	\N	\N	user_3DJDlpSBQgNPlAiSL3XyyqmtCt0
4	1	5	40	50	90	\N	\N	user_3DJDlpSBQgNPlAiSL3XyyqmtCt0
5	1	1	47	40	87	\N	\N	user_3DJDlpSBQgNPlAiSL3XyyqmtCt0
\.


--
-- Data for Name: TransportRequest; Type: TABLE DATA; Schema: public; Owner: techstylus
--

COPY public."TransportRequest" (id, "parentId", "studentId", "classId", routine, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: _SubjectToTeacher; Type: TABLE DATA; Schema: public; Owner: techstylus
--

COPY public."_SubjectToTeacher" ("A", "B") FROM stdin;
2	teacher1
3	teacher2
4	teacher3
5	teacher4
6	teacher5
7	teacher6
8	teacher7
9	teacher8
10	teacher9
1	teacher10
2	teacher11
3	teacher12
4	teacher13
5	teacher14
6	teacher15
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: techstylus
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
4d6a9c52-9410-42a9-8b27-21ff000ccbef	41e38280b15c5b33ddda9d4c7e08b394759de02167d657f1bf5a77ec8e9f9570	2026-06-06 19:21:55.733568+00	20260429140102_init	\N	\N	2026-06-06 19:21:54.299488+00	1
cbca2af6-a586-4888-adfb-a3cb674a6784	bc05d01c800534b32b4b94d450b1df324504f371446858733e9778a05696a6a2	2026-06-06 19:21:59.214172+00	20260526195046_add_school_settings	\N	\N	2026-06-06 19:21:59.11551+00	1
87394a2c-b851-4d54-af48-7dd4e3b17fbc	92b673912efcb7628b40419af928faabbf88819f9ba54e629c1376d317d562b3	2026-06-06 19:21:56.189404+00	20260520140000_add_fee_management	\N	\N	2026-06-06 19:21:55.747757+00	1
82d16898-0626-46e4-8e4e-fb3082b99524	a69abea47daf95540a12cbfc0ab38c81645b903233608a945413726cd46b7047	2026-06-06 19:21:56.913605+00	20260520150000_add_book_purchase	\N	\N	2026-06-06 19:21:56.239291+00	1
d9109755-f002-4608-aca3-b031fa0e6ee3	456575929030cea5a4692e95962cf923f653e40b67a0f828ca8a94406a903c70	2026-06-06 19:21:57.400735+00	20260521120000_add_academic_year_settings	\N	\N	2026-06-06 19:21:56.984032+00	1
1ddc8685-f49f-48ac-8b08-44d46f284d37	43a8c429e2a672ac233130676149822608f72bab874e3c5eca52bc0ed67f12e4	2026-06-06 19:21:59.476104+00	20260529075608_add_bus_model	\N	\N	2026-06-06 19:21:59.243325+00	1
01eb6b9c-d514-4f74-a3d9-03fc84d1bbfb	dd1a64ba7926aeebf8b95332bcd95e6a5ab7efab1860011ed7df555ee1305d73	2026-06-06 19:21:57.689075+00	20260521130000_term_days_weeks_per_term	\N	\N	2026-06-06 19:21:57.43954+00	1
05b39c76-dd19-42c9-bfd0-783a0a152312	41019a6c8a15db576c356ef0b5f4308b1c0020499f709d52fd032b9d1594dbfc	2026-06-06 19:21:58.12077+00	20260521140000_grading_and_termly_reports	\N	\N	2026-06-06 19:21:57.715612+00	1
b1394abd-a0a4-405f-9ca7-2e79f47f15aa	81526323e6ec528b44f87b2adf8bac4f76dc58e7eae56050c54320b121dfdb19	2026-06-06 19:21:58.294178+00	20260521214550_add_message_model	\N	\N	2026-06-06 19:21:58.132438+00	1
231765ba-d9f5-4126-bebd-bffbe545b181	b5731cbfdb0b3f458abfd70e0af252b3b74cbcc6cb0af9e8cf31575e394c247a	2026-06-06 19:21:59.599495+00	20260529084000_add_bus_registration	\N	\N	2026-06-06 19:21:59.489344+00	1
6192bc8a-3c9f-4328-90b1-608898784fd9	3308145adc1f160f07183435e57818949cdef657049a67ec1c125a0ddebb0204	2026-06-06 19:21:58.362035+00	20260521221259_add_read_tracking	\N	\N	2026-06-06 19:21:58.314683+00	1
83462366-2d0b-490d-97ed-b53457b26ca0	c0fcad8db3f372b1906138ad622372799e6b9e399999d01b7d8a18af686cec3a	2026-06-06 19:21:58.473601+00	20260522040842_add_teacher_attendance	\N	\N	2026-06-06 19:21:58.370716+00	1
c00a76ce-da25-424a-b061-29d735c3c7ae	daeb2a42d91651e5efeacc0ec793928cd9e3e95607af1a3243e5d42be69e474b	2026-06-06 19:21:58.714472+00	20260522122218_add_exam_question_uploads	\N	\N	2026-06-06 19:21:58.481321+00	1
f607c90f-33b2-4354-98a0-3c432bf61ea2	9c2414d6565e54070120d6d7b8b734d3709c3cdb0421a5839faa8fb7dae65a84	2026-06-06 19:21:59.824114+00	20260530120000_add_fulltext_search	\N	\N	2026-06-06 19:21:59.61823+00	1
78e5777e-5df6-4a9b-805f-91f883abcfa3	4b30405d85acff83a0c0a3edbbe61b9f274b2a38524009646cd165fce80fff23	2026-06-06 19:21:58.811756+00	20260525090627_add_weeknumber_to_exam_question_upload	\N	\N	2026-06-06 19:21:58.723197+00	1
e7403b9f-7cc9-4ac4-baec-48a46baf711f	1ec694247604ace5cae5142dc95cd8117804bdd8f3a34a1dfd408c562b9e1673	2026-06-06 19:21:58.987744+00	20260525154026_add_password_change_request	\N	\N	2026-06-06 19:21:58.833516+00	1
45d90527-6b87-46d9-8308-e3a8ddcc0d36	a7463407967d02044ab1d3b28e4c325869f1425ba14b155ff69375dc79b13aec	2026-06-06 19:21:59.099826+00	20260526150833_add_payment_method	\N	\N	2026-06-06 19:21:58.999756+00	1
02496f16-dcfa-499e-a401-a8c5a41e8fce	1b4094bbf3b3c155e9593d74f2af78edbfe4ddfc7695ed1858ab0faf54076d7a	2026-06-06 19:21:59.926171+00	20260530200000_add_parent_occupation	\N	\N	2026-06-06 19:21:59.833579+00	1
1eddbf83-56be-44da-b921-ef170cd8cfee	cd29840b2bf30c93f513aa51eade7ddbbff833b23730bd4af5f3a40e7351f0bb	2026-06-06 19:22:00.386321+00	20260606120000_add_archived_flags	\N	\N	2026-06-06 19:21:59.934951+00	1
64aa2982-7787-474b-8342-13031ab55d4c	3dba1f18ad313af05d9f54a80e2de49b6762b0f912f14918328cdcb75dee62d9	2026-06-06 19:22:00.658998+00	20260606190157_sync_student_schema	\N	\N	2026-06-06 19:22:00.417413+00	1
74b3aebe-3811-426c-8b1f-3fa34dc2d9cd	304adc360abd50ea31e234da48c3e01b6145a353008ce3040c80d81339062046	2026-06-08 10:42:17.171106+00	20260608103930_add_assignment_questions	\N	\N	2026-06-08 10:42:17.104062+00	1
\.


--
-- Name: AcademicTerm_id_seq; Type: SEQUENCE SET; Schema: public; Owner: techstylus
--

SELECT pg_catalog.setval('public."AcademicTerm_id_seq"', 3, true);


--
-- Name: AcademicYear_id_seq; Type: SEQUENCE SET; Schema: public; Owner: techstylus
--

SELECT pg_catalog.setval('public."AcademicYear_id_seq"', 1, true);


--
-- Name: Announcement_id_seq; Type: SEQUENCE SET; Schema: public; Owner: techstylus
--

SELECT pg_catalog.setval('public."Announcement_id_seq"', 5, true);


--
-- Name: Assignment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: techstylus
--

SELECT pg_catalog.setval('public."Assignment_id_seq"', 10, true);


--
-- Name: Attendance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: techstylus
--

SELECT pg_catalog.setval('public."Attendance_id_seq"', 142, true);


--
-- Name: BookOrderItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: techstylus
--

SELECT pg_catalog.setval('public."BookOrderItem_id_seq"', 1, false);


--
-- Name: BookOrder_id_seq; Type: SEQUENCE SET; Schema: public; Owner: techstylus
--

SELECT pg_catalog.setval('public."BookOrder_id_seq"', 1, false);


--
-- Name: Book_id_seq; Type: SEQUENCE SET; Schema: public; Owner: techstylus
--

SELECT pg_catalog.setval('public."Book_id_seq"', 1, false);


--
-- Name: BusLocation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: techstylus
--

SELECT pg_catalog.setval('public."BusLocation_id_seq"', 1, false);


--
-- Name: BusRegistration_id_seq; Type: SEQUENCE SET; Schema: public; Owner: techstylus
--

SELECT pg_catalog.setval('public."BusRegistration_id_seq"', 1, false);


--
-- Name: Bus_id_seq; Type: SEQUENCE SET; Schema: public; Owner: techstylus
--

SELECT pg_catalog.setval('public."Bus_id_seq"', 1, false);


--
-- Name: Class_id_seq; Type: SEQUENCE SET; Schema: public; Owner: techstylus
--

SELECT pg_catalog.setval('public."Class_id_seq"', 6, true);


--
-- Name: Event_id_seq; Type: SEQUENCE SET; Schema: public; Owner: techstylus
--

SELECT pg_catalog.setval('public."Event_id_seq"', 6, true);


--
-- Name: ExamQuestionUpload_id_seq; Type: SEQUENCE SET; Schema: public; Owner: techstylus
--

SELECT pg_catalog.setval('public."ExamQuestionUpload_id_seq"', 1, false);


--
-- Name: Exam_id_seq; Type: SEQUENCE SET; Schema: public; Owner: techstylus
--

SELECT pg_catalog.setval('public."Exam_id_seq"', 10, true);


--
-- Name: FeePayment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: techstylus
--

SELECT pg_catalog.setval('public."FeePayment_id_seq"', 4, true);


--
-- Name: FeeSchedule_id_seq; Type: SEQUENCE SET; Schema: public; Owner: techstylus
--

SELECT pg_catalog.setval('public."FeeSchedule_id_seq"', 1, true);


--
-- Name: Grade_id_seq; Type: SEQUENCE SET; Schema: public; Owner: techstylus
--

SELECT pg_catalog.setval('public."Grade_id_seq"', 6, true);


--
-- Name: GradingScaleEntry_id_seq; Type: SEQUENCE SET; Schema: public; Owner: techstylus
--

SELECT pg_catalog.setval('public."GradingScaleEntry_id_seq"', 1, false);


--
-- Name: Lesson_id_seq; Type: SEQUENCE SET; Schema: public; Owner: techstylus
--

SELECT pg_catalog.setval('public."Lesson_id_seq"', 30, true);


--
-- Name: Message_id_seq; Type: SEQUENCE SET; Schema: public; Owner: techstylus
--

SELECT pg_catalog.setval('public."Message_id_seq"', 1, false);


--
-- Name: PasswordChangeRequest_id_seq; Type: SEQUENCE SET; Schema: public; Owner: techstylus
--

SELECT pg_catalog.setval('public."PasswordChangeRequest_id_seq"', 1, false);


--
-- Name: Result_id_seq; Type: SEQUENCE SET; Schema: public; Owner: techstylus
--

SELECT pg_catalog.setval('public."Result_id_seq"', 10, true);


--
-- Name: SchoolSetting_id_seq; Type: SEQUENCE SET; Schema: public; Owner: techstylus
--

SELECT pg_catalog.setval('public."SchoolSetting_id_seq"', 1, false);


--
-- Name: StudentFeeAssignment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: techstylus
--

SELECT pg_catalog.setval('public."StudentFeeAssignment_id_seq"', 8, true);


--
-- Name: Subject_id_seq; Type: SEQUENCE SET; Schema: public; Owner: techstylus
--

SELECT pg_catalog.setval('public."Subject_id_seq"', 10, true);


--
-- Name: TermlyReportSubjectLine_id_seq; Type: SEQUENCE SET; Schema: public; Owner: techstylus
--

SELECT pg_catalog.setval('public."TermlyReportSubjectLine_id_seq"', 45, true);


--
-- Name: TermlyReport_id_seq; Type: SEQUENCE SET; Schema: public; Owner: techstylus
--

SELECT pg_catalog.setval('public."TermlyReport_id_seq"', 8, true);


--
-- Name: TransportRequest_id_seq; Type: SEQUENCE SET; Schema: public; Owner: techstylus
--

SELECT pg_catalog.setval('public."TransportRequest_id_seq"', 1, false);


--
-- Name: AcademicTerm AcademicTerm_pkey; Type: CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."AcademicTerm"
    ADD CONSTRAINT "AcademicTerm_pkey" PRIMARY KEY (id);


--
-- Name: AcademicYear AcademicYear_pkey; Type: CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."AcademicYear"
    ADD CONSTRAINT "AcademicYear_pkey" PRIMARY KEY (id);


--
-- Name: Admin Admin_pkey; Type: CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Admin"
    ADD CONSTRAINT "Admin_pkey" PRIMARY KEY (id);


--
-- Name: Announcement Announcement_pkey; Type: CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Announcement"
    ADD CONSTRAINT "Announcement_pkey" PRIMARY KEY (id);


--
-- Name: Assignment Assignment_pkey; Type: CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Assignment"
    ADD CONSTRAINT "Assignment_pkey" PRIMARY KEY (id);


--
-- Name: Attendance Attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_pkey" PRIMARY KEY (id);


--
-- Name: BookOrderItem BookOrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."BookOrderItem"
    ADD CONSTRAINT "BookOrderItem_pkey" PRIMARY KEY (id);


--
-- Name: BookOrder BookOrder_pkey; Type: CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."BookOrder"
    ADD CONSTRAINT "BookOrder_pkey" PRIMARY KEY (id);


--
-- Name: Book Book_pkey; Type: CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Book"
    ADD CONSTRAINT "Book_pkey" PRIMARY KEY (id);


--
-- Name: BusLocation BusLocation_pkey; Type: CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."BusLocation"
    ADD CONSTRAINT "BusLocation_pkey" PRIMARY KEY (id);


--
-- Name: BusRegistration BusRegistration_pkey; Type: CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."BusRegistration"
    ADD CONSTRAINT "BusRegistration_pkey" PRIMARY KEY (id);


--
-- Name: Bus Bus_pkey; Type: CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Bus"
    ADD CONSTRAINT "Bus_pkey" PRIMARY KEY (id);


--
-- Name: Class Class_pkey; Type: CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Class"
    ADD CONSTRAINT "Class_pkey" PRIMARY KEY (id);


--
-- Name: Event Event_pkey; Type: CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_pkey" PRIMARY KEY (id);


--
-- Name: ExamQuestionUpload ExamQuestionUpload_pkey; Type: CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."ExamQuestionUpload"
    ADD CONSTRAINT "ExamQuestionUpload_pkey" PRIMARY KEY (id);


--
-- Name: Exam Exam_pkey; Type: CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Exam"
    ADD CONSTRAINT "Exam_pkey" PRIMARY KEY (id);


--
-- Name: FeePayment FeePayment_pkey; Type: CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."FeePayment"
    ADD CONSTRAINT "FeePayment_pkey" PRIMARY KEY (id);


--
-- Name: FeeSchedule FeeSchedule_pkey; Type: CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."FeeSchedule"
    ADD CONSTRAINT "FeeSchedule_pkey" PRIMARY KEY (id);


--
-- Name: Grade Grade_pkey; Type: CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Grade"
    ADD CONSTRAINT "Grade_pkey" PRIMARY KEY (id);


--
-- Name: GradingScaleEntry GradingScaleEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."GradingScaleEntry"
    ADD CONSTRAINT "GradingScaleEntry_pkey" PRIMARY KEY (id);


--
-- Name: Lesson Lesson_pkey; Type: CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Lesson"
    ADD CONSTRAINT "Lesson_pkey" PRIMARY KEY (id);


--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);


--
-- Name: Parent Parent_pkey; Type: CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Parent"
    ADD CONSTRAINT "Parent_pkey" PRIMARY KEY (id);


--
-- Name: PasswordChangeRequest PasswordChangeRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."PasswordChangeRequest"
    ADD CONSTRAINT "PasswordChangeRequest_pkey" PRIMARY KEY (id);


--
-- Name: Result Result_pkey; Type: CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Result"
    ADD CONSTRAINT "Result_pkey" PRIMARY KEY (id);


--
-- Name: SchoolSetting SchoolSetting_pkey; Type: CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."SchoolSetting"
    ADD CONSTRAINT "SchoolSetting_pkey" PRIMARY KEY (id);


--
-- Name: StudentFeeAssignment StudentFeeAssignment_pkey; Type: CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."StudentFeeAssignment"
    ADD CONSTRAINT "StudentFeeAssignment_pkey" PRIMARY KEY (id);


--
-- Name: Student Student_pkey; Type: CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Student"
    ADD CONSTRAINT "Student_pkey" PRIMARY KEY (id);


--
-- Name: Subject Subject_pkey; Type: CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Subject"
    ADD CONSTRAINT "Subject_pkey" PRIMARY KEY (id);


--
-- Name: Teacher Teacher_pkey; Type: CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Teacher"
    ADD CONSTRAINT "Teacher_pkey" PRIMARY KEY (id);


--
-- Name: TermlyReportSubjectLine TermlyReportSubjectLine_pkey; Type: CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."TermlyReportSubjectLine"
    ADD CONSTRAINT "TermlyReportSubjectLine_pkey" PRIMARY KEY (id);


--
-- Name: TermlyReport TermlyReport_pkey; Type: CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."TermlyReport"
    ADD CONSTRAINT "TermlyReport_pkey" PRIMARY KEY (id);


--
-- Name: TransportRequest TransportRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."TransportRequest"
    ADD CONSTRAINT "TransportRequest_pkey" PRIMARY KEY (id);


--
-- Name: _SubjectToTeacher _SubjectToTeacher_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."_SubjectToTeacher"
    ADD CONSTRAINT "_SubjectToTeacher_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: AcademicTerm_academicYearId_termNumber_key; Type: INDEX; Schema: public; Owner: techstylus
--

CREATE UNIQUE INDEX "AcademicTerm_academicYearId_termNumber_key" ON public."AcademicTerm" USING btree ("academicYearId", "termNumber");


--
-- Name: AcademicYear_label_key; Type: INDEX; Schema: public; Owner: techstylus
--

CREATE UNIQUE INDEX "AcademicYear_label_key" ON public."AcademicYear" USING btree (label);


--
-- Name: Admin_username_key; Type: INDEX; Schema: public; Owner: techstylus
--

CREATE UNIQUE INDEX "Admin_username_key" ON public."Admin" USING btree (username);


--
-- Name: Class_name_key; Type: INDEX; Schema: public; Owner: techstylus
--

CREATE UNIQUE INDEX "Class_name_key" ON public."Class" USING btree (name);


--
-- Name: FeeSchedule_classId_academicYear_term_key; Type: INDEX; Schema: public; Owner: techstylus
--

CREATE UNIQUE INDEX "FeeSchedule_classId_academicYear_term_key" ON public."FeeSchedule" USING btree ("classId", "academicYear", term);


--
-- Name: Grade_level_key; Type: INDEX; Schema: public; Owner: techstylus
--

CREATE UNIQUE INDEX "Grade_level_key" ON public."Grade" USING btree (level);


--
-- Name: Parent_email_key; Type: INDEX; Schema: public; Owner: techstylus
--

CREATE UNIQUE INDEX "Parent_email_key" ON public."Parent" USING btree (email);


--
-- Name: Parent_isArchived_idx; Type: INDEX; Schema: public; Owner: techstylus
--

CREATE INDEX "Parent_isArchived_idx" ON public."Parent" USING btree ("isArchived");


--
-- Name: Parent_phone_key; Type: INDEX; Schema: public; Owner: techstylus
--

CREATE UNIQUE INDEX "Parent_phone_key" ON public."Parent" USING btree (phone);


--
-- Name: Parent_username_key; Type: INDEX; Schema: public; Owner: techstylus
--

CREATE UNIQUE INDEX "Parent_username_key" ON public."Parent" USING btree (username);


--
-- Name: StudentFeeAssignment_studentId_feeScheduleId_key; Type: INDEX; Schema: public; Owner: techstylus
--

CREATE UNIQUE INDEX "StudentFeeAssignment_studentId_feeScheduleId_key" ON public."StudentFeeAssignment" USING btree ("studentId", "feeScheduleId");


--
-- Name: Student_email_key; Type: INDEX; Schema: public; Owner: techstylus
--

CREATE UNIQUE INDEX "Student_email_key" ON public."Student" USING btree (email);


--
-- Name: Student_isArchived_idx; Type: INDEX; Schema: public; Owner: techstylus
--

CREATE INDEX "Student_isArchived_idx" ON public."Student" USING btree ("isArchived");


--
-- Name: Student_phone_key; Type: INDEX; Schema: public; Owner: techstylus
--

CREATE UNIQUE INDEX "Student_phone_key" ON public."Student" USING btree (phone);


--
-- Name: Student_username_key; Type: INDEX; Schema: public; Owner: techstylus
--

CREATE UNIQUE INDEX "Student_username_key" ON public."Student" USING btree (username);


--
-- Name: Subject_name_key; Type: INDEX; Schema: public; Owner: techstylus
--

CREATE UNIQUE INDEX "Subject_name_key" ON public."Subject" USING btree (name);


--
-- Name: Teacher_email_key; Type: INDEX; Schema: public; Owner: techstylus
--

CREATE UNIQUE INDEX "Teacher_email_key" ON public."Teacher" USING btree (email);


--
-- Name: Teacher_isArchived_idx; Type: INDEX; Schema: public; Owner: techstylus
--

CREATE INDEX "Teacher_isArchived_idx" ON public."Teacher" USING btree ("isArchived");


--
-- Name: Teacher_phone_key; Type: INDEX; Schema: public; Owner: techstylus
--

CREATE UNIQUE INDEX "Teacher_phone_key" ON public."Teacher" USING btree (phone);


--
-- Name: Teacher_username_key; Type: INDEX; Schema: public; Owner: techstylus
--

CREATE UNIQUE INDEX "Teacher_username_key" ON public."Teacher" USING btree (username);


--
-- Name: TermlyReportSubjectLine_termlyReportId_subjectId_key; Type: INDEX; Schema: public; Owner: techstylus
--

CREATE UNIQUE INDEX "TermlyReportSubjectLine_termlyReportId_subjectId_key" ON public."TermlyReportSubjectLine" USING btree ("termlyReportId", "subjectId");


--
-- Name: TermlyReport_studentId_academicYearId_termNumber_key; Type: INDEX; Schema: public; Owner: techstylus
--

CREATE UNIQUE INDEX "TermlyReport_studentId_academicYearId_termNumber_key" ON public."TermlyReport" USING btree ("studentId", "academicYearId", "termNumber");


--
-- Name: _SubjectToTeacher_B_index; Type: INDEX; Schema: public; Owner: techstylus
--

CREATE INDEX "_SubjectToTeacher_B_index" ON public."_SubjectToTeacher" USING btree ("B");


--
-- Name: idx_announcement_search_vector; Type: INDEX; Schema: public; Owner: techstylus
--

CREATE INDEX idx_announcement_search_vector ON public."Announcement" USING gin (search_vector);


--
-- Name: idx_book_search_vector; Type: INDEX; Schema: public; Owner: techstylus
--

CREATE INDEX idx_book_search_vector ON public."Book" USING gin (search_vector);


--
-- Name: idx_class_search_vector; Type: INDEX; Schema: public; Owner: techstylus
--

CREATE INDEX idx_class_search_vector ON public."Class" USING gin (search_vector);


--
-- Name: idx_event_search_vector; Type: INDEX; Schema: public; Owner: techstylus
--

CREATE INDEX idx_event_search_vector ON public."Event" USING gin (search_vector);


--
-- Name: idx_message_search_vector; Type: INDEX; Schema: public; Owner: techstylus
--

CREATE INDEX idx_message_search_vector ON public."Message" USING gin (search_vector);


--
-- Name: idx_parent_search_vector; Type: INDEX; Schema: public; Owner: techstylus
--

CREATE INDEX idx_parent_search_vector ON public."Parent" USING gin (search_vector);


--
-- Name: idx_student_search_vector; Type: INDEX; Schema: public; Owner: techstylus
--

CREATE INDEX idx_student_search_vector ON public."Student" USING gin (search_vector);


--
-- Name: idx_teacher_search_vector; Type: INDEX; Schema: public; Owner: techstylus
--

CREATE INDEX idx_teacher_search_vector ON public."Teacher" USING gin (search_vector);


--
-- Name: Announcement tsvectorupdate_announcement; Type: TRIGGER; Schema: public; Owner: techstylus
--

CREATE TRIGGER tsvectorupdate_announcement BEFORE INSERT OR UPDATE ON public."Announcement" FOR EACH ROW EXECUTE FUNCTION tsvector_update_trigger('search_vector', 'pg_catalog.english', 'title', 'description');


--
-- Name: Book tsvectorupdate_book; Type: TRIGGER; Schema: public; Owner: techstylus
--

CREATE TRIGGER tsvectorupdate_book BEFORE INSERT OR UPDATE ON public."Book" FOR EACH ROW EXECUTE FUNCTION tsvector_update_trigger('search_vector', 'pg_catalog.english', 'title', 'supplierName');


--
-- Name: Class tsvectorupdate_class; Type: TRIGGER; Schema: public; Owner: techstylus
--

CREATE TRIGGER tsvectorupdate_class BEFORE INSERT OR UPDATE ON public."Class" FOR EACH ROW EXECUTE FUNCTION tsvector_update_trigger('search_vector', 'pg_catalog.english', 'name');


--
-- Name: Event tsvectorupdate_event; Type: TRIGGER; Schema: public; Owner: techstylus
--

CREATE TRIGGER tsvectorupdate_event BEFORE INSERT OR UPDATE ON public."Event" FOR EACH ROW EXECUTE FUNCTION tsvector_update_trigger('search_vector', 'pg_catalog.english', 'title', 'description');


--
-- Name: Message tsvectorupdate_message; Type: TRIGGER; Schema: public; Owner: techstylus
--

CREATE TRIGGER tsvectorupdate_message BEFORE INSERT OR UPDATE ON public."Message" FOR EACH ROW EXECUTE FUNCTION tsvector_update_trigger('search_vector', 'pg_catalog.english', 'text');


--
-- Name: Parent tsvectorupdate_parent; Type: TRIGGER; Schema: public; Owner: techstylus
--

CREATE TRIGGER tsvectorupdate_parent BEFORE INSERT OR UPDATE ON public."Parent" FOR EACH ROW EXECUTE FUNCTION tsvector_update_trigger('search_vector', 'pg_catalog.english', 'name', 'surname', 'username', 'email', 'phone');


--
-- Name: Student tsvectorupdate_student; Type: TRIGGER; Schema: public; Owner: techstylus
--

CREATE TRIGGER tsvectorupdate_student BEFORE INSERT OR UPDATE ON public."Student" FOR EACH ROW EXECUTE FUNCTION tsvector_update_trigger('search_vector', 'pg_catalog.english', 'name', 'surname', 'username', 'email');


--
-- Name: Teacher tsvectorupdate_teacher; Type: TRIGGER; Schema: public; Owner: techstylus
--

CREATE TRIGGER tsvectorupdate_teacher BEFORE INSERT OR UPDATE ON public."Teacher" FOR EACH ROW EXECUTE FUNCTION tsvector_update_trigger('search_vector', 'pg_catalog.english', 'name', 'surname', 'username', 'email');


--
-- Name: AcademicTerm AcademicTerm_academicYearId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."AcademicTerm"
    ADD CONSTRAINT "AcademicTerm_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES public."AcademicYear"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Announcement Announcement_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Announcement"
    ADD CONSTRAINT "Announcement_classId_fkey" FOREIGN KEY ("classId") REFERENCES public."Class"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Assignment Assignment_lessonId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Assignment"
    ADD CONSTRAINT "Assignment_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES public."Lesson"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Attendance Attendance_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."Student"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Attendance Attendance_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public."Teacher"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: BookOrderItem BookOrderItem_bookId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."BookOrderItem"
    ADD CONSTRAINT "BookOrderItem_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES public."Book"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: BookOrderItem BookOrderItem_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."BookOrderItem"
    ADD CONSTRAINT "BookOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."BookOrder"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BookOrder BookOrder_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."BookOrder"
    ADD CONSTRAINT "BookOrder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Parent"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Book Book_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Book"
    ADD CONSTRAINT "Book_classId_fkey" FOREIGN KEY ("classId") REFERENCES public."Class"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BusLocation BusLocation_busId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."BusLocation"
    ADD CONSTRAINT "BusLocation_busId_fkey" FOREIGN KEY ("busId") REFERENCES public."Bus"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BusRegistration BusRegistration_busId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."BusRegistration"
    ADD CONSTRAINT "BusRegistration_busId_fkey" FOREIGN KEY ("busId") REFERENCES public."Bus"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BusRegistration BusRegistration_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."BusRegistration"
    ADD CONSTRAINT "BusRegistration_classId_fkey" FOREIGN KEY ("classId") REFERENCES public."Class"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BusRegistration BusRegistration_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."BusRegistration"
    ADD CONSTRAINT "BusRegistration_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Parent"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BusRegistration BusRegistration_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."BusRegistration"
    ADD CONSTRAINT "BusRegistration_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."Student"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Class Class_gradeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Class"
    ADD CONSTRAINT "Class_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES public."Grade"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Class Class_supervisorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Class"
    ADD CONSTRAINT "Class_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES public."Teacher"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Event Event_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_classId_fkey" FOREIGN KEY ("classId") REFERENCES public."Class"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ExamQuestionUpload ExamQuestionUpload_lessonId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."ExamQuestionUpload"
    ADD CONSTRAINT "ExamQuestionUpload_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES public."Lesson"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ExamQuestionUpload ExamQuestionUpload_uploadedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."ExamQuestionUpload"
    ADD CONSTRAINT "ExamQuestionUpload_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES public."Teacher"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Exam Exam_lessonId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Exam"
    ADD CONSTRAINT "Exam_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES public."Lesson"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: FeePayment FeePayment_studentFeeAssignmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."FeePayment"
    ADD CONSTRAINT "FeePayment_studentFeeAssignmentId_fkey" FOREIGN KEY ("studentFeeAssignmentId") REFERENCES public."StudentFeeAssignment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FeeSchedule FeeSchedule_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."FeeSchedule"
    ADD CONSTRAINT "FeeSchedule_classId_fkey" FOREIGN KEY ("classId") REFERENCES public."Class"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Lesson Lesson_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Lesson"
    ADD CONSTRAINT "Lesson_classId_fkey" FOREIGN KEY ("classId") REFERENCES public."Class"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Lesson Lesson_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Lesson"
    ADD CONSTRAINT "Lesson_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public."Subject"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Lesson Lesson_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Lesson"
    ADD CONSTRAINT "Lesson_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public."Teacher"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Result Result_assignmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Result"
    ADD CONSTRAINT "Result_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES public."Assignment"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Result Result_examId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Result"
    ADD CONSTRAINT "Result_examId_fkey" FOREIGN KEY ("examId") REFERENCES public."Exam"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Result Result_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Result"
    ADD CONSTRAINT "Result_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."Student"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StudentFeeAssignment StudentFeeAssignment_feeScheduleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."StudentFeeAssignment"
    ADD CONSTRAINT "StudentFeeAssignment_feeScheduleId_fkey" FOREIGN KEY ("feeScheduleId") REFERENCES public."FeeSchedule"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: StudentFeeAssignment StudentFeeAssignment_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."StudentFeeAssignment"
    ADD CONSTRAINT "StudentFeeAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."Student"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Student Student_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Student"
    ADD CONSTRAINT "Student_classId_fkey" FOREIGN KEY ("classId") REFERENCES public."Class"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Student Student_gradeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Student"
    ADD CONSTRAINT "Student_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES public."Grade"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Student Student_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."Student"
    ADD CONSTRAINT "Student_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Parent"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TermlyReportSubjectLine TermlyReportSubjectLine_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."TermlyReportSubjectLine"
    ADD CONSTRAINT "TermlyReportSubjectLine_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public."Subject"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TermlyReportSubjectLine TermlyReportSubjectLine_termlyReportId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."TermlyReportSubjectLine"
    ADD CONSTRAINT "TermlyReportSubjectLine_termlyReportId_fkey" FOREIGN KEY ("termlyReportId") REFERENCES public."TermlyReport"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TermlyReport TermlyReport_academicYearId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."TermlyReport"
    ADD CONSTRAINT "TermlyReport_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES public."AcademicYear"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TermlyReport TermlyReport_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."TermlyReport"
    ADD CONSTRAINT "TermlyReport_classId_fkey" FOREIGN KEY ("classId") REFERENCES public."Class"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TermlyReport TermlyReport_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."TermlyReport"
    ADD CONSTRAINT "TermlyReport_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."Student"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TransportRequest TransportRequest_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."TransportRequest"
    ADD CONSTRAINT "TransportRequest_classId_fkey" FOREIGN KEY ("classId") REFERENCES public."Class"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TransportRequest TransportRequest_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."TransportRequest"
    ADD CONSTRAINT "TransportRequest_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Parent"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TransportRequest TransportRequest_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."TransportRequest"
    ADD CONSTRAINT "TransportRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."Student"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _SubjectToTeacher _SubjectToTeacher_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."_SubjectToTeacher"
    ADD CONSTRAINT "_SubjectToTeacher_A_fkey" FOREIGN KEY ("A") REFERENCES public."Subject"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _SubjectToTeacher _SubjectToTeacher_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techstylus
--

ALTER TABLE ONLY public."_SubjectToTeacher"
    ADD CONSTRAINT "_SubjectToTeacher_B_fkey" FOREIGN KEY ("B") REFERENCES public."Teacher"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: techstylus
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict 7qAbJub8QyzIxqx91I1nr6fI1sLGV5egbZLHbSADmxHSjTdUopaNG9eM3rQgEha

