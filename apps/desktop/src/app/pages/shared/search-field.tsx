import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@erda/ui/components/ui/input-group";
import { Search, X } from "lucide-react";
import { useRef, type ComponentProps, type RefObject } from "react";

const CLEAR = "animate-in fade-in zoom-in-95 duration-100 ease-out motion-reduce:zoom-in-100";
const GLASS = "h-8 rounded-[10px] border-transparent bg-glass-card dark:bg-glass-card";

type InputProps = Omit<
  ComponentProps<typeof InputGroupInput>,
  "ref" | "type" | "value" | "onChange" | "placeholder" | "className"
>;

export function SearchField({
  value,
  onValueChange,
  label,
  inputRef,
  className = GLASS,
  icon = true,
  clearClassName = CLEAR,
  ...inputProps
}: InputProps & {
  value: string;
  onValueChange: (value: string) => void;
  label: string;
  inputRef?: RefObject<HTMLInputElement | null>;
  className?: string;
  icon?: boolean;
  clearClassName?: string;
}) {
  const ownRef = useRef<HTMLInputElement>(null);
  const ref = inputRef ?? ownRef;
  const clear = () => {
    onValueChange("");
    ref.current?.focus();
  };
  return (
    <InputGroup className={className}>
      {icon ? (
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
      ) : null}
      <InputGroupInput
        ref={ref}
        type="search"
        className="[&::-webkit-search-cancel-button]:appearance-none"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={label}
        aria-label={label}
        autoComplete="off"
        spellCheck={false}
        {...inputProps}
      />
      {value ? (
        <InputGroupAddon align="inline-end" className={clearClassName}>
          <InputGroupButton size="icon-xs" aria-label="지우기" onClick={clear}>
            <X />
          </InputGroupButton>
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  );
}
