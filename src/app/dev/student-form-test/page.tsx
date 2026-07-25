"use client";

import { useState } from "react";
import StudentForm from "../../../components/forms/StudentForm";

export default function TestStudentFormPage() {
  const [open, setOpen] = useState(true);

  const sampleData = {
    id: "test-student",
    username: "teststudent",
    name: "Test",
    surname: "Student",
    otherNames: "Demo",
    nationality: "Ghanaian",
    religion: "None",
    address: "123 Test Street",
    gpsAddress: "5.6037,-0.1870",
    languagesSpoken: "English",
    bloodType: "O+",
    birthday: "2015-05-01",
    sex: "MALE",
    department: "PRIMARY",
    classId: 1,
    parentId: "",
    previousSchoolName: "Demo School",
    previousClass: "Class 1",
    yearsAttended: 2,
    reasonForTransfer: "Relocation",
    knownMedicalConditions: "None",
    hasAllergies: false,
    allergyDetails: "",
    hasHearingDifficulties: false,
    hearingDetails: "",
    wearsCorrectiveGlasses: false,
    correctiveGlassesDetails: "",
    physicallyFitForSports: true,
    fitnessDetails: "",
    otherIssues: "",
    emergencyContactPerson: "Parent",
    emergencyContactNumber: "",
    alternativeEmergencyContactPerson: "Relative",
    alternativeEmergencyContactNumber: "",
    declarationName: "Parent",
    declarationDate: "2026-06-02",
  };

  const relatedData = {
    classes: [
      { id: 1, name: "Primary 1", capacity: 30, _count: { students: 10 } },
      { id: 2, name: "Primary 2", capacity: 30, _count: { students: 12 } },
    ],
    parents: [
      { id: "p1", name: "John", surname: "Doe" },
      { id: "p2", name: "Jane", surname: "Doe" },
    ],
  };

  return (
    <div className="p-8">
      {open && (
        <StudentForm
          type="update"
          data={sampleData}
          setOpen={setOpen}
          relatedData={relatedData}
        />
      )}
      {!open && (
        <button onClick={() => setOpen(true)} className="btn-primary">
          Open form
        </button>
      )}
    </div>
  );
}
