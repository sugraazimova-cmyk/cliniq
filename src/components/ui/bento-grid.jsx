import { cn } from "@/lib/utils"
import { ArrowRight } from "lucide-react"

const BentoGrid = ({ children, className }) => (
  <div className={cn("grid w-full auto-rows-[22rem] grid-cols-3 gap-4", className)}>
    {children}
  </div>
)

const BentoCard = ({ name, className, background, Icon, description, onClick, cta, disabled }) => (
  <div
    className={cn(
      "group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-2xl",
      "bg-white [box-shadow:0_0_0_1px_rgba(18,32,86,.06),0_2px_4px_rgba(18,32,86,.05),0_12px_24px_rgba(18,32,86,.05)]",
      !disabled && "cursor-pointer",
      disabled && "cursor-default",
      className,
    )}
    onClick={!disabled ? onClick : undefined}
  >
    <div>{background}</div>
    <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1 p-6 transition-all duration-300 group-hover:-translate-y-10">
      <Icon
        className="h-12 w-12 origin-left transform-gpu transition-all duration-300 ease-in-out group-hover:scale-75"
        style={{ color: disabled ? "#c7caed" : "#5B65DC" }}
      />
      <h3 className="text-xl font-semibold" style={{ color: disabled ? "#b0b8d4" : "#122056" }}>
        {name}
      </h3>
      <p className="max-w-lg text-sm" style={{ color: disabled ? "#c2c9e0" : "#475467" }}>
        {description}
      </p>
    </div>

    {!disabled && (
      <div className="pointer-events-none absolute bottom-0 flex w-full translate-y-10 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <span className="flex items-center gap-1 text-sm font-medium rounded-lg px-3 py-1.5 bg-[#EEEFFD] transition-colors" style={{ color: "#5B65DC" }}>
          {cta} <ArrowRight className="h-4 w-4 ml-1" />
        </span>
      </div>
    )}

    {disabled && (
      <div className="pointer-events-none absolute bottom-0 flex w-full translate-y-10 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <span className="text-xs px-2.5 py-1 rounded-full bg-[#EEEFFD]" style={{ color: "#5B65DC" }}>
          Tezliklə
        </span>
      </div>
    )}

    <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-black/[.02]" />
  </div>
)

export { BentoCard, BentoGrid }
