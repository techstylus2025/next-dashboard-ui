import { FieldError } from "react-hook-form";

type InputFieldProps = {
  label: string;
  type?: string;
  register?: any;
  name: string;
  defaultValue?: string;
  error?: FieldError;
  hidden?: boolean;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  containerClassName?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "type">;

const InputField = ({
  label,
  type = "text",
  register,
  name,
  defaultValue,
  error,
  hidden,
  inputProps,
  containerClassName,
  ...props
}: InputFieldProps) => {
  return (
    <div
      className={
        hidden
          ? "hidden"
          : containerClassName ?? "flex flex-col gap-2 w-full"
      }
    >
      <label className="input-label">{label}</label>
      <input
        type={type}
        {...(register ? register(name) : {})}
        name={name}
        className="input-base"
        {...inputProps}
        {...props}
        defaultValue={defaultValue}
      />
      {error?.message && (
        <p className="text-xs text-red-400">{error.message.toString()}</p>
      )}
    </div>
  );
};

export default InputField;
