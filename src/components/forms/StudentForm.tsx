"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import {
  Dispatch,
  SetStateAction,
  useActionState,
  useEffect,
  useState,
} from "react";
import { studentSchema, StudentSchema } from "@/lib/formValidationSchemas";
import { createStudent, updateStudent } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  FormCheckboxField,
  FormErrorBanner,
  FormFieldGrid,
  FormHeader,
  FormNavButtons,
  FormSection,
  FormSelect,
  FormStepper,
  FormTextarea,
  PhotoUploadCard,
} from "./FormUi";

const formatBirthday = (value: string | Date | undefined) => {
  if (!value) return undefined;
  if (typeof value === "string") return value.split("T")[0];
  return value.toISOString().split("T")[0];
};

const StudentForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    trigger,
  } = useForm<StudentSchema>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      ...data,
      birthday: formatBirthday(data?.birthday),
      declarationDate: formatBirthday(data?.declarationDate),
    },
  });

  const [img, setImg] = useState<any>(data?.img);
  const [currentStep, setCurrentStep] = useState<number>(0);

  useEffect(() => {
    if (data) {
      reset({
        ...data,
        birthday: formatBirthday(data?.birthday),
        declarationDate: formatBirthday(data?.declarationDate),
      });
      setImg(data?.img);
    }
  }, [data, reset]);

  const stepLabels = [
    "Student Info",
    "Parent / Guardian",
    "Academic Background",
    "Medical Info",
    "Emergency Contact",
    "Declaration",
  ];

  const stepFields: string[][] = [
    [
      "surname",
      "name",
      "birthday",
      "sex",
      "nationality",
      "religion",
      "bloodType",
      "address",
      "gpsAddress",
      "department",
      "classId",
    ],
    ["parentId"],
    ["previousSchoolName", "previousClass", "yearsAttended"],
    [
      "knownMedicalConditions",
      "hasAllergies",
      "allergyDetails",
      "hasHearingDifficulties",
      "hearingDetails",
      "wearsCorrectiveGlasses",
      "correctiveGlassesDetails",
      "physicallyFitForSports",
      "fitnessDetails",
      "otherIssues",
    ],
    [
      "emergencyContactPerson",
      "emergencyContactNumber",
      "alternativeEmergencyContactPerson",
      "alternativeEmergencyContactNumber",
    ],
    ["declarationName", "declarationDate"],
  ];

  const goNext = async () => {
    const fields = stepFields[currentStep] || [];
    const valid = await trigger(fields as any);
    if (valid) setCurrentStep((s) => Math.min(s + 1, stepLabels.length - 1));
  };

  const goPrev = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const [state, formAction] = useActionState(
    type === "create" ? createStudent : updateStudent,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit(async (formData) => {
    await formAction({ ...formData, img: img?.secure_url ?? data?.img });
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Student has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const { classes, parents } = relatedData;

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <FormHeader
        title={type === "create" ? "Enrol a new student" : "Update student record"}
        description="Complete each section to build a full student profile. Required fields are validated as you move through the steps."
        badge={type === "create" ? "Admission" : "Edit record"}
      />

      <FormSection
        title="Portal account"
        description="Credentials the student will use to access the school portal."
      >
        <FormFieldGrid cols={2}>
          <InputField
            label="Username"
            name="username"
            defaultValue={data?.username}
            register={register}
            error={errors?.username}
          />
          <InputField
            label={
              type === "create"
                ? "Password"
                : "Password (leave blank to keep current)"
            }
            name="password"
            type="password"
            defaultValue={data?.password}
            register={register}
            error={errors?.password}
          />
        </FormFieldGrid>
      </FormSection>

      <FormStepper
        steps={stepLabels}
        currentStep={currentStep}
        onStepClick={setCurrentStep}
      />

      <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="min-h-[320px] flex-1 overflow-y-auto p-5 sm:p-6">
          {currentStep === 0 ? (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Student information
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Personal details, placement, and contact information.
                </p>
              </div>

              <PhotoUploadCard
                imageUrl={img?.secure_url ?? data?.img}
                onUpload={setImg}
                label="Student photo"
              />

              <input type="hidden" {...register("id")} defaultValue={data?.id || ""} />

              <FormFieldGrid cols={3}>
                <InputField
                  label="Surname"
                  name="surname"
                  defaultValue={data?.surname}
                  register={register}
                  error={errors.surname}
                />
                <InputField
                  label="First name"
                  name="name"
                  defaultValue={data?.name}
                  register={register}
                  error={errors.name}
                />
                <InputField
                  label="Other names"
                  name="otherNames"
                  defaultValue={data?.otherNames}
                  register={register}
                  error={errors.otherNames}
                />
              </FormFieldGrid>

              <FormFieldGrid cols={4}>
                <InputField
                  label="Date of birth"
                  name="birthday"
                  defaultValue={formatBirthday(data?.birthday)}
                  register={register}
                  error={errors.birthday}
                  type="date"
                />
                <FormSelect
                  label="Gender"
                  name="sex"
                  register={register}
                  error={errors.sex}
                  defaultValue={data?.sex}
                  options={[
                    { value: "MALE", label: "Male" },
                    { value: "FEMALE", label: "Female" },
                  ]}
                />
                <InputField
                  label="Nationality"
                  name="nationality"
                  defaultValue={data?.nationality}
                  register={register}
                  error={errors.nationality}
                />
                <InputField
                  label="Religion"
                  name="religion"
                  defaultValue={data?.religion}
                  register={register}
                  error={errors.religion}
                />
              </FormFieldGrid>

              <FormFieldGrid cols={2}>
                <InputField
                  label="Blood type"
                  name="bloodType"
                  defaultValue={data?.bloodType}
                  register={register}
                  error={errors.bloodType}
                  placeholder="e.g. O+"
                />
              </FormFieldGrid>

              <FormFieldGrid cols={3}>
                <InputField
                  label="Home address"
                  name="address"
                  defaultValue={data?.address}
                  register={register}
                  error={errors.address}
                />
                <InputField
                  label="GPS address"
                  name="gpsAddress"
                  defaultValue={data?.gpsAddress}
                  register={register}
                  error={errors.gpsAddress}
                />
                <InputField
                  label="Languages spoken"
                  name="languagesSpoken"
                  defaultValue={data?.languagesSpoken}
                  register={register}
                  error={errors.languagesSpoken}
                />
              </FormFieldGrid>

              <FormFieldGrid cols={2}>
                <FormSelect
                  label="Department"
                  name="department"
                  register={register}
                  error={errors.department}
                  defaultValue={data?.department || "PRESCHOOL"}
                  options={[
                    { value: "PRESCHOOL", label: "Preschool" },
                    { value: "PRIMARY", label: "Primary" },
                    { value: "JHS", label: "JHS" },
                  ]}
                />
                <FormSelect
                  label="Class"
                  name="classId"
                  register={register}
                  error={errors.classId}
                  defaultValue={data?.classId ? String(data.classId) : ""}
                  options={classes.map(
                    (classItem: {
                      id: number;
                      name: string;
                      capacity: number;
                      _count: { students: number };
                    }) => ({
                      value: classItem.id,
                      label: `${classItem.name} (${classItem._count.students}/${classItem.capacity})`,
                    })
                  )}
                />
              </FormFieldGrid>
            </div>
          ) : null}

          {currentStep === 1 ? (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Parent / guardian details
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Link this student to an existing parent or guardian account.
                </p>
              </div>
              <FormSelect
                label="Parent / guardian"
                name="parentId"
                register={register}
                error={errors.parentId}
                defaultValue={data?.parentId || ""}
                placeholder="Select a parent"
                options={
                  parents?.map(
                    (parent: { id: string; name: string; surname: string }) => ({
                      value: parent.id,
                      label: `${parent.name} ${parent.surname}`,
                    })
                  ) ?? []
                }
              />
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Academic background
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Previous schooling and reason for admission.
                </p>
              </div>
              <FormFieldGrid cols={3}>
                <InputField
                  label="Previous school name"
                  name="previousSchoolName"
                  defaultValue={data?.previousSchoolName}
                  register={register}
                  error={errors.previousSchoolName}
                />
                <InputField
                  label="Class / form completed"
                  name="previousClass"
                  defaultValue={data?.previousClass}
                  register={register}
                  error={errors.previousClass}
                />
                <InputField
                  label="Years attended"
                  name="yearsAttended"
                  defaultValue={data?.yearsAttended}
                  register={register}
                  error={errors.yearsAttended}
                  type="number"
                  inputProps={{ min: 0 }}
                />
              </FormFieldGrid>
              <FormTextarea
                label="Reason for transfer / admission"
                name="reasonForTransfer"
                register={register}
                error={errors.reasonForTransfer}
                defaultValue={data?.reasonForTransfer}
                placeholder="Briefly describe why the student is joining this school."
              />
            </div>
          ) : null}

          {currentStep === 3 ? (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Medical information
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Health details the school should be aware of.
                </p>
              </div>

              <FormTextarea
                label="Known medical conditions"
                name="knownMedicalConditions"
                register={register}
                defaultValue={data?.knownMedicalConditions}
                placeholder="List any ongoing medical conditions, if applicable."
              />

              <FormFieldGrid cols={2}>
                <FormCheckboxField
                  label="Allergies"
                  description="Check if the student has known allergies."
                  name="hasAllergies"
                  register={register}
                  defaultChecked={data?.hasAllergies}
                >
                  <FormTextarea
                    label="Allergy details"
                    name="allergyDetails"
                    register={register}
                    defaultValue={data?.allergyDetails}
                    placeholder="Describe allergy triggers and reactions."
                    rows={3}
                    hideLabel
                  />
                </FormCheckboxField>

                <FormCheckboxField
                  label="Hearing difficulties"
                  description="Check if the student has hearing concerns."
                  name="hasHearingDifficulties"
                  register={register}
                  defaultChecked={data?.hasHearingDifficulties}
                >
                  <FormTextarea
                    label="Hearing details"
                    name="hearingDetails"
                    register={register}
                    defaultValue={data?.hearingDetails}
                    placeholder="Provide relevant hearing support details."
                    rows={3}
                    hideLabel
                  />
                </FormCheckboxField>

                <FormCheckboxField
                  label="Corrective glasses"
                  description="Check if the student wears or requires glasses."
                  name="wearsCorrectiveGlasses"
                  register={register}
                  defaultChecked={data?.wearsCorrectiveGlasses}
                >
                  <FormTextarea
                    label="Vision details"
                    name="correctiveGlassesDetails"
                    register={register}
                    defaultValue={data?.correctiveGlassesDetails}
                    placeholder="Describe vision correction needs."
                    rows={3}
                    hideLabel
                  />
                </FormCheckboxField>

                <FormCheckboxField
                  label="Physical fitness for sports"
                  description="Check if the student is fit for all sporting activities."
                  name="physicallyFitForSports"
                  register={register}
                  defaultChecked={data?.physicallyFitForSports}
                >
                  <FormTextarea
                    label="Fitness details"
                    name="fitnessDetails"
                    register={register}
                    defaultValue={data?.fitnessDetails}
                    placeholder="If not fit, explain any limitations."
                    rows={3}
                    hideLabel
                  />
                </FormCheckboxField>
              </FormFieldGrid>

              <FormTextarea
                label="Other factors or issues"
                name="otherIssues"
                register={register}
                defaultValue={data?.otherIssues}
                placeholder="Any other health or welfare concerns the school should know about."
              />
            </div>
          ) : null}

          {currentStep === 4 ? (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Emergency contact
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  People to contact in case of an emergency.
                </p>
              </div>
              <FormFieldGrid cols={2}>
                <InputField
                  label="Emergency contact person"
                  name="emergencyContactPerson"
                  defaultValue={data?.emergencyContactPerson}
                  register={register}
                  error={errors.emergencyContactPerson}
                />
                <InputField
                  label="Emergency contact number"
                  name="emergencyContactNumber"
                  defaultValue={data?.emergencyContactNumber}
                  register={register}
                  error={errors.emergencyContactNumber}
                />
                <InputField
                  label="Alternative contact person"
                  name="alternativeEmergencyContactPerson"
                  defaultValue={data?.alternativeEmergencyContactPerson}
                  register={register}
                  error={errors.alternativeEmergencyContactPerson}
                />
                <InputField
                  label="Alternative contact number"
                  name="alternativeEmergencyContactNumber"
                  defaultValue={data?.alternativeEmergencyContactNumber}
                  register={register}
                  error={errors.alternativeEmergencyContactNumber}
                />
              </FormFieldGrid>
            </div>
          ) : null}

          {currentStep === 5 ? (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Declaration
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Parent or guardian acknowledgement of the information provided.
                </p>
              </div>
              <FormFieldGrid cols={2}>
                <InputField
                  label="Name of parent / guardian"
                  name="declarationName"
                  defaultValue={data?.declarationName}
                  register={register}
                  error={errors.declarationName}
                />
                <InputField
                  label="Declaration date"
                  name="declarationDate"
                  type="date"
                  defaultValue={formatBirthday(data?.declarationDate)}
                  register={register}
                  error={errors.declarationDate}
                />
              </FormFieldGrid>
            </div>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
          <FormNavButtons
            currentStep={currentStep}
            onPrevious={goPrev}
            onNext={goNext}
            isLastStep={currentStep === stepLabels.length - 1}
            submitLabel={type === "create" ? "Create student" : "Save changes"}
          />
        </div>
      </div>

      {state.error ? (
        <FormErrorBanner message="Something went wrong. Please review the form and try again." />
      ) : null}
    </form>
  );
};

export default StudentForm;
